// modeled after https://github.com/ggascoigne/react-table-example

import React, { CSSProperties, MouseEventHandler, PropsWithChildren, ReactElement, useEffect, Props } from "react";
import cx from "classnames";
import { assign } from "lodash";
import MaUTable from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Grid from "@material-ui/core/Grid";

import {
    useTable,
    usePagination,
    useSortBy,
    HeaderGroup,
    useResizeColumns,
    useFlexLayout,
    useFilters,
    useGlobalFilter,
    useAsyncDebounce,
} from "react-table";

import useLocalStorage from "../../../hooks/useLocalStorage";

import { CustomTableProps } from "./TableTypes";
import TablePagination from "./TablePagination";
import TableHeaderCell from "./TableHeaderCell";
import { DefaultColumnFilter, GlobalFilter } from "./TableFilters/TableFilters";
import FilterPanel from "./TableFilters/FilterPanel";
import { FilterChipBar } from "./TableFilters/FilterChipBar";

import { fuzzyTextFilter, numericTextFilter, greaterThanFilter, includesFilter } from "./TableFilters/filters";

import { useStyles } from "./TableStyles";

const hooks = [
    //useColumnOrder,
    //useGroupBy,
    //useExpanded,
    useFlexLayout,
    useResizeColumns,
    useGlobalFilter,
    useFilters,
    useSortBy,
    usePagination,
    //useRowSelect,
    //selectionHook,
];

const defaultFilterTypes = {
    fuzzyText: fuzzyTextFilter,
    numeric: numericTextFilter,
    greater: greaterThanFilter,
    select: includesFilter,
    pie: includesFilter,
};

// fix to force table to always take full width of container
// https://stackoverflow.com/questions/64094137/how-to-resize-columns-with-react-table-hooks-with-a-specific-table-width
// https://spectrum.chat/react-table/general/v7-resizing-columns-no-longer-fit-to-width~4ea8a7c3-b21a-49a0-8582-baf0a6202d43
const _defaultColumn = React.useMemo(
    () => ({
        // When using the useFlexLayout:
        minWidth: 30, // minWidth is only used as a limit for resizing
        width: 150, // width is used for both the flex-basis and flex-grow
        maxWidth: 300, // maxWidth is only used as a limit for resizing
        //@ts-ignore
        Filter: () => null, // overcome the issue that useGlobalFilter sets canFilter to true
        //Cell: ,
        //Header: DefaultHeader,
    }),
    []
);

const CustomTable: React.FC<CustomTableProps> = ({ columns, data, filterTypes, className, canFilter }) => {
    // Use the state and functions returned from useTable to build your UI
    //const instance = useTable({ columns, data }, ...hooks) as TableTypeWorkaround<T>;
    const classes = useStyles();
    const [initialState, setInitialState] = useLocalStorage(`tableState:${name}`, {});
    const tableFilterTypes = filterTypes ? assign({}, defaultFilterTypes, filterTypes) : defaultFilterTypes; // add custom filterTypes into the default / overwrite defaults
    const instance = useTable(
        {
            columns,
            data,
            // @ts-ignore -- TODO will be fixed in react-table v8 / basically @types/react-table is no longer being updated
            initialState: { pageIndex: 0, pageSize: 10 },
            defaultCanFilter: false,
            //@ts-ignore
            defaultColumn: _defaultColumn,
            globalFilter: "global" in tableFilterTypes ? "global" : "text", // text is the react-table default
            filterTypes: tableFilterTypes,
        },
        ...hooks
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        preGlobalFilteredRows,
        setGlobalFilter,
        globalFilter,
        page, // Instead of using 'rows', we'll use page, which has only the rows for the active page
        state, //: { pageIndex, pageSize },
    } = instance;

    const debouncedState = useAsyncDebounce(state, 500);

    useEffect(() => {
        const { sortBy, filters, pageSize, columnResizing, hiddenColumns, globalFilter } = debouncedState;
        const val = {
            sortBy,
            filters,
            pageSize,
            columnResizing,
            hiddenColumns,
        };
        setInitialState(val);
    }, [setInitialState, debouncedState]);

    // Render the UI for your table
    return (
        <>
            <Grid container direction="column">
                <Grid item>
                    {canFilter && (
                        <Grid container direction="row">
                            <Grid item xs={3}>
                                <GlobalFilter
                                    preGlobalFilteredRows={preGlobalFilteredRows}
                                    globalFilter={globalFilter}
                                    setGlobalFilter={setGlobalFilter}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <FilterPanel instance={instance} />
                            </Grid>
                        </Grid>
                    )}
                    <TablePagination instance={instance} />
                </Grid>

                <Grid item>
                    {/*<TableToolbar instance={instance}/>*/}
                    {canFilter && <FilterChipBar instance={instance} />}

                    <MaUTable {...getTableProps()} className={className}>
                        <TableHead>
                            {headerGroups.map((headerGroup: HeaderGroup<object>) => (
                                <TableRow {...headerGroup.getHeaderGroupProps()}>
                                    {headerGroup.headers.map((column) => (
                                        //@ts-ignore -- TODO --getSortByToggleProps will be add to types in react-table v8
                                        <TableHeaderCell key={column.id} column={column} />
                                    ))}
                                </TableRow>
                            ))}
                        </TableHead>
                        <TableBody>
                            {page.map((row: any, i: any) => {
                                prepareRow(row);
                                return (
                                    <TableRow {...row.getRowProps()}>
                                        {row.cells.map((cell: any) => {
                                            return (
                                                <TableCell
                                                    size="small"
                                                    {...cell.getCellProps()}
                                                    className={cx({ [classes.tableCell]: true })}
                                                >
                                                    {cell.render("Cell")}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </MaUTable>
                </Grid>
            </Grid>
        </>
    );
};

export default CustomTable;
