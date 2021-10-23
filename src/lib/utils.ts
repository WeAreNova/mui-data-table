import { useUtils } from "@material-ui/pickers";
import get from "lodash.get";
import orderBy from "lodash.orderby";
import type { ReactNode } from "react";
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
import { MonetaryObject } from "./table.types";

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

export const getFilterTypeConvertors = (value: ActiveFilter["value"], utils: ReturnType<typeof useUtils>) => {
  const convertors = {
    string: (): string | null => (typeof value === "string" ? value : String(value)),
    number: (): number | null => (typeof value === "number" ? value : Number(value)),
    boolean: (): boolean | null => (typeof value === "boolean" ? value : value === "true"),
    date: (): any | null => utils.startOfDay(utils.date(value)),
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

export const numberFormatter = (
  value: number,
  {
    currency = true,
    decimalPlaces,
    ...options
  }: Omit<Intl.NumberFormatOptions, "currency"> & { currency?: boolean; decimalPlaces?: number },
) =>
  new Intl.NumberFormat(window.navigator.language, {
    style: currency ? "currency" : undefined,
    currency: currency ? "GBP" : undefined,
    minimumFractionDigits: decimalPlaces ?? 2,
    maximumFractionDigits: decimalPlaces ?? 2,
    ...options,
  }).format(value);

export const getRowId = <T extends BaseData>(data: T, arrayIndex: number) => String(data.id || data._id || arrayIndex);

export const getValue = <T extends BaseData, DataType extends T[] = T[]>(
  struct: TableColumnStructure<T, DataType>,
  data: T,
  rowId: string,
  dataArrayIndex: number,
): ReactNode | string | number => {
  if (struct.monetary) {
    const {
      path,
      decimalPlaces = 2,
      minDecimalPlaces,
      maxDecimalPlaces,
    }: MonetaryObject<T> = typeof struct.monetary === "object"
      ? struct.monetary
      : {
          path: struct.monetary === true ? struct.dataIndex! : struct.monetary!,
        };
    const value = get(data, path as string);
    if (isNaN(Number(value))) return "";
    return numberFormatter(value, {
      currency: true,
      minimumFractionDigits: minDecimalPlaces ?? decimalPlaces,
      maximumFractionDigits: maxDecimalPlaces ?? decimalPlaces,
    });
  }
  if (struct.render) return struct.render(data, false, rowId, dataArrayIndex);
  return get(data, struct.dataIndex! as string) as string;
};

export const exportTableToCSV = async <
  RowType extends BaseData,
  DataType extends RowType[] = RowType[],
  TableColumn extends TableColumnStructure<RowType, DataType> = TableColumnStructure<RowType, DataType>,
>(
  tableData: DataType,
  tableStructure: TableColumn[] = [],
) => {
  const getTitle = (c: TableColumn | ColGroup<RowType, DataType>) => {
    if (typeof c.title === "function") return c.title(tableData);
    return c.title;
  };
  const flattenedStructure = tableStructure.flatMap((c) => [c, ...(c.colGroup ?? [])]);
  const csvHeaders = flattenedStructure.map(getTitle).join();
  const csvRows = tableData.flatMap((row, dataIndex) =>
    flattenedStructure.map((c) => {
      const renderedValue = getValue(c, row, getRowId(row, dataIndex), dataIndex);
      switch (typeof renderedValue) {
        case "object":
          return "Invalid Value";
        case "number":
          return renderedValue;
        default:
          return `"${renderedValue}""`;
      }
    }),
  );
  return [csvHeaders, ...csvRows].join("\n");
};
