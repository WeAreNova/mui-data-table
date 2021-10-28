import { Tooltip } from "@material-ui/core";
import get from "lodash.get";
import React, { PropsWithChildren, useCallback, useContext, useMemo } from "react";
import TableContext, { TableState } from "./table.context";
import type { BaseData, ColGroupDefinition, ColumnDefinition } from "./table.types";
import TableCell from "./TableCell.component";
import { findIndexFrom, findLastIndexFrom, getRowId, getValue } from "./utils";

interface BodyCellProps<RowType extends BaseData, DataType extends RowType[]> {
  index: number;
  rowId: string;
  structure: ColumnDefinition<RowType, DataType> | ColGroupDefinition<RowType, DataType>;
  data: RowType;
}

const BodyCell = <RowType extends BaseData, DataType extends RowType[]>({
  index,
  rowId,
  structure,
  data,
}: PropsWithChildren<BodyCellProps<RowType, DataType>>) => {
  const { rowClick, hiddenColumns, pinnedColumn, tableData, rowsSelectable, selectedRows, isMacOS, loading, update } =
    useContext<TableState<RowType, DataType>>(TableContext);

  const value = useMemo(() => getValue(structure, data, rowId, index), [data, index, rowId, structure]);
  const tooltipTitle = useMemo(() => (typeof value === "string" && value.length > 20 ? value : ""), [value]);

  const groupBy = useCallback(
    (groupByKey: string, index: number) => {
      const value = get(data, groupByKey);
      if (!value) return 1;

      const previousValue = get(tableData[index - 1], groupByKey);
      if (previousValue && value === previousValue) return 0;

      const endIndex = findIndexFrom(tableData, (v) => get(v, groupByKey) !== value, index);
      return endIndex > -1 ? endIndex - index : tableData.length - index;
    },
    [data, tableData],
  );

  const rowSpan = useMemo(() => {
    return structure.rowSpan
      ? structure.rowSpan(data, index, tableData)
      : structure.groupBy
      ? groupBy(structure.groupBy, index)
      : 1;
  }, [data, groupBy, index, structure, tableData]);

  const handleRowClick = useCallback(
    (e: React.MouseEvent<HTMLTableCellElement, MouseEvent>) => {
      e.stopPropagation();
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
        const lastIndex = findLastIndexFrom(
          tableData,
          (value, index) => Boolean(selectedRows[getRowId(value, index)]),
          index,
        );
        const indexOfSelected =
          findLastIndexFrom(tableData, (value, index) => rowId === getRowId(value, index)) + (rowSpan - 1);
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

  return (
    <TableCell
      key={structure.key}
      onClick={handleRowClick}
      hidden={Boolean(hiddenColumns[structure.key])}
      pinned={pinnedColumn === structure.key}
      maxWidth={structure.limitWidth}
      rowSpan={rowSpan}
      align={structure.align}
    >
      {structure.limitWidth ? (
        <Tooltip title={tooltipTitle}>
          <span>{value}</span>
        </Tooltip>
      ) : (
        value
      )}
    </TableCell>
  );
};

export default BodyCell;
