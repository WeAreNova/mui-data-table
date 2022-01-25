import { createStyles, Divider, IconButton, makeStyles, TableSortLabel, Tooltip } from "@material-ui/core";
import AcUnit from "@material-ui/icons/AcUnit";
import FilterList from "@material-ui/icons/FilterList";
import Visibility from "@material-ui/icons/Visibility";
import clsx from "clsx";
import { InitialFilterValues } from "Filter";
import useTableContext from "hooks/useTableContext.hook";
import PropTypes from "prop-types";
import React, { Fragment, MouseEventHandler, PropsWithChildren, useCallback, useMemo, useRef } from "react";
import type { ActionButton, BaseData, ColGroupDefinition, ColumnDefinition, Sort } from "table.types";
import TableCell from "TableCell.component";
import { dispatchTableEvent, getColumnTitle, getDataType, getDefaultOperator, getPath } from "utils";
import { ColumnDefinitionPropType } from "_propTypes";

interface HeaderCellProps<RowType extends BaseData, AllDataType extends RowType[]> {
  id: string;
  structure: ColumnDefinition<RowType, AllDataType> | ColGroupDefinition<RowType, AllDataType>;
  onFilterClick(target: HTMLTableCellElement, initialFilter: InitialFilterValues<RowType>): void;
  hasColGroups?: boolean;
  colGroupHeader?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const useStyles = makeStyles(
  (theme) =>
    createStyles({
      root: {
        "&:hover $filterButton": {
          opacity: 1,
        },
      },
      alignLeft: {
        justifyContent: "flex-start",
        "&$editableOffset": {
          paddingLeft: theme.spacing(1),
        },
      },
      alignCenter: {
        justifyContent: "center",
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
        justifyContent: "flex-end",
        "&$editableOffset": {
          padding: 0,
          paddingRight: theme.spacing(1),
        },
        "& > div:nth-child(1)": {
          order: 3,
          textAlign: "right",
          "& $sortLabel": {
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
      body: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "pre",
      },
      buttonGroup: {
        display: "flex",
        alignItems: "center",
        "& svg": {
          fontSize: "1rem",
        },
      },
      editableOffset: {},
      filterButton: {
        opacity: 0.2,
        transition: theme.transitions.create(["opacity", "color"], {
          duration: theme.transitions.duration.shorter,
          easing: theme.transitions.easing.easeInOut,
        }),
      },
      inner: {
        display: "flex",
      },
      resizeable: {
        overflow: "hidden",
      },
      resizeContainer: {
        position: "relative",
      },
      resizeHandle: {
        width: 3,
        height: 24,
        position: "absolute",
        right: `calc(${theme.spacing(-1)}px - 1.5px)`, // horizontal alignment
        top: "calc(50% - 12px)", // vertical alignment
        cursor: "col-resize",
        "&:active,&:hover": {
          backgroundColor: theme.palette.action.active,
        },
      },
      sortLabel: {
        whiteSpace: "inherit",
        "& > svg.MuiTableSortLabel-icon": {
          opacity: 0.2,
        },
      },
      stickyColGroup: {
        left: "unset",
      },
    }),
  { name: "DTHeaderCell" },
);

/**
 * The HeaderCell component is a wrapper around the custom TableCell component which manages all the state for a single header cell
 * as well as handle the rendering of the header title.
 *
 * @component
 * @package
 */
const HeaderCell = <RowType extends BaseData, AllDataType extends RowType[] = RowType[]>({
  id,
  structure,
  onFilterClick,
  hasColGroups = false,
  colGroupHeader = false,
  className,
  style,
  ...props
}: PropsWithChildren<HeaderCellProps<RowType, AllDataType>>) => {
  const classes = useStyles(props);
  const { activeFilters, sort, enableHiddenColumns, hiddenColumns, pinnedColumn, allTableData, update, resizeable } =
    useTableContext<RowType, AllDataType>();
  const tableCellRef = useRef<HTMLTableCellElement>(null);

  const headerTitle = useMemo(() => getColumnTitle(structure.title, allTableData), [structure, allTableData]);
  const isHidden = useMemo(() => Boolean(hiddenColumns[id]), [hiddenColumns, id]);
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
    () => isHidden && handleHiddenColumnsChange(false),
    [handleHiddenColumnsChange, isHidden],
  );

  const handleSort = useCallback(() => {
    update({
      sort: (currSort) => {
        const key = typeof structure.sorter === "string" ? structure.sorter : structure.dataIndex || id;
        let direction: Sort["direction"];
        if (currSort.key !== key || currSort.direction === undefined) {
          direction = "asc";
        } else if (currSort.direction === "asc") {
          direction = "desc";
        }
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
      clsx(classes.root, className, {
        [classes.stickyColGroup]: colGroupHeader && pinnedColumn !== id,
      }),
    [className, classes.stickyColGroup, classes.root, colGroupHeader, id, pinnedColumn],
  );

  const handleFilterClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (e) => {
      if (!filterPath) return;
      e.stopPropagation();
      dispatchTableEvent("cancelEdit");
      const filterType = getDataType(structure.filterColumn, structure);
      onFilterClick(tableCellRef.current!, {
        path: filterPath,
        type: filterType,
        operator: getDefaultOperator(structure.filterColumn, filterType),
      });
    },
    [filterPath, onFilterClick, structure],
  );

  const stopPropagation = useCallback((e: React.MouseEvent | React.TouchEvent) => e.stopPropagation(), []);

  return (
    <Fragment key={id}>
      <Tooltip title={isHidden ? `Unhide '${structure.title}' Column` : ""} placement="top">
        <TableCell
          onClick={handleUnhide}
          ref={tableCellRef}
          hidden={Boolean(isHidden)}
          pinned={pinnedColumn === id}
          colSpan={colSpan}
          rowSpan={rowSpan}
          align={structure.align}
          className={headerClasses}
          style={style}
        >
          <div className={classes.resizeContainer}>
            <div
              className={clsx(classes.inner, classes.alignLeft, {
                [classes.alignRight]: structure.align === "right",
                [classes.alignCenter]: structure.align === "center",
                [classes.editableOffset]: Boolean(structure.editable),
                [classes.resizeable]: !colGroupHeader && resizeable,
              })}
            >
              <div className={classes.body}>
                {structure.sorter ? (
                  <TableSortLabel
                    onClick={handleSort}
                    className={classes.sortLabel}
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
              <div className={classes.buttonGroup}>
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
                {structure.actionButtons?.map(({ key, icon, onClick, ...actionButtonProps }: ActionButton) => (
                  <IconButton key={key} onClick={onClick} {...actionButtonProps} size="small">
                    {icon}
                  </IconButton>
                ))}
                {filterEnabled && (
                  <IconButton
                    onClick={handleFilterClick}
                    onMouseUp={stopPropagation}
                    onTouchEnd={stopPropagation}
                    data-testid="DT-FilterButton"
                    color={filterActive ? "primary" : "default"}
                    size="small"
                    className={clsx({ [classes.filterButton]: !filterActive })}
                  >
                    <FilterList />
                  </IconButton>
                )}
              </div>
              <div />
            </div>
            {!colGroupHeader && resizeable && (
              <Divider
                id="DT-ResizeHandle"
                className={classes.resizeHandle}
                orientation="vertical"
                data-testid="DT-ResizeHandle"
              />
            )}
          </div>
        </TableCell>
      </Tooltip>
    </Fragment>
  );
};
HeaderCell.propTypes = {
  id: PropTypes.string.isRequired,
  structure: ColumnDefinitionPropType.isRequired,
  onFilterClick: PropTypes.func.isRequired,
  hasColGroups: PropTypes.bool,
  colGroupHeader: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default HeaderCell;
