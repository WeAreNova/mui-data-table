# CSV Export

You can enable CSV exporting via the `exportToCSVOption?: boolean;` prop on the table. Setting the prop to true will make the `CSV Export` button available.

The export is handled by an internal function that renders the data just as it appears in the table. But, in some cases, the output of the render may not be stringifiable.

The
