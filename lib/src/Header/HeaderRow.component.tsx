import { Grow, Popper, styled, TableHead, TableRow } from "@mui/material";
import Filter, { InitialFilterValues } from "Filter";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import TableContext, { TableState } from "table.context";
import type { BaseData } from "table.types";
import HeaderCell from "./HeaderCell.component";

const StyledPopper = styled(Popper)`
  zindex: 1;
`;

/**
 * The HeaderRow component is used to render the table header, handle its state and manage other components used in the table header.
 *
 * @component
 * @package
 */
const HeaderRow = <RowType extends BaseData, AllDataType extends RowType[]>() => {
  const { structure, hiddenColumns } = useContext<TableState<RowType, AllDataType>>(TableContext);
  const topHeaderRef = useRef<HTMLTableRowElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLTableCellElement | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [initialFilter, setInitialFilter] = useState<InitialFilterValues<RowType> | null>(null);

  const hasColGroups = useMemo(
    () => structure.notHidden.some((struct) => Boolean(struct.colGroup)),
    [structure.notHidden],
  );

  const topHeaderOffsetStyle = useCallback(
    () => ({ top: (topHeaderRef.current && topHeaderRef.current.offsetHeight) ?? undefined }),
    [],
  );

  const handleFilterClick = useCallback(
    (target: HTMLTableCellElement, targetInitFilter: InitialFilterValues<RowType>) => {
      setAnchorEl((currentTarget) => {
        const isSame = currentTarget === target;
        if (!isSame) {
          setInitialFilter(targetInitFilter);
          setFilterOpen(true);
        } else {
          setFilterOpen((s) => !s);
        }
        return target;
      });
    },
    [],
  );

  const handleFilterClose = useCallback(() => setFilterOpen(false), []);

  useEffect(() => {
    document.addEventListener("closeFilter", handleFilterClose);
    return () => document.removeEventListener("closeFilter", handleFilterClose);
  }, [handleFilterClose]);

  return (
    <TableHead>
      <TableRow ref={topHeaderRef}>
        {structure.notHidden.map((column) => (
          <HeaderCell
            key={column.key}
            id={column.key}
            structure={column}
            hasColGroups={hasColGroups}
            onFilterClick={handleFilterClick}
          />
        ))}
      </TableRow>
      {hasColGroups && (
        <TableRow>
          {structure.notHidden.map(({ colGroup, ...containerStructure }) =>
            colGroup && !hiddenColumns[containerStructure.key]
              ? colGroup
                  .filter((cg) => !cg.hidden)
                  .map((colGroupStructure) => (
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
      <StyledPopper open={filterOpen} anchorEl={anchorEl} placement="bottom-start" transition>
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <div>
              <Filter initialFilter={initialFilter} onClose={handleFilterClose} />
            </div>
          </Grow>
        )}
      </StyledPopper>
    </TableHead>
  );
};

export default HeaderRow;
