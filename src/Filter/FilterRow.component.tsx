import { IconButton, makeStyles, Typography } from "@material-ui/core";
import Close from "@material-ui/icons/Close";
import { createStyles } from "@material-ui/styles";
import SimpleSelectField from "client/components/FormControls/SimpleSelectField.component";
import SubmitOnChange from "client/components/SubmitOnChange.component";
import clsx from "clsx";
import { FastField, Field, Form, Formik } from "formik";
import React, { ChangeEvent, useCallback, useContext, useMemo } from "react";
import { SetRequired } from "type-fest";
import * as Yup from "yup";
import TableContext from "../table.context";
import type { ActiveFilter, ColGroup, FilterColumn, FilterTypes, NullableActiveFilter, OperatorValues, TableColumnStructure } from "../table.types";
import { getFilterPath } from "../utils";
import { FILTER_TYPES, OPERATORS } from "./filter.consts";
import ValueField from "./ValueField.component";

interface Props {
  value: ActiveFilter | NullableActiveFilter;
  last: boolean;
  onSubmit(value: ActiveFilter): any;
  onRemove(value: ActiveFilter | NullableActiveFilter): any;
  name?: string;
}

const useStyles = makeStyles(
  (theme) =>
    createStyles({
      root: {
        display: "flex",
        "& > div": {
          display: "flex",
          alignItems: "flex-end",
          "&:first-child": {
            flex: 1,
          },
          "&:last-child": {
            flex: 4,
          },
        },
      },
      field: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        "& input": {
          ...theme.typography.caption,
        },
        "&:not(:last-child)": {
          marginRight: theme.spacing(1),
        },
      },
      operatorField: {
        flex: 0.5,
      },
    }),
  { name: "FilterRowComponent" },
);

const SCHEMA = Yup.object({
  path: Yup.string().nullable().required(""),
  type: Yup.string()
    .oneOf([...FILTER_TYPES], "")
    .required(""),
  operator: Yup.string().nullable().required(""),
  value: Yup.mixed().when(
    ["type", "operator"],
    ((type: FilterTypes, operator: OperatorValues | null) => {
      let baseSchema;
      switch (type) {
        case "number":
          baseSchema = Yup.number();
          break;
        case "boolean":
          baseSchema = Yup.boolean();
          break;
        case "date":
          baseSchema = Yup.date();
          break;
        default:
          baseSchema = Yup.string();
          break;
      }
      if (operator?.includes("exists")) return baseSchema.nullable();
      return baseSchema.nullable().required("");
    }) as any, // ? `Yup` types not correct when passing in array of keys and config builder function
  ),
});

export const EMPTY_FILTER = {
  path: null,
  operator: "=",
  value: "",
  type: null,
} as const;

const getFilterType = (f: FilterColumn<any>): Exclude<FilterTypes, undefined | null> => {
  if (typeof f !== "object" || typeof f.type !== "string") return "string";
  return f.type;
};

const getOperatorOptions = (type: Exclude<FilterTypes, undefined | null> | null) =>
  OPERATORS.filter((o) => !o.typeLabelMap || o.typeLabelMap.default || (Boolean(type) && type! in o.typeLabelMap)).map((o) => ({
    label: !o.typeLabelMap ? o.value : (type && o.typeLabelMap[type]) ?? o.typeLabelMap.default,
    value: o.value,
  }));

const FilterRow: React.FC<Props> = ({ value, last, onSubmit, onRemove, name, ...props }) => {
  const classes = useStyles(props);
  const { tableStructure } = useContext(TableContext);

  const columns = useMemo(
    () =>
      tableStructure
        .flatMap((c) => [c, ...(c.colGroup?.map((cg) => ({ ...cg, title: `${c.title} - ${cg.title}` })) ?? [])])
        .filter((c): c is SetRequired<TableColumnStructure<any> | ColGroup<any>, "filterColumn"> => Boolean(c.filterColumn))
        .map((c) => ({
          label: c.title,
          value: getFilterPath(c),
          type: getFilterType(c.filterColumn),
        })),
    [tableStructure],
  );

  const initialValues = useMemo(() => ({ ...EMPTY_FILTER, ...value }), [value]);

  const handleSubmit = useCallback(
    (values: ActiveFilter) => {
      if (!values.value || values.operator.includes("exists")) values.value = null;
      onSubmit(values);
    },
    [onSubmit],
  );

  const handleRemove = useCallback(() => {
    onRemove(value);
  }, [onRemove, value]);

  return (
    <Formik<NullableActiveFilter>
      initialValues={initialValues}
      validationSchema={SCHEMA}
      onSubmit={handleSubmit as any} // ? `Formik` types don't seem to let `onSubmit` `values` argument have a different type to `initialValues` or vice versa
      validateOnBlur={false}
      validateOnChange={false}
      validateOnMount={false}
      enableReinitialize
    >
      {({ values, setValues }) => (
        <Form data-testid={name} className={classes.root}>
          <div>
            <IconButton onClick={handleRemove} disabled={last && !value.path} size="small">
              <Close />
            </IconButton>
            <div></div>
          </div>
          <div>
            <div className={classes.field}>
              <Typography variant="caption">Column</Typography>
              <FastField
                name="path"
                component={SimpleSelectField}
                options={columns}
                placeholder="Column"
                size="small"
                variant="standard"
                onChange={(e: ChangeEvent<HTMLInputElement>, selected: typeof columns[number] | null) =>
                  setValues((currValues) => ({ ...currValues, [e.target.name]: selected?.value, type: selected?.type ?? null, value: "" }))
                }
              />
            </div>
            <div className={clsx([classes.field, classes.operatorField])}>
              <Typography variant="caption">Operator</Typography>
              <Field
                name="operator"
                component={SimpleSelectField}
                options={getOperatorOptions(values.type)}
                placeholder="Operator"
                size="small"
                variant="standard"
              />
            </div>
            {!values.operator?.includes("exists") && (
              <div className={classes.field}>
                <ValueField />
              </div>
            )}
          </div>
          <SubmitOnChange />
        </Form>
      )}
    </Formik>
  );
};

export default FilterRow;
