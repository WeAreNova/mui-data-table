import AcUnit from "@mui/icons-material/AcUnit";
import FilterList from "@mui/icons-material/FilterList";
import Visibility from "@mui/icons-material/Visibility";
import { Box, CSSObject, Divider, IconButton, styled, TableSortLabel, Tooltip } from "@mui/material";
import { InitialFilterValues } from "Filter";
import PropTypes from "prop-types";
import React, { Fragment, MouseEventHandler, PropsWithChildren, useCallback, useContext, useMemo, useRef } from "react";
import TableContext, { TableState } from "table.context";
import type { ActionButton, BaseData, ColGroupDefinition, ColumnDefinition, Sort, TableCellAlign } from "table.types";
import TableCell from "TableCell.component";
import { dispatchTableEvent, dontForwardProps, getColumnTitle, getDataType, getDefaultOperator, getPath } from "utils";
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

const FilterButton = styled(IconButton, {
  name: "DTHeaderCell-filterButton",
  shouldForwardProp: dontForwardProps("active"),
})<{ active: boolean }>(({ active, theme }) => [
  {
    opacity: 0.3,
    transition: theme.transitions.create(["opacity", "color"], {
      duration: theme.transitions.duration.shorter,
      easing: theme.transitions.easing.easeInOut,
    }),
  },
  active && {
    opacity: 1,
  },
]);

const HeaderTableCell = styled(TableCell, {
  name: "DTHeaderCell-root",
  shouldForwardProp: dontForwardProps("colGroupHeader", "pinned"),
})<{
  colGroupHeader: boolean;
  pinned: boolean;
}>(({ colGroupHeader, pinned }) => [
  {
    [`&:hover ${FilterButton}`]: {
      opacity: 1,
    },
  },
  colGroupHeader && pinned && { left: "unset" },
]);

const alignmentStyles: Record<TableCellAlign, CSSObject> = {
  left: {
    justifyContent: "flex-start",
  },
  center: {
    justifyContent: "center",
    "& > div": {
      flex: 1,
      width: "100%",
      "&:nth-of-type(1)": {
        order: 2,
        textAlign: "center",
      },
      "&:nth-of-type(2)": {
        order: 1,
      },
      "&:nth-of-type(3)": {
        order: 3,
      },
    },
  },
  right: {
    justifyContent: "flex-end",
    "& > div:nth-of-type(1)": {
      order: 3,
      textAlign: "right",
      "& .MuiTableSortLabel-root": {
        flexDirection: "row-reverse",
      },
    },
    "& > div:nth-of-type(2)": {
      order: 2,
    },
    "& > div:nth-of-type(3)": {
      order: 1,
    },
  },
};

const editableOffsetKey: Record<Exclude<TableCellAlign, "center">, string> = {
  left: "paddingLeft",
  right: "paddingRight",
};

const InnerHeaderCell = styled("div", {
  name: "DTHeaderCell-inner",
  shouldForwardProp: dontForwardProps("alignment", "editableOffset", "resizeable"),
})<{
  alignment?: TableCellAlign;
  editableOffset: boolean;
  resizeable: boolean;
}>(({ alignment = "left", editableOffset, resizeable, theme }) => [
  { display: "flex" },
  resizeable && { overflow: "hidden" },
  alignment && alignmentStyles[alignment],
  editableOffset &&
    alignment !== "center" && {
      [editableOffsetKey[alignment]]: theme.spacing(1),
    },
]);

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
  style,
}: PropsWithChildren<HeaderCellProps<RowType, AllDataType>>) => {
  const { activeFilters, sort, enableHiddenColumns, hiddenColumns, pinnedColumn, allTableData, update, resizeable } =
    useContext<TableState<RowType, AllDataType>>(TableContext);
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
        <HeaderTableCell
          onClick={handleUnhide}
          ref={tableCellRef}
          hidden={Boolean(isHidden)}
          pinned={pinnedColumn === id}
          colGroupHeader={colGroupHeader}
          colSpan={colSpan}
          rowSpan={rowSpan}
          align={structure.align}
          style={style}
        >
          <Box sx={{ position: "relative" }}>
            <InnerHeaderCell
              alignment={structure.align}
              resizeable={!colGroupHeader && resizeable}
              editableOffset={Boolean(structure.editable)}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  whiteSpace: "pre",
                }}
              >
                {structure.sorter ? (
                  <TableSortLabel
                    onClick={handleSort}
                    active={
                      sort.direction &&
                      (sort.key === structure.sorter || sort.key === structure.dataIndex || sort.key === id)
                    }
                    direction={
                      sort.key === id || sort.key === structure.sorter || sort.key === structure.dataIndex
                        ? sort.direction
                        : undefined
                    }
                    sx={{
                      whiteSpace: "inherit",
                      "& > svg.MuiTableSortLabel-icon": {
                        opacity: 0.2,
                      },
                    }}
                  >
                    {headerTitle}
                  </TableSortLabel>
                ) : (
                  headerTitle
                )}
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  "& svg": {
                    fontSize: "1rem",
                  },
                }}
              >
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
                  <FilterButton
                    onClick={handleFilterClick}
                    onMouseUp={stopPropagation}
                    onTouchEnd={stopPropagation}
                    data-testid="tableFilterButton"
                    color={filterActive ? "primary" : "default"}
                    active={filterActive}
                    size="small"
                  >
                    <FilterList />
                  </FilterButton>
                )}
              </Box>
              <div />
            </InnerHeaderCell>
            {!colGroupHeader && resizeable && (
              <Divider
                id="DataTable-ResizeHandle"
                orientation="vertical"
                sx={{
                  height: 24,
                  borderRightWidth: 3,
                  position: "absolute",
                  right: (theme) => `calc(${theme.spacing(-1)} - 1.5px)`, // 1.5 = borderRightWidth / 2
                  top: "calc(50% - 12px)", // 12 = height / 2
                  cursor: "col-resize",
                  "&:active,&:hover": {
                    borderColor: "action.active",
                  },
                }}
              />
            )}
          </Box>
        </HeaderTableCell>
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
