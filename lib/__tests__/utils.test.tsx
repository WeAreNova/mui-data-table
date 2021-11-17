/* eslint-disable sonarjs/no-duplicate-string */
import { SetOptional } from "type-fest";
import { ActiveFilter, BaseData, ColumnDefinition, DataTypes, OperatorValues } from "../src";
import {
  createDTError,
  dataTypeOperatorMap,
  dispatchTableEvent,
  findIndexFrom,
  findLastIndexFrom,
  getDataType,
  getDefaultOperator,
  getFilteredData,
  getFilterTypeConvertors,
  getPath,
} from "../src/utils";

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

it("should dispatch table events", function () {
  const promises = [eventPromise("cancelEdit"), eventPromise("closeFilter")];
  dispatchTableEvent("*");
  promises.forEach((promise) => expect(promise).resolves.toBeInstanceOf(CustomEvent));
});

it("should create a data table error", function () {
  const error = createDTError("helper_message", "error_message");
  expect(error.dataTableMessage).toBe("helper_message");
  expect(error.message).toBe("error_message");
  expect(error).toBeInstanceOf(Error);
});

it("should find an index from another index", function () {
  expect(findIndexFrom(ARRAY_DATA, (value) => value === 3)).toBe(3);
  expect(findIndexFrom(ARRAY_DATA, (value) => value === 3, 4)).toBe(15);
  expect(findIndexFrom(ARRAY_DATA, (value) => value === 9, 10)).toBe(-1);
});

it("should find the last index from another index", function () {
  expect(findLastIndexFrom(ARRAY_DATA, (value) => value === 3)).toBe(15);
  expect(findLastIndexFrom(ARRAY_DATA, (value) => value === 9)).toBe(9);
  expect(findLastIndexFrom(ARRAY_DATA, (value) => value === 9, 10)).toBe(-1);
});

it("should check the filter type convertors are working correctly", function () {
  expect(getFilterTypeConvertors(1).string()).toBe("1");
  expect(getFilterTypeConvertors("1").number()).toBe(1);
  expect(getFilterTypeConvertors("true").boolean()).toBe(true);
  expect(getFilterTypeConvertors("false").boolean()).toBe(false);
  expect(getFilterTypeConvertors(1).boolean()).toBe(false);
  expect(getFilterTypeConvertors("2022-01-01").date()).toEqual(new Date("2022-01-01"));
});

const DATA_TO_FILTER = [
  { email: "test@example.com", balance: 100, confirmed: true, date: "2022-01-02", nullable: true },
  { email: "test@gmail.com", balance: 50, confirmed: true, date: "2022-01-01" },
  { email: "test@gmail.com", balance: 150, confirmed: false, date: "2022-01-03" },
];

const FILTERS: Record<
  OperatorValues,
  Array<{
    resultIndexes: number[];
    filter: SetOptional<Omit<ActiveFilter<typeof DATA_TO_FILTER[number]>, "id" | "operator">, "type">;
  }>
> = {
  exists: [{ filter: { value: null, path: "nullable", type: "boolean" }, resultIndexes: [0] }],
  "!exists": [{ filter: { value: null, path: "nullable", type: "boolean" }, resultIndexes: [1, 2] }],
  "~": [{ filter: { value: "gmail.com", path: "email" }, resultIndexes: [1, 2] }],
  "!~": [{ filter: { value: "gmail.com", path: "email" }, resultIndexes: [0] }],
  "=": [
    { filter: { value: "test@example.com", path: "email" }, resultIndexes: [0] },
    { filter: { value: 50, path: "balance" }, resultIndexes: [1] },
    { filter: { value: true, path: "confirmed" }, resultIndexes: [0, 1] },
    { filter: { value: "2022-01-03", type: "date", path: "date" }, resultIndexes: [2] },
  ],
  "!=": [
    { filter: { value: "test@example.com", path: "email" }, resultIndexes: [1, 2] },
    { filter: { value: 50, path: "balance" }, resultIndexes: [0, 2] },
    { filter: { value: true, path: "confirmed" }, resultIndexes: [2] },
    { filter: { value: "2022-01-03", type: "date", path: "date" }, resultIndexes: [0, 1] },
  ],
  ">": [
    { filter: { value: 50, path: "balance" }, resultIndexes: [0, 2] },
    { filter: { value: "2022-01-02", type: "date", path: "date" }, resultIndexes: [2] },
  ],
  ">=": [
    { filter: { value: 50, path: "balance" }, resultIndexes: [0, 1, 2] },
    { filter: { value: "2022-01-02", type: "date", path: "date" }, resultIndexes: [0, 2] },
  ],
  "<": [
    { filter: { value: 100, path: "balance" }, resultIndexes: [1] },
    { filter: { value: "2022-01-03", type: "date", path: "date" }, resultIndexes: [0, 1] },
  ],
  "<=": [
    { filter: { value: 50, path: "balance" }, resultIndexes: [1] },
    { filter: { value: "2022-01-03", type: "date", path: "date" }, resultIndexes: [0, 1, 2] },
  ],
};

it("should filter data correctly", function () {
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
  it("returns structure.dataType if value is a path type", function () {
    expect(getDataType("path", { dataType: "number" } as ColumnDefinition<BaseData>)).toBe("number");
  });
  it('returns "string" as default', function () {
    expect(getDataType("path", {} as ColumnDefinition<BaseData>)).toBe("string");
  });
  it("returns value.type if specified", function () {
    expect(getDataType({ type: "number" }, { dataType: "string" } as ColumnDefinition<BaseData>)).toBe("number");
  });
  it("returns structure.dataType value.type is unspecified", function () {
    expect(getDataType({}, { dataType: "boolean" } as ColumnDefinition<BaseData>)).toBe("boolean");
  });
});

describe("getDefaultOperator utility function", function () {
  it("returns the specified default operator", function () {
    expect(getDefaultOperator({ defaultOperator: "!=" }, "string")).toBe("!=");
  });
  Object.entries(dataTypeOperatorMap).forEach(([dataType, defaultOperator]) => {
    it(`returns the default operator for a ${dataType} data type`, function () {
      expect(getDefaultOperator({}, dataType as DataTypes)).toBe(defaultOperator);
    });
  });
});

describe("getPath utility function", function () {
  it("returns the value if it is a string", function () {
    expect(getPath("path", { dataIndex: "test" } as ColumnDefinition<BaseData>)).toBe("path");
  });
  it("returns value.path if specified", function () {
    expect(getPath({ path: "path" }, {} as ColumnDefinition<BaseData>)).toBe("path");
  });
  it("returns dataIndex if value.path is unspecified", function () {
    expect(getPath({}, { dataIndex: "path" } as ColumnDefinition<BaseData>)).toBe("path");
  });
  it("returns dataIndex if the value is true", function () {
    expect(getPath(true, { dataIndex: "path" } as ColumnDefinition<BaseData>)).toBe("path");
  });
  it("returns dataIndex if value.path is true", function () {
    expect(getPath({ path: true }, { dataIndex: "path" } as ColumnDefinition<BaseData>)).toBe("path");
  });
});
