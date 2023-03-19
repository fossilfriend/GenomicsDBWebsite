// modified from https://github.com/ggascoigne/react-table-example
import React, { ReactElement, useCallback } from "react";

import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import RotateLeftIcon from "@material-ui/icons/RotateLeft";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Dialog from "@material-ui/core/Dialog";

import { StyledTooltip as Tooltip } from "@components/MaterialUI";

import { useFilterPanelStyles, FilterPageProps, FilterGroup } from "@viz/Table/TableFilters";
import { DEFAULT_PVALUE_FILTER_VALUE } from "@components/Record/RecordTable/RecordTableFilters";
import { FilterChipBar } from "@viz/Table/TableSections";
import { HelpIcon } from "wdk-client/Components";

export function FilterDialog({ instance, filterGroups, includeChips = true }: FilterPageProps): ReactElement {
    const classes = useFilterPanelStyles();
    //@ts-ignore
    const { allColumns, setAllFilters } = instance;
    //@ts-ignore
    const { preGlobalFilteredRows, globalFilter, setGlobalFilter } = instance;

    const resetFilters = useCallback(() => {
        if (hasPvalueFilter) {
            setAllFilters([{ id: "pvalue", value: DEFAULT_PVALUE_FILTER_VALUE }]);
        } else {
            setAllFilters([]);
        }
    }, [setAllFilters]);

    const hasPvalueFilter: boolean =
        allColumns.filter(
            //@ts-ignore
            (item) => item.canFilter && item.filter && item.filter.toLowerCase().includes("pvalue")
        ).length > 0;

    const renderCollapsibleFilterGroup = (group: FilterGroup) =>
        renderStaticFilterGroup(group, classes.collapsibleFilterGroup);

    const renderStaticFilterGroup = (group: FilterGroup, className?: string) => {
        return (
            <Grid
                key={group.label + "-static"}
                container
                className={className ? className : classes.filterGroup}
                justifyContent="flex-start"
                alignItems="flex-start"
            >
                {group.columns.map((id: string) => renderFilter(id))}
            </Grid>
        );
    };

    const renderFilterGroup = (group: FilterGroup) => {
        const isCollapsible: boolean = group.collapsible != null ? group.collapsible : true;
        return isCollapsible ? renderCollapsibleFilterGroup(group) : renderStaticFilterGroup(group);
    };

    const renderFilter = (columnName: string) => {
        return allColumns
            .filter((column) => column.id === columnName)
            .map((column) => (
                <Grid item key={column.id}>
                    <Box className={classes.filterCell}>{column.render("Filter")}</Box>
                </Grid>
            ));
    };

    return (
        <>
            <Grid
                container
                //direction="column"
                justifyContent="center"
                alignItems="flex-start"
                className={classes.root}
            >
                <Grid item>
                    <Box component="span">
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<RotateLeftIcon />}
                            //fullWidth={true}
                            size="small"
                            onClick={resetFilters}
                        >
                            Reset Filters
                        </Button>

                        <HelpIcon>
                            Remove or reset filter criteria to table defaults. This will not clear terms entered in the
                            text search box.
                        </HelpIcon>
                    </Box>
                </Grid>
                {includeChips && (
                    <Grid item>
                        <FilterChipBar instance={instance} />
                    </Grid>
                )}
                <Grid item>{filterGroups.map((fg) => renderFilterGroup(fg))}</Grid>
            </Grid>
        </>
    );
}
