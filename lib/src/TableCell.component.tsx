import { createStyles, makeStyles, TableCell as MUITableCell, TableCellProps } from "@material-ui/core";
import clsx from "clsx";
import useTableContext from "hooks/useTableContext.hook";
import PropTypes from "prop-types";
import React, { useMemo } from "react";

interface Props extends TableCellProps {
  hidden?: boolean;
  pinned?: boolean;
  maxWidth?: "lg" | "sm";
}

const useStyles = makeStyles(
  (theme) =>
    createStyles({
      hiddenTableCell: {
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
      pinnedTableCell: {
        position: "sticky",
        left: 0,
        right: 0,
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
const TableCell: React.FC<Props> = React.forwardRef(function _TableCell(
  { hidden = false, pinned = false, maxWidth, className, ...props }: Props,
  ref,
) {
  const { resizeable } = useTableContext();
  const classes = useStyles(props);
  const cellClasses = useMemo(
    () =>
      clsx([
        className,
        {
          [classes.hiddenTableCell]: hidden,
          [classes.pinnedTableCell]: pinned,
          [classes.maxWidthLg]: maxWidth === "lg",
          [classes.maxWidthSm]: maxWidth === "sm",
          [classes.resizeable]: Boolean(resizeable),
        },
      ]),
    [className, classes, hidden, maxWidth, pinned, resizeable],
  );
  return <MUITableCell align="center" {...props} ref={ref} className={cellClasses} />;
});
TableCell.propTypes = {
  hidden: PropTypes.bool,
  pinned: PropTypes.bool,
  maxWidth: PropTypes.oneOf(["lg", "sm"]),
};

export default TableCell;
