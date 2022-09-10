import PropTypes from "prop-types";
import { createContext, Provider, useContext } from "react";
import { ColumnDefinitionPropType, RowDataPropType } from "../propTypes";
import { BaseData, FullColDef, FullColGroupDef } from "../types";

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

const useBodyContext = <RowType extends BaseData, AllDataType extends RowType[]>() => {
  return useContext<BodyState<RowType, AllDataType>>(BodyContext);
};

export default useBodyContext;
