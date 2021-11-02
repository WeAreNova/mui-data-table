import type { IconButtonProps, TablePaginationProps, TableProps as MUITableProps } from "@material-ui/core";
import type React from "react";
import { ReactNode } from "react";
import type { LiteralUnion, RequireExactlyOne } from "type-fest";
import { BASE_OPERATORS, FILTER_TYPES } from "./Filter/filter.consts";

export interface BaseData {
  id?: string | null;
  [key: string]: any;
}

export type PathType<RowType extends BaseData> = Exclude<LiteralUnion<keyof RowType, string>, symbol | number>;

export type PathValueType<T extends BaseData> = PathType<T> | true | undefined;

export type Sorter<T> = (ab: T, ba: T) => number;

export type TableCellAlign = "left" | "center" | "right";

interface BaseColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
  key: string;
  dataIndex?: PathType<RowType>;
  align?: TableCellAlign;
  numerical?: true | NumericalValueOptions<RowType>;
  render?(data: RowType, isCSVExport: boolean, rowId: string, dataArrayIndex: number): ReactNode;
  footer?(tableData: DataType): ReactNode;
  groupBy?: PathType<RowType>;
  limitWidth?: "lg" | "sm";
  rowSpan?(data: RowType, index: number, arr: RowType[]): number;
  sorter?: PathValueType<RowType> | Sorter<RowType>;
  title:
    | Exclude<ReactNode, number | boolean | null | undefined>
    | ((data: DataType) => Exclude<ReactNode, number | boolean | null | undefined>);
  filterColumn?: FilterColumn<RowType>;
  pinnable?: boolean;
  actionButtons?: ActionButton[];
  colGroup?: ColGroupDefinition<RowType, DataType>[];
  isColGroup?: true;
  hasColGroupFooter?: boolean;
}

type WithDataIndex<RowType extends BaseData, DataType extends RowType[]> = BaseColumnDefinition<RowType, DataType> & {
  dataIndex: PathType<RowType>;
};

type WithExactlyOne<
  RowType extends BaseData,
  DataType extends RowType[],
  Requires extends keyof BaseColumnDefinition<RowType, DataType> = "numerical" | "render",
> = RequireExactlyOne<BaseColumnDefinition<RowType, DataType>, Requires>;

export type ColumnDefinition<RowType extends BaseData, DataType extends RowType[] = RowType[]> =
  | WithDataIndex<RowType, DataType>
  | WithExactlyOne<RowType, DataType, "numerical" | "render" | "colGroup">;

export type ColGroupDefinition<RowType extends BaseData, DataType extends RowType[] = RowType[]> = Omit<
  WithDataIndex<RowType, DataType> | WithExactlyOne<RowType, DataType, "numerical" | "render">,
  "colGroup"
> & { colGroup?: never };

export interface NumericalObject<RowType extends BaseData = BaseData> {
  path?: true | PathType<RowType>;
  decimalPlaces?: number;
  minDecimalPlaces?: number;
  maxDecimalPlaces?: number;
  currency?: boolean | string;
}

export type NumericalValueOptions<RowType extends BaseData = BaseData> =
  | true
  | PathType<RowType>
  | NumericalObject<RowType>;

export interface ActionButton extends Omit<IconButtonProps, "size"> {
  key: string;
  icon: ReactNode;
  onClick(): void;
}

export type FilterTypes = typeof FILTER_TYPES[number] | undefined | null;

export interface FilterOptions<RowType extends BaseData> {
  path?: PathValueType<RowType>;
  type?: FilterTypes;
}

export type OperatorValues = typeof BASE_OPERATORS[number]["value"];

export interface Operator {
  readonly value: OperatorValues;
  readonly typeLabelMap?: {
    readonly [key in typeof FILTER_TYPES[number] | "default"]?: string;
  };
}

export type FilterColumn<RowType extends BaseData> = PathValueType<RowType> | FilterOptions<RowType>;

export type FilterValue = string | number | Date | boolean | null;

export interface ActiveFilter<RowType extends BaseData = any> extends NonNullable<FilterOptions<RowType>> {
  id: string;
  type: NonNullable<FilterTypes>;
  path: Exclude<FilterOptions<RowType>["path"], true | undefined>;
  value: FilterValue;
  operator: OperatorValues;
}

export type NullableActiveFilter<RowType extends BaseData = any> = {
  [key in keyof ActiveFilter<RowType>]: ActiveFilter<RowType>[key] | null;
};

export type ActiveFilters<RowType extends BaseData = any> = ActiveFilter<RowType>[];

export interface OnChangeObject {
  columnFilters: ActiveFilters;
  limit?: number | false;
  skip: number;
  sortDirection: "asc" | "desc" | undefined;
  sortKey: string | null;
}

export interface RowOptions {
  alternateRowColour?(data: Record<string, any>): boolean;
  rowDisabled?(data: Record<string, any>): boolean;
}

export interface Sort {
  key: null | string;
  direction?: "asc" | "desc";
}

export interface TableProps<RowType extends BaseData, DataType extends RowType[]> {
  count?: number;
  csvFilename?: string;
  disablePagination?: boolean;
  enableHiddenColumns?: boolean;
  exportToCSVOption?: boolean;
  hideColumnsOption?: boolean;
  onChange?: <T extends boolean>(
    changeObject: OnChangeObject,
    isExport: T,
  ) => T extends true ? DataType | Promise<DataType> : any;
  rowClick?(data: RowType, e: React.MouseEvent<HTMLTableCellElement, MouseEvent>): void;
  rowOptions?: RowOptions;
  rowsPerPageOptions?: TablePaginationProps["rowsPerPageOptions"];
  rowsPerPageDefault?: number;
  tableData: DataType;
  tableProps?: MUITableProps;
  tableStructure: ColumnDefinition<RowType, DataType>[];
  rowsSelectable?: boolean;
  onSelectedRowsChange?(rows: RowType[]): void;
  selectGroupBy?: string;
  defaultSort?: Sort;
}
