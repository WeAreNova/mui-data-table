import PropTypes from "prop-types";
import { createContext, Provider } from "react";
import { BaseData, FullColDef, FullColGroupDef } from "table.types";
import { ColumnDefinitionPropType, RowDataPropType } from "_propTypes";

export interface BodyState<RowType extends BaseData, AllDataType extends RowType[]> {
  structure: FullColDef<RowType, AllDataType> | FullColGroupDef<RowType, AllDataType>;
  index: number;
  rowId: string;
  data: RowType;
}

const BodyContext = createContext<BodyState<any, any>>({} as BodyState<any, any>);
BodyContext.displayName = "BodyContext";

export const BodyContextProvider = BodyContext.Provider;
(BodyContextProvider as Provider<any>).propTypes = {
  value: PropTypes.exact({
    index: PropTypes.number.isRequired,
    rowId: PropTypes.string.isRequired,
    structure: ColumnDefinitionPropType.isRequired,
    data: RowDataPropType.isRequired,
  }),
};
export default BodyContext;
