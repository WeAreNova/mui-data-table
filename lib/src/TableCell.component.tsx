import { createStyles, makeStyles, TableCell as MUITableCell, TableCellProps } from "@material-ui/core";
import clsx from "clsx";
import useTableContext from "hooks/useTableContext.hook";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { CellType } from "table.types";

interface Props extends TableCellProps {
  className?: string;
  hidden?: boolean;
  pinned?: boolean;
  maxWidth?: "lg" | "sm";
  type?: CellType
  customKey?: string;
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
  { hidden = false, pinned = false, maxWidth, className, type, customKey, ...props }: Props,
  forwardedRef,
) {
  const cellRef = useRef<HTMLTableCellElement>();
  const { resizeable, pinnedColumns, headerCellsSiblingsMap } = useTableContext();
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
    (cell: HTMLTableCellElement, offset: "left" | "right", useMap?: boolean) => {
      const getNextCell = (c: HTMLTableCellElement) => {
        return (offset === "right" ? c.nextElementSibling : c.previousElementSibling) as HTMLTableCellElement | null;
      };

      const getNextCellFromMap = (c: HTMLTableCellElement) => {
        return (offset === "right" ? document.getElementById(headerCellsSiblingsMap[c.id].rightSibling) : document.getElementById(headerCellsSiblingsMap[c.id].leftSibling)) as HTMLTableCellElement | null;
      };

      let totalOffset = 0;
      for (let nextCell = useMap ? getNextCellFromMap(cell) : getNextCell(cell); nextCell; nextCell = useMap ? getNextCellFromMap(nextCell) : getNextCell(nextCell)) {
        if (nextCell.classList.contains(classes.pinned)) totalOffset += nextCell.offsetWidth;
      }
      return `${totalOffset}px`;
    },
    [classes.pinned, headerCellsSiblingsMap],
  );

  useEffect(() => {
    if (!pinned || typeof cellRef === "function" || !cellRef?.current) return;
    const cell = cellRef.current;

    if (type === "Header") {
      cell.style.right = getPinnedOffset(cell, "right", true);
      cell.style.left = getPinnedOffset(cell, "left", true);
    } else if (type === "Footer" && customKey) {
      //finding pinned offset for footer with colgroup is problematic, because of multiple footer rows, and having empty footer columns, so we will find footer offset based on the header
      const headerCell = document.getElementById(customKey);
      if (headerCell && headerCell instanceof HTMLTableCellElement) {
        cell.style.right = getPinnedOffset(headerCell, "right", true);
        cell.style.left = getPinnedOffset(headerCell, "left", true);
      }
    } else {
      cell.style.right = getPinnedOffset(cell, "right");
      cell.style.left = getPinnedOffset(cell, "left");
    }
    cell.classList.add(classes.pinnedStyling);

  }, [classes.pinned, classes.pinnedStyling, customKey, getPinnedOffset, pinned, pinnedColumns, type]);
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
