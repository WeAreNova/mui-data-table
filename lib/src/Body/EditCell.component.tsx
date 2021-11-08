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
import { BaseData, EditableOptions } from "../table.types";
import { getDataType, getPath } from "../utils";
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
  const { structure, data, rowId, index } = useContext<BodyState<RowType, AllDataType>>(BodyContext);
  const [selectOpen, setSelectOpen] = useState(false);
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
          return await structure.editable.validate(value, { data, allData: allTableData });
        }
        if (editType === "number" && isNaN(Number(value))) {
          throw new Error("Value must be a number");
        }
        if (editType === "date" && isNaN(new Date(value as string | number | Date).getTime())) {
          throw new Error("Invalid date");
        }
        setError(null);
        return true;
      } catch (error: any) {
        const errorMessage = typeof error === "string" ? error : error?.message;
        if (errorMessage) setError(errorMessage);
        return false;
      }
    },
    [allTableData, data, editType, structure.editable],
  );

  const handleCancelEdit = useCallback(() => {
    if (selectOpen) return;
    cancelEdit();
  }, [cancelEdit, selectOpen]);

  const handleEdit = useCallback(async () => {
    const valid = await validate(editValue);
    if (!valid) return;

    if (onEdit) {
      onEdit(editPath, editValue, rowId, index);
    } else {
      update.tableData((currTableData) => {
        const newData = [...currTableData];
        const updatedValue = set({ ...newData[index] }, editPath, editValue);
        newData[index] = { ...updatedValue };
        return newData;
      });
    }
    cancelEdit();
  }, [cancelEdit, editPath, editValue, index, onEdit, rowId, update, validate]);

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
    document.addEventListener("keyup", handleKeyPress);
    return () => document.removeEventListener("keyup", handleKeyPress);
  }, [handleKeyPress]);

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
    switch (editType) {
      case "boolean":
        return <SimpleSelectField {...commonProps} onChange={handleSelectChange} options={BOOLEAN_OPTIONS} />;
      case "select":
        return (
          <SimpleSelectField
            {...commonProps}
            onChange={handleSelectChange}
            options={(structure.editable as EditableOptions<RowType, AllDataType>).selectOptions!}
            onOpen={() => setSelectOpen(true)}
            onClose={() => setSelectOpen(false)}
          />
        );
      default:
        return <TextField {...commonProps} onChange={handleOtherChange} type={editType} />;
    }
  }, [commonProps, editType, handleOtherChange, handleSelectChange, structure.editable]);

  return (
    <ClickAwayListener onClickAway={handleCancelEdit}>
      <div className={classes.fieldContainer}>{field}</div>
    </ClickAwayListener>
  );
};

export default EditCell;
