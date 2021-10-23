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
import React, { ChangeEvent, ChangeEventHandler, PropsWithChildren, useCallback } from "react";

export type Option = { label: string; value: string };

interface SimpleSelectProps<T extends Option> extends Omit<SelectProps, "onChange"> {
  options: T[];
  onChange: (e: ChangeEvent<{ name?: string; value: unknown }>, value: T | null) => void;
}

const useStyles = makeStyles(
  (theme) =>
    createStyles({
      select: {
        ...theme.typography.caption,
      },
    }),
  { name: "SimpleSelectFieldComponent" },
);

const Option: React.FC<{ value: string }> = (props) => {
  const isAccuratePointer = useMediaQuery("(pointer: fine)");
  return !isAccuratePointer ? (
    <Typography {...props} variant="caption" component="option" />
  ) : (
    <MenuItem {...props}>
      <Typography variant="caption">{props.value === "" ? <em>{props.children}</em> : props.children}</Typography>
    </MenuItem>
  );
};

const SimpleSelectField = <T extends Option>({
  placeholder,
  options,
  onChange,
  className,
  value,
  ...selectProps
}: PropsWithChildren<SimpleSelectProps<T>>) => {
  const classes = useStyles(selectProps);
  const isAccuratePointer = useMediaQuery("(pointer: fine)");

  const handleChange = useCallback<ChangeEventHandler<{ name?: string; value: unknown }>>(
    (e) => {
      const value = e.target.value === "" ? null : e.target.value;
      // if (!onChange) return form.setFieldValue(field.name, value);
      onChange(e, options.find((o) => o.value === value) ?? null);
    },
    [onChange, options],
  );

  return (
    <FormControl className={className}>
      <Select
        {...selectProps}
        value={value}
        onChange={handleChange}
        displayEmpty={Boolean(placeholder)}
        native={!isAccuratePointer}
        className={classes.select}
      >
        {placeholder && <Option value="">{placeholder}</Option>}
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const label = typeof option === "string" ? option : option.label;
          return (
            <Option key={value} value={value}>
              {label}
            </Option>
          );
        })}
      </Select>
    </FormControl>
  );
};

export default SimpleSelectField;
