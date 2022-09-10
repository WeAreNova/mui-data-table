import { TextFieldProps } from "@mui/material";
import React, { Suspense, useCallback, useMemo, useState } from "react";
import { DateLike } from "../../types";
import NativeDatePicker from "./NativeDatePicker";

const DynamicDatePicker = React.lazy(async () => import("./DynamicPicker"));

export interface DatePickerProps extends Pick<TextFieldProps, "variant"> {
  onChange(date: DateLike): void;
  defaultValue: DateLike;
}

const DatePicker: React.FC<DatePickerProps> = ({ defaultValue, onChange, ...props }) => {
  const [val, setVal] = useState(defaultValue || null);

  const handleChange = useCallback(
    (date: DateLike) => {
      onChange(date || null);
      setVal(date || null);
    },
    [onChange],
  );

  const datePickerProps = useMemo(
    () => ({
      ...props,
      onChange: handleChange,
      defaultValue: defaultValue ?? null,
    }),
    [defaultValue, handleChange, props],
  );

  return (
    <Suspense fallback={<NativeDatePicker {...datePickerProps} />}>
      <DynamicDatePicker {...datePickerProps} value={val} />
    </Suspense>
  );
};

export default DatePicker;
