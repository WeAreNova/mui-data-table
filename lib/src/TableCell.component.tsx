import { CSSObject, styled, TableCell as MUITableCell, TableCellProps as MUITableCellProps } from "@mui/material";
import useTableContext from "hooks/useTableContext.hook";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useRef } from "react";
import { dontForwardProps } from "utils";

type Widths = "lg" | "sm";

interface TableCellProps extends MUITableCellProps {
  hidden?: boolean;
  pinned?: boolean;
  maxWidth?: Widths;
}

const maxWidthStyles: Record<Widths, CSSObject> = {
  sm: { "& > *": { maxWidth: "6em" } },
  lg: { "& > *": { maxWidth: "20em" } },
};

const DTTableCell = styled(MUITableCell, {
  name: "DTTableCell",
  slot: "Root",
  shouldForwardProp: dontForwardProps("hidden", "pinned", "maxWidth", "resizeable"),
})<TableCellProps & { resizeable?: boolean }>(({ hidden = false, pinned = false, maxWidth, resizeable, theme }) => [
  resizeable && {
    overflow: "hidden",
  },
  hidden && {
    contentVisibility: "hidden",
    maxWidth: 0,
    padding: 0,
    cursor: "pointer",
    transition: theme.transitions.create("border-right-width", {
      duration: theme.transitions.duration.shortest,
      easing: theme.transitions.easing.easeInOut,
    }),
    "&:last-child": {
      borderLeft: `3px solid ${theme.palette.divider}`,
      "&:hover": {
        borderLeftWidth: 5,
      },
    },
    "&:not(:last-child)": {
      "&:not(:hover)": {
        borderRightWidth: 3,
      },
      "&:hover": {
        borderRightWidth: 5,
      },
    },
  },
  pinned && {
    position: "sticky",
    background: theme.palette.background.default,
    borderLeft: `1px solid ${theme.palette.divider}`,
    borderRight: `1px solid ${theme.palette.divider}`,
    "&.MuiTableCell-head": {
      zIndex: 4,
    },
  },
  maxWidth && {
    ...maxWidthStyles[maxWidth],
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
]);

/**
 * Enhanced TableCell component with additional styles
 *
 * @component
 */
const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(function _TableCell(
  props: TableCellProps,
  forwardedRef,
) {
  const cellRef = useRef<HTMLTableCellElement>();
  const { resizeable } = useTableContext();

  const handleRef = useCallback(
    (r: HTMLTableCellElement) => {
      cellRef.current = r;
      if (!forwardedRef) return;
      if (typeof forwardedRef === "function") return forwardedRef(r);
      forwardedRef.current = r;
    },
    [forwardedRef],
  );

  const getPinnedOffset = useCallback((cell: HTMLTableCellElement, offset: "left" | "right") => {
    const getNextCell = (c: HTMLTableCellElement) => {
      return (offset === "right" ? c.nextElementSibling : c.previousElementSibling) as HTMLTableCellElement | null;
    };
    let totalOffset = 0;
    for (let nextCell = getNextCell(cell); nextCell; nextCell = getNextCell(nextCell)) {
      if (nextCell.classList.contains("DTTableCell-pinned")) totalOffset += nextCell.offsetWidth;
    }
    return `${totalOffset}px`;
  }, []);

  useEffect(() => {
    if (!props.pinned || typeof cellRef === "function" || !cellRef?.current) return;
    const cell = cellRef.current;
    cell.style.right = getPinnedOffset(cell, "right");
    cell.style.left = getPinnedOffset(cell, "left");
  }, [getPinnedOffset, props.pinned]);

  useEffect(
    () => () => {
      if (!cellRef.current) return;
      const cell = cellRef.current;
      cell.style.right = "";
      cell.style.left = "";
    },
    [props.pinned],
  );

  return (
    <DTTableCell
      align="left"
      {...props}
      resizeable={resizeable}
      className={!props.pinned ? "" : "DTTableCell-pinned"}
      ref={handleRef}
    />
  );
});
TableCell.propTypes = {
  hidden: PropTypes.bool,
  pinned: PropTypes.bool,
  maxWidth: PropTypes.oneOf(["lg", "sm"]),
};

export default TableCell;
