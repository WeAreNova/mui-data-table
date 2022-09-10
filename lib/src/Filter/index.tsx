import Add from "@mui/icons-material/Add";
import { Box, Button, ClickAwayListener, Paper } from "@mui/material";
import React, { Fragment, PropsWithChildren, useCallback, useEffect, useState } from "react";
import useTableContext from "../table.context";
import { ActiveFilter, BaseData, NullableActiveFilter } from "../types";
import FilterRow, { EMPTY_FILTER } from "./FilterRow";

export type InitialFilterValues<RowType extends BaseData> = Pick<ActiveFilter<RowType>, "path" | "type" | "operator">;

interface FilterProps<RowType extends BaseData> {
  initialFilter: InitialFilterValues<RowType> | null;
  onClose(e: MouseEvent | TouchEvent): void;
}

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
}: PropsWithChildren<FilterProps<RowType>>) => {
  const { activeFilters, update } = useTableContext<RowType, AllTableData>();
  const [filters, setFilters] = useState<Array<ActiveFilter | NullableActiveFilter>>(activeFilters);

  useEffect(() => {
    if (!initialFilter) return;
    setFilters((fs) => {
      const filterActive = fs.some((f) => f.path === initialFilter.path);
      return [...activeFilters, ...(filterActive ? [] : [getInitialFilter(initialFilter)])];
    });
  }, [activeFilters, initialFilter]);

  const handleAddBlankFilter = useCallback(
    () => setFilters((currFiltersArray) => [...currFiltersArray, getInitialFilter()]),
    [],
  );

  const handleRemoveFilter = useCallback(
    (value: ActiveFilter | NullableActiveFilter) => {
      const removePredicate = <T extends ActiveFilter | NullableActiveFilter>(currFiltersArray: T[]): T[] =>
        currFiltersArray.filter((filter) => filter.id !== value.id);
      if (value.path) {
        update.activeFilters(removePredicate);
      }
      setFilters((currFiltersArray) => {
        const updatedArray = removePredicate(currFiltersArray);
        return updatedArray.length ? updatedArray : [getInitialFilter()];
      });
    },
    [update],
  );

  const handleFilterSubmit = useCallback(
    <RType extends BaseData>(value: ActiveFilter<RType>) => {
      const submitPredicate = <T extends ActiveFilter<RType> | NullableActiveFilter<RType>>(currFiltersArray: T[]) => {
        const filterIndex = currFiltersArray.findIndex((filter) => filter.id === value.id);
        if (filterIndex === -1) return [...currFiltersArray, value];
        const updatedArray = [...currFiltersArray];
        updatedArray[filterIndex] = value as T;
        return updatedArray;
      };
      update.activeFilters(submitPredicate);
      setFilters(submitPredicate);
    },
    [update],
  );

  useEffect(() => {
    if (!activeFilters.length) {
      setFilters([getInitialFilter(initialFilter)]);
    }
  }, [activeFilters.length, initialFilter]);

  return (
    <ClickAwayListener onClickAway={onClose} mouseEvent="onMouseUp" touchEvent="onTouchEnd">
      <Paper
        sx={{
          minWidth: 250,
          maxHeight: 400,
          overflowY: "auto",
          "& > div": {
            p: 1,
          },
        }}
      >
        <div>
          {filters.map((filter, index) => (
            <Fragment key={filter.id}>
              {Boolean(index) && <br />}
              <FilterRow
                name={`filter-${index}`}
                value={filter}
                last={filters.length === 1}
                onSubmit={handleFilterSubmit}
                onRemove={handleRemoveFilter}
              />
            </Fragment>
          ))}
        </div>
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            borderTop: `1px solid`,
            borderTopColor: "palette.divider",
          }}
        >
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
        </Box>
      </Paper>
    </ClickAwayListener>
  );
};
Filter.whyDidYouRender = true;

export default Filter;
