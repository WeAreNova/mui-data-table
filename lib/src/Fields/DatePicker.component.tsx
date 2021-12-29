import { TextField, TextFieldProps } from "@material-ui/core";
import React, { ChangeEvent, Suspense, useCallback, useMemo, useState } from "react";
import { DateLike } from "../table.types";

function FallbackDatePicker({
  defaultValue: propDefault,
  inputVariant,
  ...props
}: TextFieldProps & { defaultValue: DateLike; inputVariant?: string }) {
  const defaultValue = useMemo(() => propDefault && new Date(propDefault).toISOString().split("T")[0], [propDefault]);
  return <TextField {...props} value={undefined} defaultValue={defaultValue ?? ""} type="date" />;
}

// @ts-expect-error `@material-ui/pickers` is a weak dependency
const MUIDatePicker = React.lazy<typeof TextField | typeof import("@material-ui/pickers").DatePicker>(async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DatePicker: PickerComponent } = require("@material-ui/pickers");
    return { default: (props: TextFieldProps) => <PickerComponent {...props} defaultValue={undefined} /> };
  } catch (error) {
    return { default: FallbackDatePicker };
  }
});

interface DatePickerProps extends Pick<TextFieldProps, "variant"> {
  onChange(date: DateLike): void;
  defaultValue?: DateLike;
}

const DatePicker: React.FC<DatePickerProps> = ({ defaultValue, onChange, ...props }) => {
  const [val, setVal] = useState<DateLike>(defaultValue || null);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | (DateLike & { target: undefined })) => {
      const date = e?.target?.value ?? (e as DateLike);
      onChange(date);
      setVal(date || null);
    },
    [onChange],
  );

  const datePickerProps = useMemo(
    () => ({
      ...props,
      onChange: handleChange,
    }),
    [handleChange, props],
  );

  return (
    <Suspense fallback={<FallbackDatePicker {...datePickerProps} defaultValue={defaultValue ?? ""} />}>
      <MUIDatePicker {...datePickerProps} defaultValue={defaultValue} value={val} inputVariant={props.variant} />
    </Suspense>
  );
};

export default DatePicker;
