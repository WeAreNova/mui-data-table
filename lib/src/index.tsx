import PropTypes from "prop-types";
import React, { PropsWithChildren } from "react";
import { ColumnDefinitionPropType, RowDataPropType, RowsPerPageOptionsPropType } from "./propTypes";
import Table from "./Table";
import { TableProvider } from "./table.context";
import { BaseData, TableProps } from "./types";

/**
 * The DataTable component is the entry point for the DataTable library.
 *
 * @component
 */
export const DataTable = <RowType extends BaseData, AllDataType extends RowType[] = RowType[]>({
  onChange,
  ...props
}: PropsWithChildren<TableProps<RowType, AllDataType>>) => {
  return (
    <TableProvider value={props} onChange={onChange}>
      <Table
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
    alternateRowColour: PropTypes.func,
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
  onEdit: PropTypes.func,
  resizeable: PropTypes.bool,
};

export * from "./types";
export { createDTError, numberFormatter, setDefaultCurrency } from "./utils";
export default DataTable;
