import {
  createStyles,
  FormControl,
  makeStyles,
  MenuItem,
  Select,
  SelectProps,
  Typography,
  useMediaQuery,
} from "@material-ui/core";
import React, { ChangeEvent, ChangeEventHandler, PropsWithChildren, useCallback, useMemo } from "react";

export type Option = { label: string; value: string };

interface SimpleSelectProps<T extends Option> extends Omit<SelectProps, "onChange"> {
  options: T[];
  onChange: (e: ChangeEvent<{ name?: string; value: unknown }>, value: T | null) => void;
}

const useStyles = makeStyles(
  (theme) =>
    createStyles({
      select: {
        ...theme.typography.caption,
      },
    }),
  { name: "SimpleSelectFieldComponent" },
);

const getOption = (value: string, label: string, isAccuratePointer: boolean) => {
  if (!isAccuratePointer)
    return (
      <Typography key={value} variant="caption" component="option">
        {label}
      </Typography>
    );
  return (
    <MenuItem key={value} value={value}>
      <Typography variant="caption">{value === "" ? <em>{label}</em> : label}</Typography>
    </MenuItem>
  );
};

const SimpleSelectField = <T extends Option>({
  placeholder,
  options,
  onChange,
  className,
  value,
  ...selectProps
}: PropsWithChildren<SimpleSelectProps<T>>) => {
  const classes = useStyles(selectProps);
  const isAccuratePointer = useMediaQuery("(pointer: fine)");

  const defaultValue = useMemo(() => value || "", [value]);

  const handleChange = useCallback<ChangeEventHandler<{ name?: string; value: unknown }>>(
    (e) => {
      const value = e.target.value === "" ? null : e.target.value;
      onChange(e, options.find((o) => o.value === value) ?? null);
    },
    [onChange, options],
  );

  return (
    <FormControl className={className}>
      <Select
        {...selectProps}
        defaultValue={defaultValue}
        onChange={handleChange}
        displayEmpty={Boolean(placeholder)}
        native={!isAccuratePointer}
        className={classes.select}
      >
        {placeholder && getOption("", placeholder, isAccuratePointer)}
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const label = typeof option === "string" ? option : option.label;
          return getOption(value, label, isAccuratePointer);
        })}
      </Select>
    </FormControl>
  );
};

export default SimpleSelectField;
