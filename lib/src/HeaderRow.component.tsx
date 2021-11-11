import { Grow, makeStyles, Popper, TableHead, TableRow } from "@material-ui/core";
import React, { PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Filter, { InitialFilterValues } from "./Filter";
import HeaderCell from "./HeaderCell.component";
import TableContext, { TableState } from "./table.context";
import type { BaseData } from "./table.types";

const useStyles = makeStyles(
  () => ({
    filterContainer: {
      zIndex: 2,
    },
  }),
  { name: "DataTable-HeaderRow" },
);

/**
 * The HeaderRow component is used to render the table header, handle its state and manage other components used in the table header.
 *
 * @component
 * @package
 */
const HeaderRow = <RowType extends BaseData, AllDataType extends RowType[]>(
  props: PropsWithChildren<Record<string, never>>,
) => {
  const classes = useStyles(props);
  const { filteredTableStructure, hiddenColumns } = useContext<TableState<RowType, AllDataType>>(TableContext);
  const topHeaderRef = useRef<HTMLTableRowElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLTableCellElement | null>(null);
  const [initialFilter, setInitialFilter] = useState<InitialFilterValues<RowType> | null>(null);

  const topHeaderOffsetStyle = useCallback(
    () => ({ top: (topHeaderRef.current && topHeaderRef.current.offsetHeight) ?? undefined }),
    [],
  );

  const hasColGroups = useMemo(
    () => filteredTableStructure.some((struct) => Boolean(struct.colGroup)),
    [filteredTableStructure],
  );

  const handleFilterClick = useCallback((target: HTMLTableCellElement, initialFilter: InitialFilterValues<RowType>) => {
    setAnchorEl((currentTarget) => {
      const newAnchorEl = currentTarget === target ? null : target;
      if (newAnchorEl) setInitialFilter(initialFilter);
      return newAnchorEl;
    });
  }, []);

  const handleFilterClose = useCallback(() => setAnchorEl(null), []);

  useEffect(() => {
    document.addEventListener("closeFilter", handleFilterClose);
    return () => document.removeEventListener("closeFilter", handleFilterClose);
  }, [handleFilterClose]);

  return (
    <TableHead>
      <TableRow ref={topHeaderRef}>
        {filteredTableStructure.map((structure) => (
          <HeaderCell
            key={structure.key}
            id={structure.key}
            structure={structure}
            hasColGroups={hasColGroups}
            onFilterClick={handleFilterClick}
          />
        ))}
      </TableRow>
      {hasColGroups && (
        <TableRow>
          {filteredTableStructure.map(({ colGroup, ...containerStructure }) =>
            colGroup && !hiddenColumns[containerStructure.key]
              ? colGroup.map((colGroupStructure) => (
                  <HeaderCell
                    key={colGroupStructure.key}
                    id={colGroupStructure.key}
                    structure={colGroupStructure}
                    onFilterClick={handleFilterClick}
                    style={topHeaderOffsetStyle()}
                    colGroupHeader
                  />
                ))
              : null,
          )}
        </TableRow>
      )}
      <Popper
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        placement="bottom-start"
        transition
        className={classes.filterContainer}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Filter initialFilter={initialFilter} onClose={handleFilterClose} />
          </Grow>
        )}
      </Popper>
    </TableHead>
  );
};

export default HeaderRow;
