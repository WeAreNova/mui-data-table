import {
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  SelectChangeEvent,
  SelectProps,
  Typography,
  useMediaQuery,
} from "@mui/material";
import PropTypes from "prop-types";
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";

export type SelectOptionObject = { label: string; value: string };
export type SimpleSelectChangeHandler<T extends SelectOptionObject> = (value: T | null) => void;

interface SimpleSelectProps<T extends SelectOptionObject> extends Omit<SelectProps, "onChange"> {
  options: Array<T | string>;
  onChange: SimpleSelectChangeHandler<T>;
  helperText?: string | null;
  disablePortal?: boolean;
}

/**
 * The SimpleSelectField is used to render a basic select field without autocomplete
 * but switches to a native select field if the device pointer is **not** a cursor.
 *
 * @component
 */
const SimpleSelect = <T extends SelectOptionObject>({
  placeholder,
  options,
  value,
  defaultValue,
  onChange,
  className,
  error,
  helperText,
  fullWidth,
  disablePortal = false,
  ...selectProps
}: PropsWithChildren<SimpleSelectProps<T>>) => {
  const isAccuratePointer = useMediaQuery("(pointer: fine)");
  const [isOpen, setIsOpen] = useState(false);

  const menuProps = useMemo(() => ({ disablePortal }), [disablePortal]);
  const val = useMemo(() => value ?? defaultValue ?? "", [defaultValue, value]);
  const allOptions = useMemo<T[]>(
    () => [
      ...(placeholder ? [{ label: placeholder, value: "" } as T] : []),
      ...options.map((option) => (typeof option === "object" ? option : ({ label: option, value: option } as T))),
    ],
    [options, placeholder],
  );

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);
  const handleChange = useCallback(
    (e: SelectChangeEvent<unknown>) => {
      const selectedValue = e.target.value === "" ? null : e.target.value;
      onChange(allOptions.find((o) => o.value === selectedValue) ?? null);
    },
    [allOptions, onChange],
  );

  useEffect(() => {
    if (selectProps.disabled) {
      handleClose();
    }
  }, [handleClose, selectProps.disabled]);

  return (
    <FormControl fullWidth={fullWidth} error={error} className={className}>
      <Select
        {...selectProps}
        {...(value === undefined ? { defaultValue: val } : { value: val })}
        onChange={handleChange}
        displayEmpty={Boolean(placeholder)}
        native={!isAccuratePointer}
        MenuProps={menuProps}
        open={isOpen}
        onOpen={handleOpen}
        onClose={handleClose}
        sx={(theme) => ({ ...theme.typography.caption })}
        variant="standard"
      >
        {allOptions.map(({ label, value: optionValue }) =>
          !isAccuratePointer ? (
            <Typography key={optionValue} value={optionValue} variant="caption" component="option">
              {label}
            </Typography>
          ) : (
            <MenuItem key={optionValue} value={optionValue}>
              <Typography variant="caption">{label}</Typography>
            </MenuItem>
          ),
        )}
      </Select>
      {Boolean(helperText) && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};
SimpleSelect.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      }).isRequired,
    ]),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default SimpleSelect;
