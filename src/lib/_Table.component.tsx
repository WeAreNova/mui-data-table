import {
  alpha,
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
import get from "lodash.get";
import React, { MouseEventHandler, PropsWithChildren, useCallback, useContext, useEffect, useMemo } from "react";
import HeaderRow from "./HeaderRow.component";
import TableContext, { TableState } from "./table.context";
import { BaseData, ColGroupDefinition, ColumnDefinition, TableProps } from "./table.types";
import TableCell from "./TableCell.component";
import { findIndexFrom, findLastIndexFrom, getRowId, getValue } from "./utils";

const useStyles = makeStyles(
  (theme) => ({
    alternateRowColour: {
      backgroundColor: alpha(theme.palette.error.dark, 0.9),
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

const _Table = <RowType extends BaseData, DataType extends RowType[]>({
  tableProps = {},
  rowOptions = {},
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  exportToCSVOption = false,
  disablePagination = false,
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

  const onHover = useCallback<MouseEventHandler<HTMLTableRowElement>>(
    (e) => {
      if (!rowClick) return;
      e.currentTarget.classList.add(classes.rowHover);
      if (!e.currentTarget.parentNode) return;
      const hoverRowIndex = Array.from(e.currentTarget.parentNode.children).indexOf(e.currentTarget);
      for (let row = e.currentTarget.previousSibling as Element; row; row = row.previousSibling as Element) {
        if (!row.parentNode) continue;
        const rowIndex = Array.from(row.parentNode.children).indexOf(row);
        const rowsBetween = hoverRowIndex - rowIndex;
        row.querySelectorAll("td[rowspan]").forEach((cell) => {
          const rowSpan = Number(cell.getAttribute("rowspan"));
          if (rowSpan > rowsBetween) cell.classList.add(classes.rowHover);
        });
      }
    },
    [classes.rowHover, rowClick],
  );

  const onUnHover = useCallback<React.MouseEventHandler<HTMLTableRowElement>>(
    (e) => {
      if (!rowClick) return;
      e.currentTarget.classList.remove(classes.rowHover);
      for (let row = e.currentTarget.previousSibling as Element; row; row = row.previousSibling as Element) {
        row.querySelectorAll("td[rowspan]").forEach((cell) => cell.classList.remove(classes.rowHover));
      }
    },
    [classes.rowHover, rowClick],
  );

  const groupBy = useCallback((groupByKey: string, data: RowType, index: number, arr: RowType[]) => {
    const value = get(data, groupByKey);
    const previousValue = get(arr[index - 1], groupByKey);
    if (value && previousValue && value === previousValue) {
      // if previous row has same group by value, this row merges with the row above
      return 0;
    }
    if (value) {
      // go forward until we find a different value, then span all the rows in between
      const endIndex = findIndexFrom(arr, (v) => get(v, groupByKey) !== value, index);
      return endIndex > -1 ? endIndex - index : arr.length - index;
    }
    return 1;
  }, []);

  const cellColumns = useMemo(
    () =>
      filteredTableStructure.flatMap<ColumnDefinition<RowType, DataType> | ColGroupDefinition<RowType, DataType>>(
        (struct) =>
          !struct.colGroup || hiddenColumns[struct.key]
            ? [struct]
            : struct.colGroup.map((colGroup) => ({
                ...colGroup,
                isColGroup: true,
                hasColGroupFooter: Boolean(struct.footer),
              })),
      ),
    [filteredTableStructure, hiddenColumns],
  );
  const hasColGroupFooter = useMemo(
    () => filteredTableStructure.some((struct) => Boolean(struct.colGroup && struct.footer)),
    [filteredTableStructure],
  );
  const hasFooter = useMemo(() => cellColumns.some((struct) => Boolean(struct.footer)), [cellColumns]);

  const isMacOS = useMemo(() => typeof window !== "undefined" && window.navigator.userAgent.indexOf("Mac") !== -1, []);

  const handleRowClick = useCallback(
    (data: RowType, e: React.MouseEvent<HTMLTableCellElement, MouseEvent>, rowId: string, idx: number, rowSpan = 1) => {
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
            const extraRowId = getRowId(row, idx + (extraRowIndex + 1));
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
          (value, index) => Object.keys(selectedRows).some((currentId) => currentId === getRowId(value, index)),
          idx,
        );
        const indexOfSelected =
          findLastIndexFrom(tableData, (value, index) => rowId === getRowId(value, index)) + (rowSpan - 1);
        const allIncludes = tableData.slice(lastIndex + 1, indexOfSelected + 1);
        allIncludes.forEach((row) => {
          const currentId = getRowId(row, idx);
          updatedSelectedRows[currentId] = row;
        });
        update.selectedRows(updatedSelectedRows);
        return;
      }
      rowClick?.(data, e);
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
              const rowId = getRowId(data, dataIndex);
              return (
                <TableRow
                  key={rowId}
                  data-testid="tableRow"
                  onMouseOver={onHover}
                  onMouseOut={onUnHover}
                  className={clsx({
                    [classes.alternateRowColour]: Boolean(isAlternateColour),
                    [classes.disabledRow]: Boolean(isDisabledRow),
                    [classes.selectedRow]: rowsSelectable && Boolean(selectedRows[rowId]),
                  })}
                >
                  {cellColumns.map((struct) => {
                    const value = getValue(struct, data, String(rowId), dataIndex);
                    const rowSpan = struct.rowSpan
                      ? struct.rowSpan(data, dataIndex, arr)
                      : struct.groupBy
                      ? groupBy(struct.groupBy as string, data, dataIndex, arr)
                      : 1;
                    return (
                      Boolean(rowSpan) && (
                        <TableCell
                          key={struct.key}
                          onClick={(e) => handleRowClick(data, e, rowId, dataIndex, rowSpan)}
                          hidden={Boolean(hiddenColumns[struct.key])}
                          pinned={pinnedColumn === struct.key}
                          maxWidth={struct.limitWidth}
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

export default _Table;
