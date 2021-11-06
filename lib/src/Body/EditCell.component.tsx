import { ClickAwayListener, Input } from "@material-ui/core";
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
import TableContext, { TableState } from "../table.context";
import { BaseData } from "../table.types";
import { getPath } from "../utils";
import BodyContext, { BodyState } from "./body.context";

interface EditCellProps {
  cancelEdit(): void;
}

const EditCell = <RowType extends BaseData, AllDataType extends RowType[]>({
  cancelEdit,
}: PropsWithChildren<EditCellProps>) => {
  const { onEdit, update } = useContext<TableState<RowType, AllDataType>>(TableContext);
  const { structure, data, rowId, index } = useContext<BodyState<RowType, AllDataType>>(BodyContext);

  const editPath = useMemo(() => getPath(structure.editable, structure), [structure]);
  const defaultValue = useMemo(() => {
    if (!structure.editable) return null;
    return get(data, editPath);
  }, [data, editPath, structure.editable]);

  const [editValue, setEditValue] = useState(defaultValue);

  const handleEdit = useCallback(() => {
    // if (onEdit) return onEdit(editPath, editValue, rowId, index);
    update.tableData((currTableData) => {
      const newData = [...currTableData];
      set(newData[index], editPath, editValue);
      console.log(newData[index]);
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

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>((e) => setEditValue(e.target.value), []);

  useEffect(() => {
    document.addEventListener("keyup", handleKeyPress);
    return () => document.removeEventListener("keyup", handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    setEditValue(defaultValue);
  }, [defaultValue]);

  return (
    <ClickAwayListener onClickAway={cancelEdit}>
      <Input defaultValue={defaultValue} onChange={handleChange} fullWidth />
    </ClickAwayListener>
  );
};

export default EditCell;
