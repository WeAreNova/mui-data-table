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
import PropTypes from "prop-types";
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

/**
 * The SimpleSelectField is used to render a basic select field without autocomplete
 * but switches to a native select field if the device pointer is **not** a cursor.
 *
 * @component
 */
const SimpleSelectField = <T extends SelectFieldOption>({
  placeholder,
  options,
  onChange,
  className,
  ...selectProps
}: PropsWithChildren<SimpleSelectProps<T>>) => {
  const classes = useStyles(selectProps);
  const isAccuratePointer = useMediaQuery("(pointer: fine)");

  const defaultValue = useMemo(
    () => selectProps.value || selectProps.defaultValue || "",
    [selectProps.defaultValue, selectProps.value],
  );
  const allOptions = useMemo(
    () => [...(placeholder ? [{ label: placeholder, value: "" }] : []), ...options],
    [options, placeholder],
  );

  const handleChange = useCallback<ChangeEventHandler<{ name?: string; value: unknown }>>(
    (e) => {
      const selectedValue = e.target.value === "" ? null : e.target.value;
      onChange(options.find((o) => o.value === selectedValue) ?? null);
    },
    [onChange, options],
  );

  return (
    <FormControl fullWidth={selectProps.fullWidth} className={className}>
      <Select
        {...selectProps}
        defaultValue={defaultValue}
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
SimpleSelectField.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default SimpleSelectField;
