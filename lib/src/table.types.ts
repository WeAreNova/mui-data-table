import type { IconButtonProps, TablePaginationProps, TableProps as MUITableProps } from "@material-ui/core";
import type React from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
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

export type ColumnDefinitionTitle<AllDataType extends BaseData[]> =
  | Exclude<ReactNode, number | boolean | null | undefined>
  | ((data: AllDataType) => Exclude<ReactNode, number | boolean | null | undefined>);

export declare class DataTableErrorType extends Error {
  readonly isDataTableError: true;
  readonly dataTableMessage: string;
  constructor(helperMessage: string, errorMessage?: string);
}

interface BaseColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
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
  footer?(tableData: AllDataType): ReactNode;
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
  title: ColumnDefinitionTitle<AllDataType>;
  /**
   * A helper field which specifies how to filter data for this column.
   */
  filterColumn?: FilterColumn<RowType>;
  /**
   *  Options for cell editing.
   */
  editable?: EditableCell<RowType, AllDataType>;
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
  colGroup?: ColGroupDefinition<RowType, AllDataType>[];
  /**
   * Boolean flag to indicate if the column is hidden from the table.
   *
   * Can be used when you want to include the column in the table's various functionality but don't want to display as a column.
   *
   * @example
   * When you want to be able to filter the data by the column, but the rendered value is not useful.
   * e.g. an Id field
   */
  hidden?: boolean;
  /**
   * @private internal use only
   */
  isColGroup?: true;
  /**
   * @private internal use only
   */
  hasColGroupFooter?: boolean;
}

type WithDataIndex<RowType extends BaseData, AllDataType extends RowType[]> = BaseColumnDefinition<
  RowType,
  AllDataType
> & {
  dataIndex: PathType<RowType>;
};

type WithExactlyOne<
  RowType extends BaseData,
  AllDataType extends RowType[],
  Requires extends keyof BaseColumnDefinition<RowType, AllDataType> = "numerical" | "render",
> = RequireExactlyOne<BaseColumnDefinition<RowType, AllDataType>, Requires>;

type GetColumnDefinition<RowType extends BaseData, AllDataType extends RowType[] = RowType[]> =
  | WithDataIndex<RowType, AllDataType>
  | WithExactlyOne<RowType, AllDataType, "numerical" | "render" | "colGroup" | "hidden">;

export type ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[] = RowType[]> = GetColumnDefinition<
  RowType,
  AllDataType
>;

export type ColGroupDefinition<RowType extends BaseData, AllDataType extends RowType[] = RowType[]> = Omit<
  WithDataIndex<RowType, AllDataType> | WithExactlyOne<RowType, AllDataType, "numerical" | "render">,
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

export type OperatorValues = typeof BASE_OPERATORS[number]["value"];

export interface FilterOptions<RowType extends BaseData> {
  path?: PathValueType<RowType>;
  type?: NullableDataTypes;
  /**
   * The default operator.
   */
  defaultOperator?: OperatorValues;
}

export interface Operator {
  readonly value: OperatorValues;
  readonly typeLabelMap?: {
    readonly [key in typeof DATA_TYPES[number] | "default"]?: string;
  };
}

export interface EditComponentProps<T = any> {
  defaultValue: T;
  onChange: Dispatch<SetStateAction<T>>;
  error: boolean;
  helperText: string | null;
  /**
   * Boolean flag for when the input should be disabled.
   *
   * The value is `true` when the it is validating the edit value and then updating the data.
   */
  disabled: boolean;
}

export interface EditableOptions<EditType, RowType extends BaseData, AllDataType extends RowType[]> {
  path: PathValueType<RowType>;
  /**
   * The data type. Used to determine the type of the input.
   *
   * If not specified, the type is inferred from the `dataType` field.
   */
  type?: EditDataTypes;
  /**
   * Custom edit component.
   */
  component?: (props: EditComponentProps<EditType>, data: RowType, allData: AllDataType) => ReactNode;
  /**
   * Validation for the input value.
   *
   * @param value the input value.
   * @returns the value, post-validation.
   * @throws {Error | DataTableErrorType} throws a DataTableError if the value is invalid.
   * If you want to display an error message as helper text, throw an error with a message.
   */
  validate?<T = EditType>(value: T, options: { data: RowType; allData: AllDataType }): any | Promise<any>;
  /**
   * Options or a function that returns the options for the select component when `type` is `"select"`.
   */
  selectOptions?: SelectFieldOption[] | ((data: RowType, allData: AllDataType) => SelectFieldOption[]);
  /**
   * Default value if the value at the `path` is `undefined` or `null`.
   */
  defaultValue?: EditType;
}

export type EditableCell<RowType extends BaseData, AllDataType extends RowType[]> =
  | PathValueType<RowType>
  | EditableOptions<any, RowType, AllDataType>;

export type FilterColumn<RowType extends BaseData> = PathValueType<RowType> | FilterOptions<RowType>;

export type FilterValue = string | number | Date | boolean | null;

export interface ActiveFilter<RowType extends BaseData = any> {
  id: string;
  type: NonNullable<NullableDataTypes>;
  path: PathType<RowType>;
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

/**
 * A function invoked when a row/cell is edited.
 *
 * If no function is provided, the row/cell will be updated in place.
 * Otherwise it will expect the function to return the updated value or update the table data itself.
 *
 * @param update.path the path to the value to be updated.
 * @param update.value the updated value.
 * @param data the row data.
 * @throws {DataTableErrorType} throws a `DataTableError` if the value is invalid.
 * @returns `void` if the update will be handled separately or the updated value which is then used to
 * update the table data in place.
 */
export type TableCellEditHandler<RowType extends BaseData, T = unknown> = (
  update: { path: PathType<RowType>; value: T },
  rowData: RowType,
) => T | Promise<T> | void | Promise<void>;

export interface TableProps<RowType extends BaseData, AllDataType extends RowType[]> {
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
  ) => T extends true ? AllDataType | Promise<AllDataType> : any;
  /**
   * A function invoked when a row is clicked.
   *
   * @param rowData the data of the row.
   * @param e the mouse event.
   */
  rowClick?(rowData: RowType, e: React.MouseEvent<HTMLTableCellElement, MouseEvent>): void;
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
  tableData: AllDataType;
  /**
   * The MUI table props.
   */
  tableProps?: MUITableProps;
  /**
   * The table's structure.
   */
  tableStructure: ColumnDefinition<RowType, AllDataType>[];
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
   * If no function is provided, the row/cell will be updated in place.
   * Otherwise it will expect the function to return the updated value or update the table data itself.
   *
   * @see {@link TableCellEditHandler}
   */
  onEdit?: TableCellEditHandler<RowType>;
  /**
   * Enables the table to be resized.
   */
  resizeable?: boolean;
}
