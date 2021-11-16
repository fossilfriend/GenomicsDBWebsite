// modeled after https://github.com/ggascoigne/react-table-example
import React from "react";
import cx from "classnames";
import { assign } from "lodash";

import MaUTable from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Box from "@material-ui/core/Box";

import { HeaderGroup, Column, TableInstance } from "react-table";

import { TableHeaderCell, useTableStyles }   from ".";

interface TableProps {
    instance: TableInstance;
    showAdvancedFilter: boolean;
    canFilter: boolean;
    className?: string;
}

export const Table: React.FC<TableProps> = ({ instance, canFilter, showAdvancedFilter, className }) => {

    const classes = useTableStyles();
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        //@ts-ignore
        page, // Instead of using 'rows', we'll use page, which has only the rows for the active page
    } = instance;

    return (
        <Box> 
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
        </Box>
    );
};

