import { DatePicker as MUIDatePicker, DatePickerProps as MUIDatePickerProps } from "@material-ui/pickers";
import React, { useCallback, useEffect, useState } from "react";

interface DatePickerProps extends Omit<MUIDatePickerProps, "value"> {
  defaultValue?: MUIDatePickerProps["value"];
  value?: MUIDatePickerProps["value"];
}

const DatePicker: React.FC<DatePickerProps> = ({ defaultValue, value, onChange, ...props }) => {
  const [val, setVal] = useState(defaultValue || value || null);

  const handleChange = useCallback(
    (date) => {
      onChange(date);
      if (typeof value === "undefined") {
        setVal(date || null);
      }
    },
    [onChange, value],
  );

  useEffect(() => {
    if (typeof defaultValue === "undefined") {
      setVal(value || null);
    }
  }, [defaultValue, value]);

  return <MUIDatePicker {...props} value={val} onChange={handleChange} />;
};

export default DatePicker;
