# Features

## Currency & Number Formatting

This package exports a `numberFormatter` utility function that can be used to format numerical values. The function is also used during a Numerical Render (see [here](/columns#numerical-render-optional)).

```ts
/**
 * @param value the number to be formatted. If `value` is not a parseable number, then `value` is returned.
 * @param options the `Intl.NumberFormatOptions` options.
 * @param options.currency can be a `boolean` or an ISO 4217 currency code e.g. `"USD"` to override the default currency.
 * @param options.decimalPlaces a special field to set both the maximum and minimum decimal places.
 * @default options.currency = true
 * @returns the formatted number as a string.
 */
function numberFormatter(
  value: number,
  options: Omit<Intl.NumberFormatOptions, "currency"> & { currency?: boolean | string; decimalPlaces?: number } = {},
): string;
```

> The locale for the number formatter uses `window.navigator.language`.

### Defaults

There are a few options which are defaulted. These are:

- `currency` defaults to `true`. So, unless specifically disabled, the value number will be formatted as currency.
- If `decimalPlaces`, `minimumFractionDigits` and `maximumFractionDigits` are all unspecified, then the number of decimal places defaults to 2.

### Setting the Default Currency

By default, the currency is "GBP", but you can also use the exported `setDefaultCurrency` function to change it.

e.g. given the locale of `"en"`

```js
import { numberFormatter, setDefaultCurrency } from "@wearenova/mui-data-table";

numberFormatter(1); // £1.00
setDefaultCurrency("USD"); // Changes the default currency to US Dollar
numberFormatter(1); // $1.00
```

```ts
/**
 * @param currency the ISO 4217 currency code
 * @returns the new default currency
 */
function setDefaultCurrency(currency: string): string;
```

## CSV Export

You can enable CSV exporting via the `exportToCSVOption?: boolean;` prop on the Data Table. Setting the prop to true will make the `CSV Export` button available.

The export is handled by an internal function that renders the data just as it appears in the table. But, in some cases, the output of the render may not be stringifiable. In this case, it returns a string saying "Invalid Value".

To avoid situations like the above, the second argument to the `render` function specified whether it is being called as part of the CSV export, allowing you to return an alternate value that is displayable in CSV.

See [Custom Render](/columns#custom-render-optional) for more info on the `render` function.

You can also specify a custom filename for the produced CSV file via the `csvFilename?: string;` prop. It can include the `.csv` extension, but is not required to.

### Example

```jsx
<DataTable tableStructure={tableStructure} tableData={tableData} exportToCSVOption csvFilename="Test" />
```

## Editing

To enable editing, you need to include a column (or column group) definition which specifies a value for the `editable` field.

Currently, only cell editing is supported currently, row editing support shall come later.

Including at least one definition with the `editable` field will make the table editable for the cells specified.

If you want to explicitly enable or disable editing at the table level, then there is also the `editable` table prop which can have one of the following values:

- `true`
- `false` - disables cell/row editing.
- `"cells"`
- `"rows"`

If you want to be ready for row editing support, you can set the `editable` table prop to `"rows"` as follows:

```jsx
<DataTable tableStructure={tableStructure} tableData={tableData} editable="rows" />
```

!> This will still enable cell editing.

By default, the table data is edited by the Data Table itself. If you want control over editing, then you can specify the `onEdit` table prop.

The `onEdit` table prop is passed the following arguments:

- `update.path` - the path to the value which is to be updated.
- `update.value` - the updated value.
- `data` the row's data that the cell belongs to, prior to updating.

The function can return a `Promise`, which the Data Table awaits.

If `onEdit` is specified, the Data Table expects the function to either:

- return `undefined` and so expects the function to update the table's data or
- return any other value, which will then be treated as the updated value. The data table then uses this to update the record in place.

> To view more info on the specific options for cell editing see [here](/columns#editing-optional).

### Validation

Basic client-side validation is provided by the Data Table itself, you can also specify your own validation using the `editable.validate()` field in the column definition.

If specified, the `validate` function is passed the following arguments:

- `value` - the updated value.
- `options.data` - the row's data.
- `options.allData` - all the table's data.

If you want to display an error message as helper text, throw an `Error` or a `DataTableError` with the message to display.

!> If validation **fails**, the function **should throw**, else it will assume the validation has passed.

?> To create a `DataTableError` you can use the `createDTError(helperMessage: string, errorMessage?: string): DataTableError;` utility function which is exported from `@wearenova/mui-data-table`.

#### Server-Side Validation

To enable server-side validation, you can throw a `DataTableError` error in the `onEdit` function when validation fails. This should then include a message describing the issue and the Data Table shall catch it and display the error message as the input field's helper text.

!> If the error thrown is not a `DataTableError`, then no helper text will be shown. This is to differentiate between actual validation errors and other irrelevant errors which may occur during the `onEdit`.
