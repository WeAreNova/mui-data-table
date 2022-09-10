/* eslint-disable sonarjs/no-duplicate-string */
import { SetOptional } from "type-fest";
import { ActiveFilter, OperatorValues } from "../src/types";

export const DATA_TO_FILTER = [
  { email: "test@example.com", balance: 100, confirmed: true, date: "2022-01-02", nullable: true },
  { email: "test@gmail.com", balance: 50, confirmed: true, date: "2022-01-01" },
  { email: "test@gmail.com", balance: 150, confirmed: false, date: "2022-01-03" },
];

export const FILTERS: Record<
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
