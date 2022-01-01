import React from "react";
import { DateLike } from "table.types";
import { DatePickerProps } from ".";
import NativeDatePicker from "./NativeDatePicker.component";

interface MUIPickerProps extends DatePickerProps {
  value: DateLike;
}

let MUIPicker: React.FC<MUIPickerProps> | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PickerComponent = require("@material-ui/pickers").DatePicker;
  MUIPicker = function MUIDatePicker({ defaultValue, ...props }: MUIPickerProps) {
    return <PickerComponent {...props} defaultValue={undefined} />;
  };
} catch (error) {
  // `@mui/lab` is not installed
}

export default (MUIPicker || NativeDatePicker) as NonNullable<typeof MUIPicker> | typeof NativeDatePicker;
