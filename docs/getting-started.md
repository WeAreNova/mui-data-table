# Getting Started

## Installation

MUI Data Table is available as an NPM package

```shell
// with npm
npm install --save @wearenova/mui-data-table

// with yarn
yarn add @wearenova/mui-data-table
```

## Peer Dependencies

You will also need to have the following packages at the specified minimum versions installed:

```json
{
  "@mui/material": "^5.0.0",
  "@mui/icons-material": "^5.0.0",
  "@mui/lab": "^5.0.0-alpha.30"
}
```

!> Note that mui-data-table is made for [@material-ui](https://v4.mui.com) v4 and not [@mui](https://mui.com) v5. Official support for v5 will come soon.

?> Because this package uses [@material-ui/pickers](https://material-ui-pickers.dev/) you will also want to follow the [installation instructions](https://material-ui-pickers.dev/getting-started/installation) for that package, if you have not already done so.
The @material-ui/pickers library is used in the filtering of MUI Data Table for date filtering. In the future this package will make the pickers library optional so that it is used if it is installed, else it uses the browser's native date pickers.

## Usage

Once all the necessary components are installed, you then need to import the `DataTable` component.

```js
// as the default export
import DataTable from "@wearenova/mui-data-table";

// or as a named export
import { DataTable } from "@wearenova/mui-data-table";
```

### Fetch the Table Data

The table data has very few restrictions around it. The restrictions that are there are that if the data is to include an `id` or `_id` field, then they need to be of type `string`. The type definition for the table data is:

```ts
interface BaseData {
  id?: string | null;
  _id?: string | null;
  [key: string]: any;
}
```

> You can see that the `id` and `_id` fields can be a `string`, `null` or `undefined`. They are used for providing a unique ID, defaulting to the index of the data in the array if they don't exist or are `null` or `undefined`.

#### Example

```ts
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const tableData: User[] = [
  {
    id: "96e2b636-99a1-4c67-9e00-df5db197914a",
    firstName: "Dave",
    lastName: "Dave",
    email: "dave@example.com",
    registrationDate: new Date()
  },
  ....
];
```

### Define the Table Structure

The table structure is an array of `ColumnDefinitions` which specify the features and how to render the cell of that column for each row.

```ts
import { ColumnDefinition } from "@wearenova/mui-data-table";

const tableStructure: ColumnDefinition<User>[] = [
  {
    key: "userId",
    dataIndex: "id",
    limitWidth: "sm",
    filterColumn: true /* or "id" or { path: true or "id", type: "string" } */,
  },
  {
    key: "userRegistrationDate",
    render: (record) => record.registrationDate.toLocaleDateString(),
    filterColumn: { path: "registrationDate", type: "date" },
    sorter: (a, b) => a.valueOf() - b.valueOf(),
  },
  { key: "userFirstName", dataIndex: "firstName", filterColumn: true, sorter: true },
  { key: "userLastName", dataIndex: "lastName", filterColumn: true, sorter: true },
  { key: "userEmail", dataIndex: "email", filterColumn: true, sorter: true },
];
```

### Putting it all Together

Once you have defined the table's structure and have got the data for the table, all that is needed is to plug it all together.

> Below is a very basic example, you can go to the demo page [here](/demo) to interact and explore a more complex implementation.

```jsx
import { ColumnDefinition, DataTable } from "@wearenova/mui-data-table";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const tableData: User[] = [
  {
    id: "96e2b636-99a1-4c67-9e00-df5db197914a",
    firstName: "Dave",
    lastName: "Dave",
    email: "dave@example.com",
    registrationDate: new Date()
  },
  ....
];

const tableStructure: ColumnDefinition<User>[] = [
  {
    key: "userId",
    dataIndex: "id",
    limitWidth: "sm",
    filterColumn: true /* or "id" or { path: true or "id", type: "string" } */,
  },
  {
    key: "userRegistrationDate",
    render: (record) => record.registrationDate.toLocaleDateString(),
    filterColumn: { path: "registrationDate", type: "date" },
    sorter: (a, b) => a.valueOf() - b.valueOf(),
  },
  { key: "userFirstName", dataIndex: "firstName", filterColumn: true, sorter: true },
  { key: "userLastName", dataIndex: "lastName", filterColumn: true, sorter: true },
  { key: "userEmail", dataIndex: "email", filterColumn: true, sorter: true },
];

function App() {
  return (
    <DataTable tableStructure={tableStructure} tableData={tableData} />
  );
}
```
