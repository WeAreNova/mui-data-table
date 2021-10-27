import {
  Button,
  makeStyles,
  Table as MUITable,
  TableBody,
  TableContainer,
  TableFooter,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@material-ui/core";
import TablePaginationActions from "@material-ui/core/TablePagination/TablePaginationActions";
import Help from "@material-ui/icons/Help";
import clsx from "clsx";
import React, { PropsWithChildren, useCallback, useContext, useEffect, useMemo } from "react";
import BodyRow from "./BodyRow.component";
import HeaderRow from "./HeaderRow.component";
import TableContext, { TableState } from "./table.context";
import { BaseData, TableProps } from "./table.types";
import TableCell from "./TableCell.component";
import { getRowId } from "./utils";

interface _TableProps
  extends Pick<TableProps, "tableProps" | "rowsPerPageOptions" | "exportToCSVOption" | "disablePagination"> {}

const useStyles = makeStyles(
  (theme) => ({
    dataLoading: {
      "& > tbody": {
        opacity: 0.4,
        backgroundColor: theme.palette.action.hover,
      },
    },
    footerButtons: {
      display: "flex",
    },
    selectedRowsFooter: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      "& > *": {
        marginRight: theme.spacing(2.5),
      },
    },
    table: {
      "& > tbody": {
        transition: "opacity 0.2s ease-in-out, background-color 0.2s ease-in-out",
      },
    },
    tableFooter: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      border: `1px solid ${theme.palette.divider}`,
      borderWidth: "1px 0 1px 0",
      flexWrap: "wrap",
      "& > *": {
        borderBottom: 0,
      },
      [theme.breakpoints.down("sm")]: {
        flexDirection: "column",
        alignItems: "flex-start",
      },
    },
    tablePagination: {
      borderBottom: "none",
      [theme.breakpoints.down("sm")]: {
        width: "100%",
      },
    },
  }),
  { name: "DataTable" },
);

const _Table = <RowType extends BaseData, DataType extends RowType[]>({
  tableProps = {},
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  exportToCSVOption = false,
  disablePagination = false,
  ...props
}: PropsWithChildren<_TableProps>) => {
  const classes = useStyles(props);
  const {
    allTableData,
    tableData,
    filteredTableStructure,
    flattenedTableStructure,
    enableHiddenColumns,
    rowsSelectable,
    rowsPerPage,
    page,
    selectedRows,
    onSelectedRowsChange,
    hiddenColumns,
    update,
    loading,
    exportToCSV,
    count,
    isMacOS,
  } = useContext<TableState<RowType, DataType>>(TableContext);

  const allColumnsVisible = useMemo(() => {
    const values = Object.values(hiddenColumns);
    return !values.length || values.every((value) => !value);
  }, [hiddenColumns]);

  const onPageChange = useCallback((newPage) => update.page(newPage), [update]);

  const onRowsPerPageChange = useCallback(
    (e) => {
      const newRowsPerPage = parseInt(e.target.value, 10);
      update({ rowsPerPage: newRowsPerPage, page: 0 });
    },
    [update],
  );

  const hasColGroupFooter = useMemo(
    () => filteredTableStructure.some((struct) => Boolean(struct.colGroup && struct.footer)),
    [filteredTableStructure],
  );
  const hasFooter = useMemo(
    () => flattenedTableStructure.some((struct) => Boolean(struct.footer)),
    [flattenedTableStructure],
  );

  useEffect(() => {
    if (onSelectedRowsChange) onSelectedRowsChange(Object.values(selectedRows));
  }, [onSelectedRowsChange, selectedRows]);

  return (
    <>
      <TableContainer>
        <MUITable
          {...tableProps}
          stickyHeader
          className={clsx(classes.table, tableProps.className, { [classes.dataLoading]: loading })}
        >
          <HeaderRow />
          <TableBody>
            {tableData.map((data, dataIndex) => (
              <BodyRow key={getRowId(data, dataIndex)} index={dataIndex} data={data} />
            ))}
          </TableBody>
          {(hasFooter || hasColGroupFooter) && (
            <TableFooter>
              {hasFooter && (
                <TableRow>
                  {flattenedTableStructure.map((struct) => (
                    <TableCell
                      key={struct.key}
                      rowSpan={hasColGroupFooter && (!struct.isColGroup || !struct.hasColGroupFooter) ? 2 : 1}
                    >
                      {struct.footer ? struct.footer(allTableData) : ""}
                    </TableCell>
                  ))}
                </TableRow>
              )}
              {hasColGroupFooter && (
                <TableRow>
                  {filteredTableStructure.map(({ colGroup, footer, ...struct }) =>
                    colGroup && footer ? (
                      <TableCell key={struct.key} colSpan={colGroup.length}>
                        {footer(allTableData)}
                      </TableCell>
                    ) : null,
                  )}
                </TableRow>
              )}
            </TableFooter>
          )}
        </MUITable>
      </TableContainer>
      <div className={classes.tableFooter}>
        <div>
          <div className={classes.footerButtons}>
            {exportToCSVOption && (
              <Button variant="text" disabled={loading} onClick={exportToCSV}>
                CSV Export
              </Button>
            )}
            {enableHiddenColumns && !allColumnsVisible && (
              <Button
                onClick={() =>
                  update.hiddenColumns(
                    Object.keys(hiddenColumns).reduce((prev, key) => ({ ...prev, [key]: false }), {}),
                  )
                }
                variant="text"
                disabled={allColumnsVisible}
              >
                Show all
              </Button>
            )}
          </div>
        </div>
        <div>
          {!disablePagination && (
            <TablePagination
              className={classes.tablePagination}
              rowsPerPageOptions={rowsPerPageOptions}
              count={count!}
              rowsPerPage={rowsPerPage!}
              page={page}
              SelectProps={{
                inputProps: { "aria-label": "rows per page" },
                native: true,
              }}
              onPageChange={(_e, newPage) => onPageChange(newPage)}
              onRowsPerPageChange={onRowsPerPageChange}
              ActionsComponent={TablePaginationActions}
              component="div"
            />
          )}
          {rowsSelectable && (
            <div className={classes.selectedRowsFooter}>
              <Button
                onClick={() => update.selectedRows({})}
                disabled={!Object.values(selectedRows).length}
                variant="text"
                size="small"
              >
                Clear Selection
              </Button>
              <Typography variant="body2" align="right">
                {Object.values(selectedRows).length} of {rowsPerPage} selected
              </Typography>
              <Tooltip
                title={
                  <Typography variant="caption" color="inherit">
                    Use&nbsp;
                    <strong>
                      <kbd>{isMacOS ? "cmd" : "ctrl"}</kbd>&nbsp;+&nbsp;<kbd>click</kbd>
                    </strong>{" "}
                    to select a single row.
                    <br />
                    Use&nbsp;
                    <strong>
                      <kbd>shift</kbd>&nbsp;+&nbsp;<kbd>click</kbd>
                    </strong>{" "}
                    to select multiple rows.
                  </Typography>
                }
              >
                <Help />
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default _Table;
