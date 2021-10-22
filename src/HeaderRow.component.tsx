import { Grow, makeStyles, Popper, TableHead, TableRow } from "@material-ui/core";
import clsx from "clsx";
import React, { useCallback, useContext, useMemo, useRef, useState } from "react";
import Filter from "./Filter";
import HeaderCell from "./HeaderCell.component";
import TableContext from "./table.context";
import { TableColumnStructure } from "./table.types";

interface Props {}

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

const HeaderRow: React.FC<Props> = (props) => {
  const classes = useStyles(props);
  const { tableStructure, filteredTableStructure, hiddenColumns } = useContext(TableContext);
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

  const getColumnId = useCallback((c: TableColumnStructure<any>) => (c.id || c.key)!, []);

  const handleFilterClick = useCallback(
    (target: HTMLTableCellElement) => setAnchorEl((a) => (a === target ? null : target)),
    [],
  );

  return (
    <TableHead>
      <TableRow ref={topHeaderRef}>
        {filteredTableStructure.map((structure) => {
          const id = getColumnId(structure);
          return (
            <HeaderCell
              key={id}
              id={id}
              structure={structure}
              hasColGroups={hasColGroups}
              onFilterClick={handleFilterClick}
            />
          );
        })}
      </TableRow>
      {hasColGroups && (
        <TableRow>
          {filteredTableStructure.map(({ colGroup, ...containerStructure }, structIndex) =>
            colGroup && !hiddenColumns[getColumnId(containerStructure)]
              ? colGroup.map((colGroupStructure, colGroupIndex) => {
                  const id = getColumnId(colGroupStructure);
                  return (
                    <HeaderCell
                      key={id}
                      id={id}
                      structure={colGroupStructure}
                      onFilterClick={handleFilterClick}
                      colGroupHeader
                      className={clsx({
                        [classes.borderRight]:
                          structIndex !== tableStructure.length - 1 && colGroupIndex === colGroup.length - 1,
                      })}
                      style={topHeaderOffsetStyle()}
                    />
                  );
                })
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
