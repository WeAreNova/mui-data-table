import { createStyles, makeStyles, TableCell as MUITableCell, TableCellProps } from "@material-ui/core";
import clsx from "clsx";
import useTableContext from "hooks/useTableContext.hook";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

interface Props extends TableCellProps {
  className?: string;
  hidden?: boolean;
  pinned?: boolean;
  maxWidth?: "lg" | "sm";
}

const useStyles = makeStyles(
  (theme) =>
    createStyles({
      hidden: {
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
      maxWidthLg: {
        "& > *": {
          maxWidth: "20em",
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
      },
      maxWidthSm: {
        "& > *": {
          maxWidth: "6em",
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
      },
      pinned: {},
      pinnedStyling: {
        position: "sticky",
        background: theme.palette.background.default,
        borderLeft: `1px solid ${theme.palette.divider}`,
        borderRight: `1px solid ${theme.palette.divider}`,
        "&.MuiTableCell-head": {
          zIndex: 4,
        },
      },
      resizeable: {
        overflow: "hidden",
      },
    }),
  { name: "DTTableCell" },
);

/**
 * Enhanced TableCell component with additional styles
 *
 * @component
 */
const TableCell = React.forwardRef<HTMLTableCellElement, Props>(function _TableCell(
  { hidden = false, pinned = false, maxWidth, className, ...props }: Props,
  forwardedRef,
) {
  const cellRef = useRef<HTMLTableCellElement>();
  const { resizeable } = useTableContext();
  const classes = useStyles(props);
  const cellClasses = useMemo(
    () =>
      clsx([
        className,
        {
          [classes.hidden]: hidden,
          [classes.maxWidthLg]: maxWidth === "lg",
          [classes.maxWidthSm]: maxWidth === "sm",
          [classes.resizeable]: Boolean(resizeable),
          [classes.pinned]: pinned,
        },
      ]),
    [
      className,
      classes.hidden,
      classes.maxWidthLg,
      classes.maxWidthSm,
      classes.pinned,
      classes.resizeable,
      hidden,
      maxWidth,
      pinned,
      resizeable,
    ],
  );

  const handleRef = useCallback(
    (r: HTMLTableCellElement) => {
      cellRef.current = r;
      if (!forwardedRef) return;
      if (typeof forwardedRef === "function") return forwardedRef(r);
      forwardedRef.current = r;
    },
    [forwardedRef],
  );

  const getPinnedOffset = useCallback(
    (cell: HTMLTableCellElement, offset: "left" | "right") => {
      const getNextCell = (c: HTMLTableCellElement) => {
        return (offset === "right" ? c.nextElementSibling : c.previousElementSibling) as HTMLTableCellElement | null;
      };
      let totalOffset = 0;
      for (let nextCell = getNextCell(cell); nextCell; nextCell = getNextCell(nextCell)) {
        if (nextCell.classList.contains(classes.pinned)) totalOffset += nextCell.offsetWidth;
      }
      return `${totalOffset}px`;
    },
    [classes.pinned],
  );

  useEffect(() => {
    if (!pinned || typeof cellRef === "function" || !cellRef?.current) return;
    const cell = cellRef.current;
    cell.style.right = getPinnedOffset(cell, "right");
    cell.style.left = getPinnedOffset(cell, "left");
    cell.classList.add(classes.pinnedStyling);
  }, [classes.pinned, classes.pinnedStyling, getPinnedOffset, pinned]);

  useEffect(
    () => () => {
      if (!cellRef.current) return;
      const cell = cellRef.current;
      cell.classList.remove(classes.pinnedStyling);
      cell.style.right = "";
      cell.style.left = "";
    },
    [classes.pinnedStyling, pinned],
  );

  return <MUITableCell align="center" {...props} ref={handleRef} className={cellClasses} />;
});
TableCell.propTypes = {
  hidden: PropTypes.bool,
  pinned: PropTypes.bool,
  maxWidth: PropTypes.oneOf(["lg", "sm"]),
};

export default TableCell;
