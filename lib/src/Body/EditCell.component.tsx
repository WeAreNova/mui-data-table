import { ClickAwayListener, createStyles, makeStyles, TextField } from "@material-ui/core";
import { get, set } from "dot-prop";
import React, {
  ChangeEventHandler,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import SimpleSelectField, { SelectFieldOption } from "../Filter/SimpleSelectField.component";
import TableContext, { TableState } from "../table.context";
import {
  BaseData,
  ColGroupDefinition,
  ColumnDefinition,
  DataTableErrorType,
  EditDataTypes,
  PathType,
} from "../table.types";
import { createDTError, getDataType, getPath, getRowId } from "../utils";
import { BOOLEAN_OPTIONS } from "../_dataTable.consts";
import BodyContext, { BodyState } from "./body.context";

interface EditCellProps {
  cancelEdit(): void;
}

const useStyles = makeStyles(
  () =>
    createStyles({
      fieldContainer: {
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
  { name: "DataTable-EditCell" },
);

function getDefaultValue<RowType extends BaseData, AllDataType extends RowType[]>({
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
  const { onEdit, update, allTableData } = useContext<TableState<RowType, AllDataType>>(TableContext);
  const { structure, data, rowId } = useContext<BodyState<RowType, AllDataType>>(BodyContext);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const editType = useMemo(() => getDataType(structure.editable, structure), [structure]);
  const editPath = useMemo(() => getPath(structure.editable, structure), [structure]);
  const editOptions = useMemo(
    () => (typeof structure.editable === "object" ? structure.editable : null),
    [structure.editable],
  );
  const defaultValue = useMemo(() => {
    const v = getDefaultValue({ structure, data, path: editPath, type: editType });
    if (typeof v === "string" || typeof v === "number") return v;
    return editOptions?.defaultValue ?? "";
  }, [data, editOptions?.defaultValue, editPath, editType, structure]);

  const [editValue, setEditValue] = useState(defaultValue);

  const commonProps = useMemo(
    () =>
      ({
        defaultValue,
        error: Boolean(error),
        helperText: error,
        fullWidth: true,
        variant: "standard",
        margin: "none",
      } as const),
    [defaultValue, error],
  );
  const selectOptions = useMemo(() => {
    if (editType === "boolean") return BOOLEAN_OPTIONS;
    if (editType !== "select") return [];
    if (typeof editOptions!.selectOptions === "function") return editOptions!.selectOptions(data, allTableData);
    return editOptions!.selectOptions || [];
  }, [allTableData, data, editOptions, editType]);

  const validate = useCallback(
    async (value) => {
      try {
        if (editOptions?.validate) {
          await editOptions.validate(value, { data, allData: allTableData });
          return true;
        }
        if (editType === "number" && isNaN(Number(value))) throw createDTError("Invalid number");
        if (editType === "boolean" && typeof value !== "boolean") throw createDTError("Invalid boolean value");
        if (editType === "date" && isNaN(new Date(value as string | number | Date).getTime())) {
          throw createDTError("Invalid date");
        }
        if (editType === "select" && !selectOptions?.some((o) => o.value === value)) {
          throw createDTError("Invalid select option");
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
          const index = currTableData.findIndex((row, index) => getRowId(row, index) === rowId);
          if (index === -1) return currTableData;
          const newData = [...currTableData];
          const updatedValue = set({ ...newData[index] }, editPath, newValue ?? editValue);
          newData[index] = { ...updatedValue };
          return newData;
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
      switch (e.key) {
        case "Escape":
          return handleCancelEdit();
        case "Tab":
        case "Enter":
          setIsSaving(true);
          await handleEdit();
          setIsSaving(false);
          return;
        default:
          return;
      }
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
    setEditValue(defaultValue);
  }, [defaultValue]);

  useEffect(
    () => () => {
      setIsSaving(false);
    },
    [],
  );

  const handleOtherChange = useCallback<ChangeEventHandler<HTMLInputElement>>((e) => {
    setEditValue(e.target.value);
  }, []);
  const handleSelectChange = useCallback(
    (selected: SelectFieldOption | null) => {
      if (!selected) return setEditValue(null);
      if (editType === "boolean") {
        return setEditValue(selected.value === "true");
      }
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
        <SimpleSelectField
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
      <div className={classes.fieldContainer}>{field}</div>
    </ClickAwayListener>
  );
};

export default EditCell;
