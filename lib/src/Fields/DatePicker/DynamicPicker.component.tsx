import CalendarIcon from "@mui/icons-material/CalendarToday";
import { IconButton, StandardTextFieldProps, TextField } from "@mui/material";
import React, { useCallback, useState } from "react";
import { DateLike } from "table.types";
import { DatePickerProps } from "./index";
import NativeDatePicker from "./NativeDatePicker.component";

interface MUIPickerProps extends DatePickerProps {
  value: DateLike;
}

interface DatePickerInputProps extends StandardTextFieldProps {
  onIconClick(): void;
}

let MUIPicker: React.FC<MUIPickerProps> | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PickerComponent = require("@mui/lab/DatePicker").default;
  const MUIPickerInput: React.FC<DatePickerInputProps> = ({ onIconClick, ...props }) => {
    return (
      <TextField
        {...props}
        sx={{ pr: 0.5 }}
        InputProps={{
          ...props.InputProps,
          endAdornment: (
            <IconButton onClick={onIconClick}>
              <CalendarIcon fontSize="small" />
            </IconButton>
          ),
        }}
        variant="standard"
      />
    );
  };

  MUIPicker = function MUIDatePicker({ defaultValue, ...props }: MUIPickerProps) {
    const [open, setOpen] = useState(false);
    const toggleOpen = useCallback(() => setOpen((o) => !o), []);
    return (
      <PickerComponent
        {...props}
        open={open}
        onOpen={toggleOpen}
        onClose={toggleOpen}
        renderInput={(textFieldProps: StandardTextFieldProps) => (
          <MUIPickerInput {...textFieldProps} onIconClick={toggleOpen} />
        )}
      />
    );
  };
} catch (error) {
  // `@mui/lab` is not installed
}

export default MUIPicker || NativeDatePicker;
