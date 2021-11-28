import { alpha, createStyles, makeStyles, TableRow } from "@material-ui/core";
import clsx from "clsx";
import PropTypes from "prop-types";
import React, { MouseEventHandler, PropsWithChildren, useCallback, useContext, useMemo } from "react";
import TableContext, { TableState } from "../table.context";
import { BaseData } from "../table.types";
import { getRowId } from "../utils";
import { RowDataPropType } from "../_propTypes";
import { BodyContextProvider, BodyState } from "./body.context";
import BodyCell from "./BodyCell.component";

interface BodyRowProps<RowType extends BaseData> {
  index: number;
  data: RowType;
}

const useStyles = makeStyles(
  (theme) =>
    createStyles({
      alternateRowColour: {
        backgroundColor: alpha(theme.palette.error.dark, 0.9),
      },
      disabledRow: {
        backgroundColor: theme.palette.action.disabledBackground,
        opacity: theme.palette.action.disabledOpacity,
      },
      rowHover: {
        cursor: "pointer",
        backgroundColor: theme.palette.action.hover,
      },
      selectedRow: {
        backgroundColor: theme.palette.action.selected,
      },
    }),
  { name: "DataTable-BodyRow" },
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
  const { structure, rowClick, rowOptions, rowsSelectable, selectedRows } =
    useContext<TableState<RowType, AllDataType>>(TableContext);

  const rowId = useMemo(() => getRowId(data, index), [data, index]);
  const isAlternateRowColour = useMemo(() => rowOptions?.alternateRowColour?.(data) ?? false, [data, rowOptions]);
  const isDisabledRow = useMemo(() => rowOptions?.rowDisabled?.(data) ?? false, [data, rowOptions]);
  const tableRowClasses = useMemo(
    () =>
      clsx({
        [classes.alternateRowColour]: isAlternateRowColour,
        [classes.disabledRow]: isDisabledRow,
        [classes.selectedRow]: rowsSelectable && Boolean(selectedRows[rowId]),
      }),
    [
      classes.alternateRowColour,
      classes.disabledRow,
      classes.selectedRow,
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
      e.currentTarget.classList.add(classes.rowHover);
      if (!e.currentTarget.parentNode) return;
      const hoverRowIndex = Array.from(e.currentTarget.parentNode.children).indexOf(e.currentTarget);
      for (let row = e.currentTarget.previousSibling as Element; row; row = row.previousSibling as Element) {
        if (!row.parentNode) continue;
        const rowIndex = Array.from(row.parentNode.children).indexOf(row);
        const rowsBetween = hoverRowIndex - rowIndex;
        row.querySelectorAll("td[rowspan]").forEach((cell) => {
          const rowSpan = Number(cell.getAttribute("rowspan"));
          if (rowSpan > rowsBetween) cell.classList.add(classes.rowHover);
        });
      }
    },
    [classes.rowHover, rowClick],
  );

  const onUnHover = useCallback<React.MouseEventHandler<HTMLTableRowElement>>(
    (e) => {
      if (!rowClick) return;
      e.currentTarget.classList.remove(classes.rowHover);
      for (let row = e.currentTarget.previousSibling as Element; row; row = row.previousSibling as Element) {
        row.querySelectorAll("td[rowspan]").forEach((cell) => cell.classList.remove(classes.rowHover));
      }
    },
    [classes.rowHover, rowClick],
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
      data-testid="tableRow"
      onMouseOver={onHover}
      onMouseOut={onUnHover}
      className={tableRowClasses}
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
    </TableRow>
  );
};
BodyRow.propTypes = {
  index: PropTypes.number.isRequired,
  data: RowDataPropType.isRequired,
};

export default BodyRow;
