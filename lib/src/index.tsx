import PropTypes from "prop-types";
import React, { PropsWithChildren, useMemo } from "react";
import { TableProvider } from "./table.context";
import { BaseData, TableProps } from "./table.types";
import { ColumnDefinitionPropType, RowDataPropType, RowsPerPageOptionsPropType } from "./_propTypes";
import _Table from "./_Table.component";

/**
 * The DataTable component is the entry point for the DataTable library.
 *
 * @component
 */
export const DataTable = <RowType extends BaseData, DataType extends RowType[] = RowType[]>(
  props: PropsWithChildren<TableProps<RowType, DataType>>,
) => {
  const allProps = useMemo(
    () => ({
      enableHiddenColumns: false,
      rowsSelectable: false,
      defaultSort: { key: null, direction: undefined },
      rowsPerPageDefault: 25,
      csvFilename: "TableExport",
      ...props,
      editable:
        props.editable ||
        props.tableStructure.some((c) => c.editable || Boolean(c.colGroup?.some((cg) => cg.editable))),
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
(DataTable as React.FC).propTypes = {
  count: PropTypes.number,
  csvFilename: PropTypes.string,
  disablePagination: PropTypes.bool,
  enableHiddenColumns: PropTypes.bool,
  exportToCSVOption: PropTypes.bool,
  onChange: PropTypes.func,
  rowClick: PropTypes.func,
  rowOptions: PropTypes.exact({
    alternateRowColor: PropTypes.func,
    rowDisabled: PropTypes.func,
  }),
  rowsPerPageOptions: RowsPerPageOptionsPropType,
  rowsPerPageDefault: PropTypes.number,
  tableData: PropTypes.arrayOf(RowDataPropType.isRequired).isRequired,
  tableProps: PropTypes.object,
  tableStructure: PropTypes.arrayOf(ColumnDefinitionPropType.isRequired).isRequired,
  rowsSelectable: PropTypes.bool,
  onSelectedRowsChange: PropTypes.func,
  selectGroupBy: PropTypes.string,
  defaultSort: PropTypes.exact({
    key: PropTypes.string,
    direction: PropTypes.oneOf(["asc", "desc"]),
  }),
};

export * from "./table.types";
export default DataTable;
