# Column Definitions

The table's structure is defined by an array of columns which have the type `ColumnDefinition`.

This section shall go into more detail about what makes up the `ColumnDefinition` and the features you have access to.

## The Options

The Column Definition has many fields you can make use of.

#### Key - Required

The `key` field is the unique identifier for the column.

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  key: string;
  ....
}
```

#### Title - Required

The **required** `title` field is used to specify the column header title and has two possible values:

- a `ReactNode` with some types excluded (see below)
- or a function which returns a `ReactNode` with some types excluded (see below)

?> If the value is a function, then it is passed all the table's data as an argument.

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  title: Exclude<ReactNode, number | boolean | null | undefined> | (data: AllDataType) => Exclude<ReactNode, number | boolean | null | undefined>;
  ....
}
```

#### Path Render - Optional

The `dataIndex` field is used to specify the path to the data which is to be rendered using dot-notation.

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  dataIndex?: string;
  ....
}
```

#### Custom Render - Optional

The `render` field is used for custom rendering of the content.

Its type is a function which is given:

- the current row's data
- whether the function is being called as part of exporting to CSV
- the unique row identifier
- the index of the row in the array of data

and returns a `ReactNode`.

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  render?(data: RowType, isCSVExport: boolean, rowId: string, dataArrayIndex: number): ReactNode;
  ....
}
```

#### Numerical Render - Optional

The `numerical` field is a helper field for rendering and formatting numerical values.

The value can be one of:

- `true` which uses default number formatter options to render the value at the given `dataIndex`
- a path to the value to be rendered which also uses default formatting options
- an object with the type:

```ts
interface NumericalObject<RowType extends BaseData = BaseData> {
  path?: true | string; // `true` uses the value of `dataIndex`
  decimalPlaces?: number;
  minDecimalPlaces?: number;
  maxDecimalPlaces?: number;
  currency?: true | string; // `true` uses the default currency, which is "GBP" by default. Or you can override it here by specifying an ISO 4217 currency code.
}
```

!> To change the default currency, see [Setting the Default Currency](/features#setting-the-default-currency).

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  numerical?: true | string | NumericalObject<RowType>;
  ....
}
```

?> For more information on numerical rendering and formatting, see [Currency & Number Formatting](/features#currency-amp-number-formatting).

#### Data Type - Optional

The `dataType` field is used the specify the type of the data. This field can be used as the default for [`filterColumn.type`](#filtering-optional) and [`editable.type`](#editing-optional).

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  dataType?: "string" | "number" | "boolean" | "date";
  ....
}
```

#### Footer - Optional

The `footer` field is used to render a column footer and is passed all the table's data and returns a `ReactNode`.

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  footer?(tableData: AllDataType): ReactNode;
  ....
}
```

#### Grouping - Optional

The `groupBy` field is a dot-notation path that indicates that this cell should span the rows which have the same value as this, using strict equality `===`, until a row with a different value is found.

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  groupBy?: string;
  ....
}
```

#### Alignment - Optional

The `align` field is for specifying how the content of the column's cells should be aligned.

If `align` is unspecified, then the data table attempts to work out the alignment itself. It does this by checking for a few conditions:

- if the `numerical` field is used, then align `"right"`
- if `typeof rendered value === "number"` then align `"right"`
- else align `"left"`

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  align?: "left" | "center" | "right";
  ....
}
```

#### Limit Width - Optional

The `limitWidth` field is used to limit the width of the column.

There are currently two possible values being:

- `lg` which limits the width to `20em`
- `sm` which limits the width to `6em`

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  limitWidth?: "lg" | "sm";
  ....
}
```

#### Row Span - Optional

The `rowSpan` field is a function which allows for specifying a custom row span.

The function is passed three arguments:

- the current row's data
- the index of the row in the array of all table data
- all the table's data

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  rowSpan?(data: RowType, index: number, arr: RowType[]): number;
  ....
}
```

#### Sorting - Optional

The `sorter` field is a helper field used to specify the sorting behaviour of the column.

The value can be one of:

- `true` which uses the `dataIndex` field to specify the path to the data to sort by
- A path to the data to sort by
- A sorter function

?> If the value is a sorter function, it is passed two arguments which are two adjacent data. Similar to a compare function for `Array.prototype.sort()`.

!> The sorter function value is only available when the sorting is done client-side.

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  sorter?: true | string | (a: RowType, b: RowType) => number;
  ....
}
```

#### Filtering - Optional

The `filterColumn` field is a helper field used to specify the filtering behaviour of the column.

The value can be one of:

- `true` which defaults to the path specified in the `dataIndex` field
- a string specifying the path to the data to be filtered
- an object with the type:

```ts
interface FilterOptions<RowType extends BaseData> {
  path: true | string; // `true` uses the value of `dataIndex`
  type?: "string" | "number" | "boolean" | "date" | undefined | null; // defaults to the value of the `dataType` field or `"string"` if `dataType` is not specified
  defaultOperator?: "exists" | "!exists" | "~" | "!~" | "=" | "!=" | ">" | ">=" | "<" | "<="; // See below for the meanings of these values
}
```

?> If the value is `true` or a string, then the filter type defaults to `"string"`

?> `defaultOperator` is optional and can be used if there is a common use-case for a field.
For example, `registrationDate` may commonly be queried with the `>` operator e.g. to find the most recently registered users.
See [Filter Operators](#filter-operators) for further details on the operators.

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  filterColumn?: true | string | FilterOptions<RowType>;
  ....
}
```

##### Filter Operators

Below are all the different operators for the filter, along with their `typeLabelMap` which defines which operators are available for which type(s) and the labels for each type.

> When there is a `default` field in the `typeLabelMap`, that means the operator is enabled for all data types with the value being the default label.

```ts
[
  {
    value: "exists",
    typeLabelMap: {
      default: "exists",
    },
  },
  {
    value: "!exists",
    typeLabelMap: {
      default: "does not exist",
    },
  },
  {
    value: "~",
    typeLabelMap: {
      string: "contains",
    },
  },
  {
    value: "!~",
    typeLabelMap: {
      string: "does not contain",
    },
  },
  {
    value: "=",
    typeLabelMap: {
      default: "is",
      number: "=",
    },
  },
  {
    value: "!=",
    typeLabelMap: {
      default: "is not",
      number: "≠",
    },
  },
  {
    value: ">",
    typeLabelMap: {
      date: "is after",
      number: ">",
    },
  },
  {
    value: ">=",
    typeLabelMap: {
      date: "is on or after",
      number: "≥",
    },
  },
  {
    value: "<",
    typeLabelMap: {
      date: "is before",
      number: "<",
    },
  },
  {
    value: "<=",
    typeLabelMap: {
      date: "is on or before",
      number: "≤",
    },
  },
];
```

#### Editing - Optional

The `editable` field is used to specify the edit options for the cell.

The value can be one of:

- `true` which defaults to the path specified in the `dataIndex` field
- a string specifying the path to the data to be filtered
- an object with the type:

```ts
interface EditComponentProps {
  defaultValue: unknown;
  onChange: Dispatch<unknown>;
  error: boolean;
  helperText: string | null;
  /**
   * Boolean flag for when the input should be disabled.
   *
   * The value is `true` when the it is validating the edit value and then updating the data.
   */
  disabled: boolean;
}

export interface EditableOptions<RowType extends BaseData, AllDataType extends RowType[]> {
  path: true | string; // `true` uses the value of the `dataIndex` field
  /**
   * The data type. Used to determine the type of the input.
   *
   * If not specified, the type is inferred from the `dataType` field.
   */
  type?: "string" | "number" | "boolean" | "date" | "select";
  /**
   * Custom edit component.
   */
  component?: (props: EditComponentProps, data: RowType, allData: AllDataType) => ReactNode;
  /**
   * Validation for the input value.
   *
   * @param value the input value.
   * @returns the value, post-validation.
   * @throws an error if the value is invalid.
   * If you want to display an error message as helper text, throw an error with a message.
   */
  validate?<T>(value: T, options: { data: RowType; allData: AllDataType }): any | Promise<any>;
  /**
   * Options or a function that returns the options for the select component when `type` is `"select"`.
   */
  selectOptions?: SelectFieldOption[] | ((data: RowType, allData: AllDataType) => SelectFieldOption[]);
  /**
   * Default value if the value at the `path` is `undefined` or `null`.
   */
  defaultValue?: EditType;
}
```

?> An unspecified type defaults to the value of the `dataType` field. This includes if `editable` is `true` or a `string`.

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  editable?: true | string | EditableOptions<RowType, AllDataType>;
  ....
}
```

#### Pinnable - Optional

The `pinnable` field is used to specify whether the column is able to be "pinned" and appear on top of other columns as you scroll. This displays a header action button which freezes the column.

!> This uses the CSS `sticky` property which may not be fully supported in all browsers. See `caniuse` [here](https://caniuse.com/css-sticky) to check if it is supported for your target browser(s).

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  pinnable?: boolean;
  ....
}
```

#### Header Action Buttons - Optional

The `actionButtons` field is used to add additional custom action buttons to the column header cell.

The value is an array of objects with the type:

```ts
import { IconButtonProps } from "@material-ui/core";

interface ActionButton extends Omit<IconButtonProps, "size"> {
  key: string;
  icon: ReactNode;
  onClick(): void;
}
```

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  actionButtons?: ActionButton[];
  ....
}
```

#### Column Groups - Optional

The `colGroup` field is used to define the nested columns to this column. This is demonstrated in the [demo](/demo) with the `Cash Balance` columns.

The value of `colGroup` is an array of `ColGroupDefinition` objects. Which has the type:

```ts
type ColGroupDefinition<RowType extends BaseData, AllDataType extends RowType[]> = Omit<
  ColumnDefinition<RowType, AllDataType>,
  "colGroup"
>;
```

?> In other words, `ColGroupDefinition` has the same type as `ColumnDefinition` but without the `colGroup` field. So, columns can only be nested to a depth of `1`.

```ts
interface ColumnDefinition<RowType extends BaseData, AllDataType extends RowType[]> {
  ....
  colGroup: ColGroupDefinition<RowType, AllDataType>[];
  ....
}
```
