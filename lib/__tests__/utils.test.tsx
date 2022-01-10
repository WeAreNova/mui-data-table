/* eslint-disable sonarjs/no-duplicate-string */
import React from "react";
import { ActiveFilter, BaseData, ColumnDefinition, DataTypes } from "../src";
import {
  createDTError,
  dataTypeOperatorMap,
  debounce,
  dispatchTableEvent,
  findIndexFrom,
  findLastIndexFrom,
  getColumnTitle,
  getDataType,
  getDefaultOperator,
  getDefaultPath,
  getFilteredData,
  getFilterTypeConvertors,
  getPath,
  getRowId,
  getTableCellAlignment,
  getUnhiddenColumns,
  getValue,
  numberFormatter,
  setDefaultCurrency,
} from "../src/utils";
import { DATA_TO_FILTER, FILTERS } from "./utils";

const ARRAY_DATA = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

function eventPromise(event: string) {
  return new Promise<any>((resolve, reject) => {
    setTimeout(() => {
      reject();
      document.removeEventListener(event, resolve);
    }, 10000);
    document.addEventListener(event, resolve);
  });
}

it("should dispatch table events", () => {
  const promises = [eventPromise("cancelEdit"), eventPromise("closeFilter")];
  dispatchTableEvent("*");
  promises.forEach((promise) => expect(promise).resolves.toBeInstanceOf(CustomEvent));
});

it("should create a data table error", () => {
  const error = createDTError("helper_message", "error_message");
  expect(error.dataTableMessage).toBe("helper_message");
  expect(error.message).toBe("error_message");
  expect(error).toBeInstanceOf(Error);
});

it("should find an index from another index", () => {
  expect(findIndexFrom(ARRAY_DATA, (value) => value === 3)).toBe(3);
  expect(findIndexFrom(ARRAY_DATA, (value) => value === 3, 4)).toBe(15);
  expect(findIndexFrom(ARRAY_DATA, (value) => value === 9, 10)).toBe(-1);
});

it("should find the last index from another index", () => {
  expect(findLastIndexFrom(ARRAY_DATA, (value) => value === 3)).toBe(15);
  expect(findLastIndexFrom(ARRAY_DATA, (value) => value === 9)).toBe(9);
  expect(findLastIndexFrom(ARRAY_DATA, (value) => value === 9, 10)).toBe(-1);
});

it("should check the filter type convertors are working correctly", () => {
  expect(getFilterTypeConvertors(1).string()).toBe("1");
  expect(getFilterTypeConvertors("1").number()).toBe(1);
  expect(getFilterTypeConvertors("true").boolean()).toBe(true);
  expect(getFilterTypeConvertors("false").boolean()).toBe(false);
  expect(getFilterTypeConvertors(1).boolean()).toBe(false);
  expect(getFilterTypeConvertors("2022-01-01").date()).toEqual(new Date("2022-01-01"));
});

it("should filter data correctly", () => {
  Object.entries(FILTERS).forEach(([operator, filters]) =>
    filters.forEach(({ filter, resultIndexes }) => {
      const expected = resultIndexes.map((index) => DATA_TO_FILTER[index]);
      const result = getFilteredData(DATA_TO_FILTER, [
        { operator, type: typeof filter.value, ...filter } as ActiveFilter,
      ]);
      console.log(filter);
      expect(result).toEqual(expected);
    }),
  );
});

describe("getDataType utility function", function () {
  it("returns structure.dataType if value is a path type", () => {
    expect(getDataType("path", { dataType: "number" } as ColumnDefinition<BaseData>)).toBe("number");
  });
  it('returns "string" as default', () => {
    expect(getDataType("path", {} as ColumnDefinition<BaseData>)).toBe("string");
  });
  it("returns value.type if specified", () => {
    expect(getDataType({ type: "number" }, { dataType: "string" } as ColumnDefinition<BaseData>)).toBe("number");
  });
  it("returns structure.dataType value.type is unspecified", () => {
    expect(getDataType({}, { dataType: "boolean" } as ColumnDefinition<BaseData>)).toBe("boolean");
  });
});

describe("getDefaultOperator utility function", function () {
  it("returns the specified default operator", () => {
    expect(getDefaultOperator({ defaultOperator: "!=" }, "string")).toBe("!=");
  });
  Object.entries(dataTypeOperatorMap).forEach(([dataType, defaultOperator]) => {
    it(`returns the default operator for a ${dataType} data type`, () => {
      expect(getDefaultOperator({}, dataType as DataTypes)).toBe(defaultOperator);
    });
  });
});

describe("getPath utility function", function () {
  it("returns the value if it is a string", () => {
    expect(getPath("path", { dataIndex: "test" } as ColumnDefinition<BaseData>)).toBe("path");
  });
  it("returns value.path if specified", () => {
    expect(getPath({ path: "path" }, { dataIndex: "test" } as ColumnDefinition<BaseData>)).toBe("path");
  });
  it("returns dataIndex if the value is true", () => {
    expect(getPath(true, { dataIndex: "path" } as ColumnDefinition<BaseData>)).toBe("path");
  });
  it("returns dataIndex if value.path is unspecified", () => {
    expect(getPath({}, { dataIndex: "path" } as ColumnDefinition<BaseData>)).toBe("path");
  });
  it("returns dataIndex if value.path is true", () => {
    expect(getPath({ path: true }, { dataIndex: "path" } as ColumnDefinition<BaseData>)).toBe("path");
  });
});

describe("numberFormatter utility function", function () {
  it("should format a number as GBP with 2 decimal places by default", () => {
    expect(numberFormatter(1)).toBe("£1.00");
  });
  it("should not format a non-number value", () => {
    expect(numberFormatter("test" as any)).toBe("test");
  });
  it("should format a number with the specified number of decimal places", () => {
    expect(numberFormatter(1.234, { decimalPlaces: 0 })).toBe("£1");
    expect(numberFormatter(1.234, { decimalPlaces: 2 })).toBe("£1.23");
    expect(numberFormatter(1.234, { decimalPlaces: 3 })).toBe("£1.234");
    expect(numberFormatter(1.234, { maximumFractionDigits: 3 })).toBe("£1.234");
    expect(numberFormatter(1.2, { currency: false, maximumFractionDigits: 3, minimumFractionDigits: 2 })).toBe("1.20");
  });
  it("should format a number to use the specified currency", () => {
    expect(numberFormatter(1, { currency: "USD" })).toBe("$1.00");
  });
  it("should format a number to use the default currency after it is changed", () => {
    expect(setDefaultCurrency("USD")).toBe("USD");
    expect(numberFormatter(1)).toBe("$1.00");
  });
});

describe("getRowId utility function", function () {
  it("should return data.id if it is specified", () => {
    expect(getRowId({ id: "test" }, 0)).toBe("test");
  });
  it("should return data._id if it is specified", () => {
    expect(getRowId({ _id: "test" }, 0)).toBe("test");
  });
  it("should return data.id if both data.id and data._id is specified", () => {
    expect(getRowId({ id: "test", _id: "test2" }, 0)).toBe("test");
  });
  it("should return the specified index as a fallback", () => {
    expect(getRowId({ test: "test" }, 0)).toBe("0");
  });
});

describe("getColumnTitle utility function", function () {
  it("should return the title if it is a string", () => {
    expect(getColumnTitle("test", [])).toBe("test");
  });
  it("should return the result of the title function", () => {
    expect(getColumnTitle(() => "test", [])).toBe("test");
  });
  it("should return the result of the title function with the data", () => {
    expect(
      getColumnTitle(
        (allData) => allData.reduce((prev, { test }) => prev + test, 0),
        [{ test: 1 }, { test: 1 }, { test: 1 }],
      ),
    ).toBe(3);
  });
});

describe("getValue utility function", function () {
  const commonGetValueArgs = [DATA_TO_FILTER[0], "rowId", 0, false] as [
    data: typeof DATA_TO_FILTER[0],
    rowId: string,
    dataArrayIndex: number,
    isCSVExport: boolean,
  ];
  it("should return the email address by dataIndex", () => {
    expect(
      getValue({ dataIndex: "email" } as ColumnDefinition<typeof DATA_TO_FILTER[number]>, ...commonGetValueArgs),
    ).toBe(DATA_TO_FILTER[0].email);
  });
  it("should return the email address by render function", () => {
    expect(
      getValue(
        { render: (record: any) => record.email } as unknown as ColumnDefinition<typeof DATA_TO_FILTER[number]>,
        ...commonGetValueArgs,
      ),
    ).toBe(DATA_TO_FILTER[0].email);
  });
  it("should return the formatted balance", () => {
    expect(
      getValue({ numerical: "balance" } as ColumnDefinition<typeof DATA_TO_FILTER[number]>, ...commonGetValueArgs),
    ).toBe(numberFormatter(DATA_TO_FILTER[0].balance));
    expect(
      getValue(
        { numerical: { path: "balance", decimalPlaces: 2 } } as ColumnDefinition<typeof DATA_TO_FILTER[number]>,
        ...commonGetValueArgs,
      ),
    ).toBe(numberFormatter(DATA_TO_FILTER[0].balance, { decimalPlaces: 2 }));
    expect(
      getValue(
        { dataIndex: "balance", numerical: { decimalPlaces: 2 } } as ColumnDefinition<typeof DATA_TO_FILTER[number]>,
        ...commonGetValueArgs,
      ),
    ).toBe(numberFormatter(DATA_TO_FILTER[0].balance, { decimalPlaces: 2 }));
    expect(
      getValue(
        { dataIndex: "test", numerical: { path: "balance", decimalPlaces: 2 } } as ColumnDefinition<
          typeof DATA_TO_FILTER[number]
        >,
        ...commonGetValueArgs,
      ),
    ).toBe(numberFormatter(DATA_TO_FILTER[0].balance, { decimalPlaces: 2 }));
  });
  it("should should return a different value depending on if it is a CSV export", () => {
    expect(
      getValue(
        {
          render: (record: any, isCSVExport: boolean) => (isCSVExport ? "isCSVExport" : record.email),
        } as unknown as ColumnDefinition<typeof DATA_TO_FILTER[number]>,
        ...commonGetValueArgs,
      ),
    ).toBe(DATA_TO_FILTER[0].email);
    expect(
      getValue(
        {
          render: (record: any, isCSVExport: boolean) => (isCSVExport ? "isCSVExport" : record.name),
        } as unknown as ColumnDefinition<typeof DATA_TO_FILTER[number]>,
        ...([...commonGetValueArgs.slice(0, -1), true] as typeof commonGetValueArgs),
      ),
    ).toBe("isCSVExport");
  });
});

describe("getTableCellAlignment utility function", function () {
  it("should return the specified alignment", () => {
    expect(getTableCellAlignment({ align: "left" } as ColumnDefinition<BaseData>)).toBe("left");
    expect(
      getTableCellAlignment({ dataType: "number", numerical: "number", align: "left" } as ColumnDefinition<BaseData>),
    ).toBe("left");
  });
  it("should return right if it is a number", () => {
    expect(getTableCellAlignment({ dataType: "number" } as ColumnDefinition<BaseData>)).toBe("right");
    expect(getTableCellAlignment({ numerical: "number" } as ColumnDefinition<BaseData>)).toBe("right");
  });
  it("should return the cell alignment from the rendered value type", () => {
    expect(
      getTableCellAlignment(
        { dataIndex: "email" } as ColumnDefinition<typeof DATA_TO_FILTER[number]>,
        DATA_TO_FILTER[0],
      ),
    ).toBe("left");
    expect(
      getTableCellAlignment(
        { dataIndex: "balance" } as ColumnDefinition<typeof DATA_TO_FILTER[number]>,
        DATA_TO_FILTER[0],
      ),
    ).toBe("right");
  });
  it("should default to left alignment if it cannot work out the type", () => {
    expect(
      getTableCellAlignment({ render: () => <div>0</div> } as unknown as ColumnDefinition<
        typeof DATA_TO_FILTER[number]
      >),
    ).toBe("left");
  });
});

describe("getUnhiddenColumns utility function", function () {
  const baseColumns = [
    { dataIndex: "email", hidden: true } as ColumnDefinition<typeof DATA_TO_FILTER[number]>,
    { dataIndex: "name" } as ColumnDefinition<typeof DATA_TO_FILTER[number]>,
    { dataIndex: "balance", hidden: false } as ColumnDefinition<typeof DATA_TO_FILTER[number]>,
  ];
  it("should filter out hidden columns", function () {
    expect(getUnhiddenColumns(baseColumns)).toEqual([baseColumns[1], baseColumns[2]]);
  });
  it("should return all columns if there are no hidden columns", function () {
    baseColumns[0].hidden = false;
    expect(getUnhiddenColumns(baseColumns)).toEqual(baseColumns);
  });
  it("should return no columns if all columns are hidden", function () {
    baseColumns.forEach((column) => (column.hidden = true));
    expect(getUnhiddenColumns(baseColumns)).toEqual([]);
  });
});

describe("debounce utility function", function () {
  jest.useFakeTimers();
  it("should return a debounced function that is called after a specified time", () => {
    const mockFunction = jest.fn();
    const debounced = debounce(mockFunction, 100);
    expect(debounced).toBeInstanceOf(Function);
    debounced();
    jest.advanceTimersByTime(100);
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });
  it("should return a debounced function which is only called once and after the default time", () => {
    const mockFunction = jest.fn();
    const debounced = debounce(mockFunction);
    expect(debounced).toBeInstanceOf(Function);
    for (let count = 0; count < 10; count++) debounced();
    jest.advanceTimersByTime(250);
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });
});

describe("getDefaultPath utility function", function () {
  it("should prioritise the dataIndex field", () => {
    expect(getDefaultPath({ dataIndex: "test" })).toBe("test");
  });
  it("should return the value of numerical if it is a string and dataIndex is undefined", () => {
    expect(getDefaultPath({ numerical: "test" })).toBe("test");
  });
  it("should return numerical.path if it is a string and dataIndex is undefined", () => {
    expect(getDefaultPath({ numerical: { path: "test" } })).toBe("test");
  });
  it("should return the value of dataIndex if numerical is true or numerical.path is true or undefined", () => {
    expect(getDefaultPath({ dataIndex: "test", numerical: true })).toBe("test");
    expect(getDefaultPath({ dataIndex: "test", numerical: { path: true } })).toBe("test");
    expect(getDefaultPath({ dataIndex: "test", numerical: {} })).toBe("test");
  });
  it("should return undefined if dataIndex is undefined and numerical or numerical.path is undefined", () => {
    expect(getDefaultPath({ dataIndex: undefined, numerical: undefined })).toBeUndefined();
    expect(getDefaultPath({ dataIndex: undefined, numerical: { path: undefined } })).toBeUndefined();
  });
});
