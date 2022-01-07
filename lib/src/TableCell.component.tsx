import { CSSObject, styled, TableCell as MUITableCell, TableCellProps as MUITableCellProps } from "@mui/material";
import useTableContext from "hooks/useTableContext.hook";
import PropTypes from "prop-types";
import React from "react";
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

const StyledTableCell = styled(MUITableCell, {
  name: "DTCell-root",
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
    left: 0,
    right: 0,
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
const TableCell: React.FC<TableCellProps> = React.forwardRef(function _TableCell(props: TableCellProps, ref) {
  const { resizeable } = useTableContext();
  return <StyledTableCell align="left" {...props} resizeable={resizeable} ref={ref} />;
});
TableCell.propTypes = {
  hidden: PropTypes.bool,
  pinned: PropTypes.bool,
  maxWidth: PropTypes.oneOf(["lg", "sm"]),
};

export default TableCell;
