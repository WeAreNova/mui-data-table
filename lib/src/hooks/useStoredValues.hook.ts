import { useMemo } from "react";
import { ActiveFilters, OnChangeObject, Sort } from "../table.types";

function useStoredValues(
  defaultSort: Sort,
  defaultRowsPerPage: number,
): { sort: Sort; rowsPerPage: number; activeFilters: ActiveFilters } {
  return useMemo(() => {
    const defaultStored = {
      sort: defaultSort,
      rowsPerPage: defaultRowsPerPage,
      activeFilters: [] as ActiveFilters,
    };
    if (typeof window === "undefined") return defaultStored;
    const sessionChangeObjStr = sessionStorage.getItem(window.location.pathname);
    if (!sessionChangeObjStr) return defaultStored;

    const parsed = JSON.parse(sessionChangeObjStr) as OnChangeObject;
    const filters = parsed.columnFilters || defaultStored.activeFilters;
    return {
      sort:
        parsed.sortKey && parsed.sortDirection
          ? { key: parsed.sortKey, direction: parsed.sortDirection }
          : defaultStored.sort,
      rowsPerPage: parsed.limit || defaultStored.rowsPerPage,
      activeFilters: filters,
    };
  }, [defaultRowsPerPage, defaultSort]);
}

export default useStoredValues;
