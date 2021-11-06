import { debounce, TextField, Typography } from "@material-ui/core";
import { DatePicker, useUtils } from "@material-ui/pickers";
import { MaterialUiPickersDate } from "@material-ui/pickers/typings/date";
import PropTypes from "prop-types";
import React, { ChangeEvent, PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import type { ActiveFilter, NullableActiveFilter } from "../table.types";
import { getFilterTypeConvertors } from "../utils";
import { FilterValuePropTypes } from "../_dataTable.consts";
import SimpleSelect, { SelectFieldOption } from "./SimpleSelectField.component";

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

const BOOLEAN_OPTIONS: SelectFieldOption[] = ["true", "false"].map((value) => ({ value, label: value }));
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
  const dateUtils = useUtils();
  const [filterValue, setFilterValue] = useState<ActiveFilter["value"]>(filter.value);
  const [hasError, setHasError] = useState(false);

  const specifiable = useMemo(() => !filter.operator?.includes("exists"), [filter.operator]);
  const commonProps = useMemo(
    () => ({ ...COMMON_PROPS, defaultValue: filter.value, error: hasError }),
    [filter.value, hasError],
  );

  const handleSelectChange = useCallback((selected: SelectFieldOption | null) => {
    if (!selected) return setFilterValue(null);
    setFilterValue(selected.value === "true");
  }, []);
  const handleDateChange = useCallback(
    (value: MaterialUiPickersDate | null) => {
      const newFilterValue = value && dateUtils.date(value)?.toDate();
      setFilterValue(newFilterValue ?? null);
    },
    [dateUtils],
  );
  const handleOtherChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!filter.type) return setFilterValue(e.target.value);
      const convertors = getFilterTypeConvertors(e.target.value, dateUtils);
      setFilterValue(convertors[filter.type]());
    },
    [dateUtils, filter.type],
  );

  const field = useMemo(() => {
    const { defaultValue, ...otherCommonProps } = commonProps;
    const dateProps = { ...otherCommonProps, defaultValue };
    switch (filter.type) {
      case "boolean":
        return (
          <SimpleSelect
            {...otherCommonProps}
            value={defaultValue}
            onChange={handleSelectChange}
            options={BOOLEAN_OPTIONS}
          />
        );
      case "date":
        return (
          <DatePicker
            {...(dateProps as any)}
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
