import Checkbox from "@mui/material/Checkbox";
import React, { useCallback } from "react";
import useTableContext from "../table.context";
import { BaseData } from "../types";
import { getRowId } from "../utils";

const HeaderCheckbox: React.FC = <RowType extends BaseData, AllDataType extends RowType[]>() => {
  const { update, numRowsSelected, tableData } = useTableContext<RowType, AllDataType>();

  const handleSelectAll = useCallback(() => {
    update((currState) => {
      if (Object.values(currState.selectedRows).length) return { selectedRows: {} };
      return {
        selectedRows: currState.tableData.reduce(
          (prev, row, rowIndex) => ({ ...prev, [getRowId(row, rowIndex)]: row }),
          {},
        ),
      };
    });
  }, [update]);

  return (
    <Checkbox
      onClick={handleSelectAll}
      checked={Boolean(numRowsSelected)}
      indeterminate={numRowsSelected > 0 && numRowsSelected < tableData.length}
    />
  );
};

export default HeaderCheckbox;
