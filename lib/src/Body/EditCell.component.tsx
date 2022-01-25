import { ClickAwayListener, createStyles, makeStyles, TextField } from "@material-ui/core";
import { get, set } from "dot-prop";
import SimpleSelect, { SelectOptionObject } from "Fields/SimpleSelect.component";
import useBodyContext from "hooks/useBodyContext.hook";
import useTableContext from "hooks/useTableContext.hook";
import React, { ChangeEventHandler, PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import {
  BaseData,
  ColGroupDefinition,
  ColumnDefinition,
  DataTableErrorType,
  EditDataTypes,
  PathType,
  SelectOption,
} from "table.types";
import { createDTError, getDataType, getPath, getRowId } from "utils";
import { BOOLEAN_OPTIONS } from "_dataTable.consts";

interface EditCellProps {
  cancelEdit(): void;
}

const useStyles = makeStyles(
  () =>
    createStyles({
      root: {
        display: "flex",
        flexDirection: "column",
        "& > *": {
          width: "100%",
        },
        "& *:not(svg)": {
          fontSize: "inherit",
        },
      },
    }),
  { name: "DTEditCell" },
);

const DEFAULT_VALIDATORS: Record<NonNullable<EditDataTypes>, (value: any, options: SelectOption[]) => void> = {
  string: (value) => {
    if (typeof value !== "string") throw createDTError("Value should be a string");
  },
  number: (value) => {
    if (isNaN(value)) throw createDTError("Value should be a valid number");
  },
  boolean: (value) => {
    if (typeof value !== "boolean") throw createDTError("Value should be a boolean");
  },
  date: (value) => {
    if (isNaN(new Date(value).getTime())) throw createDTError("Value should be a valid date");
  },
  select: (value, options) => {
    if (options.every((o) => (typeof o === "string" ? o !== value : o.value !== value))) {
      throw createDTError("Value should be one of the available options");
    }
  },
};

function getInitialValue<RowType extends BaseData, AllDataType extends RowType[]>({
  structure,
  data,
  path,
  type,
}: {
  structure: ColumnDefinition<RowType, AllDataType> | ColGroupDefinition<RowType, AllDataType>;
  data: RowType;
  path: PathType<RowType>;
  type: EditDataTypes;
}) {
  if (!structure.editable) return null;
  const v = get(data, path);
  if (!v || type !== "date") return v;
  const asDate = new Date(v as string | number | Date);
  const month = asDate.getMonth() + 1;
  const day = asDate.getDate();
  return `${asDate.getFullYear()}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

const EditCell = <RowType extends BaseData, AllDataType extends RowType[]>({
  cancelEdit,
  ...props
}: PropsWithChildren<EditCellProps>) => {
  const classes = useStyles(props);
  const { onEdit, update, allTableData } = useTableContext<RowType, AllDataType>();
  const { structure, data, rowId } = useBodyContext<RowType, AllDataType>();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const editType = useMemo(() => getDataType(structure.editable, structure), [structure]);
  const editPath = useMemo(() => getPath(structure.editable, structure), [structure]);
  const editOptions = useMemo(
    () => (typeof structure.editable === "object" ? structure.editable : null),
    [structure.editable],
  );
  const initialValue = useMemo(() => {
    const v = getInitialValue({ structure, data, path: editPath, type: editType });
    return v ?? editOptions?.defaultValue ?? "";
  }, [data, editOptions?.defaultValue, editPath, editType, structure]);

  const [editValue, setEditValue] = useState(initialValue);

  const commonProps = useMemo(
    () =>
      ({
        defaultValue: initialValue,
        error: Boolean(error),
        helperText: error,
        variant: "standard",
        margin: "none",
        fullWidth: true,
        autoFocus: true,
      } as const),
    [initialValue, error],
  );
  const selectOptions = useMemo(() => {
    if (editType === "boolean") return BOOLEAN_OPTIONS;
    if (editType !== "select") return [];
    if (!editOptions?.selectOptions) return [];
    if (typeof editOptions.selectOptions === "function") {
      return editOptions.selectOptions(data, allTableData);
    }
    return editOptions.selectOptions;
  }, [allTableData, data, editOptions, editType]);

  const validate = useCallback(
    async (value) => {
      try {
        if (editOptions?.validate) {
          await editOptions.validate(value, { data, allData: allTableData });
        } else {
          DEFAULT_VALIDATORS[editType](value, selectOptions);
        }
        setError(null);
        return true;
      } catch (err: any) {
        const errorMessage = err?.dataTableMessage || err?.message;
        if (errorMessage) setError(errorMessage || "Invalid value");
        return false;
      }
    },
    [allTableData, data, editOptions, editType, selectOptions],
  );

  const handleCancelEdit = useCallback(() => cancelEdit(), [cancelEdit]);
  const handleEdit = useCallback(async () => {
    try {
      const valid = await validate(editValue);
      if (!valid) return;
      let newValue: typeof editValue | undefined = undefined;
      if (onEdit) {
        const res = await onEdit({ path: editPath, value: editValue }, data);
        if (typeof res !== "undefined") newValue = res;
      }
      if (!onEdit || typeof newValue !== "undefined") {
        update.tableData((currTableData) => {
          const index = currTableData.findIndex((row, idx) => getRowId(row, idx) === rowId);
          if (index === -1) return currTableData;
          const newData = [...currTableData];
          const updatedValue = set({ ...newData[index] }, editPath, newValue ?? editValue);
          newData[index] = { ...updatedValue };
          return newData as AllDataType;
        });
      }
      cancelEdit();
    } catch (err: any) {
      if ((err as DataTableErrorType).isDataTableError) {
        setError(err?.dataTableMessage || "Invalid value");
      }
    }
  }, [cancelEdit, data, editPath, editValue, onEdit, rowId, update, validate]);

  const handleKeyPress = useCallback(
    async (e: KeyboardEvent | React.KeyboardEvent) => {
      if (e.key === "Escape") return handleCancelEdit();
      if (e.key !== "Enter" && e.key !== "Tab") return;
      setIsSaving(true);
      await handleEdit();
      setIsSaving(false);
    },
    [handleCancelEdit, handleEdit],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    document.addEventListener("cancelEdit", handleCancelEdit);
    return () => document.removeEventListener("cancelEdit", handleCancelEdit);
  }, [handleCancelEdit]);

  useEffect(() => {
    setEditValue(initialValue);
  }, [initialValue]);

  useEffect(() => () => setIsSaving(false), []);

  const handleOtherChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      let parsed: string | number = e.target.value;
      if (editType === "number") parsed = Number(parsed);
      setEditValue(parsed);
    },
    [editType],
  );
  const handleSelectChange = useCallback(
    (selected: SelectOptionObject | null) => {
      if (!selected) return setEditValue(null);
      if (editType === "boolean") return setEditValue(selected.value === "true");
      setEditValue(selected.value);
    },
    [editType],
  );

  const field = useMemo(() => {
    if (editOptions?.component) {
      return editOptions.component(
        {
          defaultValue: commonProps.defaultValue,
          error: commonProps.error,
          helperText: commonProps.helperText,
          onChange: setEditValue,
          disabled: isSaving,
        },
        data,
        allTableData,
      );
    }
    if (["boolean", "select"].includes(editType)) {
      return (
        <SimpleSelect
          {...commonProps}
          onChange={handleSelectChange}
          options={editType === "boolean" ? BOOLEAN_OPTIONS : selectOptions}
          disabled={isSaving}
          disablePortal
        />
      );
    }
    return <TextField {...commonProps} onChange={handleOtherChange} type={editType} disabled={isSaving} />;
  }, [
    allTableData,
    commonProps,
    data,
    editOptions,
    editType,
    handleOtherChange,
    handleSelectChange,
    isSaving,
    selectOptions,
  ]);

  return (
    <ClickAwayListener onClickAway={handleCancelEdit}>
      <div className={classes.root}>{field}</div>
    </ClickAwayListener>
  );
};

export default EditCell;
