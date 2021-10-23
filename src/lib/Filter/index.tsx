import { Button, makeStyles, Paper } from "@material-ui/core";
import Add from "@material-ui/icons/Add";
import { createStyles } from "@material-ui/styles";
import { uniqueId } from "lodash";
import React, { Fragment, useCallback, useContext, useState } from "react";
import TableContext from "../table.context";
import { ActiveFilter, BaseData, NullableActiveFilter } from "../table.types";
import FilterRow, { EMPTY_FILTER } from "./FilterRow.component";

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
  { name: "TableFilter" },
);

const Filter: React.FC = (props) => {
  const classes = useStyles(props);
  const { activeFilters, update } = useContext(TableContext);
  const [filtersArray, setFiltersArray] = useState<Array<ActiveFilter | NullableActiveFilter>>(() =>
    activeFilters.length ? activeFilters : [{ id: uniqueId(), ...EMPTY_FILTER }],
  );

  const handleAddBlankFilter = useCallback(
    () => setFiltersArray((currFiltersArray) => [...currFiltersArray, { id: uniqueId(), ...EMPTY_FILTER }]),
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
        return updatedArray.length ? updatedArray : [{ id: uniqueId(), ...EMPTY_FILTER }];
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

  return (
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
  );
};

export default Filter;
