import { get } from "dot-prop";
import { orderBy } from "natural-orderby";
import type { ReactNode } from "react";
import {
  ActiveFilter,
  ActiveFilters,
  BaseData,
  ColumnDefinitionTitle,
  DataTableErrorType,
  DataTypes,
  EditDataTypes,
  FilterColumn,
  FullColDef,
  FullColGroupDef,
  NullableDataTypes,
  NumericalObject,
  OperatorValues,
  PathType,
  PathValueType,
  Sort,
  Sorter,
  TableCellAlign,
} from "./types";

type FilterValuesType = NonNullable<ReturnType<ReturnType<typeof getFilterTypeConvertors>[DataTypes]>>;
interface MatchActionArg {
  value: FilterValuesType | null | undefined;
  currValue: FilterValuesType;
  filterValue: FilterValuesType;
  type: DataTypes;
}

let defaultCurrency = "GBP";

const TABLE_EVENTS = ["cancelEdit", "closeFilter", "saveEdit"] as const;

export function getWindow() {
  return typeof window !== "undefined" ? window : null;
}
export function getDocument() {
  return typeof document !== "undefined" ? document : null;
}

export function dontForwardProps(...propsToIgnore: string[]) {
  return (name: string) => propsToIgnore.indexOf(name) === -1;
}

/**
 * A function to dispatch a custom Data Table event.
 *
 * @param events the custom event/events to dispatch.
 */
export function dispatchTableEvent(...events: Array<typeof TABLE_EVENTS[number]>) {
  const doc = getDocument();
  if (!doc) return;
  events.forEach((e) => doc.dispatchEvent(new CustomEvent(e)));
}

/**
 * The `DataTableError` class
 */
export class DataTableError extends Error implements DataTableErrorType {
  readonly isDataTableError: true = true as const;
  readonly dataTableMessage: string;
  constructor(helperMessage: string, errorMessage?: string) {
    super(errorMessage || helperMessage);
    this.dataTableMessage = helperMessage;
  }
}

/**
 * A helper function for creating a `DataTableError`.
 *
 * @param errorMessage the error message to display.
 * @returns the `DataTableError`
 */
export function createDTError(helperMessage: string, errorMessage?: string): DataTableError {
  return new DataTableError(helperMessage, errorMessage);
}

/**
 * A function that returns the index of the first element in the array where predicate is `true`, else `-1`
 *
 * @param array the array in which to find the element
 * @param predicate the function invoked per iteration
 * @param fromIndex the index to search from
 * @returns the first index of the found element, else `-1`
 */
export function findIndexFrom<T>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => boolean,
  fromIndex?: number,
): number {
  const index = array.slice(fromIndex).findIndex(predicate);
  if (!fromIndex || index === -1) return index;
  return index + fromIndex;
}

/**
 * A function that returns the index of the last element in the array where predicate is `true`, else `-1`
 *
 * @param array the array in which to find the element
 * @param predicate the function invoked per iteration
 * @param fromIndex the index to search from
 * @returns the last index of the found element, else `-1`
 */
export function findLastIndexFrom<T>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => boolean,
  fromIndex?: number,
): number {
  const reversedIndex = array.slice(fromIndex).reverse().findIndex(predicate);
  if (reversedIndex === -1) return reversedIndex;
  const index = array.length - 1 - reversedIndex;
  return fromIndex ? index + fromIndex : index;
}

/**
 * A function that returns true if the `value` is `null` or `undefined`
 *
 * @param {T} value the value to check
 * @returns {boolean} returns `true` if the value is `null` or `undefined`
 *
 * @example
 *  isNil(null) // true
 *  isNil(true) // false
 */
export function isNil<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

function startOfDay(date: any) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: any) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function isSameDay(date1: any, date2: any) {
  const d1 = startOfDay(date1);
  const d2 = startOfDay(date2);
  return d1.valueOf() === d2.valueOf();
}

function isBefore(date1: any, date2: any) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.valueOf() < d2.valueOf();
}

/**
 * A function that returns an object which converts the given filter value to the correct type
 *
 * @param value the filter's value
 * @returns the convertors
 */
export function getFilterTypeConvertors(value: ActiveFilter["value"]) {
  const convertors = {
    string: (): string | null => (typeof value === "string" ? value : String(value)),
    number: (): number | null => (typeof value === "number" ? value : Number(value)),
    boolean: (): boolean | null => (typeof value === "boolean" ? value : value === "true"),
    date: (): Date | null => {
      if (value instanceof Date) return value;
      if (!value || value === true) return null;
      return startOfDay(value);
    },
  } as const;
  return Object.entries(convertors).reduce(
    (prev, [key, convertor]) => ({ ...prev, [key]: () => (isNil(value) ? null : convertor()) }),
    {} as typeof convertors,
  );
}

/**
 * A function which tests if the given search value matches the given value
 *
 * @param value the value to match against
 * @param searchValue the search value
 * @param isContains whether this is a contains or a strict equality string match
 * @returns whether the value matches the search value
 */
function getStringRegexMatch(value: string, searchValue: string, isContains: boolean) {
  return new RegExp(`${isContains ? ".*" : "^"}${searchValue}${isContains ? ".*" : "$"}`, "i").test(value);
}

const OPERATOR_MAP: Record<OperatorValues, (args: MatchActionArg) => boolean> = {
  exists: ({ value }) => !isNil(value),
  "!exists": ({ value }) => isNil(value),
  "~": ({ currValue, filterValue }) => getStringRegexMatch(currValue as string, filterValue as string, true),
  "!~": ({ currValue, filterValue }) => !getStringRegexMatch(currValue as string, filterValue as string, true),
  ">": ({ currValue, filterValue }) => currValue > filterValue,
  ">=": ({ currValue, filterValue }) => currValue >= filterValue,
  "<": ({ currValue, filterValue }) => currValue < filterValue,
  "<=": ({ currValue, filterValue, type }) => {
    if (type === "date") return isBefore(currValue, endOfDay(filterValue)) || isSameDay(currValue, filterValue);
    return currValue <= filterValue;
  },
  "=": ({ currValue, filterValue, type }) => {
    if (type === "number" || type === "boolean") return currValue === filterValue;
    if (type === "date") return isSameDay(currValue, filterValue);
    return getStringRegexMatch(currValue as string, filterValue as string, false);
  },
  "!=": ({ currValue, filterValue, type }) => {
    if (type === "number" || type === "boolean") return currValue !== filterValue;
    if (type === "date") return !isSameDay(currValue, filterValue);
    return !getStringRegexMatch(currValue as string, filterValue as string, true);
  },
};

/**
 * A function which tests if the filter value matches the given value given the filter operator and type
 *
 * @param value the value to match against
 * @param filter the current filter
 * @param filter.value the filter value
 * @param filter.operator the filter operator
 * @param filter.type the filter type
 * @returns whether the value matches the filter value given the filter operator and type
 */
export function getMatch<RowType extends BaseData>(value: RowType[keyof RowType], filter: ActiveFilter): boolean {
  const filterValue = getFilterTypeConvertors(filter.value)[filter.type]();
  const currValue = getFilterTypeConvertors(value)[filter.type]();
  if (!filter.operator.includes("exists") && (isNil(filterValue) || isNil(currValue))) return false;
  return OPERATOR_MAP[filter.operator]({ value, currValue: currValue!, filterValue: filterValue!, type: filter.type });
}

/**
 * A function that filters the table data when done client-side
 *
 * @param data table data
 * @param filters the filters to apply
 * @returns the filtered data
 */
export function getFilteredData<RowType extends BaseData>(data: RowType[], filters: ActiveFilters<RowType>): RowType[] {
  if (!filters.length) return data;
  return [...data].filter((row) =>
    // * `filters.every` will change to `filters.some` for the 'OR' case
    filters.every((filter) => {
      const currValue = get(row, filter.path);
      return getMatch(currValue, filter);
    }),
  );
}
/**
 * A function that sorts the given data when done client-side
 *
 * @param data table data
 * @param sort the sort to apply to the data
 * @param tableStructure the complete structure definition of the table
 * @returns the sorted data
 */
export function getSortedData<RowType extends BaseData, AllDataType extends RowType[]>(
  data: RowType[],
  sort: Sort,
  tableStructure?: FullColDef<RowType, AllDataType>[],
): RowType[] {
  if (!sort.key || !sort.direction) return data;

  const sortColumn = tableStructure
    ?.flatMap<FullColDef<RowType, AllDataType> | FullColGroupDef<RowType, AllDataType>>((c) => [
      c,
      ...(c.colGroup ?? []),
    ])
    .find((c) => c.key === sort.key);

  if (typeof sortColumn?.sorter === "function") {
    return [...data].sort((a, b) =>
      (sortColumn.sorter as Sorter<RowType>)(sort.direction === "asc" ? a : b, sort.direction === "asc" ? b : a),
    );
  }
  let sortKey: string | undefined;
  if (!sortColumn?.sorter) {
    sortKey = sort.key;
  } else if (typeof sortColumn.sorter === "string") {
    sortKey = sortColumn.sorter;
  } else {
    sortKey = getPath(sortColumn.numerical, sortColumn);
  }
  if (!sortKey) return data;
  return orderBy([...data], (data) => get(data, sortKey!), sort.direction);
}
/**
 * A function which returns the paginated table data when done client-side
 *
 * @param data the table data
 * @param pagination the pagination options
 * @returns the paginated table data
 */
export function getPagedData<RowType extends BaseData>(data: RowType[], pagination: { limit?: number; page: number }) {
  const page = pagination.page ?? data.length;
  return pagination.limit ? data.slice(page * pagination.limit, page * pagination.limit + pagination.limit) : data;
}

/**
 * A utility function which returns the specified data type.
 *
 * @param value the value of one of the properties in the definition of the table column
 * @param struct the definition of the table column
 * @returns the data type
 */
export function getDataType<
  RowType extends BaseData,
  AllDataType extends RowType[],
  T extends { type?: NullableDataTypes } | { type?: EditDataTypes } = { type?: NullableDataTypes },
>(value: PathValueType<RowType> | T, struct: FullColDef<RowType, AllDataType> | FullColGroupDef<RowType, AllDataType>) {
  const dataType = (typeof value === "object" && value.type) || struct.dataType;
  return (dataType ?? "string") as NonNullable<T["type"]>;
}

export const dataTypeOperatorMap: Record<DataTypes, OperatorValues> = {
  string: "~",
  number: "=",
  boolean: "=",
  date: "=",
} as const;

/**
 * A utility function which returns the default operator for the filter.
 *
 * Returns `filterColumn.defaultOperator` if it is defined,
 * else the default operator for the data type.
 *
 * See {@link dataTypeOperatorMap `dataTypeOperatorMap`} for the default operator for each data type.
 *
 * @param value the value of `filterColumn` property in the definition of the table column.
 * @param dataType the specified data type for the filter.
 * @returns the default operator for the filter.
 */
export function getDefaultOperator<RowType extends BaseData>(
  value: FilterColumn<RowType>,
  dataType: DataTypes,
): OperatorValues {
  const specifiedDefaultOperator = typeof value === "object" && value.defaultOperator;
  if (specifiedDefaultOperator) return specifiedDefaultOperator;
  return dataTypeOperatorMap[dataType] || "=";
}

/**
 * A utility function to get the default path.
 *
 * @param struct the definition of the table column
 * @returns the path if available
 */
export function getDefaultPath<RowType extends BaseData, AllDataType extends RowType[]>(
  struct: FullColDef<RowType, AllDataType> | FullColGroupDef<RowType, AllDataType>,
): PathType<RowType> | undefined {
  if (struct.dataIndex) return struct.dataIndex;
  if (typeof struct.numerical === "string") return struct.numerical;
  if (typeof struct.numerical === "object" && typeof struct.numerical.path === "string") {
    return struct.numerical.path as string;
  }
}

/**
 * A utility function which returns the path to the data to be rendered when the given value could be `true | string | undefined`
 *
 * @param value the value of one of the properties in the definition of the table column
 * @param struct the definition of the table column
 * @returns the path
 */
export function getPath<RowType extends BaseData, AllDataType extends RowType[] = RowType[]>(
  value: PathValueType<RowType> | { path?: PathValueType<RowType> },
  struct: FullColDef<RowType, AllDataType> | FullColGroupDef<RowType, AllDataType>,
): PathType<RowType> {
  const path = typeof value === "object" ? value.path : value;
  if (path === true || path === undefined) return getDefaultPath(struct)!;
  return path;
}

/**
 * A utility function to handle the formatting of numerical values when desired
 *
 * @param value the number to be formatted. If `value` is not a parseable number, then `value` is returned.
 * @param options the `Intl.NumberFormatOptions` options.
 * @param options.currency can be a `boolean` or an ISO 4217 currency code e.g. `"USD"` to override the default currency.
 * @param options.decimalPlaces a special field to set both the maximum and minimum decimal places.
 * @default options.currency = true
 * @returns the formatted number as a string.
 */
export function numberFormatter(
  value: number,
  {
    currency = true,
    decimalPlaces,
    ...options
  }: Omit<Intl.NumberFormatOptions, "currency"> & { currency?: boolean | string; decimalPlaces?: number } = {},
) {
  if (isNaN(value)) return value;
  let currencySymbol: string | undefined;
  if (typeof currency === "string") {
    currencySymbol = currency;
  } else if (currency) {
    currencySymbol = defaultCurrency;
  }
  return new Intl.NumberFormat(getWindow()?.navigator.language, {
    style: currency ? "currency" : undefined,
    currency: currencySymbol,
    minimumFractionDigits: decimalPlaces ?? 2,
    maximumFractionDigits: decimalPlaces ?? 2,
    ...options,
  }).format(value);
}

/**
 * A utility function to change the default currency for the number formatter
 *
 * @param currency the ISO 4217 currency code
 * @returns the new default currency
 */
export function setDefaultCurrency(currency: string) {
  defaultCurrency = currency;
  return defaultCurrency;
}

/**
 * A utility function to retrieve the given row's ID
 *
 * @param data a single row of the table data
 * @param index the index of the row
 * @returns the row's ID
 */
export function getRowId<T extends BaseData>(data: T, index: number) {
  return String(data.id || data._id || index);
}

/**
 * A utility function to retrieve the header's title.
 *
 * @param title the title property in the column definition
 * @param data all the table data
 * @returns the rendered title
 */
export function getColumnTitle<T extends BaseData[]>(title: ColumnDefinitionTitle<T>, data: T) {
  return typeof title === "function" ? title(data) : title;
}

/**
 * A utility function to help with the rendering of a table cell
 *
 * @param struct the definition of the table column
 * @param data a single row of the table data
 * @param rowId the row's ID
 * @param dataArrayIndex the index of the row in the table data array
 * @param isCSVExport whether the function is being invoked as part of the CSV export
 * @returns the rendered value
 */
export function getValue<T extends BaseData, AllDataType extends T[] = T[]>(
  struct: FullColDef<T, AllDataType> | FullColGroupDef<T, AllDataType>,
  data: T,
  rowId: string,
  dataArrayIndex: number,
  isCSVExport = false,
): ReactNode | string | number {
  if (struct.numerical) {
    const {
      path,
      decimalPlaces = 2,
      minDecimalPlaces,
      maxDecimalPlaces,
      ...options
    }: NumericalObject<T> = typeof struct.numerical === "object" ? struct.numerical : { path: struct.numerical };
    const value = get<any>(data, getPath(path, struct));
    if (isNaN(Number(value))) return "";
    return numberFormatter(value, {
      minimumFractionDigits: minDecimalPlaces ?? decimalPlaces,
      maximumFractionDigits: maxDecimalPlaces ?? decimalPlaces,
      ...options,
    });
  }
  let value: ReactNode;
  if (struct.render) {
    value = struct.render(data, isCSVExport, rowId, dataArrayIndex);
  } else {
    value = get(data, struct.dataIndex!);
  }
  if (typeof value === "boolean") return String(value);
  return value as ReactNode;
}

/**
 * A utility function to retrieve the content alignment of a table cell
 *
 * @param structure the definition of the table column
 * @param data a single row of the table data
 * @param index the index of the row in the table data array
 * @returns the cell alignment
 */
export function getTableCellAlignment<RowType extends BaseData, AllDataType extends RowType[]>(
  structure: FullColDef<RowType, AllDataType> | FullColGroupDef<RowType, AllDataType>,
  data?: RowType,
  index = 0,
): TableCellAlign {
  if (structure.align) return structure.align;
  if (structure.numerical || structure.dataType === "number") return "right";
  const renderedValue = data && getValue(structure, data, getRowId(data, index), index);
  return typeof renderedValue === "number" ? "right" : "left";
}

/**
 * A function to convert the given table data to a CSV string
 *
 * @param tableData the data to be converted to a CSV
 * @param tableStructure the complete table structure definition
 * @returns the CSV string
 */
export async function exportTableToCSV<RowType extends BaseData, AllDataType extends RowType[]>(
  tableData: AllDataType,
  tableStructure: FullColDef<RowType, AllDataType>[] = [],
) {
  const getTitle = (c: FullColDef<RowType, AllDataType> | FullColGroupDef<RowType, AllDataType>) => {
    if (typeof c.title === "function") return c.title(tableData);
    return c.title;
  };
  const flattenedStructure = tableStructure.flatMap((c) => [c, ...(c.colGroup ?? [])]);
  const csvHeaders = flattenedStructure.map(getTitle).join();
  const csvRows = tableData.map((row, dataIndex) =>
    flattenedStructure.map((c) => {
      const renderedValue = getValue(c, row, getRowId(row, dataIndex), dataIndex, true);
      if (isNil(renderedValue)) return "";
      switch (typeof renderedValue) {
        case "object":
          return "Invalid Value";
        case "number":
          return renderedValue;
        default:
          return `"${renderedValue}"`;
      }
    }),
  );
  return [csvHeaders, ...csvRows].join("\n");
}

/**
 * A function to filter out hidden columns from the table structure.
 *
 * @param tableStructure the complete table structure definition
 * @returns the table structure without always hidden columns
 */
export function getUnhiddenColumns<T extends { hidden?: boolean }>(tableStructure: T[]) {
  return tableStructure.filter((c): c is typeof c & { hidden: false | undefined } => !c.hidden);
}

/**
 * A function which creates a debounced version of the given function.
 * @param fn the function to be debounced
 * @param wait the time to wait before invoking the function
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, wait = 250) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}
