import PropTypes from "prop-types";
import { SelectFieldOption } from "./Filter/SimpleSelectField.component";
import { Operator } from "./table.types";

export const BOOLEAN_OPTIONS: SelectFieldOption[] = ["true", "false"].map((value) => ({ value, label: value }));

export const DATA_TYPES = ["string", "number", "boolean", "date"] as const;

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

export const FilterTypePropTypes = PropTypes.oneOf([...DATA_TYPES, null, undefined]);

export const FilterValuePropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  type: FilterTypePropTypes,
  path: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date), PropTypes.bool]),
  operator: PropTypes.oneOf([...OPERATORS.map((o) => o.value), null]),
});
