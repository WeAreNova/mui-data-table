import React, { PropsWithChildren, useMemo } from "react";
import { TableProvider } from "./table.context";
import { BaseData, TableProps } from "./table.types";
import _Table from "./_Table.component";

const DataTable = <RowType extends BaseData, DataType extends RowType[] = RowType[]>(
  props: PropsWithChildren<TableProps<RowType, DataType>>,
) => {
  const allProps = useMemo(
    () => ({
      hideColumnsOption: false,
      enableHiddenColumns: false,
      rowsSelectable: false,
      defaultSort: { key: null, direction: undefined },
      rowsPerPageDefault: 25,
      csvFilename: "TableExport",
      ...props,
    }),
    [props],
  );
  return (
    <TableProvider value={allProps}>
      <_Table
        tableProps={props.tableProps}
        rowsPerPageOptions={props.rowsPerPageOptions}
        exportToCSVOption={props.exportToCSVOption}
        disablePagination={props.disablePagination}
      />
    </TableProvider>
  );
};

export * from "./table.types";
export default DataTable;
