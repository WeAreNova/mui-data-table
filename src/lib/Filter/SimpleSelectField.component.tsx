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
import React, { ChangeEventHandler, PropsWithChildren, useCallback, useMemo } from "react";

export type SelectFieldOption = { label: string; value: string };
export type SimpleSelectChangeHandler<T extends SelectFieldOption> = (value: T | null) => void;

interface SimpleSelectProps<T extends SelectFieldOption> extends Omit<SelectProps, "onChange"> {
  options: T[];
  onChange: SimpleSelectChangeHandler<T>;
}

const useStyles = makeStyles(
  (theme) =>
    createStyles({
      select: {
        ...theme.typography.caption,
      },
    }),
  { name: "DataTable-SimpleSelectField" },
);

const SimpleSelectField = <T extends SelectFieldOption>({
  placeholder,
  options,
  onChange,
  className,
  ...selectProps
}: PropsWithChildren<SimpleSelectProps<T>>) => {
  const classes = useStyles(selectProps);
  const isAccuratePointer = useMediaQuery("(pointer: fine)");

  const value = useMemo(() => selectProps.value || "", [selectProps.value]);
  const allOptions = useMemo(
    () => [...(placeholder ? [{ label: placeholder, value: "" }] : []), ...options],
    [options, placeholder],
  );

  const handleChange = useCallback<ChangeEventHandler<{ name?: string; value: unknown }>>(
    (e) => {
      const value = e.target.value === "" ? null : e.target.value;
      onChange(options.find((o) => o.value === value) ?? null);
    },
    [onChange, options],
  );

  return (
    <FormControl className={className}>
      <Select
        {...selectProps}
        value={value}
        onChange={handleChange}
        displayEmpty={Boolean(placeholder)}
        native={!isAccuratePointer}
        className={classes.select}
      >
        {allOptions.map(({ label, value }) =>
          !isAccuratePointer ? (
            <Typography key={value} value={value} variant="caption" component="option">
              {label}
            </Typography>
          ) : (
            <MenuItem key={value} value={value}>
              <Typography variant="caption">{label}</Typography>
            </MenuItem>
          ),
        )}
      </Select>
    </FormControl>
  );
};

export default SimpleSelectField;
