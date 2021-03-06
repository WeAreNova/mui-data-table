import Close from "@mui/icons-material/Close";
import { IconButton, styled, Typography } from "@mui/material";
import SimpleSelect, { SimpleSelectChangeHandler } from "Fields/SimpleSelect.component";
import useTableContext from "hooks/useTableContext.hook";
import PropTypes from "prop-types";
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import type { ActiveFilter, BaseData, FilterValue, NullableActiveFilter, NullableDataTypes } from "table.types";
import { debounce } from "utils";
import { FilterValuePropTypes, OPERATORS } from "_dataTable.consts";
import ValueField from "./ValueField.component";

interface Props {
  value: ActiveFilter | NullableActiveFilter;
  last: boolean;
  onSubmit(value: ActiveFilter): any;
  onRemove(value: ActiveFilter | NullableActiveFilter): any;
  name: string;
}

const DTFilterRow = styled("form", {
  name: "DTFilterRow",
  slot: "Root",
})({
  display: "flex",
  "& > div": {
    display: "flex",
    alignItems: "flex-end",
    "&:first-of-type": {
      flex: 1,
    },
    "&:last-child": {
      flex: 4,
    },
  },
});

const DTFieldContainer = styled("div", { name: "DTFilterRow", slot: "FieldContainer" })(({ theme }) => ({
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
}));

export const EMPTY_FILTER = {
  path: null,
  operator: "=",
  value: "",
  type: null,
} as const;

const getOperatorOptions = (type: Exclude<NullableDataTypes, undefined | null> | null) =>
  OPERATORS.filter((o) => !o.typeLabelMap || o.typeLabelMap.default || (Boolean(type) && type! in o.typeLabelMap)).map(
    (o) => ({
      label: !o.typeLabelMap ? o.value : (type && o.typeLabelMap[type]) ?? o.typeLabelMap.default!,
      value: o.value,
    }),
  );

/**
 * The FilterRow is a row in the Filter component which manages the state of a single filter.
 *
 * @component
 * @package
 */
const FilterRow = <RowType extends BaseData, AllDataType extends RowType[]>({
  value,
  last,
  onSubmit,
  onRemove,
  name,
}: PropsWithChildren<Props>) => {
  const { filterOptions } = useTableContext<RowType, AllDataType>();
  const [filter, setFilter] = useState({ ...EMPTY_FILTER, ...value });
  const [errors, setErrors] = useState({ path: false, operator: false, value: false });

  const operatorOptions = useMemo(() => getOperatorOptions(filter.type), [filter.type]);

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
      path: !filter.path,
      operator: !filter.operator,
      value:
        !filter.operator?.includes("exists") &&
        typeof filter.value !== "boolean" &&
        typeof filter.value !== "number" &&
        !filter.value,
    };
    const hasError = Object.values(errs).some((v) => v);
    setErrors(errs);
    if (!hasError) {
      debouncedSubmit(filter as ActiveFilter);
    }
  }, [debouncedSubmit, filter]);

  const handleColumnChange = useCallback<SimpleSelectChangeHandler<typeof filterOptions[number]>>((selected) => {
    setFilter((currValues) => ({
      ...currValues,
      path: selected?.value ?? null,
      type: selected?.type ?? null,
      operator: selected?.defaultOperator ?? null,
      value: "",
    }));
  }, []);

  const handleOperatorChange = useCallback<SimpleSelectChangeHandler<typeof operatorOptions[number]>>((selected) => {
    setFilter((currValues) => ({
      ...currValues,
      operator: selected?.value ?? null,
    }));
  }, []);

  const handleValueChange = useCallback((newValue: FilterValue) => {
    setFilter((currValues) => ({
      ...currValues,
      value: newValue,
    }));
  }, []);

  return (
    <DTFilterRow data-testid={name}>
      <div>
        <IconButton onClick={handleRemove} disabled={last && !value.path} size="small">
          <Close />
        </IconButton>
        <div></div>
      </div>
      <div>
        <DTFieldContainer>
          <Typography variant="caption">Column</Typography>
          <SimpleSelect
            name="path"
            onChange={handleColumnChange}
            value={filter.path}
            options={filterOptions}
            error={errors.path}
            placeholder="Column"
            variant="standard"
          />
        </DTFieldContainer>
        <DTFieldContainer sx={{ flex: 0.5 }}>
          <Typography variant="caption">Operator</Typography>
          <SimpleSelect
            name="operator"
            onChange={handleOperatorChange}
            value={filter.operator}
            options={operatorOptions}
            error={errors.operator}
            placeholder="Operator"
            variant="standard"
          />
        </DTFieldContainer>
        {!filter.operator?.includes("exists") && (
          <DTFieldContainer>
            <ValueField value={filter} onChange={handleValueChange} />
          </DTFieldContainer>
        )}
      </div>
    </DTFilterRow>
  );
};
FilterRow.propTypes = {
  value: FilterValuePropTypes.isRequired,
  last: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
};

export default FilterRow;
