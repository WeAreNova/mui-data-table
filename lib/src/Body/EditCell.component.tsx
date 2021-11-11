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
import { BaseData, DataTableErrorType, EditableOptions } from "../table.types";
import { createDTError, getDataType, getPath } from "../utils";
import { BOOLEAN_OPTIONS } from "../_dataTable.consts";
import BodyContext, { BodyState } from "./body.context";

interface EditCellProps {
  cancelEdit(): void;
}

const useStyles = makeStyles(
  () =>
    createStyles({
      fieldContainer: {
        "& *:not(svg)": {
          fontSize: "inherit",
        },
      },
    }),
  { name: "DataTable-EditCell" },
);

const EditCell = <RowType extends BaseData, AllDataType extends RowType[]>({
  cancelEdit,
  ...props
}: PropsWithChildren<EditCellProps>) => {
  const classes = useStyles(props);
  const { onEdit, update, allTableData } = useContext<TableState<RowType, AllDataType>>(TableContext);
  const { structure, data, rowId } = useContext<BodyState<RowType, AllDataType>>(BodyContext);
  const [error, setError] = useState<string | null>(null);
  const editType = useMemo(() => getDataType(structure.editable, structure), [structure]);
  const editPath = useMemo(() => getPath(structure.editable, structure), [structure]);

  const defaultValue = useMemo(() => {
    if (!structure.editable) return null;
    const v = get(data, editPath);
    if (!v || editType !== "date") return v;
    const asDate = new Date(v as string | number | Date);
    const month = asDate.getMonth() + 1;
    const day = asDate.getDate();
    return `${asDate.getFullYear()}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  }, [data, editPath, editType, structure.editable]);
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

  const validate = useCallback(
    async (value) => {
      try {
        if (typeof structure.editable === "object" && structure.editable.validate) {
          await structure.editable.validate(value, { data, allData: allTableData });
          return true;
        }
        if (editType === "number" && isNaN(Number(value))) throw createDTError("Invalid number");
        if (editType === "boolean" && typeof value !== "boolean") throw createDTError("Invalid boolean value");
        if (editType === "date" && isNaN(new Date(value as string | number | Date).getTime())) {
          throw createDTError("Invalid date");
        }
        if (
          editType === "select" &&
          !(structure.editable as EditableOptions<RowType, AllDataType>).selectOptions!.some((o) => o.value === value)
        ) {
          throw createDTError("Invalid select option");
        }
        setError(null);
        return true;
      } catch (error: any) {
        const errorMessage = error?.dataTableMessage || error?.message;
        if (errorMessage) setError(errorMessage || "Invalid value");
        return false;
      }
    },
    [allTableData, data, editType, structure.editable],
  );

  const handleCancelEdit = useCallback(() => cancelEdit(), [cancelEdit]);
  const handleEdit = useCallback(async () => {
    try {
      const valid = await validate(editValue);
      if (!valid) return;
      if (onEdit) {
        await onEdit(editPath, editValue, data);
      } else {
        update.tableData((currTableData) => {
          const index = currTableData.findIndex((row) => row.id === rowId);
          if (index === -1) return currTableData;
          const newData = [...currTableData];
          const updatedValue = set({ ...newData[index] }, editPath, editValue);
          newData[index] = { ...updatedValue };
          return newData;
        });
      }
      cancelEdit();
    } catch (error: any) {
      if ((error as DataTableErrorType).isDataTableError) {
        setError(error?.dataTableMessage || "Invalid value");
      }
    }
  }, [cancelEdit, data, editPath, editValue, onEdit, rowId, update, validate]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent | React.KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          return handleCancelEdit();
        case "Tab":
        case "Enter":
          return handleEdit();
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

  const handleOtherChange = useCallback<ChangeEventHandler<HTMLInputElement>>((e) => {
    setEditValue(e.target.value);
  }, []);
  const handleSelectChange = useCallback((selected: SelectFieldOption | null) => {
    if (!selected) return setEditValue(null);
    setEditValue(selected.value === "true");
  }, []);

  const field = useMemo(() => {
    if (typeof structure.editable === "object" && structure.editable.component) {
      return structure.editable.component({
        defaultValue: commonProps.defaultValue,
        error: commonProps.error,
        helperText: commonProps.helperText,
        onChange: setEditValue,
      });
    }
    if (["boolean", "select"].includes(editType)) {
      return (
        <SimpleSelectField
          {...commonProps}
          onChange={handleSelectChange}
          options={
            editType === "boolean"
              ? BOOLEAN_OPTIONS
              : (structure.editable as EditableOptions<RowType, AllDataType>).selectOptions!
          }
        />
      );
    }
    return <TextField {...commonProps} onChange={handleOtherChange} type={editType} />;
  }, [commonProps, editType, handleOtherChange, handleSelectChange, structure.editable]);

  return (
    <ClickAwayListener onClickAway={handleCancelEdit} mouseEvent="onMouseUp">
      <div className={classes.fieldContainer}>{field}</div>
    </ClickAwayListener>
  );
};

export default EditCell;
