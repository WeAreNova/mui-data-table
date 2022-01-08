import Help from "@mui/icons-material/Help";
import {
  Box,
  Button,
  styled,
  Table as MUITable,
  TableBody,
  TableContainer,
  TableFooter,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import BodyRow from "Body/BodyRow.component";
import HeaderRow from "Header/HeaderRow.component";
import useTableContext from "hooks/useTableContext.hook";
import PropTypes from "prop-types";
import type { ChangeEventHandler, PropsWithChildren } from "react";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { BaseData, TableProps } from "table.types";
import TableCell from "TableCell.component";
import { dontForwardProps, getRowId } from "utils";
import { RowsPerPageOptionsPropType } from "_propTypes";

interface _TableProps<RowType extends BaseData, AllDataType extends RowType[]>
  extends Pick<
    TableProps<RowType, AllDataType>,
    "tableProps" | "rowsPerPageOptions" | "exportToCSVOption" | "disablePagination"
  > {}

const LoadableTableBody = styled(TableBody, {
  name: "DTTableBody-root",
  shouldForwardProp: dontForwardProps("loading"),
})<{ loading: boolean }>(({ loading, theme }) => [
  {
    transition: theme.transitions.create(["opacity", "background-color"], {
      duration: theme.transitions.duration.shortest,
      easing: theme.transitions.easing.easeInOut,
    }),
  },
  loading && {
    opacity: 0.4,
    backgroundColor: "action.hover",
  },
]);

const TableToolbar = styled("div", { name: "DTToolbar-root" })({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  position: "sticky",
  left: 0,
  border: "1px solid",
  borderColor: "divider",
  borderWidth: "1px 0 1px 0",
});

/**
 * This is the internal Table component and should not be used directly.
 * Use the default export from `@wearenova/mui-data-table` instead.
 *
 * @component
 * @package
 */
const _Table = <RowType extends BaseData, AllDataType extends RowType[]>({
  tableProps = {},
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  exportToCSVOption = false,
  disablePagination = false,
}: PropsWithChildren<_TableProps<RowType, AllDataType>>) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const {
    allTableData,
    tableData,
    structure,
    enableHiddenColumns,
    rowsSelectable,
    selectedRows,
    numRowsSelected,
    rowsPerPage,
    page,
    onSelectedRowsChange,
    hiddenColumns,
    update,
    loading,
    exportToCSV,
    count,
    isMacOS,
    resizeable,
  } = useTableContext<RowType, AllDataType>();

  const allColumnsVisible = useMemo(() => {
    const values = Object.values(hiddenColumns);
    return !values.length || values.every((value) => !value);
  }, [hiddenColumns]);

  const hasFooter = useMemo(() => structure.flattened.some((struct) => Boolean(struct.footer)), [structure.flattened]);
  const hasColGroupFooter = useMemo(
    () => structure.some((struct) => Boolean(struct.colGroup && struct.footer)),
    [structure],
  );

  const onPageChange = useCallback((_e: React.MouseEvent | null, newPage: number) => update.page(newPage), [update]);
  const onRowsPerPageChange = useCallback<ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>>(
    (e) => {
      const newRowsPerPage = parseInt(e.target.value, 10);
      update({ rowsPerPage: newRowsPerPage, page: 0 });
    },
    [update],
  );

  const handleShowAll = useCallback(
    () =>
      update.hiddenColumns((currHiddenColumns) =>
        Object.keys(currHiddenColumns).reduce((prev, key) => ({ ...prev, [key]: false }), {}),
      ),
    [update],
  );
  const handleClearSelection = useCallback(() => update.selectedRows({}), [update]);

  useEffect(() => {
    if (onSelectedRowsChange) onSelectedRowsChange(Object.values(selectedRows));
  }, [onSelectedRowsChange, selectedRows]);

  useEffect(() => {
    if (!resizeable || !tableRef.current) return;
    tableRef.current.style.tableLayout = "auto";
    const columns = tableRef.current.getElementsByTagName("th");
    Array.from(columns).forEach((column) => {
      column.style.width = column.clientWidth + "px";
      const resizeHandle = column.querySelector<HTMLHRElement>("hr#DataTable-ResizeHandle");
      if (!resizeHandle) return;
      let initialX = 0;
      let width = 0;
      const handleMouseMove = (e: MouseEvent) => {
        const diffX = e.clientX - initialX;
        column.style.width = `${width + diffX}px`;
      };
      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      const handleMouseDown = (e: MouseEvent) => {
        initialX = e.clientX;
        width = column.clientWidth;
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      };
      resizeHandle.addEventListener("mousedown", handleMouseDown);
    });
    tableRef.current.style.tableLayout = "fixed";
  }, [resizeable, tableData]);

  return (
    <>
      <TableContainer>
        <MUITable {...tableProps} stickyHeader ref={tableRef}>
          <HeaderRow />
          <LoadableTableBody loading={loading}>
            {tableData.map((data, dataIndex) => (
              <BodyRow key={getRowId(data, dataIndex)} index={dataIndex} data={data} />
            ))}
          </LoadableTableBody>
          {(hasFooter || hasColGroupFooter) && (
            <TableFooter>
              {hasFooter && (
                <TableRow>
                  {structure.flattened.map((struct) => (
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
                  {structure.map(({ colGroup, footer, ...struct }) =>
                    colGroup && footer ? (
                      <TableCell key={struct.key} colSpan={colGroup.length} align="center">
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
      <TableToolbar>
        <div>
          <Box
            sx={{
              display: "flex",
              pl: 1,
            }}
          >
            {exportToCSVOption && (
              <Button variant="text" disabled={loading} onClick={exportToCSV}>
                CSV Export
              </Button>
            )}
            {enableHiddenColumns && (
              <Button onClick={handleShowAll} variant="text" disabled={allColumnsVisible}>
                Show all
              </Button>
            )}
          </Box>
        </div>
        <div>
          {!disablePagination && (
            <TablePagination
              sx={{
                borderBottom: "none",
                width: { xs: "100%", md: "auto" },
              }}
              rowsPerPageOptions={rowsPerPageOptions}
              count={count}
              rowsPerPage={rowsPerPage!}
              page={page}
              SelectProps={{ inputProps: { "aria-label": "rows per page" }, native: true }}
              onPageChange={onPageChange}
              onRowsPerPageChange={onRowsPerPageChange}
              component="div"
            />
          )}
          {rowsSelectable && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                "& > *": {
                  mr: 2.5,
                },
              }}
            >
              <Button onClick={handleClearSelection} disabled={!numRowsSelected} variant="text" size="small">
                Clear Selection
              </Button>
              <Typography variant="body2" align="right">
                {numRowsSelected} of {tableData.length} selected
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
            </Box>
          )}
        </div>
      </TableToolbar>
    </>
  );
};
_Table.propTypes = {
  tableProps: PropTypes.object,
  rowsPerPageOptions: RowsPerPageOptionsPropType,
  exportToCSVOption: PropTypes.bool,
  disablePagination: PropTypes.bool,
};

export default _Table;
