import { styled, Tooltip } from "@mui/material";
import { get } from "dot-prop";
import ErrorBoundary from "ErrorBoundary.component";
import useBodyContext from "hooks/useBodyContext.hook";
import useTableContext from "hooks/useTableContext.hook";
import React, { MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BaseData } from "table.types";
import TableCell from "TableCell.component";
import { dispatchTableEvent, dontForwardProps, findIndexFrom, findLastIndexFrom, getRowId, getValue } from "utils";
import EditCell from "./EditCell.component";

const focusOutline = {
  "& > div": {
    outline: `1px solid`,
    outlineColor: "action.focus",
  },
};

const DTBodyCell = styled(TableCell, {
  name: "DTBodyCell",
  slot: "Root",
  shouldForwardProp: dontForwardProps("editable"),
})<{ editable: boolean }>(({ editable, theme }) => [
  {
    outline: "none",
    "&:focus": focusOutline,
    "&:focus-within": focusOutline,
    "& > div": {
      minHeight: theme.spacing(2),
    },
  },
  editable && {
    "& > div": {
      padding: theme.spacing(0.5, 1),
      "&:hover": {
        backgroundColor: theme.palette.action.hover,
      },
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
  const { structure, data, rowId, index } = useBodyContext<RowType, AllDataType>();
  const {
    rowClick,
    hiddenColumns,
    pinnedColumns,
    tableData,
    rowsSelectable,
    isMacOS,
    loading,
    update,
    editable: tableEditable,
  } = useTableContext<RowType, AllDataType>();
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

  const handleRowsSelect = useCallback(
    (e: React.MouseEvent<HTMLTableCellElement, MouseEvent>) => {
      e.preventDefault();
      update((currState) => {
        const updatedSelectedRows = { ...currState.selectedRows };
        if (e.shiftKey) {
          const lastIndex = findLastIndexFrom(currState.tableData, (v, i) => {
            return Boolean(currState.selectedRows[getRowId(v, i)]);
          });
          const indexOfSelected =
            rowSpan - 1 + findLastIndexFrom(currState.tableData, (v, i) => rowId === getRowId(v, i));
          const allIncludes = currState.tableData.slice(lastIndex + 1, indexOfSelected + 1);
          allIncludes.forEach((row) => (updatedSelectedRows[getRowId(row, index)] = row));
          return { selectedRows: updatedSelectedRows };
        }

        const setAsSelected = !updatedSelectedRows[rowId];
        if (!setAsSelected) {
          delete updatedSelectedRows[rowId];
        } else {
          updatedSelectedRows[rowId] = data;
        }

        if (rowSpan > 1) {
          const extraRows = [...currState.tableData].splice(index + 1, rowSpan - 1);
          extraRows.forEach((row, extraRowIndex) => {
            const extraRowId = getRowId(row, index + (extraRowIndex + 1));
            if (setAsSelected) {
              updatedSelectedRows[extraRowId] = row;
              return;
            }
            delete updatedSelectedRows[extraRowId];
          });
        }
        return { selectedRows: updatedSelectedRows };
      });
    },
    [data, index, rowId, rowSpan, update],
  );

  const handleRowClick = useCallback(
    (e: React.MouseEvent<HTMLTableCellElement, MouseEvent>) => {
      e.stopPropagation();
      dispatchTableEvent("*");
      if (loading) return;
      if (rowsSelectable && (e.shiftKey || (isMacOS ? e.metaKey : e.ctrlKey))) return handleRowsSelect(e);
      rowClick?.(data, e);
    },
    [loading, rowsSelectable, isMacOS, handleRowsSelect, rowClick, data],
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

  if (!rowSpan) return null;
  return (
    <DTBodyCell
      key={structure.key}
      onClick={handleRowClick}
      editable={Boolean(tableEditable && structure.editable)}
      hidden={Boolean(hiddenColumns[structure.key])}
      pinned={Boolean(pinnedColumns[structure.key])}
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
    </DTBodyCell>
  );
};

export default BodyCell;
