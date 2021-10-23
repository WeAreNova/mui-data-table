import { debounce, IconButton, makeStyles, Typography } from "@material-ui/core";
import Close from "@material-ui/icons/Close";
import { createStyles } from "@material-ui/styles";
import clsx from "clsx";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SetRequired } from "type-fest";
import TableContext from "../table.context";
import type {
  ActiveFilter,
  ColGroup,
  FilterColumn,
  FilterTypes,
  NullableActiveFilter,
  TableColumnStructure,
} from "../table.types";
import { getFilterPath } from "../utils";
import { OPERATORS } from "./filter.consts";
import SimpleSelectField from "./SimpleSelectField.component";
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
  OPERATORS.filter((o) => !o.typeLabelMap || o.typeLabelMap.default || (Boolean(type) && type! in o.typeLabelMap)).map(
    (o) => ({
      label: !o.typeLabelMap ? o.value : (type && o.typeLabelMap[type]) ?? o.typeLabelMap.default!,
      value: o.value,
    }),
  );

const FilterRow: React.FC<Props> = ({ value, last, onSubmit, onRemove, name, ...props }) => {
  const classes = useStyles(props);
  const { tableStructure, allTableData } = useContext(TableContext);
  const [values, setValues] = useState(value ?? EMPTY_FILTER);
  const [errors, setErrors] = useState({ path: false, operator: false });

  const columns = useMemo(
    () =>
      tableStructure
        .flatMap((c) => [c, ...(c.colGroup?.map((cg) => ({ ...cg, title: `${c.title} - ${cg.title}` })) ?? [])])
        .filter((c): c is SetRequired<TableColumnStructure<any> | ColGroup<any>, "filterColumn"> =>
          Boolean(c.filterColumn),
        )
        .map((c) => ({
          label: typeof c.title === "function" ? c.title(allTableData) : c.title,
          value: getFilterPath(c),
          type: getFilterType(c.filterColumn),
        })),
    [allTableData, tableStructure],
  );

  const handleRemove = useCallback(() => {
    onRemove(value);
  }, [onRemove, value]);

  const handleSubmit = useCallback(
    (values: ActiveFilter) => {
      if (!values.value || values.operator.includes("exists")) values.value = null;
      onSubmit(values);
    },
    [onSubmit],
  );

  const debouncedSubmit = useMemo(() => debounce(handleSubmit, 500), [handleSubmit]);

  useEffect(() => {
    const errs = {
      path: !values.path,
      operator: !values.operator,
    };
    const hasError = Object.values(errs).some((v) => v);
    if (hasError) {
      setErrors(errs);
    } else {
      debouncedSubmit(values as ActiveFilter);
    }
  }, [debouncedSubmit, values]);

  return (
    <form data-testid={name} className={classes.root}>
      <div>
        <IconButton onClick={handleRemove} disabled={last && !value.path} size="small">
          <Close />
        </IconButton>
        <div></div>
      </div>
      <div>
        <div className={classes.field}>
          <Typography variant="caption">Column</Typography>
          <SimpleSelectField
            name="path"
            options={columns}
            error={errors.path}
            placeholder="Column"
            variant="standard"
            onChange={(_e, selected) =>
              setValues((currValues) => ({
                ...currValues,
                path: selected?.value ?? null,
                type: selected?.type ?? null,
                value: "",
              }))
            }
          />
        </div>
        <div className={clsx([classes.field, classes.operatorField])}>
          <Typography variant="caption">Operator</Typography>
          <SimpleSelectField
            name="operator"
            options={getOperatorOptions(values.type)}
            error={errors.operator}
            placeholder="Operator"
            variant="standard"
            onChange={(_e, selected) => {
              setValues((currValues) => ({
                ...currValues,
                operator: selected?.value ?? null,
              }));
            }}
          />
        </div>
        {!values.operator?.includes("exists") && (
          <div className={classes.field}>
            <ValueField
              value={values}
              onChange={(value) =>
                setValues({
                  ...values,
                  value,
                })
              }
            />
          </div>
        )}
      </div>
    </form>
  );
};

export default FilterRow;
