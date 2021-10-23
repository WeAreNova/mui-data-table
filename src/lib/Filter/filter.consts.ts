import { Operator } from "../table.types";

export const FILTER_TYPES = ["string", "number", "boolean", "date"] as const;

export const BASE_OPERATORS = [
  {
    value: "exists",
    typeLabelMap: {
      default: "exists",
    },
  },
  {
    value: "!exists",
    typeLabelMap: {
      default: "does not exist",
    },
  },
  {
    value: "~",
    typeLabelMap: {
      string: "contains",
    },
  },
  {
    value: "!~",
    typeLabelMap: {
      string: "does not contain",
    },
  },
  {
    value: "=",
    typeLabelMap: {
      default: "is",
      number: "=",
    },
  },
  {
    value: "!=",
    typeLabelMap: {
      default: "is not",
      number: "≠",
    },
  },
  {
    value: ">",
    typeLabelMap: {
      date: "is after",
      number: ">",
    },
  },
  {
    value: ">=",
    typeLabelMap: {
      date: "is on or after",
      number: "≥",
    },
  },
  {
    value: "<",
    typeLabelMap: {
      date: "is before",
      number: "<",
    },
  },
  {
    value: "<=",
    typeLabelMap: {
      date: "is on or before",
      number: "≤",
    },
  },
] as const;

export const OPERATORS = BASE_OPERATORS as ReadonlyArray<Operator>;
