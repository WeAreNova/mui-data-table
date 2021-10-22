import { IconButton, makeStyles, TableCell, TableSortLabel, Tooltip } from "@material-ui/core";
import { AcUnit, FilterList, Visibility } from "@material-ui/icons";
import { createStyles } from "@material-ui/styles";
import clsx from "clsx";
import React, { Fragment, PropsWithChildren, useCallback, useContext, useMemo, useRef } from "react";
import { SetRequired } from "type-fest";
import TableContext from "./table.context";
import { ActionButton, BaseData, TableColumnStructure } from "./table.types";
import { getFilterPath } from "./utils";

interface Props<RowType extends BaseData, DataType extends RowType[]> {
  id: string;
  structure: TableColumnStructure<RowType, DataType>;
  onFilterClick(target: HTMLTableCellElement): void;
  hasColGroups?: boolean;
  colGroupHeader?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const useStyles = makeStyles(
  (theme) =>
    createStyles({
      columnCell: {
        transition: theme.transitions.create("width", {
          duration: theme.transitions.duration.shorter,
          easing: theme.transitions.easing.easeInOut,
        }),
        "&:hover $filterIconButton": {
          opacity: 1,
        },
      },
      columnCellBody: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      columnCellInner: {
        display: "flex",
        "& > div": {
          flex: 1,
          width: "100%",
        },
      },
      columnCellButtonGroup: {
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        paddingRight: theme.spacing(1),
        "& svg": {
          fontSize: "1rem",
        },
      },
      columnFilterInput: {
        "& > input": {
          ...theme.typography.caption,
          "&::placeholder": {
            ...theme.typography.caption,
            opacity: 1,
            color: theme.palette.text.hint,
          },
        },
      },
      filterIconButton: {
        opacity: 0.2,
        transition: theme.transitions.create(["opacity", "color"], {
          duration: theme.transitions.duration.shorter,
          easing: theme.transitions.easing.easeInOut,
        }),
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
      stickyColGroupHeader: {
        left: "unset",
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
    }),
  { name: "HeaderCellComponent" },
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
    useContext(TableContext);
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
    () => filterEnabled && getFilterPath(structure as SetRequired<typeof structure, "filterColumn">),
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
        ...(structure.colGroup?.reduce((acc, col) => ({ ...acc, [(col.id || col.key)!]: hidden }), {}) || {}),
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
    () =>
      clsx([
        className,
        classes.columnCell,
        {
          [classes.stickyColGroupHeader]: colGroupHeader && pinnedColumn !== id,
          [classes.hiddenColumnCell]: Boolean(hidden),
          [classes.pinnedColumnCell]: pinnedColumn === id,
        },
      ]),
    [className, classes, colGroupHeader, hidden, id, pinnedColumn],
  );

  const handleFilterClick = useCallback(() => onFilterClick(tableCellRef.current!), [onFilterClick]);

  return (
    <Fragment key={id}>
      <Tooltip title={hidden ? `Unhide '${structure.title}' Column` : ""} placement="top">
        <TableCell
          ref={tableCellRef}
          style={style}
          className={headerClasses}
          colSpan={colSpan}
          rowSpan={rowSpan}
          onClick={handleUnhide}
        >
          <div className={classes.columnCellInner}>
            <div className={classes.columnCellButtonGroup}>
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
            <div className={classes.columnCellBody}>
              {structure.sorter ? (
                <TableSortLabel
                  active={
                    sort.direction &&
                    (sort.key === structure.sorter || sort.key === structure.dataIndex || sort.key === id)
                  }
                  direction={
                    sort.key === id || sort.key === structure.sorter || sort.key === structure.dataIndex
                      ? sort.direction
                      : undefined
                  }
                  onClick={handleSort}
                >
                  {headerTitle}
                </TableSortLabel>
              ) : typeof structure.title === "function" ? (
                structure.title(allTableData)
              ) : (
                structure.title
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
