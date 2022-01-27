import { alpha, createStyles, darken, lighten, makeStyles, TableRow } from "@material-ui/core";
import clsx from "clsx";
import useTableContext from "hooks/useTableContext.hook";
import PropTypes from "prop-types";
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef } from "react";
import { BaseData } from "table.types";
import { getRowId } from "utils";
import { RowDataPropType } from "_propTypes";
import { BodyContextProvider, BodyState } from "./body.context";
import BodyCell from "./BodyCell.component";

interface BodyRowProps<RowType extends BaseData> {
  index: number;
  data: RowType;
}

const useStyles = makeStyles(
  (theme) => {
    const hoverBgColor = (theme.palette.type === "dark" ? lighten : darken)(
      theme.palette.background.default,
      theme.palette.action.hoverOpacity,
    );
    return createStyles({
      altColor: {
        backgroundColor: alpha(theme.palette.error.dark, 0.9),
      },
      clickable: {
        cursor: "pointer",
        "&:hover > td": {
          backgroundColor: hoverBgColor,
        },
      },
      disabled: {
        backgroundColor: theme.palette.action.disabledBackground,
        opacity: theme.palette.action.disabledOpacity,
      },
      hovered: {
        backgroundColor: hoverBgColor,
      },
      selected: {
        backgroundColor: theme.palette.action.selected,
      },
    });
  },
  { name: "DTBodyRow" },
);

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
  ...props
}: PropsWithChildren<BodyRowProps<RowType>>) => {
  const classes = useStyles(props);
  const rowRef = useRef<HTMLTableRowElement>(null);
  const { structure, rowClick, rowOptions, rowsSelectable, selectedRows } = useTableContext<RowType, AllDataType>();

  const rowId = useMemo(() => getRowId(data, index), [data, index]);
  const bodyContextValue = useMemo(
    () => ({ data, index, rowId } as Omit<BodyState<RowType, AllDataType>, "structure">),
    [data, index, rowId],
  );

  const isAlternateRowColour = useMemo(() => rowOptions?.alternateRowColour?.(data) ?? false, [data, rowOptions]);
  const isDisabledRow = useMemo(() => rowOptions?.rowDisabled?.(data) ?? false, [data, rowOptions]);

  const tableRowClasses = useMemo(
    () =>
      clsx({
        [classes.altColor]: isAlternateRowColour,
        [classes.disabled]: isDisabledRow,
        [classes.selected]: rowsSelectable && Boolean(selectedRows[rowId]),
        [classes.clickable]: Boolean(rowClick),
      }),
    [
      classes.altColor,
      classes.disabled,
      classes.clickable,
      classes.selected,
      isAlternateRowColour,
      isDisabledRow,
      rowClick,
      rowId,
      rowsSelectable,
      selectedRows,
    ],
  );

  const handleHover = useCallback(
    function (this: HTMLTableRowElement) {
      if (!this.parentElement || !this.previousElementSibling) return;
      const tableRows = Array.from(this.parentElement.children);
      const hoverRowIndex = tableRows.indexOf(this);
      this.parentElement.querySelectorAll(`tr:nth-of-type(-n+${hoverRowIndex}) > td[rowspan]`).forEach((td) => {
        const tdRowIndex = tableRows.indexOf(td.parentElement!);
        const rowspan = Number(td.getAttribute("rowspan") || 1);
        if (hoverRowIndex < tdRowIndex + rowspan) td.classList.add(classes.hovered);
      });
    },
    [classes.hovered],
  );

  const handleUnHover = useCallback(
    function (this: HTMLTableRowElement) {
      if (!this.parentElement || !this.previousElementSibling) return;
      this.parentElement
        .querySelectorAll(`td[rowspan].${classes.hovered}`)
        .forEach((cell) => cell.classList.remove(classes.hovered));
    },
    [classes.hovered],
  );

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
    <TableRow key={rowId} data-testid="tableRow" className={tableRowClasses} ref={rowRef}>
      {structure.flattened.notHidden.map((struct) => (
        <BodyContextProvider key={struct.key} value={{ ...bodyContextValue, structure: struct }}>
          <BodyCell />
        </BodyContextProvider>
      ))}
    </TableRow>
  );
};
BodyRow.propTypes = {
  index: PropTypes.number.isRequired,
  data: RowDataPropType.isRequired,
};

export default BodyRow;
