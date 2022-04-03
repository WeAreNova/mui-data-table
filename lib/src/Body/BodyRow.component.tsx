import { alpha, darken, lighten, styled, TableRow, useTheme } from "@mui/material";
import useTableContext from "hooks/useTableContext.hook";
import PropTypes from "prop-types";
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef } from "react";
import { BaseData } from "table.types";
import { dontForwardProps, getRowId } from "utils";
import { RowDataPropType } from "_propTypes";
import { BodyContextProvider, BodyState } from "./body.context";
import BodyCell from "./BodyCell.component";

interface BodyRowProps<RowType extends BaseData> {
  index: number;
  data: RowType;
}

const DTBodyRow = styled(TableRow, {
  name: "DTBodyRow",
  slot: "Root",
  shouldForwardProp: dontForwardProps("altColour", "disabled", "selected"),
})<{ altColour: boolean; disabled: boolean; selected: boolean }>(({ altColour, disabled, selected, theme }) => [
  altColour && { bgcolor: alpha(theme.palette.error.dark, 0.9) },
  disabled && { bgcolor: theme.palette.action.disabledBackground, opacity: theme.palette.action.disabledOpacity },
  selected && { bgcolor: theme.palette.action.selected },
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
  const rowRef = useRef<HTMLTableRowElement>(null);
  const { structure, rowClick, rowOptions, rowsSelectable, selectedRows } = useTableContext<RowType, AllDataType>();

  const rowId = useMemo(() => getRowId(data, index), [data, index]);
  const bodyContextValue = useMemo(
    () => ({ data, index, rowId } as Omit<BodyState<RowType, AllDataType>, "structure">),
    [data, index, rowId],
  );

  const isAlternateRowColour = useMemo(() => rowOptions?.alternateRowColour?.(data) ?? false, [data, rowOptions]);
  const isDisabledRow = useMemo(() => rowOptions?.rowDisabled?.(data) ?? false, [data, rowOptions]);
  const hoverBgColor = useMemo(
    () =>
      (theme.palette.mode === "dark" ? lighten : darken)(
        theme.palette.background.default,
        theme.palette.action.hoverOpacity,
      ),
    [theme.palette.action.hoverOpacity, theme.palette.background.default, theme.palette.mode],
  );

  const handleHover = useCallback(
    function (this: HTMLTableRowElement) {
      if (!this.parentElement || !this.previousElementSibling) return;
      const tableRows = Array.from(this.parentElement.children);
      const hoverRowIndex = tableRows.indexOf(this);
      this.parentElement
        .querySelectorAll<HTMLTableCellElement>(`tr:nth-of-type(-n+${hoverRowIndex}) > td[rowspan]`)
        .forEach((td) => {
          const tdRowIndex = tableRows.indexOf(td.parentElement!);
          const rowspan = Number(td.getAttribute("rowspan") || 1);
          if (hoverRowIndex < tdRowIndex + rowspan) {
            td.style.backgroundColor = hoverBgColor;
            td.classList.add("DTBodyRow-hovered");
          }
        });
    },
    [hoverBgColor],
  );

  const handleUnHover = useCallback(function (this: HTMLTableRowElement) {
    if (!this.parentElement || !this.previousElementSibling) return;
    this.parentElement.querySelectorAll<HTMLTableCellElement>("td[rowspan].DTBodyRow-hovered").forEach((td) => {
      td.style.removeProperty("background-color");
      td.classList.remove("DTBodyRow-hovered");
    });
  }, []);

  useEffect(() => {
    if (!rowClick || !rowRef.current) return;
    const row = rowRef.current;
    row.addEventListener("mouseenter", handleHover);
    row.addEventListener("mouseleave", handleUnHover);
    return () => {
      row.removeEventListener("mouseenter", handleHover);
      row.removeEventListener("mouseleave", handleUnHover);
    };
  }, [handleHover, handleUnHover, rowClick]);

  return (
    <DTBodyRow
      key={rowId}
      data-testid="tableRow"
      onMouseOver={handleHover}
      onMouseOut={handleUnHover}
      altColour={isAlternateRowColour}
      disabled={isDisabledRow}
      selected={Boolean(rowsSelectable && selectedRows[rowId])}
      sx={rowClick && { cursor: "pointer", "&:hover > td": { backgroundColor: hoverBgColor } }}
    >
      {structure.flattened.notHidden.map((struct) => (
        <BodyContextProvider key={struct.key} value={{ ...bodyContextValue, structure: struct }}>
          <BodyCell />
        </BodyContextProvider>
      ))}
    </DTBodyRow>
  );
};
BodyRow.propTypes = {
  index: PropTypes.number.isRequired,
  data: RowDataPropType.isRequired,
};

export default BodyRow;
