import { ColumnAccessorType } from "@viz/Table/ColumnAccessors";
import { FilterGroup, FilterType } from "@viz/Table/TableFilters";

export interface TableColumnSort {
    id: string;
    descending: boolean;
}

export interface TableProperties {
    filters?: { [columnId: string]: FilterType };
    filterGroups?: FilterGroup[];
    defaultFilter?: string;
    hiddenColumns?: string[];
    requiredColumns?: string[];
    defaultOpen?: boolean;
    canFilter: boolean;
    canExport?: boolean;
    canToggleColumns: boolean;
    locusZoomView?: boolean;
    fullWidth?: boolean;
    sortedBy?: TableColumnSort[];
    accessors?: {[key: string]: ColumnAccessorType };
}

export const _defaultTableProperties: TableProperties = {
    defaultOpen: false,
    canFilter: false,
    canExport: true,
    fullWidth: false,
    canToggleColumns: false,
};
