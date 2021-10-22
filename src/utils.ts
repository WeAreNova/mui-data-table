import { useUtils } from "@material-ui/pickers";
import get from "lodash.get";
import orderBy from "lodash.orderby";
// import moment, { Moment } from "moment";
// import {  } from "@material-ui/pickers"
import { SetRequired } from "type-fest";
import type {
  ActiveFilter,
  ActiveFilters,
  BaseData,
  ColGroup,
  Sort,
  Sorter,
  TableColumnStructure,
} from "./table.types";

export function findIndexFrom<T>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => boolean,
  fromIndex?: number,
) {
  return array.slice(fromIndex).findIndex(predicate);
}

export function findLastIndexFrom<T>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => boolean,
  fromIndex?: number,
) {
  return array.slice(fromIndex).reverse().findIndex(predicate);
}

function isNil<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

function uniqBy<T>(array: T[], key: keyof T | ((item: T) => string)): T[] {
  const seen = new Set<keyof T | string>();
  return array.filter((item) => {
    const k = typeof key === "function" ? key(item) : key;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const getFilterTypeConvertors = (value: ActiveFilter["value"], utils: ReturnType<typeof useUtils>) => {
  const convertors = {
    string: (): string | null => (typeof value === "string" ? value : String(value)),
    number: (): number | null => (typeof value === "number" ? value : Number(value)),
    boolean: (): boolean | null => (typeof value === "boolean" ? value : value === "true"),
    date: (): any | null => utils.startOfDay(value),
  } as const;
  return Object.entries(convertors).reduce(
    (prev, [key, convertor]) => ({ ...prev, [key]: () => (isNil(value) ? null : convertor()) }),
    {} as typeof convertors,
  );
};

const getStringRegexMatch = (value: string, searchValue: string, isContains: boolean) =>
  new RegExp(`${isContains ? ".*" : "^"}${searchValue}${isContains ? ".*" : "$"}`, "i").test(value);

const getMatch = <RowType extends BaseData>(
  value: RowType[keyof RowType],
  filter: ActiveFilter,
  utils: ReturnType<typeof useUtils>,
): boolean => {
  const filterValue = getFilterTypeConvertors(filter.value, utils)[filter.type]();
  const currValue = getFilterTypeConvertors(value, utils)[filter.type]();
  if (!filter.operator.includes("exists") && (isNil(filterValue) || isNil(currValue))) return false;

  switch (filter.operator) {
    case "exists":
      return !isNil(value);
    case "!exists":
      return isNil(value);
    case "~":
      return getStringRegexMatch(currValue as string, filterValue as string, true);
    case "!~":
      return !getStringRegexMatch(currValue as string, filterValue as string, true);
    case "=":
      if (filter.type === "number" || filter.type === "boolean") {
        return currValue === filterValue;
      }
      if (filter.type === "date") {
        return utils.isSameDay(currValue, filterValue);
      }
      return getStringRegexMatch(currValue as string, filterValue as string, false);
    case "!=":
      if (filter.type === "number" || filter.type === "boolean") {
        return currValue !== filterValue;
      }
      if (filter.type === "date") {
        return !utils.isSameDay(currValue, filterValue);
      }
      return !getStringRegexMatch(currValue as string, filterValue as string, true);
    case ">":
      return currValue! > filterValue!;
    case ">=":
      return currValue! >= filterValue!;
    case "<":
      return currValue! < filterValue!;
    case "<=":
      if (filter.type === "date")
        return utils.isBefore(currValue, utils.endOfDay(filterValue)) || utils.isSameDay(currValue, filterValue);
      return currValue! <= filterValue!;
  }
};

export const getFilteredData = <RowType extends BaseData>(
  data: RowType[],
  filters: ActiveFilters<RowType>,
  utils: ReturnType<typeof useUtils>,
) => {
  if (!filters.length) return data;
  return [...data].filter((row) =>
    // * `filters.every` will change to `filters.some` for the 'OR' case
    filters.every((filter) => {
      const currValue = get(row, filter.path);
      return getMatch(currValue, filter, utils);
    }),
  );
};
export const getSortedData = <RowType extends BaseData>(
  data: RowType[],
  sort: Sort,
  tableStructure?: TableColumnStructure<RowType>[],
) => {
  if (!sort.key || !sort.direction) return data;

  const sortColumn = tableStructure
    ?.flatMap<TableColumnStructure<RowType> | ColGroup<RowType>>((c) => [c, ...(c.colGroup ?? [])])
    .find((c) => c.dataIndex === sort.key || c.id === sort.key || c.key === sort.key);

  if (typeof sortColumn?.sorter === "function") {
    return [...data].sort((a, b) =>
      (sortColumn.sorter as Sorter<RowType>)(sort.direction === "asc" ? a : b, sort.direction === "asc" ? b : a),
    );
  }
  const sortKey = !sortColumn?.sorter
    ? sort.key
    : typeof sortColumn.sorter === "string"
    ? sortColumn.sorter
    : sortColumn.dataIndex;
  return orderBy([...data], sortKey, sort.direction);
};
export const getPagedData = <RowType extends BaseData>(
  data: RowType[],
  pagination: { limit?: number; page: number },
) => {
  const page = pagination.page ?? data.length;
  return pagination.limit ? data.slice(page * pagination.limit, page * pagination.limit + pagination.limit) : data;
};

export const getFilterPath = (c: SetRequired<TableColumnStructure<any> | ColGroup<any>, "filterColumn">) => {
  if (
    typeof c.filterColumn === "string" ||
    (typeof c.filterColumn !== "boolean" && typeof c.filterColumn.path !== "boolean")
  )
    return typeof c.filterColumn === "string" ? c.filterColumn : (c.filterColumn.path as string);
  return c.dataIndex!;
};

export const exportTableToCSV = async <
  RowType extends BaseData,
  DataType extends RowType[] = RowType[],
  TableColumn extends TableColumnStructure<RowType, DataType> = TableColumnStructure<RowType, DataType>,
>(
  tableData: DataType,
  tableStructure: TableColumn[] = [],
) =>
  parseAsync(tableData, {
    defaultValue: "",
    includeEmptyRows: true,
    fields: tableStructure.flatMap((column) => {
      /**
       * Extract the value from the table structure object.
       *
       * To retrieve a value, we search through the following
       * destinations in the order:
       *
       * 1) render() method
       * 2) monetary{...}.path (monetary as an object)
       * 3) dataIndex
       * 4) monetary (monetary as a string)
       * 5) key
       */
      const getValue =
        (tableColumn: TableColumnStructure<RowType, DataType> | ColGroup<RowType, DataType>) => (row: RowType) => {
          // set the retrievedValue
          const retrievedValue = tableColumn.render
            ? tableColumn.render(row, true)
            : typeof tableColumn.monetary === "object"
            ? get(row, tableColumn.monetary.path, 0)
            : get(row, (tableColumn.dataIndex || tableColumn.monetary) as string);

          if (retrievedValue === null) return "(null)";

          // If the retrieved value is an object (not just 'null'), we can't display it.
          // If it's undefined, the row is empty and we should reflect this in the CSV
          // (instead of leaving fields completely empty).
          switch (typeof retrievedValue) {
            case "object":
              return "Non-Displayable Information";
            case "undefined":
              return "(empty)";
            default:
              return retrievedValue;
          }
        };

      return column.colGroup
        ? column.colGroup.map((colGroup) => ({
            label: `${column.title}_${colGroup.title}`,
            value: getValue(colGroup),
          }))
        : {
            label: column.title,
            value: getValue(column),
          };
    }),
  });
