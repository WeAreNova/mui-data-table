import type { IconButtonProps, TablePaginationProps, TableProps as MUITableProps } from "@material-ui/core";
import type React from "react";
import { ChangeEventHandler, ReactNode } from "react";
import type { LiteralUnion, RequireExactlyOne } from "type-fest";
import { SelectFieldOption } from "./Filter/SimpleSelectField.component";
import { BASE_OPERATORS, DATA_TYPES } from "./_dataTable.consts";

export interface BaseData {
  id?: string | null;
  _id?: string | null;
  [key: string]: any;
}

export type PathType<RowType extends BaseData> = Exclude<LiteralUnion<keyof RowType, string>, symbol | number>;

export type PathValueType<T extends BaseData> = PathType<T> | true | undefined;

export type Sorter<T> = (ab: T, ba: T) => number;

export type TableCellAlign = "left" | "center" | "right";

export type DataTypes = typeof DATA_TYPES[number];

export type NullableDataTypes = DataTypes | undefined | null;

export type EditDataTypes = NullableDataTypes | "select";

interface BaseColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
  /**
   * The unique identifier for the column.
   */
  key: string;
  /**
   * Data type of the column.
   */
  dataType?: DataTypes;
  /**
   * The dot-notation path to the data which is to be displayed.
   */
  dataIndex?: PathType<RowType>;
  /**
   * The content alignment of the column.
   */
  align?: TableCellAlign;
  /**
   * Helper field for rendering and formatting the data as a numerical value.
   */
  numerical?: true | NumericalValueOptions<RowType>;
  /**
   * A function which allows for custom rendering of the data.
   *
   * @param data the current row of data
   * @param isCSVExport whether the render method is being called for CSV export
   * @param rowId the unique identifier for the row in the table
   * @param dataArrayIndex the index of the row in the data array
   */
  render?(data: RowType, isCSVExport: boolean, rowId: string, dataArrayIndex: number): ReactNode;
  /**
   * A function which allows creating a footer for the column.
   *
   * @param tableData all the table's data
   */
  footer?(tableData: DataType): ReactNode;
  /**
   * A dot-notation path that indicates that this cell should group with adjacent rows which have the same value as this.
   */
  groupBy?: PathType<RowType>;
  /**
   * Field to limit the width of the column.
   */
  limitWidth?: "lg" | "sm";
  /**
   * A function that allows for specifying a custom row span.
   *
   * @param data the current row of data
   * @param index the index of the row in the data array
   * @param arr all the table's data
   */
  rowSpan?(data: RowType, index: number, arr: RowType[]): number;
  /**
   * Helper field for handling the sorting of the data.
   */
  sorter?: PathValueType<RowType> | Sorter<RowType>;
  /**
   * The title of the column.
   */
  title:
    | Exclude<ReactNode, number | boolean | null | undefined>
    | ((data: DataType) => Exclude<ReactNode, number | boolean | null | undefined>);
  /**
   * A helper field which specifies how to filter data for this column.
   */
  filterColumn?: FilterColumn<RowType>;
  /**
   *  Options for cell editing.
   */
  editable?: EditableCell<RowType>;
  /**
   * Indicates whether the column is pinnable.
   */
  pinnable?: boolean;
  /**
   * Custom actions to be displayed in the column header.
   */
  actionButtons?: ActionButton[];
  /**
   * An array of `ColGroupDefinition` objects which define the nested columns of this column.
   */
  colGroup?: ColGroupDefinition<RowType, DataType>[];
  /**
   * @private internal use only
   */
  isColGroup?: true;
  /**
   * @private internal use only
   */
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

export interface FilterOptions<RowType extends BaseData> {
  path?: PathValueType<RowType>;
  type?: NullableDataTypes;
}

export type OperatorValues = typeof BASE_OPERATORS[number]["value"];

export interface Operator {
  readonly value: OperatorValues;
  readonly typeLabelMap?: {
    readonly [key in typeof DATA_TYPES[number] | "default"]?: string;
  };
}

interface EditComponentProps {
  defaultValue: unknown;
  onChange: ChangeEventHandler<unknown>;
}

export interface EditableOptions<RowType extends BaseData> {
  path: PathValueType<RowType>;
  type: EditDataTypes;
  component?: (props: EditComponentProps) => ReactNode;
  /**
   * Options for the select component.
   */
  options?: SelectFieldOption[];
}

export type EditableCell<RowType extends BaseData> = PathValueType<RowType> | EditableOptions<RowType>;

export type FilterColumn<RowType extends BaseData> = PathValueType<RowType> | FilterOptions<RowType>;

export type FilterValue = string | number | Date | boolean | null;

export interface ActiveFilter<RowType extends BaseData = any> extends NonNullable<FilterOptions<RowType>> {
  id: string;
  type: NonNullable<NullableDataTypes>;
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
  /**
   * Custom number of rows after filtering.
   */
  count?: number;
  /**
   * Custom filename for the CSV export file.
   */
  csvFilename?: string;
  /**
   * Disables pagination and shows all rows.
   */
  disablePagination?: boolean;
  /**
   * Enables hiding columns.
   */
  enableHiddenColumns?: boolean;
  /**
   * Enables the export to CSV option.
   */
  exportToCSVOption?: boolean;
  /**
   * A function which is invoked when the table options are changed.
   *
   * Should return the fetched data when it is a CSV export. This is because you may want to return different data if it is during the CSV export.
   * e.g. you may want to export all data as CSV rather than the current page.
   *
   * @param changeObject the object containing the selected filters, pagination and other options.
   * @param isExport whether the function is being invoked during CSV export.
   *
   * @returns the fetched data.
   */
  onChange?: <T extends boolean>(
    changeObject: OnChangeObject,
    isExport: T,
  ) => T extends true ? DataType | Promise<DataType> : any;
  /**
   * A function invoked when a row is clicked.
   *
   * @param data the data of the row.
   * @param e the mouse event.
   */
  rowClick?(data: RowType, e: React.MouseEvent<HTMLTableCellElement, MouseEvent>): void;
  /**
   * Options specific to row customisation.
   */
  rowOptions?: RowOptions;
  /**
   * The table pagination options.
   */
  rowsPerPageOptions?: TablePaginationProps["rowsPerPageOptions"];
  /**
   * The default number of rows per page.
   */
  rowsPerPageDefault?: number;
  /**
   * The table data.
   */
  tableData: DataType;
  /**
   * The MUI table props.
   */
  tableProps?: MUITableProps;
  /**
   * The table's structure.
   */
  tableStructure: ColumnDefinition<RowType, DataType>[];
  /**
   * Enables row selection.
   */
  rowsSelectable?: boolean;
  /**
   * A function invoked when a row is selected or deselected.
   *
   * @param rows the selected rows.
   */
  onSelectedRowsChange?(rows: RowType[]): void;
  /**
   * The key to group rows by when selecting a grouped row.
   */
  selectGroupBy?: string;
  /**
   * The default sort options.
   */
  defaultSort?: Sort;
  /**
   * Enables editing rows/cells.
   *
   * @default false when undefined.
   * @default "cells" when true.
   */
  editable?: boolean | "cells" | "rows";
  /**
   * A function invoked when a row/cell is edited.
   *
   * @param path path to the value updated.
   * @param value the updated value.
   * @param rowId the id of the row.
   * @param dataArrayIndex the index of the row in the tableData array.
   */
  onEdit?(path: PathType<RowType>, value: any, rowId: string, dataArrayIndex: number): void;
}
