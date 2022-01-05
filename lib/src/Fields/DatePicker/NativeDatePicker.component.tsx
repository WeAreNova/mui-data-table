import { TextField, TextFieldProps } from "@mui/material";
import React, { useCallback, useMemo } from "react";
import { DateLike } from "table.types";
import { DatePickerProps } from "./index";

interface NativeDatePickerProps extends DatePickerProps {
  value?: DateLike;
}

export const NativeDatePicker: React.FC<NativeDatePickerProps> = ({
  defaultValue: propDefault,
  onChange,
  value,
  ...props
}) => {
  const defaultValue = useMemo(() => propDefault && new Date(propDefault).toISOString().split("T")[0], [propDefault]);
  const handleChange = useCallback<NonNullable<TextFieldProps["onChange"]>>(
    (e) => onChange(e.target.value),
    [onChange],
  );
  return (
    <TextField {...props} defaultValue={defaultValue || ""} onChange={handleChange} type="date" variant="standard" />
  );
};

export default NativeDatePicker;
