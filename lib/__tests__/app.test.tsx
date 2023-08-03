import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import { fireEvent, render, RenderResult } from "@testing-library/react";
import React from "react";
import DataTable, { ColumnDefinition } from "../src";
import { getRowId } from "../src/utils";

const DATA = Array(30)
  .fill(null)
  .map((_, i) => ({
    id: `id_${i}`,
    name: `Name ${i}`,
    firstName: `FirstName ${i}`,
    lastName: `Name ${i}`,
    registrationDate: new Date(2020, 0, i),
  }));

const STRUCTURE = [
  {
    key: "id",
    title: "ID",
    dataIndex: "id"
  },
  {
    key: "name",
    title: "User's Name",
    pinnable: true,
    footer: (data) => `total: ${data.length}`,
    colGroup: [
      {
        key: "firstName",
        title: "first name",
        dataIndex: "firstName",
        sorter: true,
        filterColumn: true,
        pinnable: true,
      },
      {
        key: "lastName",
        title: "lastName",
        dataIndex: "lastName",
        sorter: true,
        filterColumn: true,
        pinnable: true,
      }
    ]
  },
  {
    key: "registrationDate",
    title: "Registration Date",
    dataType: "number",
    render: (record) => record.registrationDate.toLocaleDateString(),
    filterColumn: true,
    sorter: true,
    pinnable: true,
  },
] as ColumnDefinition<typeof DATA[number]>[];

let component: RenderResult;

beforeEach(() => {
  component = render(
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <DataTable tableData={DATA} tableStructure={STRUCTURE} />
    </MuiPickersUtilsProvider>,
  );
});

afterEach(() => {
  component.unmount();
});

it("should render all visible columns", async function () {
  STRUCTURE.forEach((column) => {
    const renderedTitle = typeof column.title === "function" ? column.title(DATA) : column.title;
    expect(component.getByText(renderedTitle)).toBeTruthy();
  });
});

it("should render 25 rows", async function () {
  expect(component.getAllByTestId("tableRow")).toHaveLength(25);
});

it("should render row cells correctly", async function () {
  const renderCell = (rowData: any, column: any, index: number) => column.render
    ? column.render(rowData, false, getRowId(rowData, index), index) as string
    : rowData[column.dataIndex as keyof typeof rowData] as string;

  const assertCellRenderedCorrectly = (rowData: any, column: any, index: number) => {
    const rendered = renderCell(rowData, column, index);
    const cell = component.getByText(rendered);
    expect(cell).toBeTruthy();
    expect(rows[index].contains(cell)).toBe(true);
  };

  const rows = component.getAllByTestId("tableRow");
  const cells = component.getAllByTestId("DataTable-BodyCell");
  let columns = 0;
  STRUCTURE.forEach(struct => columns += (struct.colGroup ? struct.colGroup?.length : 1));
  expect(cells).toHaveLength(25 * columns);
  for (let i = 0; i < rows.length; i++) {
    const rowData = DATA[i];
    STRUCTURE.forEach((column) => {
      if (column.colGroup) {
        column.colGroup.forEach(subColumn => {
          assertCellRenderedCorrectly(rowData, subColumn, i);
        })
      } else {
        assertCellRenderedCorrectly(rowData, column, i);

      }
    });
  }
});

it("should pin and unpin columns", async function () {
  //  Check if columns can be pinned
  const pinnableColumns = STRUCTURE.filter((column) => column.pinnable);
  pinnableColumns.forEach((column) => {
    const columnHeader = component.getByTestId(`${column.key}`);
    const pinButton = columnHeader.querySelector(".MuiIconButton-root");
    expect(pinButton).toBeTruthy(); // Pin button should exist
    if (pinButton) {
      fireEvent.click(pinButton); // Simulate a click on the pin button
      expect(pinButton.classList.contains("MuiIconButton-colorPrimary")).toBe(true); // Check if the class is applied after the click
    }
  });
});

