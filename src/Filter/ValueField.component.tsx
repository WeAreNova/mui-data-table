import { Typography } from "@material-ui/core";
import DatePickerField from "client/components/FormControls/DatePickerField.component";
import NumberQuestion from "client/components/FormControls/NumberQuestion.component";
import SimpleSelectField from "client/components/FormControls/SimpleSelectField.component";
import TextQuestion from "client/components/FormControls/TextQuestion.component";
import { Field, useFormikContext } from "formik";
import React, { useCallback, useMemo } from "react";
import type { ActiveFilter } from "../table.types";

const ValueField: React.FC = () => {
  const { values } = useFormikContext<ActiveFilter>();

  const specifiable = useMemo(() => !values.operator?.includes("exists"), [values.operator]);
  const commonProps = useMemo(
    () => ({
      name: "value",
      placeholder: "Value",
      size: "small",
      variant: "standard",
    }),
    [],
  );

  const getField = useCallback(() => {
    switch (values.type) {
      case "boolean":
        return <Field {...commonProps} component={SimpleSelectField} options={["true", "false"]} />;
      case "date":
        return (
          <Field {...commonProps} component={DatePickerField} format="DD/MM/YYYY" inputVariant={commonProps.variant} />
        );
      case "number":
        return <Field {...commonProps} component={NumberQuestion} />;
      default:
        return (
          <Field
            {...commonProps}
            component={TextQuestion}
            InputLabelProps={{
              shrink: true,
            }}
          />
        );
    }
  }, [commonProps, values.type]);

  return !specifiable ? null : (
    <>
      <Typography variant="caption">Value</Typography>
      {getField()}
    </>
  );
};

export default ValueField;
