import BodyContext, { BodyState } from "Body/body.context";
import { useContext } from "react";
import { BaseData } from "table.types";

const useBodyContext = <RowType extends BaseData, AllDataType extends RowType[]>() => {
  return useContext<BodyState<RowType, AllDataType>>(BodyContext);
};

export default useBodyContext;
