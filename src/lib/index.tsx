import { PropsWithChildren, useMemo } from "react";
import { TableProvider } from "./table.context";
import { BaseData, TableProps } from "./table.types";
import _Table from "./_Table.component";

const Table = <RowType extends BaseData, DataType extends RowType[] = RowType[]>(
  props: PropsWithChildren<TableProps<RowType, DataType>>,
) => {
  const {
    allProps,
    onChange,
    onSelectedRowsChange,
    tableData,
    tableStructure,
    hideColumnsOption,
    enableHiddenColumns,
    rowsSelectable,
    selectGroupBy,
    defaultSort,
    disablePagination,
    rowsPerPageDefault,
    csvFilename,
    count,
  } = useMemo(() => {
    const allProps = {
      hideColumnsOption: false,
      enableHiddenColumns: false,
      rowsSelectable: false,
      defaultSort: { key: null, direction: undefined },
      rowsPerPageDefault: 25,
      csvFilename: "TableExport",
      ...props,
    };
    return { allProps, ...allProps };
  }, [props]);

  const tableState = useMemo(
    () => ({
      onChange,
      onSelectedRowsChange,
      tableData,
      tableStructure,
      hideColumnsOption,
      enableHiddenColumns,
      rowsSelectable,
      selectGroupBy,
      defaultSort,
      disablePagination,
      rowsPerPageDefault,
      csvFilename,
      count,
    }),
    [
      onChange,
      onSelectedRowsChange,
      tableData,
      tableStructure,
      hideColumnsOption,
      enableHiddenColumns,
      rowsSelectable,
      selectGroupBy,
      defaultSort,
      disablePagination,
      rowsPerPageDefault,
      csvFilename,
      count,
    ],
  );

  return (
    <TableProvider value={tableState}>
      <_Table {...allProps} />
    </TableProvider>
  );
};

export * from "./table.types";
export default Table;
