import { debounce, TextField, Typography } from "@material-ui/core";
import { DatePicker, useUtils } from "@material-ui/pickers";
import { MaterialUiPickersDate } from "@material-ui/pickers/typings/date";
import React, { ChangeEvent, PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import type { ActiveFilter, NullableActiveFilter } from "../table.types";
import { getFilterTypeConvertors } from "../utils";
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
    setFilterValue(selected ? selected.value === "true" : null);
  }, []);
  const handleDateChange = useCallback(
    (value: MaterialUiPickersDate | null) => setFilterValue((value && dateUtils.date(value)?.toDate()) ?? null),
    [dateUtils],
  );
  const handleOtherChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const convertors = filter.type && getFilterTypeConvertors(e?.target?.value, dateUtils);
      setFilterValue(filter.type ? convertors![filter.type]() : e.target.value);
    },
    [dateUtils, filter.type],
  );

  const field = useMemo(() => {
    const { defaultValue, ...otherCommonProps } = commonProps;
    const dateProps = { ...otherCommonProps, defaultValue: defaultValue };
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

  useEffect(() => {
    (() => {
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
    })();
  }, [debouncedChange, filter.operator, filter.value, filterValue]);

  return !specifiable ? null : (
    <>
      <Typography variant="caption">Value</Typography>
      {field}
    </>
  );
};

export default ValueField;
