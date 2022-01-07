import { Checkbox } from "@material-ui/core";
import React, { useCallback, useContext } from "react";
import TableContext, { TableState } from "table.context";
import { BaseData } from "table.types";
import { getRowId } from "utils";

const HeaderCheckbox: React.FC = <RowType extends BaseData, AllDataType extends RowType[]>() => {
  const { update, numRowsSelected, tableData } = useContext<TableState<RowType, AllDataType>>(TableContext);

  const handleSelectAll = useCallback(() => {
    update.selectedRows((currSelectedRows) => {
      if (Object.values(currSelectedRows).length) return {};
      return tableData.reduce((prev, row, rowIndex) => ({ ...prev, [getRowId(row, rowIndex)]: row }), {});
    });
  }, [tableData, update]);

  return (
    <Checkbox
      onClick={handleSelectAll}
      checked={Boolean(numRowsSelected)}
      indeterminate={numRowsSelected > 0 && numRowsSelected < tableData.length}
    />
  );
};

export default HeaderCheckbox;
