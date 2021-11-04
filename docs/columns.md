# Column Definitions

The table's structure is defined by an array of columns which have the type `ColumnDefinition`.

This section shall go into more detail about what makes up the `ColumnDefinition` and the features you have access to.

## The Options

The Column Definition has many fields you can make use of.

#### Key - Required

The `key` field is the unique identifier for the column.

```ts
interface ColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
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
interface ColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
  ....
  title: Exclude<ReactNode, number | boolean | null | undefined> | (data: DataType) => Exclude<ReactNode, number | boolean | null | undefined>;
  ....
}
```

#### Path Render - Optional

The `dataIndex` field is used to specify the path to the data which is to be rendered using dot-notation.

```ts
interface ColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
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
interface ColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
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
  currency?: true | string; // `true` uses the browser's locale to work out the currency to use. Or you can specify your own.
}
```

```ts
interface ColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
  ....
  numerical?: true | string | NumericalObject<RowType>;
  ....
}
```

#### Footer - Optional

The `footer` field is used to render a column footer and is passed all the table's data and returns a `ReactNode`.

```ts
interface ColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
  ....
  footer?(tableData: DataType): ReactNode;
  ....
}
```

#### Grouping - Optional

The `groupBy` field is a dot-notation path that indicates that this cell should span the rows which have the same value as this, using strict equality `===`, until a row with a different value is found.

```ts
interface ColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
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
interface ColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
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
interface ColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
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
interface ColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
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
interface ColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
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
  path?: true | string; // `true` uses the value of `dataIndex`
  type?: "string" | "number" | "boolean" | "date" | undefined | null; // defaults to `"string"`
}
```

?> If the value is `true` or a string, then the filter type defaults to `"string"`

```ts
interface ColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
  ....
  filterColumn?: true | string | FilterOptions<RowType>;
  ....
}
```

#### Pinnable - Optional

The `pinnable` field is used to specify whether the column is able to be "pinned" and appear on top of other columns as you scroll. This displays a header action button which freezes the column.

!> This uses the CSS `sticky` property which may not be fully supported in all browsers. See `caniuse` [here](https://caniuse.com/css-sticky) to see if it is supported for you target browser(s).

```ts
interface ColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
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
interface ColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
  ....
  actionButtons?: ActionButton[];
  ....
}
```

#### Column Groups - Optional

The `colGroup` field is used to define the nested columns to this column. This is demonstrated in the [demo](/demo) with the `Cash Balance` columns.

The value of `colGroup` is an array of `ColGroupDefinition` objects. Which has the type:

```ts
type ColGroupDefinition<RowType extends BaseData, DataType extends RowType[]> = Omit<
  ColumnDefinition<RowType, DataType>,
  "colGroup"
>;
```

?> In other words, `ColGroupDefinition` has the same type as `ColumnDefinition` but without the `colGroup` field. So, columns can only be nested to a depth of `1`.

```ts
interface ColumnDefinition<RowType extends BaseData, DataType extends RowType[]> {
  ....
  colGroup: ColGroupDefinition<RowType, DataType>[];
  ....
}
```