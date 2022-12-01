// modeled after https://github.com/ggascoigne/react-table-example
// table is encapsulated in the side panel (e.g., for genome browser track selector)

import React, { useEffect, useMemo, useState } from "react";
import { assign } from "lodash";

import Typography from "@material-ui/core/Typography";
import LibraryBooksIcon from "@material-ui/icons/LibraryBooks";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";

import {
    useTable,
    usePagination,
    useSortBy,
    useResizeColumns,
    useFlexLayout,
    useFilters,
    useGlobalFilter,
    useAsyncDebounce,
    Column,
} from "react-table";

import useLocalStorage from "genomics-client/hooks/useLocalStorage";

import {
    fuzzyTextFilter,
    numericTextFilter,
    greaterThanFilter,
    includesFilter,
    includesAnyFilter,
    FilterGroup,
} from "@viz/Table/TableFilters";

import { Table, TableToolbar, ToggleColumnsPanel, FilterPanel, FilterChipBar } from "@viz/Table/TableSections";

import { useTableStyles, TableContainerProps } from "@viz/Table";

import TableSortingFunctions, {
    alphanumericSort,
    alphanumericCaseSensitiveSort,
    linkSort,
    basicSort,
    scientificNotationSort,
    textSort,
    textCaseSensitiveSort,
    barChartSort,
    booleanFlagSort,
} from "@viz/Table/TableSortingFunctions";

import { CustomPanel, NavigationDrawer } from "@components/MaterialUI";

interface EncapsulatedTableContainerProps extends TableContainerProps {
    isOpen: boolean;
    handleClose: any;
}

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

export const EncapsulatedTableContainer: React.FC<EncapsulatedTableContainerProps> = ({
    columns,
    data,
    filterTypes,
    filterGroups,
    className,
    canFilter,
    canExport,
    showAdvancedFilter,
    showHideColumns,
    requiredColumns,
    initialFilters,
    initialSort,
    title,
    isOpen,
    handleClose,
}) => {
    // Use the state and functions returned from useTable to build your UI
    //const instance = useTable({ columns, data }, ...hooks) as TableTypeWorkaround<T>;

    const [open, setOpen] = useState<boolean>(isOpen);
    const [initialState, setInitialState] = useLocalStorage(`tableState:${name}`, {});

    const classes = useTableStyles();

    const defaultFilterTypes = {
        fuzzyText: useMemo(() => fuzzyTextFilter, []),
        numeric: useMemo(() => numericTextFilter, []),
        greater: useMemo(() => greaterThanFilter, []),
        select: useMemo(() => includesFilter, []),
        checkbox_select: useMemo(() => includesAnyFilter, []),
        radio_select: useMemo(() => includesFilter, []),
        typeahead_select: useMemo(() => includesFilter, []),
        pie: useMemo(() => includesFilter, []),
        boolean_pie: useMemo(() => includesFilter, []),
        tissue: useMemo(() => includesFilter, []), // I think this is necessary as a placeholder
        pvalue: useMemo(() => greaterThanFilter, []), // I think this is necessary as a placeholder
    };

    // add custom filterTypes into the default / overwrite defaults
    const tableFilterTypes = filterTypes ? assign({}, defaultFilterTypes, filterTypes) : defaultFilterTypes;

    const sortingFunctions = {
        alphanumeric: useMemo(() => alphanumericSort, []),
        alphanumericCaseSensitiveSort: useMemo(() => alphanumericCaseSensitiveSort, []),
        basic: useMemo(() => basicSort, []),
        textCaseSensitive: useMemo(() => textCaseSensitiveSort, []),
        text: useMemo(() => textSort, []),
        barChart: useMemo(() => barChartSort, []),
        booleanFlag: useMemo(() => booleanFlagSort, []),
        link: useMemo(() => linkSort, []),
        scientificNotation: useMemo(() => scientificNotationSort, []),
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

    const instance = useTable(
        {
            columns,
            data,
            initialState: {
                // @ts-ignore -- TODO will be fixed in react-table v8 / basically @types/react-table is no longer being updated
                pageIndex: 0,
                pageSize: 10,
                filters: [initialFilters ? initialFilters : {}],
                sortBy: initialSort ? initialSort : [],
                hiddenColumns: columns
                    .filter((col: any) => col.show === false)
                    .map((col) => col.id || col.accessor) as any,
            },
            defaultCanFilter: false,
            //@ts-ignore
            defaultColumn: _defaultColumn,
            globalFilter: "global" in tableFilterTypes ? "global" : "text", // text is the react-table default
            filterTypes: tableFilterTypes,
            sortTypes: sortingFunctions,
        },
        ...hooks
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        setFilter,
        setSortBy,
        preGlobalFilteredRows,
        preFilteredRows,
        setGlobalFilter,
        globalFilter,
        page, // Instead of using 'rows', we'll use page, which has only the rows for the active page
        state, //: { pageIndex, pageSize },
    } = instance;

    const debouncedState = useAsyncDebounce(state, 500);

    useEffect(() => {
        const { sortBy, filters, pageSize, columnResizing, hiddenColumns } = debouncedState;
        const val = {
            sortBy,
            filters,
            pageSize,
            columnResizing,
            hiddenColumns,
        };
        setInitialState(val);
    }, [setInitialState, debouncedState]);

    const _buildDrawerSections = () => {
        const sections: React.ReactNode[] = showHideColumns
            ? [<ToggleColumnsPanel instance={instance} requiredColumns={requiredColumns} />]
            : [];
        showAdvancedFilter &&
            sections.push(<FilterPanel includeChips={false} instance={instance} filterGroups={filterGroups} />);
        return sections;
    };

    const renderDrawerHeaderContents = (
        <>
            <Typography variant="h6">
                <em>{title}</em>
            </Typography>
        </>
    );

    const renderGlobalFilter = (
        <AppBar position="static" elevation={0} className={classes.navigationToolbar}>
            <Toolbar variant="dense" disableGutters>
                <TableToolbar instance={instance} canFilter={canFilter} canExport={canExport} />
            </Toolbar>
        </AppBar>
    );

    // Render the UI for the table
    return (
        <CustomPanel justifyContent="flex-start">
            <NavigationDrawer
                navigation={null}
                toggleAnchor="left"
                drawerSections={_buildDrawerSections()}
                drawerCloseLabel="Close Track Selector"
                toggleIcon={<LibraryBooksIcon />}
                toggleHelp="Display track selector"
                toggleText="Browse Tracks"
                drawerHeaderContents={title ? renderDrawerHeaderContents : null}
                className={classes.navigationToolbar}
                width="80%"
                encapsulated={true}
            >
                <>
                    {renderGlobalFilter}
                    <FilterChipBar instance={instance} />
                    <Table className={className} instance={instance} />
                </>
            </NavigationDrawer>
        </CustomPanel>
    );
};
