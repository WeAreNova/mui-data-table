import PropTypes from "prop-types";
import { FilterTypePropTypes } from "./_dataTable.consts";

export const PathValuePropType = [PropTypes.oneOf([true]), PropTypes.string];

const ColGroupDefinitionPropType = {
  key: PropTypes.string.isRequired,
  dataIndex: PropTypes.string,
  align: PropTypes.oneOf(["left", "center", "right"]),
  numerical: PropTypes.oneOfType([
    ...PathValuePropType,
    PropTypes.shape({
      path: PropTypes.oneOfType(PathValuePropType),
      decimalPlaces: PropTypes.number,
      minDecimalPlaces: PropTypes.number,
      maxDecimalPlaces: PropTypes.number,
      currency: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    }),
  ]),
  render: PropTypes.func,
  groupBy: PropTypes.string,
  limitWidth: PropTypes.oneOf(["lg", "sm"]),
  rowSpan: PropTypes.func,
  sorter: PropTypes.oneOfType([...PathValuePropType, PropTypes.func]),
  title: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  filterColumn: PropTypes.oneOfType([
    ...PathValuePropType,
    PropTypes.shape({
      path: PropTypes.oneOfType(PathValuePropType),
      type: FilterTypePropTypes,
    }),
  ]),
  pinnable: PropTypes.bool,
  actionButtons: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      icon: PropTypes.node.isRequired,
      onClick: PropTypes.func.isRequired,
    }),
  ),
};

export const ColumnDefinitionPropType = PropTypes.shape({
  ...ColGroupDefinitionPropType,
  colGroup: PropTypes.arrayOf(PropTypes.shape(ColGroupDefinitionPropType).isRequired),
});

export const RowDataPropType = PropTypes.shape({
  id: PropTypes.string,
  _id: PropTypes.string,
});

export const RowsPerPageOptionsPropType = PropTypes.arrayOf(
  PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      value: PropTypes.number,
      label: PropTypes.string,
    }),
  ]).isRequired,
);
