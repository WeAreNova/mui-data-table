import type { IconButtonProps, TablePaginationProps, TableProps as MUITableProps } from "@material-ui/core";
import type React from "react";
import type { LiteralUnion } from "type-fest";
import { BASE_OPERATORS, FILTER_TYPES } from "./Filter/filter.consts";

export interface BaseData {
  id?: string | null;
  _id?: string | null;
  [key: string]: any;
}

export type PathType<RowType extends BaseData> = Exclude<LiteralUnion<keyof RowType, string>, symbol | number>;

export interface ColGroup<RowType, DataType extends RowType[] = RowType[]> extends Omit<TableColumnStructure<RowType, DataType>, "colGroup"> {
  isColGroup?: boolean;
  hasColGroupFooter?: boolean;
}

export interface MonetaryObject<RowType extends BaseData = BaseData> {
  path: PathType<RowType>;
  decimalPlaces?: number;
  minDecimalPlaces?: number;
  maxDecimalPlaces?: number;
}

export type Monetary<RowType extends BaseData = BaseData> = PathType<RowType> | boolean | MonetaryObject<RowType>;

export interface ActionButton extends Omit<IconButtonProps, "size"> {
  key: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export type FilterTypes = typeof FILTER_TYPES[number] | undefined | null;

export interface FilterOptions<RowType extends BaseData> {
  path: PathType<RowType> | true;
  type?: FilterTypes;
}

export type OperatorValues = typeof BASE_OPERATORS[number]["value"];

export interface Operator {
  readonly value: OperatorValues;
  readonly typeLabelMap?: {
    readonly [key in typeof FILTER_TYPES[number] | "default"]?: string;
  };
}

export type FilterColumn<RowType extends BaseData> = FilterOptions<RowType> | PathType<RowType> | true;

export interface ActiveFilter<RowType extends BaseData = any> extends NonNullable<FilterOptions<RowType>> {
  id: string;
  type: NonNullable<FilterTypes>;
  path: Exclude<FilterOptions<RowType>["path"], true>;
  value: string | number | Date | boolean | null;
  operator: OperatorValues;
}

export type NullableActiveFilter<RowType extends BaseData = any> = { [key in keyof ActiveFilter<RowType>]: ActiveFilter<RowType>[key] | null };

export type ActiveFilters<RowType extends BaseData = any> = ActiveFilter<RowType>[];

export type Sorter<RowType extends BaseData> = (ab: RowType, ba: RowType) => number;

export interface TableColumnStructure<RowType extends BaseData, DataType extends RowType[] = RowType[]> {
  colGroup?: ColGroup<RowType, DataType>[];
  dataIndex?: PathType<RowType>;
  footer?(tableData: DataType): React.ReactNode;
  groupBy?: PathType<RowType>;
  id?: string;
  isColGroup?: boolean;
  key?: string;
  limitWidth?: "lg" | "sm";
  monetary?: Monetary<RowType>;
  render?(data: RowType, isCSVExport: boolean, rowId: string, dataArrayIndex: number): React.ReactNode;
  rowSpan?(data: RowType, index: number, arr: RowType[]): number;
  sorter?: boolean | PathType<RowType> | Sorter<RowType>;
  title: React.ReactNode | ((data: DataType) => React.ReactNode);
  filterColumn?: FilterColumn<RowType>;
  pinnable?: boolean;
  actionButtons?: ActionButton[];
}

export interface OnChangeObject {
  columnFilters: ActiveFilters;
  limit?: number | false;
  skip: number;
  sortDirection: "asc" | "desc" | undefined;
  sortKey: string | null;
}

export interface RowOptions {
  alternateRowColour?(data: GenericObject): boolean;
  rowDisabled?(data: GenericObject): boolean;
}

export interface Sort {
  key: null | string;
  direction?: "asc" | "desc";
}

export interface TableProps<RowType extends BaseData = BaseData, DataType extends RowType[] = RowType[]> {
  count?: number;
  csvFilename?: string;
  disablePagination?: boolean;
  enableHiddenColumns?: boolean;
  exportToCSVOption?: boolean;
  hideColumnsOption?: boolean;
  onChange?: <T extends boolean>(changeObject: OnChangeObject, isExport: T) => T extends true ? DataType | Promise<DataType> : any;
  rowClick?(data: RowType, e: React.MouseEvent<HTMLTableRowElement, MouseEvent>): void;
  rowOptions?: RowOptions;
  rowsPerPageOptions?: TablePaginationProps["rowsPerPageOptions"];
  rowsPerPageDefault?: number;
  searchTerm?: string;
  tableData: DataType;
  tableProps?: MUITableProps;
  tableStructure: TableColumnStructure<RowType, DataType>[];
  rowsSelectable?: boolean;
  onSelectedRowsChange?(rows: RowType[]): void;
  selectGroupBy?: string;
  defaultSort?: Sort;
}
