import Checkbox from "@material-ui/core/Checkbox";
import { get } from "dot-prop";
import useTableContext from "hooks/useTableContext.hook";
import React, { useCallback } from "react";
import { BaseData } from "table.types";
import { getRowId } from "utils";

interface BodyCheckboxProps<RowType extends BaseData> {
  record: RowType;
  isCSVExport: boolean;
  rowId: string;
  dataArrayIndex: number;
}

const BodyCheckbox = <RowType extends BaseData, AllDataType extends RowType[]>({
  record,
  isCSVExport,
  rowId,
  dataArrayIndex,
}: BodyCheckboxProps<RowType>) => {
  const { update, rowsSelectable, selectedRows, selectGroupBy, isMacOS } = useTableContext<RowType, AllDataType>();

  const handleSelectedChange = useCallback<React.MouseEventHandler<HTMLButtonElement>>(
    (e) => {
      if (e.shiftKey || (isMacOS ? e.metaKey : e.ctrlKey)) return;
      e.stopPropagation();
      update((currState) => {
        const updatedSelectedRows = { ...currState.selectedRows };
        if (updatedSelectedRows[rowId]) {
          delete updatedSelectedRows[rowId];
        } else {
          updatedSelectedRows[rowId] = record;
        }
        if (selectGroupBy) {
          const extraRows = [...currState.tableData]
            .slice(dataArrayIndex + 1)
            .filter((row) => get(record, selectGroupBy!) === get(row, selectGroupBy!));
          extraRows.forEach((row, extraRowIndex) => {
            const extraRowId = getRowId(row, dataArrayIndex + (extraRowIndex + 1));
            if (updatedSelectedRows[extraRowId]) {
              delete updatedSelectedRows[extraRowId];
            } else {
              updatedSelectedRows[extraRowId] = row;
            }
          });
        }
        return { selectedRows: updatedSelectedRows };
      });
    },
    [isMacOS, rowId, selectGroupBy, update, record, dataArrayIndex],
  );

  if (isCSVExport || !rowsSelectable) return null;
  return <Checkbox onClick={handleSelectedChange} checked={Boolean(selectedRows[rowId])} />;
};

export default BodyCheckbox;
