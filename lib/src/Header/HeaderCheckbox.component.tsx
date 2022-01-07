import { Checkbox } from "@material-ui/core";
import useTableContext from "hooks/useTableContext.hook";
import React, { useCallback } from "react";
import { BaseData } from "table.types";
import { getRowId } from "utils";

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
