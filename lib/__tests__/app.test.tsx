import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import { render, RenderResult, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { act } from "react-dom/test-utils";
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
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <DataTable tableData={DATA} tableStructure={STRUCTURE} />
    </MuiPickersUtilsProvider>,
  );
});

afterEach(() => {
  component.unmount();
});

describe("row and column rendering", function () {
  it("should render all visible columns", () => {
    STRUCTURE.forEach((column) => {
      const renderedTitle = typeof column.title === "function" ? column.title(DATA) : column.title;
      expect(component.getByText(renderedTitle)).toBeTruthy();
    });
  });

  it("should render 25 rows", () => {
    expect(component.getAllByTestId("DT-TableRow")).toHaveLength(25);
  });

  it("should render row cells correctly", () => {
    const rows = component.getAllByTestId("DT-TableRow");
    const cells = component.getAllByTestId("DT-BodyCell");
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
});

describe("filtering", function () {
  let filterButtons: HTMLElement[], clickFilterButton: (index?: number) => void;
  beforeEach(() => {
    filterButtons = component.getAllByTestId("DT-FilterButton");
    clickFilterButton = (index = 0) => filterButtons[index].click();
  });

  it("should show the filter button for filterable columns", () => {
    expect(filterButtons).toHaveLength(STRUCTURE.filter((column) => column.filterColumn).length);
  });

  it("should show the filter panel", () => {
    clickFilterButton();
    expect(component.getByTestId("DT-FilterRow")).toBeTruthy();
  });

  it("should filter the table data", async () => {
    clickFilterButton();
    jest.useFakeTimers();
    await act(async () => {
      userEvent.type(component.getByTestId("DT-FilterValueInput"), "Name 25");
      jest.advanceTimersByTime(500);
    });
    jest.useRealTimers();

    await waitForElementToBeRemoved(component.getAllByTestId("DT-TableRow").pop(), { timeout: 1100 });
    expect(component.getAllByTestId("DT-TableRow")).toHaveLength(1);
  });

  xit("should reset the filter value if it is the last one", () => {
    clickFilterButton();
    const filterInput = component.getByTestId("DT-FilterValueInput") as HTMLInputElement;
    expect(filterInput).toBeTruthy();

    userEvent.type(filterInput, "Name 25");
    expect(filterInput.value).toBe("Name 25");

    component.getByTestId("DT-RemoveFilterButton").click();
    expect(filterInput.value).toBeUndefined();
  });

  it("should add a new filter row", () => {
    clickFilterButton();
    component.getByTestId("DT-AddFilterButton").click();
    expect(component.getAllByTestId("DT-FilterRow")).toHaveLength(2);
  });

  it("should remove a filter row", () => {
    clickFilterButton();
    component.getByTestId("DT-AddFilterButton").click();
    component.getAllByTestId("DT-RemoveFilterButton")[0].click();
    expect(component.getAllByTestId("DT-FilterRow")).toHaveLength(1);
  });

  it("should filter multiple columns", async () => {
    clickFilterButton();
    await act(async () => {
      userEvent.type(component.getByTestId("DT-FilterValueInput"), "Name 25");
      component.getByTestId("DT-AddFilterButton").click();

      await userEvent.selectOptions(component.getAllByTestId("DT-FilterColumnSelect")[1], "Registration Date");
      await userEvent.selectOptions(component.getAllByTestId("DT-FilterOperatorSelect")[1], ">");
      userEvent.type(component.getAllByTestId("DT-FilterValueInput")[1], "January 24th");
    });

    jest.useFakeTimers();
    jest.advanceTimersByTime(500);
    jest.useRealTimers();

    await waitForElementToBeRemoved(component.getAllByTestId("DT-TableRow").pop(), { timeout: 2000 });
    expect(component.getAllByTestId("DT-TableRow")).toHaveLength(1);
  });
});
