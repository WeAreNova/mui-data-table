import { IconButton, makeStyles, TableSortLabel, Tooltip } from "@material-ui/core";
import AcUnit from "@material-ui/icons/AcUnit";
import FilterList from "@material-ui/icons/FilterList";
import Visibility from "@material-ui/icons/Visibility";
import { createStyles } from "@material-ui/styles";
import clsx from "clsx";
import PropTypes from "prop-types";
import React, { Fragment, MouseEventHandler, PropsWithChildren, useCallback, useContext, useMemo, useRef } from "react";
import { InitialFilterValues } from "./Filter";
import TableContext, { TableState } from "./table.context";
import type { ActionButton, BaseData, ColGroupDefinition, ColumnDefinition } from "./table.types";
import TableCell from "./TableCell.component";
import { dispatchTableEvent, getColumnTitle, getDataType, getDefaultOperator, getPath } from "./utils";
import { ColumnDefinitionPropType } from "./_propTypes";

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
  const { activeFilters, sort, enableHiddenColumns, hiddenColumns, pinnedColumn, allTableData, update } =
    useContext<TableState<RowType, AllDataType>>(TableContext);
  const tableCellRef = useRef<HTMLTableCellElement>(null);

  const headerTitle = useMemo(() => getColumnTitle(structure.title, allTableData), [structure, allTableData]);
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
                  onMouseUp={stopPropagation}
                  onTouchEnd={stopPropagation}
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
