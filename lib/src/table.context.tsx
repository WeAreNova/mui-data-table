import { Checkbox } from "@material-ui/core";
import { get } from "dot-prop";
import useStoredValues from "hooks/useStoredValues.hook";
import fileDownload from "js-file-download";
import React, { PropsWithChildren, Reducer, useCallback, useEffect, useMemo, useReducer } from "react";
import type {
  ActiveFilters,
  BaseData,
  ColGroupDefinition,
  ColumnDefinition,
  DataTypes,
  OnChangeObject,
  OperatorValues,
  Sort,
  TableProps,
} from "table.types";
import {
  debounce,
  exportTableToCSV,
  getColumnTitle,
  getDataType,
  getDefaultOperator,
  getFilteredData,
  getPagedData,
  getPath,
  getRowId,
  getSortedData,
  getTableCellAlignment,
  getUnhiddenColumns,
} from "utils";

const DYNAMIC_STATE = [
  "sort",
  "rowsPerPage",
  "page",
  "activeFilters",
  "hiddenColumns",
  "pinnedColumn",
  "selectedRows",
  "loading",
  "tableData",
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

interface BaseTableState<RowType extends BaseData = BaseData, AllDataType extends RowType[] = RowType[]>
  extends Pick<
    TableProps<RowType, AllDataType>,
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
    | "onEdit"
    | "resizeable"
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
  isMacOS: boolean;
  editable: false | "cells" | "rows";
}

type FlattenedStructure<RowType extends BaseData, AllDataType extends RowType[]> = Array<
  ColumnDefinition<RowType, AllDataType> | ColGroupDefinition<RowType, AllDataType>
> & { notHidden: Array<FlattenedStructure<RowType, AllDataType>[number] & { hidden: false | undefined }> };

export type Structure<RowType extends BaseData, AllDataType extends RowType[]> = ColumnDefinition<
  RowType,
  AllDataType
>[] & {
  flattened: FlattenedStructure<RowType, AllDataType>;
  notHidden: Array<ColumnDefinition<RowType, AllDataType> & { hidden: false | undefined }>;
};

export interface TableState<RowType extends BaseData = BaseData, AllDataType extends RowType[] = RowType[]>
  extends Omit<BaseTableState<RowType, AllDataType>, "onChange"> {
  count: number;
  onChange?(queryParams?: OnChangeObject): Promise<AllDataType>;
  allTableData: AllDataType;
  update: Update;
  structure: Structure<RowType, AllDataType>;
  filterOptions: Array<{ label: string; value: string; type: DataTypes; defaultOperator: OperatorValues }>;
  resizeable: boolean;
  rowOptions?: Omit<NonNullable<BaseTableState<RowType, AllDataType>["rowOptions"]>, "alternateRowColor">;
}

export type TableContextValue<RowType extends BaseData, AllDataType extends RowType[]> = Pick<
  TableProps<RowType, AllDataType>,
  | "count"
  | "disablePagination"
  | "onChange"
  | "rowClick"
  | "rowOptions"
  | "tableData"
  | "tableStructure"
  | "onSelectedRowsChange"
  | "selectGroupBy"
  | "onEdit"
> &
  Required<
    Pick<
      TableProps<RowType, AllDataType>,
      | "csvFilename"
      | "enableHiddenColumns"
      | "rowsPerPageDefault"
      | "rowsSelectable"
      | "defaultSort"
      | "editable"
      | "resizeable"
    >
  >;

type TableReducer<RowType extends BaseData, AllDataType extends RowType[]> = Reducer<
  BaseTableState<RowType, AllDataType>,
  TableAction
>;

const TableContext = React.createContext<TableState<any, any>>({} as TableState);
TableContext.displayName = "DataTableContext";

const reducer: TableReducer<any, any> = (state, action) =>
  typeof action === "function"
    ? { ...state, ...action(state) }
    : {
        ...state,
        ...Object.entries(action).reduce<Partial<DynamicState>>((prev, [key, value]) => {
          return {
            ...prev,
            [key]: typeof value === "function" ? value(state[key as keyof BaseTableState] as never) : value,
          };
        }, {} as Partial<DynamicState>),
      };

/**
 * Internal Table Context
 *
 * @package
 */
export const TableProvider = <RowType extends BaseData, AllDataType extends RowType[]>({
  value: { defaultSort, rowsPerPageDefault, csvFilename, count, editable, onChange: baseOnChange, ...value },
  ...props
}: PropsWithChildren<{
  value: TableContextValue<RowType, AllDataType>;
}>) => {
  const stored = useStoredValues(defaultSort, rowsPerPageDefault);
  const isMacOS = useMemo(() => typeof window !== "undefined" && window.navigator.userAgent.indexOf("Mac") !== -1, []);
  const tableState = useMemo(
    () => ({
      ...value,
      ...stored,
      editable: editable === true ? "cells" : editable,
      loading: false,
      page: 0,
      hideColumns: false,
      hiddenColumns: {},
      pinnedColumn: "",
      selectedRows: {},
      isMacOS,
    }),
    [editable, isMacOS, stored, value],
  );

  const [state, dispatch] = useReducer<TableReducer<RowType, AllDataType>>(reducer, tableState);
  const update = useMemo(() => {
    function updateFunction(partialState: Partial<Pick<BaseTableState, typeof DYNAMIC_STATE[number]>>) {
      dispatch(
        Object.entries(partialState).reduce(
          (prev, [key, updateValue]) =>
            DYNAMIC_STATE.includes(key as typeof DYNAMIC_STATE[number]) ? { ...prev, [key]: updateValue } : prev,
          {},
        ),
      );
    }
    DYNAMIC_STATE.forEach((curr) => {
      (updateFunction as any)[curr] = (
        arg: BaseTableState[typeof curr] | ((currState: BaseTableState[typeof curr]) => BaseTableState[typeof curr]),
      ) => dispatch({ [curr]: arg });
    });
    return updateFunction as Update;
  }, []);

  useEffect(() => {
    update.tableData(tableState.tableData);
  }, [tableState.tableData, update]);

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
      if (!baseOnChange) return;
      if (!isExport) update.loading(true);
      const data = await baseOnChange({ ...queryParams }, isExport);
      if (!isExport) update.loading(false);
      return data;
    },
    [baseOnChange, update],
  );

  const handleChange = useMemo(() => baseOnChange && debounce(onChange), [onChange, baseOnChange]);
  useEffect(() => {
    handleChange?.(onChangeObject);
  }, [handleChange, onChangeObject]);

  const [tableData, tableCount] = useMemo(() => {
    const numberCount = count && Number(count);
    if (baseOnChange) return [state.tableData, numberCount || state.tableData.length];
    const filteredData = getFilteredData(state.tableData, state.activeFilters);
    const sortedData = getSortedData(filteredData, state.sort, tableState.tableStructure);
    const pagedData = tableState.disablePagination
      ? sortedData
      : getPagedData(sortedData, { limit: state.rowsPerPage, page: state.page });
    return [pagedData, numberCount || filteredData.length];
  }, [
    count,
    state.activeFilters,
    state.page,
    state.rowsPerPage,
    state.sort,
    state.tableData,
    tableState.disablePagination,
    baseOnChange,
    tableState.tableStructure,
  ]);

  const exportToCSV = useCallback(async () => {
    let data = state.tableData;
    if (baseOnChange) {
      data = await onChange({ ...onChangeObject, limit: undefined, skip: 0 }, true);
      await onChange(onChangeObject);
    }
    const csvString = await exportTableToCSV(data, tableState.tableStructure);
    const filename = csvFilename.endsWith(".csv") ? csvFilename : `${csvFilename}.csv`;
    fileDownload(csvString, filename, "text/csv;charset=utf-16;");
  }, [csvFilename, onChange, onChangeObject, baseOnChange, state.tableData, tableState.tableStructure]);

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
          .filter((row) => get(data, tableState.selectGroupBy!) === get(row, tableState.selectGroupBy!));
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
    if (noRowsSelected) return update.selectedRows({});
    update((currState) => ({
      ...currState,
      selectedRows: currState.tableData.reduce(
        (prev, row, rowIndex) => ({ ...prev, [getRowId(row, rowIndex)]: row }),
        {},
      ),
    }));
  }, [noRowsSelected, update]);

  const structure = useMemo<Structure<RowType, AllDataType>>(() => {
    const fullStructure = [
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
      ...tableState.tableStructure.map(
        (column) =>
          ({
            ...column,
            ...(!column.colGroup
              ? { align: getTableCellAlignment(column, tableData?.[0]) }
              : {
                  align: "center",
                  colGroup: column.colGroup.map((colGroupColumn) => ({
                    ...colGroupColumn,
                    align: getTableCellAlignment(colGroupColumn, tableData?.[0]),
                  })),
                }),
          } as const),
      ),
    ] as Structure<RowType, AllDataType>;
    fullStructure.notHidden = getUnhiddenColumns(fullStructure);

    fullStructure.flattened = fullStructure.flatMap<FlattenedStructure<RowType, AllDataType>[number]>((struct) => {
      if (!struct.colGroup || state.hiddenColumns[struct.key]) return [struct];
      return struct.colGroup.map<ColGroupDefinition<RowType, AllDataType>>((colGroup) => ({
        ...colGroup,
        isColGroup: true,
        hasColGroupFooter: Boolean(struct.footer),
      }));
    }) as FlattenedStructure<RowType, AllDataType>;
    fullStructure.flattened.notHidden = getUnhiddenColumns(fullStructure.flattened);

    return fullStructure;
  }, [
    handleSelectAll,
    handleSelectedChange,
    noRowsSelected,
    state.hiddenColumns,
    state.selectedRows,
    tableData,
    tableState.rowsSelectable,
    tableState.selectGroupBy,
    tableState.tableStructure,
  ]);

  const filterOptions = useMemo(
    () =>
      state.tableStructure
        .filter((c) => c.filterColumn || c.colGroup?.some((cg) => cg.filterColumn))
        .flatMap((c) => {
          const title = getColumnTitle(c.title, state.tableData);
          return [
            { ...c, title },
            ...(c.colGroup?.map((cg) => {
              const nestedTitle = getColumnTitle(cg.title, state.tableData);
              return { ...cg, title: `${title} - ${nestedTitle}` };
            }) || []),
          ];
        })
        .filter((c) => c.filterColumn)
        .map((c) => {
          const type = getDataType(c.filterColumn, c);
          return {
            label: c.title,
            value: getPath(c.filterColumn, c),
            type,
            defaultOperator: getDefaultOperator(c.filterColumn, type),
          };
        }),
    [state.tableData, state.tableStructure],
  );

  const providerValue = useMemo<TableState>(
    () =>
      ({
        ...state,
        onChange: handleChange,
        tableData,
        allTableData: state.tableData,
        count: tableCount,
        exportToCSV,
        structure,
        update,
        filterOptions,
      } as TableState),
    [exportToCSV, filterOptions, handleChange, state, structure, tableCount, tableData, update],
  );

  return <TableContext.Provider value={providerValue}>{props.children}</TableContext.Provider>;
};

export default TableContext;
