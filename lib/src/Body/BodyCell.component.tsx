import { styled, Tooltip } from "@mui/material";
import { get } from "dot-prop";
import React, { MouseEventHandler, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import ErrorBoundary from "../ErrorBoundary.component";
import TableContext, { TableState } from "../table.context";
import type { BaseData } from "../table.types";
import TableCell from "../TableCell.component";
import { dispatchTableEvent, dontForwardProps, findIndexFrom, findLastIndexFrom, getRowId, getValue } from "../utils";
import BodyContext, { BodyState } from "./body.context";
import EditCell from "./EditCell.component";

const focusOutline = {
  "& > div": {
    outline: `1px solid`,
    outlineColor: "action.focus",
  },
};

const EditableTableCell = styled(TableCell, {
  label: "DataTable-EditableTableCell",
  shouldForwardProp: dontForwardProps("editable"),
})<{ editable: boolean }>(({ editable, theme }) => [
  {
    outline: "none",
    "&:focus": focusOutline,
    "&:focus-within": focusOutline,
    "& > div": {
      minHeight: theme.spacing(2),
      padding: theme.spacing(1),
    },
  },
  editable && {
    "& > div:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
]);

/**
 * The BodyCell component is a wrapper around the custom TableCell component which manages the rendering of the
 * cell content, its state, its grouping and row click events.
 *
 * @component
 * @package
 */
const BodyCell = <RowType extends BaseData, AllDataType extends RowType[]>() => {
  const { structure, data, rowId, index } = useContext<BodyState<RowType, AllDataType>>(BodyContext);
  const {
    rowClick,
    hiddenColumns,
    pinnedColumn,
    tableData,
    rowsSelectable,
    selectedRows,
    isMacOS,
    loading,
    update,
    editable: tableEditable,
  } = useContext<TableState<RowType, AllDataType>>(TableContext);
  const bodyCellRef = useRef<HTMLTableCellElement>(null);
  const [editMode, setEditMode] = useState(false);

  const value = useMemo(() => getValue(structure, data, rowId, index), [data, index, rowId, structure]);
  const tooltipTitle = useMemo(() => (typeof value === "string" && value.length > 20 ? value : ""), [value]);

  const groupBy = useCallback(
    (groupByKey: string, idx: number) => {
      const groupByValue = get(data, groupByKey);
      if (!groupByValue) return 1;

      const previousValue = get(tableData[idx - 1], groupByKey);
      if (previousValue && groupByValue === previousValue) return 0;

      const endIndex = findIndexFrom(tableData, (v) => get(v, groupByKey) !== groupByValue, idx);
      return endIndex > -1 ? endIndex - idx : tableData.length - idx;
    },
    [data, tableData],
  );

  const rowSpan = useMemo(() => {
    if (structure.rowSpan) return structure.rowSpan(data, index, tableData);
    if (structure.groupBy) return groupBy(structure.groupBy, index);
    return 1;
  }, [data, groupBy, index, structure, tableData]);

  const handleRowClick = useCallback(
    (e: React.MouseEvent<HTMLTableCellElement, MouseEvent>) => {
      e.stopPropagation();
      dispatchTableEvent("*");
      if (loading) return;
      if (rowsSelectable && (isMacOS ? e.metaKey : e.ctrlKey)) {
        const updatedSelectedRows = { ...selectedRows };
        const setAsSelected = !updatedSelectedRows[rowId];
        if (updatedSelectedRows[rowId]) {
          delete updatedSelectedRows[rowId];
        } else {
          updatedSelectedRows[rowId] = data;
        }
        if (rowSpan > 1) {
          const extraRows = [...tableData].splice(index + 1, rowSpan - 1);
          extraRows.forEach((row, extraRowIndex) => {
            const extraRowId = getRowId(row, index + (extraRowIndex + 1));
            if (setAsSelected) {
              updatedSelectedRows[extraRowId] = row;
              return;
            }
            delete updatedSelectedRows[extraRowId];
          });
        }
        return update.selectedRows(updatedSelectedRows);
      }
      if (rowsSelectable && e.shiftKey) {
        const updatedSelectedRows = { ...selectedRows };
        const lastIndex = findLastIndexFrom(tableData, (v, i) => Boolean(selectedRows[getRowId(v, i)]), index);
        const indexOfSelected = findLastIndexFrom(tableData, (v, i) => rowId === getRowId(v, i)) + (rowSpan - 1);
        const allIncludes = tableData.slice(lastIndex + 1, indexOfSelected + 1);
        allIncludes.forEach((row) => {
          const currentId = getRowId(row, index);
          updatedSelectedRows[currentId] = row;
        });
        return update.selectedRows(updatedSelectedRows);
      }
      rowClick?.(data, e);
    },
    [loading, rowsSelectable, isMacOS, rowClick, data, selectedRows, rowId, rowSpan, update, tableData, index],
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | KeyboardEvent) => {
      e.stopPropagation();
      if (!tableEditable || !structure.editable || editMode) return;
      setEditMode(true);
    },
    [editMode, structure.editable, tableEditable],
  );

  const handleEditCancel = useCallback(() => setEditMode(false), []);
  const handleEditClick = useCallback<MouseEventHandler<HTMLDivElement>>(
    (e) => {
      if (!tableEditable || !structure.editable) return;
      e.stopPropagation();
      dispatchTableEvent("closeFilter");
      if (editMode) return;
      dispatchTableEvent("cancelEdit");
    },
    [editMode, structure.editable, tableEditable],
  );

  useEffect(() => {
    if (!bodyCellRef.current || editMode) return;
    const ref = bodyCellRef.current;
    const onKeyPress = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      handleEdit(e);
    };
    ref.addEventListener("keydown", onKeyPress);
    return () => ref.removeEventListener("keydown", onKeyPress);
  }, [editMode, handleEdit]);

  return (
    <EditableTableCell
      key={structure.key}
      onClick={handleRowClick}
      editable={Boolean(tableEditable && structure.editable)}
      hidden={Boolean(hiddenColumns[structure.key])}
      pinned={pinnedColumn === structure.key}
      maxWidth={structure.limitWidth}
      rowSpan={rowSpan}
      align={structure.align}
      tabIndex={0}
      ref={bodyCellRef}
      data-testid="DataTable-BodyCell"
    >
      <ErrorBoundary>
        <div onClick={handleEditClick} onDoubleClick={handleEdit}>
          {editMode ? (
            <EditCell cancelEdit={handleEditCancel} />
          ) : structure.limitWidth ? (
            <Tooltip title={tooltipTitle}>
              <span>{value}</span>
            </Tooltip>
          ) : (
            value
          )}
        </div>
      </ErrorBoundary>
    </TableCell>
  );
};

export default BodyCell;
