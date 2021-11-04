import { Checkbox, debounce } from "@material-ui/core";
import { useUtils } from "@material-ui/pickers";
import { get } from "dot-prop";
import fileDownload from "js-file-download";
import React, { PropsWithChildren, Reducer, useCallback, useEffect, useMemo, useReducer } from "react";
import type {
  ActiveFilters,
  BaseData,
  ColGroupDefinition,
  ColumnDefinition,
  OnChangeObject,
  Sort,
  TableProps,
} from "./table.types";
import {
  exportTableToCSV,
  getFilteredData,
  getPagedData,
  getRowId,
  getSortedData,
  getTableCellAlignment,
} from "./utils";

const DYNAMIC_STATE = [
  "sort",
  "rowsPerPage",
  "page",
  "activeFilters",
  "hiddenColumns",
  "pinnedColumn",
  "selectedRows",
  "loading",
] as const;

type DynamicState = Pick<BaseTableState, typeof DYNAMIC_STATE[number]>;

type TableAction =
  | Partial<DynamicState>
  | ((currState: DynamicState) => Partial<DynamicState>)
  | Partial<{ [key in keyof DynamicState]: DynamicState[key] | ((currState: DynamicState[key]) => DynamicState[key]) }>;

type Update = {
  [key in keyof DynamicState]: (
    value: DynamicState[key] | ((currState: DynamicState[key]) => DynamicState[key]),
  ) => void;
} & {
  (value: TableAction): void;
};

interface BaseTableState<RowType extends BaseData = BaseData, DataType extends RowType[] = RowType[]>
  extends Pick<
    TableProps<RowType, DataType>,
    | "tableData"
    | "tableStructure"
    | "onChange"
    | "onSelectedRowsChange"
    | "enableHiddenColumns"
    | "rowsSelectable"
    | "selectGroupBy"
    | "rowsPerPageDefault"
    | "rowOptions"
    | "rowClick"
  > {
  sort: Sort;
  rowsPerPage: number | undefined;
  page: number;
  activeFilters: ActiveFilters<RowType>;
  hiddenColumns: { [column: string]: boolean };
  pinnedColumn: string;
  selectedRows: { [rowId: string]: RowType };
  loading: boolean;
  exportToCSV?(): Promise<void>;
}

export interface TableState<RowType extends BaseData = BaseData, DataType extends RowType[] = RowType[]>
  extends Omit<BaseTableState<RowType, DataType>, "onChange"> {
  count: number;
  onChange?(queryParams?: OnChangeObject): Promise<DataType>;
  allTableData: DataType;
  update: Update;
  filteredTableStructure: ColumnDefinition<RowType, DataType>[];
  flattenedTableStructure: Array<ColumnDefinition<RowType, DataType> | ColGroupDefinition<RowType, DataType>>;
  isMacOS: boolean;
}

export type TableContextValue<RowType extends BaseData, DataType extends RowType[]> = Pick<
  TableProps<RowType, DataType>,
  | "count"
  | "csvFilename"
  | "disablePagination"
  | "enableHiddenColumns"
  | "onChange"
  | "rowClick"
  | "rowOptions"
  | "rowsPerPageDefault"
  | "tableData"
  | "tableStructure"
  | "rowsSelectable"
  | "onSelectedRowsChange"
  | "selectGroupBy"
  | "defaultSort"
>;

type TableReducer<RowType extends BaseData, DataType extends RowType[]> = Reducer<
  BaseTableState<RowType, DataType>,
  TableAction
>;

const TableContext = React.createContext<TableState<any, any>>({} as TableState);
TableContext.displayName = "TableContext";

const reducer: TableReducer<any, any> = (state, action) =>
  typeof action === "function"
    ? { ...state, ...action(state) }
    : {
        ...state,
        ...Object.entries(action).reduce<Partial<DynamicState>>(
          (prev, [key, value]) => ({
            ...prev,
            [key]: typeof value === "function" ? value(state[key as keyof BaseTableState] as never) : value,
          }),
          {} as Partial<DynamicState>,
        ),
      };

/**
 * Internal Table Context
 *
 * @package
 */
export const TableProvider = <RowType extends BaseData, DataType extends RowType[]>({
  value: { defaultSort, rowsPerPageDefault, csvFilename, count, ...value },
  ...props
}: PropsWithChildren<{
  value: TableContextValue<RowType, DataType>;
}>) => {
  const pickersUtils = useUtils();
  const stored = useMemo(() => {
    const defaultStored = {
      sort: defaultSort!,
      rowsPerPage: rowsPerPageDefault!,
      activeFilters: [] as ActiveFilters,
    };
    if (typeof window === "undefined") return defaultStored;
    const sessionChangeObjStr = sessionStorage.getItem(window.location.pathname);
    if (!sessionChangeObjStr) return defaultStored;

    const parsed = JSON.parse(sessionChangeObjStr) as OnChangeObject;

    const filters = parsed.columnFilters || defaultStored.activeFilters;
    return {
      sort:
        parsed.sortKey && parsed.sortDirection
          ? { key: parsed.sortKey, direction: parsed.sortDirection }
          : defaultStored.sort,
      rowsPerPage: parsed.limit || defaultStored.rowsPerPage,
      activeFilters: filters,
    };
  }, [defaultSort, rowsPerPageDefault]);

  const isMacOS = useMemo(() => typeof window !== "undefined" && window.navigator.userAgent.indexOf("Mac") !== -1, []);

  const tableState = useMemo(
    () => ({
      ...value,
      ...stored,
      loading: false,
      page: 0,
      hideColumns: false,
      hiddenColumns: {},
      pinnedColumn: "",
      selectedRows: {},
      isMacOS,
    }),
    [isMacOS, stored, value],
  );

  const [state, dispatch] = useReducer<TableReducer<RowType, DataType>>(reducer, tableState);

  const update = useMemo(() => {
    const updateFunction = (value: Partial<Pick<BaseTableState, typeof DYNAMIC_STATE[number]>>) => {
      dispatch(
        Object.entries(value).reduce(
          (prev, [key, value]) =>
            DYNAMIC_STATE.includes(key as typeof DYNAMIC_STATE[number]) ? { ...prev, [key]: value } : prev,
          {},
        ),
      );
    };
    DYNAMIC_STATE.forEach((curr) => {
      (updateFunction as any)[curr] = (
        arg: BaseTableState[typeof curr] | ((currState: BaseTableState[typeof curr]) => BaseTableState[typeof curr]),
      ) => dispatch({ [curr]: arg });
    });
    return updateFunction as Update;
  }, []);

  const onChangeObject = useMemo<OnChangeObject>(
    () => ({
      sortKey: state.sort.key,
      sortDirection: state.sort.direction,
      limit: !tableState.disablePagination && state.rowsPerPage,
      skip: state.rowsPerPage ? state.page * state.rowsPerPage : 0,
      columnFilters: state.activeFilters,
    }),
    [
      state.sort.key,
      state.sort.direction,
      state.rowsPerPage,
      state.page,
      state.activeFilters,
      tableState.disablePagination,
    ],
  );

  useEffect(() => {
    window.sessionStorage.setItem(window.location.pathname, JSON.stringify(onChangeObject));
  }, [onChangeObject]);

  const onChange = useCallback(
    async (queryParams = {}, isExport = false) => {
      if (!tableState.onChange) return;
      dispatch({ loading: true });
      if (!isExport) update.loading(true);
      const data = await tableState.onChange!({ ...queryParams }, isExport);
      if (!isExport) update.loading(false);
      return data;
    },
    [tableState.onChange, update],
  );

  const handleChange = useMemo(() => tableState.onChange && debounce(onChange, 250), [onChange, tableState.onChange]);

  useEffect(() => {
    handleChange?.(onChangeObject);
  }, [handleChange, onChangeObject]);

  const [tableData, tableCount] = useMemo(() => {
    const numberCount = count && Number(count);
    if (tableState.onChange) return [tableState.tableData, numberCount || tableState.tableData.length];
    const filteredData = getFilteredData(tableState.tableData, state.activeFilters, pickersUtils);
    const sortedData = getSortedData(filteredData, state.sort, tableState.tableStructure);
    const pagedData = tableState.disablePagination
      ? sortedData
      : getPagedData(sortedData, { limit: state.rowsPerPage, page: state.page });
    return [pagedData, numberCount || filteredData.length];
  }, [
    count,
    pickersUtils,
    state.activeFilters,
    state.page,
    state.rowsPerPage,
    state.sort,
    tableState.disablePagination,
    tableState.onChange,
    tableState.tableData,
    tableState.tableStructure,
  ]);

  const exportToCSV = useCallback(async () => {
    let data = tableState.tableData;
    if (tableState.onChange) {
      data = await onChange({ ...onChangeObject, limit: undefined, skip: 0 }, true);
      await onChange(onChangeObject);
    }
    const csvString = await exportTableToCSV(data, tableState.tableStructure as any);
    const filename = csvFilename!.endsWith(".csv") ? csvFilename! : `${csvFilename}.csv`;
    fileDownload(new Blob([csvString]), filename, "text/csv;charset=utf-16;");
  }, [csvFilename, onChange, onChangeObject, tableState.onChange, tableState.tableData, tableState.tableStructure]);

  const handleSelectedChange = useCallback(
    (data: RowType, rowId: string, dataArrayIndex: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const updatedSelectedRows = { ...state.selectedRows };
      if (updatedSelectedRows[rowId]) {
        delete updatedSelectedRows[rowId];
      } else {
        updatedSelectedRows[rowId] = data;
      }
      if (tableState.selectGroupBy) {
        const extraRows = [...tableData]
          .slice(dataArrayIndex + 1)
          .filter((value) => get(data, tableState.selectGroupBy!) === get(value, tableState.selectGroupBy!));
        extraRows.forEach((row, extraRowIndex) => {
          const extraRowId = getRowId(row, dataArrayIndex + (extraRowIndex + 1));
          if (updatedSelectedRows[extraRowId]) {
            delete updatedSelectedRows[extraRowId];
          } else {
            updatedSelectedRows[extraRowId] = row;
          }
        });
      }
      update.selectedRows(updatedSelectedRows);
    },
    [tableData, state.selectedRows, tableState.selectGroupBy, update],
  );

  const noRowsSelected = useMemo(() => Object.values(state.selectedRows).length, [state.selectedRows]);

  const handleSelectAll = useCallback(() => {
    if (noRowsSelected) {
      return update.selectedRows({});
    }
    update.selectedRows(
      tableData.reduce((prev, value, rowIndex) => ({ ...prev, [getRowId(value, rowIndex)]: value }), {}),
    );
  }, [noRowsSelected, tableData, update]);

  const filteredTableStructure = useMemo<ColumnDefinition<RowType, DataType>[]>(
    () => [
      ...(!tableState.rowsSelectable
        ? []
        : [
            {
              key: "selectCheckbox",
              align: "center",
              groupBy: tableState.selectGroupBy,
              title: (
                <Checkbox
                  onClick={handleSelectAll}
                  checked={Boolean(noRowsSelected)}
                  indeterminate={noRowsSelected > 0 && noRowsSelected < tableData.length}
                />
              ),
              render: (data: RowType, isCSVExport: boolean, rowId: string, dataArrayIndex: number) => {
                if (isCSVExport || !tableState.rowsSelectable) return null;
                return (
                  <Checkbox
                    onClick={(e) => handleSelectedChange(data, rowId, dataArrayIndex, e)}
                    checked={Boolean(state.selectedRows[rowId])}
                  />
                );
              },
            } as const,
          ]),
      ...tableState.tableStructure.map((structure) =>
        structure.colGroup
          ? ({
              ...structure,
              align: "center",
              colGroup: structure.colGroup.map((colGroupStructure) => ({
                ...colGroupStructure,
                align: getTableCellAlignment(colGroupStructure, tableData?.[0]),
              })),
            } as const)
          : {
              ...structure,
              align: getTableCellAlignment(structure, tableData?.[0]),
            },
      ),
    ],
    [
      tableState.rowsSelectable,
      tableState.selectGroupBy,
      tableState.tableStructure,
      handleSelectAll,
      noRowsSelected,
      tableData,
      state.selectedRows,
      handleSelectedChange,
    ],
  );

  const flattenedTableStructure = useMemo(
    () =>
      filteredTableStructure.flatMap<ColumnDefinition<RowType, DataType> | ColGroupDefinition<RowType, DataType>>(
        (struct) =>
          !struct.colGroup || state.hiddenColumns[struct.key]
            ? struct
            : struct.colGroup.map((colGroup) => ({
                ...colGroup,
                isColGroup: true,
                hasColGroupFooter: Boolean(struct.footer),
              })),
      ),
    [filteredTableStructure, state.hiddenColumns],
  );

  const providerValue = useMemo<TableState>(
    () =>
      ({
        ...state,
        onChange: handleChange,
        tableData,
        allTableData: tableState.tableData,
        count: tableCount,
        exportToCSV,
        filteredTableStructure,
        flattenedTableStructure,
        update,
      } as unknown as TableState),
    [
      state,
      handleChange,
      tableData,
      tableState.tableData,
      tableCount,
      exportToCSV,
      filteredTableStructure,
      flattenedTableStructure,
      update,
    ],
  );

  return <TableContext.Provider value={providerValue}>{props.children}</TableContext.Provider>;
};

export default TableContext;
