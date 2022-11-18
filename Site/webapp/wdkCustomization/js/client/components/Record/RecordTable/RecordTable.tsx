import React, { useMemo } from "react";
import { findIndex, has, get } from "lodash";
import classNames from "classnames";

import { Column, Row } from "react-table";

import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import { Box } from "@material-ui/core";

import { TableContainer, SelectColumnFilter, ColumnAccessorType, parseFieldValue } from "@viz/Table";
import {
    resolveAccessor,
    resolveData,
    RecordTableProps,
    negLog10pFilter,
    booleanFlagFilter,
    PValueThresholdFilter as PValueFilter,
    PieChartColumnFilter,
    DEFAULT_PVALUE_FILTER_VALUE,
} from "@components/Record/RecordTable";

import { HelpIcon } from "wdk-client/Components";
import { TableField, TableValue, AttributeField } from "wdk-client/Utils/WdkModel";

import { RecordTableProperties } from "genomics-client/data/record_properties/_recordTableProperties";

const filterTypes = {
    pvalue: negLog10pFilter,
    booleanPie: booleanFlagFilter,
};

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        table: {
            /* minHeight: 500,
          maxHeight: 500,
          overflowY: "scroll",
          overflowX: "hidden" */
        },
        fullWidth: {
            width: "100%",
        },
    })
);

// Mixed sorting is slow, but very inclusive of many edge cases.
// It handles numbers, mixed alphanumeric combinations, and even
// null, undefined, and Infinity
// modified from react-table alphanumeric function
const reSplitAlphaNumeric = /([0-9]+)/gm;
function toString(a: any) {
    if (typeof a === "number") {
        if (isNaN(a) || a === Infinity || a === -Infinity) {
            return "";
        }
        return String(a);
    }
    if (typeof a === "string") {
        return a;
    }
    return "";
}

const RecordTable: React.FC<RecordTableProps> = ({ table, data, properties }) => {
    const { attributes } = table;

    const _buildColumns = (table: TableField, data: TableValue, defaultHiddenColumns: string[]) => {
        if (!data) {
            return [];
        }
        if (data.length === 0) {
            return [];
        } else {
            let columnFilters: any = get(properties, "filters", null);
            let attributes: AttributeField[] = table.attributes;
            const accessors: any = get(properties, "accessors", null);
            let columns: Column<{}>[] = Object.keys(data[0])
                .filter((k) => {
                    const attribute: AttributeField = attributes.find((item) => item.name === k);
                    return attribute && attribute.isDisplayable;
                })
                .map((k): Column => {
                    const attribute: AttributeField = attributes.find((item) => item.name === k);
                    const accessorType: ColumnAccessorType = accessors
                        ? accessors.hasOwnProperty(attribute.name)
                            ? accessors[attribute.name]
                            : "Default"
                        : "Default";
                    let filterType =
                        columnFilters && has(columnFilters, attribute.name) ? columnFilters[attribute.name] : null;
                    let column = _buildColumn(attribute, accessorType);

                    switch (accessorType) {
                        case "BooleanFlag":
                            //@ts-ignore
                            column.disableGlobalFilter = true;
                            column.sortType = flagColumnSort;
                            if (filterType && filterType === "pie") {
                                filterType = "booleanPie";
                            }
                            break;
                        case "Float":
                        case "StackedBar":
                            //@ts-ignore
                            column.disableGlobalFilter = true;
                            break;
                        case "ScientificNotation":
                            //@ts-ignore
                            column.disableGlobalFilter = true;
                            column.sortType = sciNotationColumnSort;
                            break;
                        default:
                            // catch legacy links
                            if (column.id.endsWith("link")) {
                                column.sortType = linkColumnSort;
                            }
                    }

                    if (filterType) {
                        //@ts-ignore
                        column = _addColumnFilters(column, filterType);
                    }

                    if (defaultHiddenColumns && defaultHiddenColumns.includes(column.id)) {
                        //@ts-ignore
                        column.show = false;
                    }

                    return column;
                })
                .sort((c1, c2) => _indexSort(c1, c2, attributes));

            return columns;
        }
    };

    const flagColumnSort = useMemo(
        () => (rowA: Row, rowB: Row, id: string, desc: Boolean) => {
            const a = rowA.values[id] ? true : false,
                b = rowB.values[id] ? true : false;

            if (a > b) return 1;
            if (a < b) return -1;
            return 0;
        },
        []
    );

    const linkColumnSort = useMemo(
        () => (rowA: Row, rowB: Row, id: string, desc: Boolean) => {
            const a = parseFieldValue(rowA.values[id]),
                b = parseFieldValue(rowB.values[id]);

            if (a > b) return 1;
            if (a < b) return -1;
            return 0;
        },
        []
    );

    const sciNotationColumnSort = useMemo(
        () => (rowA: Row, rowB: Row, id: string, desc: Boolean) => {
            let a = parseFieldValue(rowA.values[id]),
                b = parseFieldValue(rowB.values[id]);
            (a = a === null || a === undefined ? -Infinity : a), (b = b === null || b === undefined ? -Infinity : b);
            a = /\d\.\d+e-\d+/.test(a) ? +a : a;
            b = /\d\.\d+e-\d+/.test(b) ? +b : b;
            if (a > b) return 1;
            if (a < b) return -1;
            return 0;
        },
        []
    );

    const defaultColumnSort = useMemo(
        () => (rowA: Row, rowB: Row, id: string, desc: Boolean) => {
            let a = parseFieldValue(rowA.values[id]),
                b = parseFieldValue(rowB.values[id]);
            // Force to strings (or "" for unsupported types)
            a = toString(a);
            b = toString(b);

            // Split on number groups, but keep the delimiter
            // Then remove falsey split values
            a = a.split(reSplitAlphaNumeric).filter(Boolean);
            b = b.split(reSplitAlphaNumeric).filter(Boolean);

            // While
            while (a.length && b.length) {
                let aa = a.shift();
                let bb = b.shift();

                const an = parseInt(aa, 10);
                const bn = parseInt(bb, 10);

                const combo = [an, bn].sort();

                // Both are string
                if (isNaN(combo[0])) {
                    if (aa > bb) {
                        return 1;
                    }
                    if (bb > aa) {
                        return -1;
                    }
                    continue;
                }

                // One is a string, one is a number
                if (isNaN(combo[1])) {
                    return isNaN(an) ? -1 : 1;
                }

                // Both are numbers
                if (an > bn) {
                    return 1;
                }
                if (bn > an) {
                    return -1;
                }
            }

            return a.length - b.length;
            if (a > b) return 1;
            if (a < b) return -1;
            return 0;
        },
        []
    );

    const _buildColumn = (attribute: AttributeField, accessor: ColumnAccessorType) => ({
        Header: _buildHeader(attribute),
        sortable: attribute.isSortable,
        accessor: resolveAccessor(attribute.name, accessor),
        id: attribute.name,
        sortType: defaultColumnSort,
    });

    let defaultHiddenColumns = get(properties, "hiddenColumns");
    const hasHiddenColumns = defaultHiddenColumns ? true : false;
    const canToggleColumns = hasHiddenColumns || get(properties, "canToggleColumns", false);

    const columns: Column<{}>[] = useMemo(() => _buildColumns(table, data, defaultHiddenColumns), [table]);
    const resolvedData: any = useMemo(() => resolveData(data), [data]);

    const canFilter = get(properties, "canFilter", true); // default to true if missing
    const hasColumnFilters = properties.hasOwnProperty("filters");
    const initialFilters = _setInitialFilters(table, properties);
    const initialSort = _setInitialSort(table, properties);

    const classes = useStyles();

    if (data.length === 0 || columns.length === 0) {
        return (
            <p>
                <em>No data available</em>
            </p>
        );
    }

    return (
        <TableContainer
            className={classNames(get(properties, "fullWidth", true) ? classes.fullWidth : "shrink", classes.table)}
            columns={columns}
            data={resolvedData}
            filterTypes={filterTypes}
            filterGroups={get(properties, "filterGroups", null)}
            canFilter={canFilter}
            showAdvancedFilter={hasColumnFilters}
            showHideColumns={canToggleColumns}
            requiredColumns={get(properties, "requiredColumns", null)}
            initialFilters={initialFilters}
            initialSort={initialSort}
            title={table.displayName}
        />
    );
};

const _setInitialFilters = (table: TableField, properties: RecordTableProperties) => {
    let columnFilters: any = get(properties, "filters", null);
    if (columnFilters && "pvalue" in columnFilters) {
        return { id: "pvalue", value: DEFAULT_PVALUE_FILTER_VALUE };
    }
    return null;
};

const _setInitialSort = (table: TableField, properties: RecordTableProperties) => {
    let sortBy: any = get(properties, "sortedBy", null);
    return useMemo(() => sortBy, []);
};

const _addColumnFilters = (column: Column, filterType: string) => {
    if (filterType === "select") {
        //@ts-ignore
        column.Filter = SelectColumnFilter;
    }
    if (filterType.toLowerCase().includes("pie")) {
        //@ts-ignore
        column.Filter = PieChartColumnFilter;
    }

    if (filterType === "pvalue") {
        //@ts-ignore
        column.Filter = PValueFilter;
    }

    //@ts-ignore
    column.filter = filterType;

    return column;
};

const _buildHeader = (attribute: AttributeField) => {
    return (
        <Box>
            {attribute.help ? <HelpIcon>{attribute.help}</HelpIcon> : null}
            {attribute.help ? " " : null}
            {attribute.displayName}
        </Box>
    );
};

const _indexSort = (col1: Column, col2: Column, attributes: AttributeField[]) => {
    const idx1 = findIndex(attributes, (att) => att.name === col1.id),
        idx2 = findIndex(attributes, (att) => att.name === col2.id);
    return idx2 > idx1 ? -1 : 1;
};

export default RecordTable;
