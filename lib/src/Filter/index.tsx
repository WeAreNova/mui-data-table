import { Button, ClickAwayListener, makeStyles, Paper } from "@material-ui/core";
import Add from "@material-ui/icons/Add";
import { createStyles } from "@material-ui/styles";
import React, { Fragment, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react";
import TableContext, { TableState } from "../table.context";
import { ActiveFilter, BaseData, NullableActiveFilter } from "../table.types";
import FilterRow, { EMPTY_FILTER } from "./FilterRow.component";

export type InitialFilterValues<RowType extends BaseData> = Pick<ActiveFilter<RowType>, "path" | "type" | "operator">;

interface FilterProps<RowType extends BaseData> {
  initialFilter: InitialFilterValues<RowType> | null;
  onClose(): void;
}

const useStyles = makeStyles(
  (theme) =>
    createStyles({
      root: {
        minWidth: 250,
        maxHeight: 400,
        overflowY: "auto",
        "& > div": {
          padding: theme.spacing(1),
        },
      },
      filterFooter: {
        position: "sticky",
        bottom: 0,
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: "inherit",
      },
    }),
  { name: "DataTable-Filter" },
);

let filterId = 0;
function uniqueId() {
  const id = ++filterId;
  return Date.now() + "_" + id;
}

function getInitialFilter(initialFilter?: InitialFilterValues<any> | null) {
  return { id: uniqueId(), ...EMPTY_FILTER, ...(initialFilter || {}) };
}

/**
 * The Filter component handles all the state and logic for the table filters.
 *
 * @component
 * @package
 */
const Filter = <RowType extends BaseData, AllTableData extends RowType[]>({
  initialFilter = {} as InitialFilterValues<RowType>,
  onClose,
  ...props
}: PropsWithChildren<FilterProps<RowType>>) => {
  const classes = useStyles(props);
  const { activeFilters, update } = useContext<TableState<RowType, AllTableData>>(TableContext);
  const [filtersArray, setFiltersArray] = useState<Array<ActiveFilter | NullableActiveFilter>>(() =>
    activeFilters.length ? activeFilters : [getInitialFilter(initialFilter)],
  );

  const handleAddBlankFilter = useCallback(
    () => setFiltersArray((currFiltersArray) => [...currFiltersArray, getInitialFilter()]),
    [],
  );

  const handleRemoveFilter = useCallback(
    (value: ActiveFilter | NullableActiveFilter) => {
      const removePredicate = <T extends ActiveFilter | NullableActiveFilter>(currFiltersArray: T[]): T[] =>
        currFiltersArray.filter((filter) => filter.id !== value.id);
      if (value.path) {
        update.activeFilters(removePredicate);
      }
      setFiltersArray((currFiltersArray) => {
        const updatedArray = removePredicate(currFiltersArray);
        return updatedArray.length ? updatedArray : [getInitialFilter()];
      });
    },
    [update],
  );

  const handleFilterSubmit = useCallback(
    <RowType extends BaseData>(value: ActiveFilter<RowType>) => {
      const submitPredicate = <T extends ActiveFilter<RowType> | NullableActiveFilter<RowType>>(
        currFiltersArray: T[],
      ) => {
        const filterIndex = currFiltersArray.findIndex((filter) => filter.id === value.id);
        if (filterIndex === -1) return [...currFiltersArray, value];
        const updatedArray = [...currFiltersArray];
        updatedArray[filterIndex] = value as T;
        return updatedArray;
      };
      update.activeFilters(submitPredicate);
      setFiltersArray(submitPredicate);
    },
    [update],
  );

  useEffect(() => {
    if (!activeFilters.length) {
      setFiltersArray([getInitialFilter(initialFilter)]);
    }
  }, [activeFilters.length, initialFilter]);

  return (
    <ClickAwayListener onClickAway={onClose}>
      <Paper className={classes.root}>
        <div>
          {filtersArray.map((filter, index) => (
            <Fragment key={filter.id}>
              {Boolean(index) && <br />}
              <FilterRow
                name={`filter-${index}`}
                value={filter}
                last={filtersArray.length === 1}
                onSubmit={handleFilterSubmit}
                onRemove={handleRemoveFilter}
              />
            </Fragment>
          ))}
        </div>
        <div className={classes.filterFooter}>
          <Button
            onClick={handleAddBlankFilter}
            data-testid="addFilter"
            startIcon={<Add />}
            size="small"
            variant="text"
            color="inherit"
          >
            Add filter
          </Button>
        </div>
      </Paper>
    </ClickAwayListener>
  );
};

export default Filter;
