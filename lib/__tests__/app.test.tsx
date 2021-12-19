import { LocalizationProvider } from "@mui/lab";
import MomentUtils from "@mui/lab/AdapterMoment";
import { render, RenderResult } from "@testing-library/react";
import React from "react";
import DataTable, { ColumnDefinition } from "../src";
import { getRowId } from "../src/utils";

const DATA = Array(30)
  .fill(null)
  .map((_, i) => ({
    id: `id_${i}`,
    name: `Name ${i}`,
    registrationDate: new Date(2020, 0, i),
  }));

const STRUCTURE = [
  {
    key: "id",
    title: "ID",
    dataIndex: "id",
  },
  {
    key: "name",
    title: "User's Name",
    dataIndex: "name",
    dataType: "string",
    filterColumn: true,
    sorter: true,
  },
  {
    key: "registrationDate",
    title: "Registration Date",
    dataType: "number",
    render: (record) => record.registrationDate.toLocaleDateString(),
    filterColumn: true,
    sorter: true,
  },
] as ColumnDefinition<typeof DATA[number]>[];

let component: RenderResult;

beforeEach(() => {
  component = render(
    <LocalizationProvider dateAdapter={MomentUtils}>
      <DataTable tableData={DATA} tableStructure={STRUCTURE} />
    </LocalizationProvider>,
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
  const rows = component.getAllByTestId("tableRow");
  const cells = component.getAllByTestId("DataTable-BodyCell");
  expect(cells).toHaveLength(25 * STRUCTURE.length);
  for (let i = 0; i < rows.length; i++) {
    const rowData = DATA[i];
    STRUCTURE.forEach((column) => {
      const rendered = column.render
        ? (column.render(rowData, false, getRowId(rowData, i), i) as string)
        : (rowData[column.dataIndex as keyof typeof rowData] as string);
      const cell = component.getByText(rendered);
      expect(cell).toBeTruthy();
      expect(rows[i].contains(cell)).toBe(true);
    });
  }
});
