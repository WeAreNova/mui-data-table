import { alpha, styled, TableRow, useTheme } from "@mui/material";
import PropTypes from "prop-types";
import React, { MouseEventHandler, PropsWithChildren, useCallback, useContext, useMemo } from "react";
import TableContext, { TableState } from "../table.context";
import { BaseData } from "../table.types";
import { dontForwardProps, getRowId } from "../utils";
import { RowDataPropType } from "../_propTypes";
import { BodyContextProvider, BodyState } from "./body.context";
import BodyCell from "./BodyCell.component";

interface BodyRowProps<RowType extends BaseData> {
  index: number;
  data: RowType;
}

const StyledTableRow = styled(TableRow, {
  label: "DataTable-BodyRow",
  shouldForwardProp: dontForwardProps(["altColour", "disabled", "selected"]),
})<{ altColour: boolean; disabled: boolean; selected: boolean }>(({ altColour, disabled, selected, theme }) => [
  altColour && { bgcolor: alpha(theme.palette.error.dark, 0.9) },
  disabled && { bgcolor: "action.disabledBackground", opacity: theme.palette.action.disabledOpacity },
  selected && { bgcolor: "action.selected" },
]);

/**
 * The BodyRow component is a single row in the table body and is responsible for managing the state
 * and callbacks for a row.
 *
 * @component
 * @package
 */
const BodyRow = <RowType extends BaseData, AllDataType extends RowType[]>({
  index,
  data,
}: PropsWithChildren<BodyRowProps<RowType>>) => {
  const theme = useTheme();
  const { structure, rowClick, rowOptions, rowsSelectable, selectedRows } =
    useContext<TableState<RowType, AllDataType>>(TableContext);
  const rowId = useMemo(() => getRowId(data, index), [data, index]);
  const isAlternateRowColour = useMemo(() => rowOptions?.alternateRowColour?.(data) ?? false, [data, rowOptions]);
  const isDisabledRow = useMemo(() => rowOptions?.rowDisabled?.(data) ?? false, [data, rowOptions]);

  const onHover = useCallback<MouseEventHandler<HTMLTableRowElement>>(
    (e) => {
      if (!rowClick || !e.currentTarget.parentNode) return;
      const hoverRowIndex = Array.from(e.currentTarget.parentNode.children).indexOf(e.currentTarget);
      for (let row = e.currentTarget.previousSibling as Element; row; row = row.previousSibling as Element) {
        if (!row.parentNode) continue;
        const rowIndex = Array.from(row.parentNode.children).indexOf(row);
        const rowsBetween = hoverRowIndex - rowIndex;
        row.querySelectorAll<HTMLTableCellElement>("td[rowspan]").forEach((cell) => {
          const rowSpan = Number(cell.getAttribute("rowspan"));
          if (rowSpan > rowsBetween) {
            cell.style.cursor = "pointer";
            cell.style.backgroundColor = theme.palette.action.hover;
          }
        });
      }
    },
    [rowClick, theme.palette.action.hover],
  );

  const onUnHover = useCallback<React.MouseEventHandler<HTMLTableRowElement>>(
    (e) => {
      if (!rowClick) return;
      for (let row = e.currentTarget.previousSibling as Element; row; row = row.previousSibling as Element) {
        row.querySelectorAll<HTMLTableCellElement>("td[rowspan]").forEach((cell) => {
          cell.style.cursor = "";
          cell.style.backgroundColor = "";
        });
      }
    },
    [rowClick],
  );

  const bodyContextValue = useMemo<Omit<BodyState<RowType, AllDataType>, "structure">>(
    () => ({ data, index, rowId }),
    [data, index, rowId],
  );

  return (
    <StyledTableRow
      key={rowId}
      data-testid="tableRow"
      onMouseOver={onHover}
      onMouseOut={onUnHover}
      altColour={isAlternateRowColour}
      disabled={isDisabledRow}
      selected={Boolean(rowsSelectable && selectedRows[rowId])}
      sx={
        rowClick && {
          cursor: "pointer",
          "&:hover": {
            bgcolor: "action.hover",
          },
        }
      }
    >
      {structure.flattened.notHidden.map((struct) => (
        <BodyContextProvider
          key={struct.key}
          value={{
            ...bodyContextValue,
            structure: struct,
          }}
        >
          <BodyCell />
        </BodyContextProvider>
      ))}
    </StyledTableRow>
  );
};
BodyRow.propTypes = {
  index: PropTypes.number.isRequired,
  data: RowDataPropType.isRequired,
};

export default BodyRow;
