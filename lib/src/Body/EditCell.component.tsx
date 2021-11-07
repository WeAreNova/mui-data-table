import { ClickAwayListener, createStyles, Input, makeStyles } from "@material-ui/core";
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
  const { onEdit, update } = useContext<TableState<RowType, AllDataType>>(TableContext);
  const { structure, data, rowId, index } = useContext<BodyState<RowType, AllDataType>>(BodyContext);

  const editPath = useMemo(() => getPath(structure.editable, structure), [structure]);
  const defaultValue = useMemo(() => {
    if (!structure.editable) return null;
    return get(data, editPath);
  }, [data, editPath, structure.editable]);
  const [editValue, setEditValue] = useState(defaultValue);

  const editType = useMemo(() => getDataType(structure.editable, structure), [structure]);
  const commonProps = useMemo(
    () => ({ defaultValue, fullWidth: true, variant: "standard", margin: "none" } as const),
    [defaultValue],
  );

  const handleEdit = useCallback(() => {
    // if (onEdit) return onEdit(editPath, editValue, rowId, index);
    if (onEdit) return onEdit(editPath, editValue, rowId, index);
    update.tableData((currTableData) => {
      const newData = [...currTableData];
      const updatedValue = set({ ...newData[index] }, editPath, editValue);
      newData[index] = { ...updatedValue };
      return newData;
    });
  }, [editPath, editValue, index, onEdit, rowId, update]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent | React.KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          return cancelEdit();
        case "Tab":
        case "Enter":
          handleEdit();
          cancelEdit();
          return;
        default:
          return;
      }
    },
    [cancelEdit, handleEdit],
  );

  useEffect(() => {
    document.addEventListener("keyup", handleKeyPress);
    return () => document.removeEventListener("keyup", handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    setEditValue(defaultValue);
  }, [defaultValue]);

  const handleSelectChange = useCallback((selected: SelectFieldOption | null) => {
    if (!selected) return setEditValue(null);
    setEditValue(selected.value === "true");
  }, []);

  const handleOtherChange = useCallback<ChangeEventHandler<HTMLInputElement>>((e) => setEditValue(e.target.value), []);


  const field = useMemo(() => {
    if (typeof structure.editable === "object" && structure.editable.component) {
      return structure.editable.component({ ...commonProps, onChange: handleOtherChange });
    }
    switch (editType) {
      case "boolean":
        return <SimpleSelectField {...commonProps} onChange={handleSelectChange} options={BOOLEAN_OPTIONS} />;
      case "select":
        return (
          <SimpleSelectField
            {...commonProps}
            onChange={handleSelectChange}
            options={(structure.editable as EditableOptions<RowType>).options!}
          />
        );
      default:
        return <Input {...commonProps} onChange={handleOtherChange} type={editType} />;
    }
  }, [commonProps, editType, handleOtherChange, handleSelectChange, structure.editable]);

  return (
    <ClickAwayListener onClickAway={cancelEdit}>
      <div className={classes.fieldContainer}>{field}</div>
    </ClickAwayListener>
  );
};

export default EditCell;
