import { Grow, makeStyles, Popper, TableHead, TableRow } from "@material-ui/core";
import clsx from "clsx";
import React, { PropsWithChildren, useCallback, useContext, useMemo, useRef, useState } from "react";
import Filter from "./Filter";
import HeaderCell from "./HeaderCell.component";
import TableContext, { TableState } from "./table.context";
import type { BaseData } from "./table.types";

interface HeaderRowProps {}

const useStyles = makeStyles(
  (theme) => ({
    borderRight: {
      borderRight: `1px solid ${theme.palette.divider}`,
    },
    filterContainer: {
      zIndex: 2,
    },
  }),
  { name: "HeaderRowComponent" },
);

const HeaderRow = <RowType extends BaseData, DataType extends RowType[]>(props: PropsWithChildren<HeaderRowProps>) => {
  const classes = useStyles(props);
  const { tableStructure, filteredTableStructure, hiddenColumns } =
    useContext<TableState<RowType, DataType>>(TableContext);
  const topHeaderRef = useRef<HTMLTableRowElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLTableCellElement | null>(null);

  const topHeaderOffsetStyle = useCallback(
    () => ({ top: (topHeaderRef.current && topHeaderRef.current.offsetHeight) ?? undefined }),
    [],
  );

  const hasColGroups = useMemo(
    () => filteredTableStructure.some((struct) => Boolean(struct.colGroup)),
    [filteredTableStructure],
  );

  const handleFilterClick = useCallback(
    (target: HTMLTableCellElement) => setAnchorEl((a) => (a === target ? null : target)),
    [],
  );

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
          {filteredTableStructure.map(({ colGroup, ...containerStructure }, structIndex) =>
            colGroup && !hiddenColumns[containerStructure.key]
              ? colGroup.map((colGroupStructure, colGroupIndex) => (
                  <HeaderCell
                    key={colGroupStructure.key}
                    id={colGroupStructure.key}
                    structure={colGroupStructure}
                    onFilterClick={handleFilterClick}
                    colGroupHeader
                    className={clsx({
                      [classes.borderRight]:
                        structIndex !== tableStructure.length - 1 && colGroupIndex === colGroup.length - 1,
                    })}
                    style={topHeaderOffsetStyle()}
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
            <Filter />
          </Grow>
        )}
      </Popper>
    </TableHead>
  );
};

export default HeaderRow;
