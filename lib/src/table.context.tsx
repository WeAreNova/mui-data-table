import BodyCheckbox from "Body/BodyCheckbox.component";
import HeaderCheckbox from "Header/HeaderCheckbox.component";
import fileDownload from "js-file-download";
import React, { PropsWithChildren, Reducer, useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type {
  ActiveFilters,
  BaseData,
  ColGroupDefinition,
  DataTypes,
  FullColDef,
  FullColGroupDef,
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
  "pinnedColumns",
  "selectedRows",
  "loading",
  "tableData",
] as const;

const DYNAMIC_STATE_MAP = DYNAMIC_STATE.reduce(
  (prev, key) => ({ ...prev, [key]: true } as const),
  {} as { [key in typeof DYNAMIC_STATE[number]]: true } &
  {
    [key in keyof Omit<BaseTableState, typeof DYNAMIC_STATE[number]>]: false;
  },
);

type DynamicState<RowType extends BaseData, AllDataType extends RowType[]> = Pick<
  BaseTableState<RowType, AllDataType>,
  typeof DYNAMIC_STATE[number] | "tableStructure"
>;

type TableAction<
  RowType extends BaseData,
  AllDataType extends RowType[],
  R extends DynamicState<RowType, AllDataType> = DynamicState<RowType, AllDataType>,
> =
  | Partial<R>
  | ((currState: R) => Partial<R>)
  | Partial<{ [key in keyof R]: R[key] | ((currState: R[key]) => R[key]) }>;

type Update<
  RowType extends BaseData,
  AllDataType extends RowType[],
  R extends DynamicState<RowType, AllDataType> = DynamicState<RowType, AllDataType>,
> = {
  [key in keyof Omit<R, "tableStructure">]: (value: R[key] | ((currState: R[key]) => R[key])) => void;
} & {
  (value: TableAction<RowType, AllDataType>): void;
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
  pinnedColumns: { [column: string]: boolean };
  selectedRows: { [rowId: string]: RowType };
  loading: boolean;
  exportToCSV?(): Promise<void>;
  isMacOS: boolean;
  editable: false | "cells" | "rows";
  csvFilename: string;
}

type FlattenedStructure<RowType extends BaseData, AllDataType extends RowType[]> = Array<
  FullColDef<RowType, AllDataType> | FullColGroupDef<RowType, AllDataType>
> & { notHidden: Array<FlattenedStructure<RowType, AllDataType>[number] & { hidden: false | undefined }> };

export type Structure<RowType extends BaseData, AllDataType extends RowType[]> = FullColDef<RowType, AllDataType>[] & {
  flattened: FlattenedStructure<RowType, AllDataType>;
  notHidden: Array<FullColDef<RowType, AllDataType> & { hidden: false | undefined }>;
};

export interface TableState<RowType extends BaseData = BaseData, AllDataType extends RowType[] = RowType[]>
  extends Omit<BaseTableState<RowType, AllDataType>, "onChange"> {
  count: number;
  onChange?(queryParams?: OnChangeObject): Promise<AllDataType>;
  allTableData: AllDataType;
  update: Update<RowType, AllDataType>;
  structure: Structure<RowType, AllDataType>;
  filterOptions: Array<{ label: string; value: string; type: DataTypes; defaultOperator: OperatorValues }>;
  resizeable: boolean;
  rowOptions?: Omit<NonNullable<BaseTableState<RowType, AllDataType>["rowOptions"]>, "alternateRowColor">;
  numRowsSelected: number;
  TotalColumns: number;
  headerCellsSiblingsMap: { [key: string]: any }
}

type TableReducer<RowType extends BaseData, AllDataType extends RowType[]> = Reducer<
  BaseTableState<RowType, AllDataType>,
  TableAction<RowType, AllDataType>
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

const reducer = <RowType extends BaseData, AllDataType extends RowType[]>(
  state: BaseTableState<RowType, AllDataType>,
  action: TableAction<RowType, AllDataType>,
) =>
  typeof action === "function"
    ? { ...state, ...filterUpdates(action(state)) }
    : {
      ...state,
      ...Object.entries(action).reduce((prev, [key, value]) => {
        return {
          ...prev,
          [key]:
            typeof value === "function" && DYNAMIC_STATE_MAP[key as keyof typeof DYNAMIC_STATE_MAP]
              ? value(state[key as keyof BaseTableState] as never)
              : value,
        };
      }, {} as Partial<typeof state>),
    };

function getStoredValues(
  defaultSort: Sort = { key: null, direction: undefined },
  defaultRowsPerPage = 25,
): StoredValues {
  const win = getWindow();
  const defaults = {
    sort: defaultSort,
    rowsPerPage: defaultRowsPerPage,
    activeFilters: [] as ActiveFilters,
  };
  if (!win) return defaults;
  const sessionChangeObjStr = sessionStorage.getItem(win.location.pathname);
  if (!sessionChangeObjStr) return defaults;

  const parsed = JSON.parse(sessionChangeObjStr) as OnChangeObject;
  const filters = parsed.columnFilters || defaults.activeFilters;
  return {
    sort:
      parsed.sortKey && parsed.sortDirection ? { key: parsed.sortKey, direction: parsed.sortDirection } : defaults.sort,
    rowsPerPage: parsed.limit || defaults.rowsPerPage,
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
    pinnedColumns: {},
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
  onChange: _onChange,
  ...props
}: PropsWithChildren<{
  value: Omit<TableProps<RowType, AllDataType>, "onChange">;
  onChange: TableProps<RowType, AllDataType>["onChange"];
}>) => {
  const initRendered = useRef(false);
  const baseOnChange = useRef(_onChange);
  const [state, dispatch] = useReducer<TableReducer<RowType, AllDataType>, TableProps<RowType, AllDataType>>(
    reducer,
    value,
    initialise,
  );
  useEffect(() => {
    if (initRendered.current) dispatch(value);
  }, [value]);
  useEffect(() => {
    if (initRendered.current) baseOnChange.current = _onChange;
  }, [_onChange]);
  useEffect(() => {
    initRendered.current = true;
  }, []);

  const update = useMemo(() => {
    function updateFunction(
      partialState:
        | Partial<DynamicState<RowType, AllDataType>>
        | ((currState: DynamicState<RowType, AllDataType>) => Partial<DynamicState<RowType, AllDataType>>),
    ) {
      dispatch(typeof partialState === "function" ? partialState : filterUpdates(partialState));
    }
    DYNAMIC_STATE.forEach((curr) => {
      (updateFunction as any)[curr] = (
        arg: BaseTableState[typeof curr] | ((currState: BaseTableState[typeof curr]) => BaseTableState[typeof curr]),
      ) => dispatch({ [curr]: arg });
    });
    return updateFunction as Update<RowType, AllDataType>;
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
      if (!baseOnChange.current) return;
      if (!isExport) update.loading(true);
      const data = await baseOnChange.current({ ...queryParams }, isExport);
      if (!isExport) update.loading(false);
      return data;
    },
    [update],
  );
  const debouncedOnChange = useMemo(() => baseOnChange.current && debounce(onChange), [onChange]);

  useEffect(() => {
    debouncedOnChange?.(onChangeObject);
  }, [debouncedOnChange, onChangeObject]);

  const _filtered = useMemo(
    () => (baseOnChange.current ? state.tableData : getFilteredData(state.tableData, state.activeFilters)),
    [state.activeFilters, state.tableData],
  );
  const _sorted = useMemo(
    () => (baseOnChange.current ? _filtered : getSortedData(_filtered, state.sort, state.tableStructure)),
    [_filtered, state.sort, state.tableStructure],
  );
  const tableData = useMemo(
    () =>
      baseOnChange.current || state.disablePagination
        ? _sorted
        : getPagedData(_sorted, { limit: state.rowsPerPage, page: state.page }),
    [_sorted, state.disablePagination, state.page, state.rowsPerPage],
  );
  const tableCount = useMemo(() => {
    const numberCount = value.count && Number(value.count);
    return numberCount || _filtered.length;
  }, [_filtered.length, value.count]);

  const exportToCSV = useCallback(async () => {
    let data = state.tableData;
    if (baseOnChange.current) {
      data = await onChange({ ...onChangeObject, limit: undefined, skip: 0 }, true);
      await onChange(onChangeObject);
    }
    const csvString = await exportTableToCSV(data, state.tableStructure);
    const filename = state.csvFilename.endsWith(".csv") ? state.csvFilename : `${state.csvFilename}.csv`;
    fileDownload(csvString, filename, "text/csv;charset=utf-16;");
  }, [onChange, onChangeObject, state.csvFilename, state.tableData, state.tableStructure]);

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
        parentKey: struct.key,
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
          const title = getColumnTitle(
            (typeof c.filterColumn === "object" && c.filterColumn.title) || c.title,
            value.tableData,
          );
          return [
            { ...c, title },
            ...(c.colGroup?.map((cg) => {
              const nestedTitle = getColumnTitle(
                (typeof cg.filterColumn === "object" && cg.filterColumn.title) || cg.title,
                value.tableData,
              );
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


  const TotalColumns = useMemo(() => {
    let total = 0;

    structure.forEach((obj) => {
      // Count parent key
      total++;

      // Count child keys
      if (obj.colGroup && obj.colGroup.length > 0) {
        total += obj.colGroup.length;
      }
    });

    return total;
  }, [structure]);

  const buildHeaderCellsSiblingsMap = useCallback((TotalColumns: number, structure: Structure<RowType, AllDataType>) => {
    const headerCellsSiblings: { [key: string]: any } = {};
    let zIndex = 0;

    const findSiblingKey = (index: number, offset: number) =>
      structure[index + offset]?.key;

    structure.forEach((struct, index) => {
      const leftSibling = findSiblingKey(index, -1);
      const rightSibling = findSiblingKey(index, 1);

      const createColGroupSibling = (colGroup: ColGroupDefinition<RowType, AllDataType>[] | undefined, index: number) => {
        if (colGroup) {
          return {
            leftSibling: index === 0 ? leftSibling : colGroup[index - 1].key,
            rightSibling: index === colGroup.length - 1 ? rightSibling : colGroup[index + 1].key,
          }

        }
      };

      const parentIndex = zIndex++;
      headerCellsSiblings[struct.key] = {
        leftSibling,
        rightSibling,
        index: { default: parentIndex, pinned: TotalColumns + parentIndex },
      };

      struct.colGroup?.forEach((colGroup, index) => {
        const childIndex = zIndex++;
        headerCellsSiblings[colGroup.key] = {
          ...createColGroupSibling(struct.colGroup, index),
          index: { default: childIndex, pinned: TotalColumns + childIndex },
        };
      });
    });

    return headerCellsSiblings;
  }, []);

  const headerCellsSiblingsMap = useMemo(() => {
    return buildHeaderCellsSiblingsMap(TotalColumns, structure);
  }, [TotalColumns, buildHeaderCellsSiblingsMap, structure]);


  const providerValue = useMemo(
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
      TotalColumns,
      headerCellsSiblingsMap
    } as TableState<RowType, AllDataType>),
    [TotalColumns, debouncedOnChange, exportToCSV, filterOptions, headerCellsSiblingsMap, numRowsSelected, state, structure, tableCount, tableData, update],
  );

  return <TableContext.Provider value={providerValue}>{props.children}</TableContext.Provider>;
};

export default TableContext;
