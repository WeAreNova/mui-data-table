import { debounce, TextField, Typography } from "@material-ui/core";
import { MaterialUiPickersDate } from "@material-ui/pickers/typings/date";
import PropTypes from "prop-types";
import React, { ChangeEvent, PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "../Fields/DatePicker.component";
import SimpleSelect, { SelectOptionObject } from "../Fields/SimpleSelect.component";
import type { ActiveFilter, NullableActiveFilter } from "../table.types";
import { getFilterTypeConvertors } from "../utils";
import { BOOLEAN_OPTIONS, FilterValuePropTypes } from "../_dataTable.consts";

type FilterValueType<T extends ActiveFilter["type"] | NullableActiveFilter["type"]> = T extends "string"
  ? string
  : T extends "number"
  ? number
  : T extends "boolean"
  ? boolean
  : T extends "date"
  ? Date
  : ActiveFilter["value"];

interface ValueFieldProps<T extends ActiveFilter | NullableActiveFilter, V extends FilterValueType<T["type"]>> {
  value: T;
  onChange(value: V | null): void;
}

const COMMON_PROPS = {
  name: "value",
  placeholder: "Value",
  size: "small",
  variant: "standard",
} as const;

/**
 * The ValueField is a component that works out what field is needed for the current filter.
 * It renders one of the following:
 * - a `string` `TextField`
 * - a `number` `TextField`
 * - a `SimpleSelectField`
 * - a `DatePicker`
 *
 * @component
 * @package
 */
const ValueField = <
  T extends ActiveFilter | NullableActiveFilter,
  V extends FilterValueType<T["type"]> = FilterValueType<T["type"]>,
>({
  value: filter,
  onChange,
}: PropsWithChildren<ValueFieldProps<T, V>>) => {
  const [filterValue, setFilterValue] = useState<ActiveFilter["value"]>(filter.value);
  const [hasError, setHasError] = useState(false);

  const specifiable = useMemo(() => !filter.operator?.includes("exists"), [filter.operator]);
  const commonProps = useMemo(
    () => ({ ...COMMON_PROPS, defaultValue: filter.value, error: hasError, autoFocus: true }),
    [filter.value, hasError],
  );

  const handleSelectChange = useCallback((selected: SelectOptionObject | null) => {
    if (!selected) return setFilterValue(null);
    setFilterValue(selected.value === "true");
  }, []);
  const handleDateChange = useCallback((value: MaterialUiPickersDate | null) => {
    const newFilterValue = value && new Date(value);
    setFilterValue(newFilterValue ?? null);
  }, []);
  const handleOtherChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!filter.type) return setFilterValue(e.target.value);
      const convertors = getFilterTypeConvertors(e.target.value);
      setFilterValue(convertors[filter.type]());
    },
    [filter.type],
  );

  const field = useMemo(() => {
    switch (filter.type) {
      case "boolean":
        return <SimpleSelect {...commonProps} onChange={handleSelectChange} options={BOOLEAN_OPTIONS} />;
      case "date":
        return (
          <DatePicker
            {...commonProps}
            defaultValue={commonProps.defaultValue as MaterialUiPickersDate}
            onChange={handleDateChange}
            variant="dialog"
            inputVariant={commonProps.variant}
          />
        );
      case "number":
        return <TextField {...commonProps} onChange={handleOtherChange} type="number" />;
      default:
        return (
          <TextField
            {...commonProps}
            onChange={handleOtherChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
        );
    }
  }, [commonProps, filter.type, handleDateChange, handleOtherChange, handleSelectChange]);

  const debouncedChange = useMemo(() => debounce(onChange, 500), [onChange]);

  const handleFilterChange = useCallback(() => {
    if (filterValue === filter.value) return;
    if (
      !filter.operator?.includes("exists") &&
      typeof filterValue !== "boolean" &&
      typeof filterValue !== "number" &&
      !filterValue
    ) {
      return setHasError(true);
    }
    setHasError(false);
    debouncedChange(filterValue as V | null);
  }, [debouncedChange, filter.operator, filter.value, filterValue]);

  useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

  return !specifiable ? null : (
    <>
      <Typography variant="caption">Value</Typography>
      {field}
    </>
  );
};
ValueField.propTypes = {
  value: FilterValuePropTypes.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ValueField;
