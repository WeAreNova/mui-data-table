# Features

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
