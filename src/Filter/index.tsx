import { Button, makeStyles, Paper } from "@material-ui/core";
import { Add } from "@material-ui/icons";
import { createStyles } from "@material-ui/styles";
import React, { Fragment, useCallback, useContext, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { BaseData } from "..";
import TableContext from "../table.context";
import { ActiveFilter, NullableActiveFilter } from "../table.types";
import FilterRow, { EMPTY_FILTER } from "./FilterRow.component";

interface Props {}

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
  { name: "FilterComponent" },
);

const Filter: React.FC<Props> = (props) => {
  const classes = useStyles(props);
  const { activeFilters, update } = useContext(TableContext);
  const [filtersArray, setFiltersArray] = useState<Array<ActiveFilter | NullableActiveFilter>>(() =>
    activeFilters.length ? activeFilters : [{ id: uuidv4(), ...EMPTY_FILTER }],
  );

  const handleAddBlankFilter = useCallback(() => setFiltersArray((currFiltersArray) => [...currFiltersArray, { id: uuidv4(), ...EMPTY_FILTER }]), []);

  const handleRemoveFilter = useCallback(
    (value: ActiveFilter | NullableActiveFilter) => {
      const removePredicate = <T extends ActiveFilter | NullableActiveFilter>(currFiltersArray: T[]): T[] =>
        currFiltersArray.filter((filter) => filter.id !== value.id);
      if (value.path) {
        update.activeFilters(removePredicate);
      }
      setFiltersArray((currFiltersArray) => {
        const updatedArray = removePredicate(currFiltersArray);
        return updatedArray.length ? updatedArray : [{ id: uuidv4(), ...EMPTY_FILTER }];
      });
    },
    [update],
  );

  const handleFilterSubmit = useCallback(
    <RowType extends BaseData>(value: ActiveFilter<RowType>) => {
      const submitPredicate = <T extends ActiveFilter<RowType> | NullableActiveFilter<RowType>>(currFiltersArray: T[]) => {
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
        <Button onClick={handleAddBlankFilter} data-testid="addFilter" startIcon={<Add />} size="small" variant="text" color="inherit">
          Add filter
        </Button>
      </div>
    </Paper>
  );
};

export default Filter;
