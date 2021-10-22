import {
  Button,
  makeStyles,
  Table as MUITable,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@material-ui/core";
import TablePaginationActions from "@material-ui/core/TablePagination/TablePaginationActions";
import { Help } from "@material-ui/icons";
import clsx from "clsx";
import Color from "color";
import deepdash from "deepdash";
import lodash from "lodash";
import React, { PropsWithChildren, useCallback, useContext, useEffect, useMemo } from "react";
import UAParser from "ua-parser-js";
import { formatThousands } from "../../utils/helpers";
import HeaderRow from "./HeaderRow.component";
import TableContext, { TableProvider, TableState } from "./table.context";
import { BaseData, ColGroup, MonetaryObject, TableColumnStructure, TableProps } from "./table.types";
import { findIndexFrom, findLastIndexFrom } from "./utils";

const _ = deepdash(lodash);
const parser = new UAParser();

const useStyles = makeStyles(
  (theme) => ({
    alternateRowColour: {
      backgroundColor: Color(theme.palette.error.dark).fade(0.9).toString(),
    },
    columnCell: {
      transition: theme.transitions.create("width", {
        duration: theme.transitions.duration.shorter,
        easing: theme.transitions.easing.easeInOut,
      }),
    },
    dataLoading: {
      "& > tbody": {
        opacity: 0.4,
        backgroundColor: theme.palette.action.hover,
      },
    },
    disabledRow: {
      backgroundColor: theme.palette.action.disabledBackground,
      opacity: theme.palette.action.disabledOpacity,
    },
    footerButtons: {
      display: "flex",
    },
    hiddenColumnCell: {
      contentVisibility: "hidden",
      maxWidth: 0,
      padding: 0,
      cursor: "pointer",
      transition: theme.transitions.create("border-right-width", {
        duration: theme.transitions.duration.shortest,
        easing: theme.transitions.easing.easeInOut,
      }),
      "&:last-child": {
        borderLeft: `3px solid ${theme.palette.divider}`,
        "&:hover": {
          borderLeftWidth: 5,
        },
      },
      "&:not(:last-child)": {
        "&:not(:hover)": {
          borderRightWidth: 3,
        },
        "&:hover": {
          borderRightWidth: 5,
        },
      },
    },
    hideColumnsSwitch: {
      paddingLeft: theme.spacing(2.5),
      "& > .MuiFormControlLabel-label": {
        whiteSpace: "nowrap",
      },
    },
    limitedWidthLg: {
      "& > *": {
        maxWidth: "20em",
        display: "block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
    },
    limitedWidthSm: {
      "& > *": {
        maxWidth: "6em",
        display: "block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
    },
    pinnedColumnCell: {
      position: "sticky",
      left: 0,
      right: 0,
      zIndex: 3,
      background: theme.palette.common.white,
      borderLeft: `1px solid ${theme.palette.divider}`,
      borderRight: `1px solid ${theme.palette.divider}`,
      "&.MuiTableCell-head": {
        zIndex: 4,
      },
    },
    rowHover: {
      cursor: "pointer",
      backgroundColor: theme.palette.action.hover,
    },
    selectedRow: {
      backgroundColor: theme.palette.action.selected,
    },
    selectedRowsFooter: {
      display: "flex",
      alignItems: "center",
      "& > *": {
        paddingRight: theme.spacing(2.5),
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
  { name: "TableComponent" },
);

const Table = <RowType extends BaseData, DataType extends RowType[]>({
  tableProps = {},
  rowOptions = {},
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  exportToCSVOption = false,
  disablePagination = false,
  selectGroupBy,
  rowClick,
  ...props
}: PropsWithChildren<TableProps<RowType, DataType>>) => {
  const classes = useStyles(props);

  const {
    allTableData,
    tableData,
    filteredTableStructure,
    enableHiddenColumns,
    rowsSelectable,
    rowsPerPage,
    page,
    selectedRows,
    onSelectedRowsChange,
    hiddenColumns,
    pinnedColumn,
    update,
    loading,
    exportToCSV,
    count,
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

  const onHover = useCallback(
    (hoverRow: EventTarget & HTMLTableRowElement) => {
      hoverRow.classList.add(classes.rowHover);
      if (!hoverRow.parentNode) return;
      const hoverRowIndex = Array.from(hoverRow.parentNode.children).indexOf(hoverRow);
      for (let row = hoverRow.previousSibling as Element; row; row = row.previousSibling as Element) {
        if (!row.parentNode) continue;
        const rowIndex = Array.from(row.parentNode.children).indexOf(row);
        const rowsBetween = hoverRowIndex - rowIndex;
        row.querySelectorAll("td[rowspan]").forEach((cell) => {
          const rowSpan = Number(cell.getAttribute("rowspan"));
          if (rowSpan > rowsBetween) cell.classList.add(classes.rowHover);
        });
      }
    },
    [classes.rowHover],
  );

  const onUnHover = useCallback(
    (hoverRow: EventTarget & HTMLTableRowElement) => {
      hoverRow.classList.remove(classes.rowHover);
      for (let row = hoverRow.previousSibling as Element; row; row = row.previousSibling as Element) {
        row.querySelectorAll("td[rowspan]").forEach((cell) => cell.classList.remove(classes.rowHover));
      }
    },
    [classes.rowHover],
  );

  const groupBy = useCallback((groupByKey: string, data: RowType, index: number, arr: RowType[]) => {
    const value = _.get(data, groupByKey);
    const previousValue = _.get(arr[index - 1], groupByKey);
    if (value && previousValue && value === previousValue) {
      // if previous row has same group by value, this row merges with the row above
      return 0;
    }
    if (value) {
      // go forward until we find a different value, then span all the rows in between
      const endIndex = findIndexFrom(arr, (v) => _.get(v, groupByKey) !== value, index);
      return endIndex > -1 ? endIndex - index : arr.length - index;
    }
    return 1;
  }, []);

  const cellColumns = useMemo(
    () =>
      filteredTableStructure.flatMap((struct) =>
        struct.colGroup && !hiddenColumns[struct.id || struct.key || ""]
          ? struct.colGroup.map(
              (colGroup) =>
                ({ ...colGroup, isColGroup: true, hasColGroupFooter: Boolean(struct.footer) } as ColGroup<
                  RowType,
                  DataType
                >),
            )
          : struct,
      ),
    [filteredTableStructure, hiddenColumns],
  );
  const hasColGroupFooter = useMemo(
    () => filteredTableStructure.some((struct) => Boolean(struct.colGroup && struct.footer)),
    [filteredTableStructure],
  );
  const hasFooter = useMemo(() => cellColumns.some((struct) => Boolean(struct.footer)), [cellColumns]);

  const getValue = useCallback(
    (struct: TableColumnStructure<RowType, DataType>, data: RowType, rowId: string, dataArrayIndex: number) => {
      if (struct.render) {
        return struct.render(data, false, rowId, dataArrayIndex);
      }
      if (struct.monetary) {
        const {
          path,
          decimalPlaces = 2,
          minDecimalPlaces,
          maxDecimalPlaces,
        } = typeof struct.monetary === "object"
          ? (struct.monetary as MonetaryObject)
          : ({ path: struct.monetary === true ? struct.dataIndex : struct.monetary } as MonetaryObject);
        const value = _.get(data, path as string);
        return !isNaN(Number(value))
          ? formatThousands(value, decimalPlaces, true, minDecimalPlaces, maxDecimalPlaces)
          : "";
      }
      return _.get(data, struct.dataIndex! as string) as string;
    },
    [],
  );

  const isMacOS = useMemo(() => {
    const os = parser.getOS();
    return os.name === "Mac OS";
  }, []);

  const handleRowClick = useCallback(
    (data, e, rowId, idx, rowSpan = 1) => {
      e.stopPropagation();
      if (loading) return;
      if (rowsSelectable && (isMacOS ? e.metaKey : e.ctrlKey)) {
        const updatedSelectedRows = { ...selectedRows };
        if (updatedSelectedRows[rowId]) {
          delete updatedSelectedRows[rowId];
        } else {
          updatedSelectedRows[rowId] = data;
        }
        if (rowSpan > 1) {
          const extraRows = [...tableData].splice(idx + 1, rowSpan - 1);
          extraRows.forEach((row, extraRowIndex) => {
            const extraRowId = row.id || row._id || idx + (extraRowIndex + 1);
            if (updatedSelectedRows[extraRowId]) {
              delete updatedSelectedRows[extraRowId];
            } else {
              updatedSelectedRows[extraRowId] = row;
            }
          });
        }
        return update.selectedRows(updatedSelectedRows);
      }
      if (rowsSelectable && e.shiftKey) {
        const updatedSelectedRows = { ...selectedRows };
        const lastIndex = findLastIndexFrom(
          tableData,
          (value, index) =>
            Object.keys(selectedRows).some((currentId) => currentId === (value.id || value._id || index.toString())),
          idx,
        );
        const indexOfSelected =
          findLastIndexFrom(tableData, (value, index) => rowId === (value.id || value._id || index)) + (rowSpan - 1);
        const allIncludes = tableData.slice(lastIndex + 1, indexOfSelected + 1);
        allIncludes.forEach((row) => {
          const currentId = row.id || row._id || idx;
          updatedSelectedRows[currentId] = row;
        });
        update.selectedRows(updatedSelectedRows);
        return;
      }
      if (rowClick) {
        rowClick(data, e);
      }
    },
    [isMacOS, loading, tableData, rowClick, rowsSelectable, selectedRows, update],
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
            {tableData.map((data, dataIndex, arr) => {
              const isAlternateColour = rowOptions.alternateRowColour && rowOptions.alternateRowColour(data);
              const isDisabledRow = rowOptions.rowDisabled && rowOptions.rowDisabled(data);
              const rowId = data.id || data._id || dataIndex;
              return (
                <TableRow
                  key={rowId}
                  data-testid="tableRow"
                  onMouseOver={(e) => rowClick && onHover(e.currentTarget)}
                  onMouseOut={(e) => rowClick && onUnHover(e.currentTarget)}
                  className={clsx({
                    [classes.alternateRowColour]: Boolean(isAlternateColour),
                    [classes.disabledRow]: Boolean(isDisabledRow),
                    [classes.selectedRow]: rowsSelectable && Boolean(selectedRows[rowId]),
                  })}
                >
                  {cellColumns.map((struct) => {
                    const cellId = struct.id || struct.key;
                    const value = getValue(struct, data, String(rowId), dataIndex);
                    const rowSpan = struct.rowSpan
                      ? struct.rowSpan(data, dataIndex, arr)
                      : struct.groupBy
                      ? groupBy(struct.groupBy as string, data, dataIndex, arr)
                      : 1;
                    return (
                      Boolean(rowSpan) && (
                        <TableCell
                          key={cellId}
                          onClick={(e) => handleRowClick(data, e, rowId, dataIndex, rowSpan)}
                          className={clsx([
                            classes.columnCell,
                            {
                              [classes.hiddenColumnCell]: Boolean(hiddenColumns[cellId!]),
                              [classes.pinnedColumnCell]: pinnedColumn === cellId,
                              [classes.limitedWidthSm]: Boolean(struct.limitWidth == "sm"),
                              [classes.limitedWidthLg]: Boolean(struct.limitWidth == "lg"),
                            },
                          ])}
                          rowSpan={rowSpan}
                        >
                          {struct.limitWidth ? (
                            <Tooltip title={typeof value === "string" && value.length > 20 ? value : ""}>
                              <span>{value}</span>
                            </Tooltip>
                          ) : (
                            value
                          )}
                        </TableCell>
                      )
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
          {(hasFooter || hasColGroupFooter) && (
            <TableFooter>
              {hasFooter && (
                <TableRow>
                  {cellColumns.map((struct) => (
                    <TableCell
                      key={struct.id || struct.key}
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
                      <TableCell key={struct.id || struct.key} colSpan={colGroup.length}>
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
                Show all Columns
              </Button>
            )}
          </div>
        </div>
        <div>
          {disablePagination ? null : (
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
          {!rowsSelectable ? null : (
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
                  <Typography variant="caption" color="textSecondary">
                    To select a single row, hold down {isMacOS ? '"cmd"' : '"ctrl"'} and click on the desired row.
                    <br />
                    <br />
                    To select all rows between the last selected upto (and including) the one clicked, hold down
                    &quot;shift&quot; and click on the desired row.
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

export default <RowType extends BaseData, DataType extends RowType[] = RowType[]>(
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
      csvFilename,
      defaultSort,
      disablePagination,
      enableHiddenColumns,
      hideColumnsOption,
      onChange,
      onSelectedRowsChange,
      rowsSelectable,
      rowsPerPageDefault,
      selectGroupBy,
      tableData,
      tableStructure,
    ],
  );

  return (
    <TableProvider value={tableState}>
      <Table {...allProps} />
    </TableProvider>
  );
};
export * from "./table.types";
