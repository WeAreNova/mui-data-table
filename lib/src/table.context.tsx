import BodyCheckbox from "Body/BodyCheckbox.component";
import HeaderCheckbox from "Header/HeaderCheckbox.component";
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
  getSortedData,
  getTableCellAlignment,
  getUnhiddenColumns,
  getWindow,
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

interface StoredValues {
  sort: Sort;
  rowsPerPage: number;
  activeFilters: ActiveFilters;
}

interface BaseTableState<RowType extends BaseData = BaseData, AllDataType extends RowType[] = RowType[]>
  extends TableProps<RowType, AllDataType> {
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
  csvFilename: string;
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
  numRowsSelected: number;
}

type TableReducer<RowType extends BaseData, AllDataType extends RowType[]> = Reducer<
  BaseTableState<RowType, AllDataType>,
  TableAction
>;

const TableContext = React.createContext<TableState<any, any>>({} as TableState);
TableContext.displayName = "DataTableContext";

const filterUpdates = <T extends { [key: string]: any }>(obj: T) => {
  const res = {} as Pick<T, typeof DYNAMIC_STATE[number]>;
  DYNAMIC_STATE.forEach((key) => {
    if (key in obj) res[key] = obj[key];
  });
  return res;
};

const reducer: TableReducer<any, any> = (state, action) =>
  typeof action === "function"
    ? { ...state, ...filterUpdates(action(state)) }
    : {
        ...state,
        ...Object.entries(action).reduce<Partial<DynamicState>>((prev, [key, value]) => {
          return {
            ...prev,
            [key]: typeof value === "function" ? value(state[key as keyof BaseTableState] as never) : value,
          };
        }, {} as Partial<DynamicState>),
      };

function getStoredValues(
  defaultSort: Sort = { key: null, direction: undefined },
  defaultRowsPerPage = 25,
): StoredValues {
  const win = getWindow();
  const defaultStored = {
    sort: defaultSort,
    rowsPerPage: defaultRowsPerPage,
    activeFilters: [] as ActiveFilters,
  };
  if (!win) return defaultStored;
  const sessionChangeObjStr = sessionStorage.getItem(win.location.pathname);
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
}

function initialise<RowType extends BaseData, AllDataType extends RowType[]>(
  state: TableProps<RowType, AllDataType>,
): BaseTableState<RowType, AllDataType> {
  const stored = getStoredValues(state.defaultSort, state.rowsPerPageDefault);
  const initialEditable =
    state.editable ?? state.tableStructure.some((c) => c.editable || Boolean(c.colGroup?.some((cg) => cg.editable)));
  return {
    defaultSort: { key: null, direction: undefined },
    rowsPerPageDefault: 25,
    csvFilename: "DataTableExport.csv",
    enableHiddenColumns: false,
    rowsSelectable: false,
    resizeable: false,
    ...state,
    ...stored,
    rowOptions: state.rowOptions && {
      ...state.rowOptions,
      alternateRowColour: state.rowOptions.alternateRowColour || state.rowOptions.alternateRowColor,
    },
    editable: initialEditable === true ? "cells" : initialEditable,
    loading: false,
    page: 0,
    hiddenColumns: {},
    pinnedColumn: "",
    selectedRows: {},
    isMacOS: getWindow()?.navigator.userAgent.indexOf("Mac") !== -1,
  };
}

/**
 * Internal Table Context
 *
 * @package
 */
export const TableProvider = <RowType extends BaseData, AllDataType extends RowType[]>({
  value,
  ...props
}: PropsWithChildren<{ value: TableProps<RowType, AllDataType> }>) => {
  const [state, dispatch] = useReducer<TableReducer<RowType, AllDataType>, TableProps<RowType, AllDataType>>(
    reducer,
    value,
    initialise,
  );
  useEffect(() => dispatch(value), [value]);

  const update = useMemo(() => {
    function updateFunction(
      partialState: Partial<DynamicState> | ((currState: DynamicState) => Partial<DynamicState>),
    ) {
      dispatch(typeof partialState === "function" ? partialState : filterUpdates(partialState));
    }
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
      limit: !state.disablePagination && state.rowsPerPage,
      skip: state.rowsPerPage ? state.page * state.rowsPerPage : 0,
      columnFilters: state.activeFilters,
    }),
    [state.activeFilters, state.disablePagination, state.page, state.rowsPerPage, state.sort.direction, state.sort.key],
  );

  useEffect(() => {
    window.sessionStorage.setItem(window.location.pathname, JSON.stringify(onChangeObject));
  }, [onChangeObject]);

  const onChange = useCallback(
    async (queryParams = {}, isExport = false) => {
      if (!value.onChange) return;
      if (!isExport) update.loading(true);
      const data = await value.onChange({ ...queryParams }, isExport);
      if (!isExport) update.loading(false);
      return data;
    },
    [update, value],
  );
  const debouncedOnChange = useMemo(() => value.onChange && debounce(onChange), [onChange, value.onChange]);

  useEffect(() => {
    debouncedOnChange?.(onChangeObject);
  }, [debouncedOnChange, onChangeObject]);

  const _filtered = useMemo(
    () => (value.onChange ? state.tableData : getFilteredData(state.tableData, state.activeFilters)),
    [state.activeFilters, state.tableData, value.onChange],
  );
  const _sorted = useMemo(
    () => (value.onChange ? _filtered : getSortedData(_filtered, state.sort, state.tableStructure)),
    [_filtered, state.sort, state.tableStructure, value.onChange],
  );
  const tableData = useMemo(
    () =>
      value.onChange || state.disablePagination
        ? _sorted
        : getPagedData(_sorted, { limit: state.rowsPerPage, page: state.page }),
    [_sorted, state.disablePagination, state.page, state.rowsPerPage, value.onChange],
  );
  const tableCount = useMemo(() => {
    const numberCount = value.count && Number(value.count);
    return numberCount || _filtered.length;
  }, [_filtered.length, value.count]);

  const exportToCSV = useCallback(async () => {
    let data = state.tableData;
    if (value.onChange) {
      data = await onChange({ ...onChangeObject, limit: undefined, skip: 0 }, true);
      await onChange(onChangeObject);
    }
    const csvString = await exportTableToCSV(data, state.tableStructure);
    const filename = state.csvFilename.endsWith(".csv") ? state.csvFilename : `${state.csvFilename}.csv`;
    fileDownload(csvString, filename, "text/csv;charset=utf-16;");
  }, [onChange, onChangeObject, state.csvFilename, state.tableData, state.tableStructure, value.onChange]);

  const numRowsSelected = useMemo(() => Object.values(state.selectedRows).length, [state.selectedRows]);

  const fullStructure = useMemo<Structure<RowType, AllDataType>>(
    () =>
      [
        ...(!state.rowsSelectable
          ? []
          : [
              {
                key: "selectCheckbox",
                align: "center",
                groupBy: state.selectGroupBy,
                title: <HeaderCheckbox />,
                render: (data: RowType, isCSVExport: boolean, rowId: string, dataArrayIndex: number) => (
                  <BodyCheckbox record={data} isCSVExport={isCSVExport} rowId={rowId} dataArrayIndex={dataArrayIndex} />
                ),
              },
            ]),
        ...state.tableStructure.map(
          (column) =>
            ({
              ...column,
              ...(!column.colGroup
                ? { align: getTableCellAlignment(column, value.tableData?.[0]) }
                : {
                    align: "center",
                    colGroup: column.colGroup.map((colGroupColumn) => ({
                      ...colGroupColumn,
                      align: getTableCellAlignment(colGroupColumn, value.tableData?.[0]),
                    })),
                  }),
            } as const),
        ),
      ] as Structure<RowType, AllDataType>,
    [state.rowsSelectable, state.selectGroupBy, state.tableStructure, value.tableData],
  );

  const structure = useMemo(() => {
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
  }, [fullStructure, state.hiddenColumns]);

  const filterOptions = useMemo(
    () =>
      state.tableStructure
        .filter((c) => c.filterColumn || c.colGroup?.some((cg) => cg.filterColumn))
        .flatMap((c) => {
          const title = getColumnTitle(c.title, value.tableData);
          return [
            { ...c, title },
            ...(c.colGroup?.map((cg) => {
              const nestedTitle = getColumnTitle(cg.title, value.tableData);
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
    [state.tableStructure, value.tableData],
  );

  const providerValue = useMemo<TableState>(
    () =>
      ({
        ...state,
        onChange: debouncedOnChange,
        tableData,
        allTableData: state.tableData,
        count: tableCount,
        exportToCSV,
        structure,
        update,
        filterOptions,
        numRowsSelected,
      } as TableState),
    [debouncedOnChange, exportToCSV, filterOptions, numRowsSelected, state, structure, tableCount, tableData, update],
  );

  return <TableContext.Provider value={providerValue}>{props.children}</TableContext.Provider>;
};

export default TableContext;
