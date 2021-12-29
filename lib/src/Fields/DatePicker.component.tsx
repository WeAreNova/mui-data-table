import { TextField, TextFieldProps } from "@mui/material";
import React, { Suspense, useCallback, useMemo, useState } from "react";
import { DateLike } from "../table.types";

function FallbackDatePicker({
  defaultValue: propDefault,
  onChange,
  value,
  ...props
}: DatePickerProps & { value?: DateLike }) {
  const defaultValue = useMemo(() => propDefault && new Date(propDefault).toISOString().split("T")[0], [propDefault]);
  const handleChange = useCallback<NonNullable<TextFieldProps["onChange"]>>(
    (e) => onChange(e.target.value),
    [onChange],
  );
  return <TextField {...props} defaultValue={defaultValue || ""} onChange={handleChange} type="date" />;
}

interface MUIDatePickerProps extends DatePickerProps {
  value: DateLike;
}

const MUIDatePicker = React.lazy<typeof FallbackDatePicker | React.FC<MUIDatePickerProps>>(async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PickerComponent = require("@mui/lab").DatePicker as typeof import("@mui/lab").DatePicker;
    return {
      default: ({ defaultValue, ...props }: MUIDatePickerProps) => (
        <PickerComponent {...props} renderInput={(textFieldProps) => <TextField {...textFieldProps} />} />
      ),
    };
  } catch (error) {
    return { default: FallbackDatePicker };
  }
});

interface DatePickerProps extends Pick<TextFieldProps, "variant"> {
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
    <Suspense fallback={<FallbackDatePicker {...datePickerProps} />}>
      <MUIDatePicker {...datePickerProps} value={val} />
    </Suspense>
  );
};

export default DatePicker;
