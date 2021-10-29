import { IconButton, makeStyles, TableSortLabel, Tooltip } from "@material-ui/core";
import AcUnit from "@material-ui/icons/AcUnit";
import FilterList from "@material-ui/icons/FilterList";
import Visibility from "@material-ui/icons/Visibility";
import { createStyles } from "@material-ui/styles";
import clsx from "clsx";
import React, { Fragment, PropsWithChildren, useCallback, useContext, useMemo, useRef } from "react";
import TableContext, { TableState } from "./table.context";
import type { ActionButton, BaseData, ColGroupDefinition, ColumnDefinition } from "./table.types";
import TableCell from "./TableCell.component";
import { getPath } from "./utils";

interface Props<RowType extends BaseData, DataType extends RowType[]> {
  id: string;
  structure: ColumnDefinition<RowType, DataType> | ColGroupDefinition<RowType, DataType>;
  onFilterClick(target: HTMLTableCellElement): void;
  hasColGroups?: boolean;
  colGroupHeader?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const useStyles = makeStyles(
  (theme) =>
    createStyles({
      tableCell: {
        "&:hover $filterIconButton": {
          opacity: 1,
        },
      },
      alignCenter: {
        "& > div": {
          flex: 1,
          width: "100%",
          "&:nth-child(1)": {
            order: 2,
            textAlign: "center",
          },
          "&:nth-child(2)": {
            order: 1,
          },
          "&:nth-child(3)": {
            order: 3,
          },
        },
      },
      alignRight: {
        "& > div:nth-child(1)": {
          order: 3,
          textAlign: "right",
          "&  $headerCellSortLabel": {
            flexDirection: "row-reverse",
          },
        },
        "& > div:nth-child(2)": {
          order: 2,
        },
        "& > div:nth-child(3)": {
          order: 1,
        },
      },
      filterIconButton: {
        opacity: 0.2,
        transition: theme.transitions.create(["opacity", "color"], {
          duration: theme.transitions.duration.shorter,
          easing: theme.transitions.easing.easeInOut,
        }),
      },
      headerCellBody: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "pre",
      },
      headerCellButtonGroup: {
        display: "flex",
        alignItems: "center",
        "& svg": {
          fontSize: "1rem",
        },
      },
      headerCellInner: {
        display: "flex",
      },
      headerCellSortLabel: {
        whiteSpace: "inherit",
        "& > svg.MuiTableSortLabel-icon": {
          opacity: 0.2,
        },
      },
      stickyColGroupHeader: {
        left: "unset",
      },
    }),
  { name: "DataTable-HeaderCell" },
);

const HeaderCell = <RowType extends BaseData, DataType extends RowType[] = RowType[]>({
  id,
  structure,
  onFilterClick,
  hasColGroups = false,
  colGroupHeader = false,
  className,
  style,
  ...props
}: PropsWithChildren<Props<RowType, DataType>>) => {
  const classes = useStyles(props);
  const { activeFilters, sort, enableHiddenColumns, hiddenColumns, pinnedColumn, allTableData, update } =
    useContext<TableState<RowType, DataType>>(TableContext);
  const tableCellRef = useRef<HTMLTableCellElement>(null);

  const headerTitle = useMemo(
    () => (typeof structure.title === "function" ? structure.title(allTableData) : structure.title),
    [structure, allTableData],
  );
  const hidden = useMemo(() => Boolean(hiddenColumns[id]), [hiddenColumns, id]);
  const colSpan = useMemo(
    () => (structure.colGroup && !hiddenColumns[id] ? structure.colGroup.length : 1),
    [hiddenColumns, id, structure.colGroup],
  );
  const rowSpan = useMemo(
    () => (hasColGroups && (!structure.colGroup || hiddenColumns[id]) ? 2 : 1),
    [hasColGroups, hiddenColumns, id, structure.colGroup],
  );

  const filterEnabled = useMemo(() => Boolean(structure.filterColumn), [structure]);
  const filterPath = useMemo(
    () => filterEnabled && getPath(structure.filterColumn, structure),
    [filterEnabled, structure],
  );
  const filterActive = useMemo(
    () => Boolean(filterPath) && activeFilters.some((f) => f.path === filterPath),
    [filterPath, activeFilters],
  );

  const handleHiddenColumnsChange = useCallback(
    (hidden?: React.MouseEvent | boolean) =>
      update.hiddenColumns((currHiddenColumns) => ({
        ...currHiddenColumns,
        [id]: typeof hidden === "boolean" ? hidden : !currHiddenColumns[id],
        ...(structure.colGroup?.reduce((acc, col) => ({ ...acc, [col.key]: hidden }), {}) || {}),
      })),
    [id, structure.colGroup, update],
  );
  const handleUnhide = useCallback(
    () => hidden && handleHiddenColumnsChange(false),
    [handleHiddenColumnsChange, hidden],
  );

  const handleSort = useCallback(() => {
    update({
      sort: (currSort) => {
        const key = typeof structure.sorter === "string" ? structure.sorter : structure.dataIndex || id;
        const direction =
          currSort.key !== key || currSort.direction === undefined
            ? "asc"
            : currSort.direction === "asc"
            ? "desc"
            : undefined;
        return {
          key,
          direction,
        };
      },
      page: 0,
    });
  }, [id, structure.dataIndex, structure.sorter, update]);

  const handlePin = useCallback(
    () => update.pinnedColumn((currPinnedColumn) => (currPinnedColumn === id ? "" : id)),
    [id, update],
  );

  const headerClasses = useMemo(
    () => clsx(classes.tableCell, className, { [classes.stickyColGroupHeader]: colGroupHeader && pinnedColumn !== id }),
    [className, classes, colGroupHeader, id, pinnedColumn],
  );

  const handleFilterClick = useCallback(() => onFilterClick(tableCellRef.current!), [onFilterClick]);

  return (
    <Fragment key={id}>
      <Tooltip title={hidden ? `Unhide '${structure.title}' Column` : ""} placement="top">
        <TableCell
          onClick={handleUnhide}
          ref={tableCellRef}
          hidden={Boolean(hidden)}
          pinned={pinnedColumn === id}
          colSpan={colSpan}
          rowSpan={rowSpan}
          align={structure.align}
          className={headerClasses}
          style={style}
        >
          <div
            className={clsx(classes.headerCellInner, {
              [classes.alignRight]: structure.align === "right",
              [classes.alignCenter]: structure.align === "center",
            })}
          >
            <div className={classes.headerCellBody}>
              {structure.sorter ? (
                <TableSortLabel
                  onClick={handleSort}
                  className={classes.headerCellSortLabel}
                  active={
                    sort.direction &&
                    (sort.key === structure.sorter || sort.key === structure.dataIndex || sort.key === id)
                  }
                  direction={
                    sort.key === id || sort.key === structure.sorter || sort.key === structure.dataIndex
                      ? sort.direction
                      : undefined
                  }
                >
                  {headerTitle}
                </TableSortLabel>
              ) : (
                headerTitle
              )}
            </div>
            <div className={classes.headerCellButtonGroup}>
              {enableHiddenColumns && (
                <IconButton onClick={handleHiddenColumnsChange} size="small">
                  <Visibility />
                </IconButton>
              )}
              {structure.pinnable && (
                <IconButton onClick={handlePin} color={pinnedColumn === id ? "primary" : "default"} size="small">
                  <AcUnit />
                </IconButton>
              )}
              {structure.actionButtons?.map(({ key, icon, onClick, ...props }: ActionButton) => (
                <IconButton key={key} onClick={onClick} {...props} size="small">
                  {icon}
                </IconButton>
              ))}
              {filterEnabled && (
                <IconButton
                  onClick={handleFilterClick}
                  data-testid="tableFilterButton"
                  color={filterActive ? "primary" : "default"}
                  size="small"
                  className={clsx({ [classes.filterIconButton]: !filterActive })}
                >
                  <FilterList />
                </IconButton>
              )}
            </div>
            <div />
          </div>
        </TableCell>
      </Tooltip>
    </Fragment>
  );
};

export default HeaderCell;
