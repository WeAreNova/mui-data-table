import { alpha, createStyles, makeStyles, TableRow } from "@material-ui/core";
import clsx from "clsx";
import useTableContext from "hooks/useTableContext.hook";
import PropTypes from "prop-types";
import React, { MouseEventHandler, PropsWithChildren, useCallback, useMemo } from "react";
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
  (theme) =>
    createStyles({
      altColor: {
        backgroundColor: alpha(theme.palette.error.dark, 0.9),
      },
      disabled: {
        backgroundColor: theme.palette.action.disabledBackground,
        opacity: theme.palette.action.disabledOpacity,
      },
      hover: {
        cursor: "pointer",
        backgroundColor: theme.palette.action.hover,
      },
      selected: {
        backgroundColor: theme.palette.action.selected,
      },
    }),
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
  const { structure, rowClick, rowOptions, rowsSelectable, selectedRows } = useTableContext<RowType, AllDataType>();

  const rowId = useMemo(() => getRowId(data, index), [data, index]);
  const isAlternateRowColour = useMemo(() => rowOptions?.alternateRowColour?.(data) ?? false, [data, rowOptions]);
  const isDisabledRow = useMemo(() => rowOptions?.rowDisabled?.(data) ?? false, [data, rowOptions]);
  const tableRowClasses = useMemo(
    () =>
      clsx({
        [classes.altColor]: isAlternateRowColour,
        [classes.disabled]: isDisabledRow,
        [classes.selected]: rowsSelectable && Boolean(selectedRows[rowId]),
      }),
    [
      classes.altColor,
      classes.disabled,
      classes.selected,
      isAlternateRowColour,
      isDisabledRow,
      rowId,
      rowsSelectable,
      selectedRows,
    ],
  );

  const onHover = useCallback<MouseEventHandler<HTMLTableRowElement>>(
    (e) => {
      if (!rowClick) return;
      e.currentTarget.classList.add(classes.hover);
      if (!e.currentTarget.parentNode) return;
      const hoverRowIndex = Array.from(e.currentTarget.parentNode.children).indexOf(e.currentTarget);
      for (let row = e.currentTarget.previousElementSibling; row; row = row.previousElementSibling) {
        if (!row.parentNode) continue;
        const rowIndex = Array.from(row.parentNode.children).indexOf(row);
        const rowsBetween = hoverRowIndex - rowIndex;
        row.querySelectorAll("td[rowspan]").forEach((cell) => {
          const rowSpan = Number(cell.getAttribute("rowspan"));
          if (rowSpan > rowsBetween) cell.classList.add(classes.hover);
        });
      }
    },
    [classes.hover, rowClick],
  );

  const onUnHover = useCallback<React.MouseEventHandler<HTMLTableRowElement>>(
    (e) => {
      if (!rowClick) return;
      e.currentTarget.classList.remove(classes.hover);
      for (let row = e.currentTarget.previousElementSibling; row; row = row.previousElementSibling) {
        row.querySelectorAll("td[rowspan]").forEach((cell) => cell.classList.remove(classes.hover));
      }
    },
    [classes.hover, rowClick],
  );

  const bodyContextValue = useMemo(
    () =>
      ({
        data,
        index,
        rowId,
      } as Omit<BodyState<RowType, AllDataType>, "structure">),
    [data, index, rowId],
  );

  return (
    <TableRow
      key={rowId}
      data-testid="DT-TableRow"
      onMouseOver={onHover}
      onMouseOut={onUnHover}
      className={tableRowClasses}
    >
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
