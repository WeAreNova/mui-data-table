import { useContext } from "react";
import TableContext, { TableState } from "table.context";
import { BaseData } from "table.types";

const useTableContext = <RowType extends BaseData, AllDataType extends RowType[]>() => {
  return useContext<TableState<RowType, AllDataType>>(TableContext);
};

export default useTableContext;
