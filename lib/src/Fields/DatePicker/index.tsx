import React, { Suspense, useCallback, useMemo, useState } from "react";
import { DateLike } from "table.types";
import NativeDatePicker from "./NativeDatePicker.component";

const DynamicDatePicker = React.lazy(async () => import("./DynamicPicker.component"));

export interface DatePickerProps {
  onChange(date: DateLike): void;
  defaultValue: DateLike;
  variant?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ defaultValue, onChange, variant, ...props }) => {
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
