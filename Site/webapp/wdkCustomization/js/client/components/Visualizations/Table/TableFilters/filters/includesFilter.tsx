import { FilterValue, IdType, Row } from "react-table";
import { parseFieldValue } from "@viz/Table";

// to lowercase / sometimes pie filter changes case for labeling
export function includesFilter<T extends Record<string, unknown>>(
    rows: Array<Row<T>>,
    id: IdType<T>,
    filterValue: FilterValue
): Array<Row<T>> {
    return rows.filter((row) => {
        // don't know off hand if the Filter allows N/A's so depend on filterValue to give hint
        const rowValue =
            filterValue === "N/A"
                ? parseFieldValue(row.values[id[0]], true).toString().toLowerCase()
                : parseFieldValue(row.values[id[0]]).toString().toLowerCase();

        return rowValue && rowValue.includes(filterValue.toString().toLowerCase());
    });
}

// This is an autoRemove method on the filter function that
// when given the new filter value and returns true, the filter
// will be automatically removed. Normally this is just an undefined
includesFilter.autoRemove = (val: any) => !val || !val.length;

export function multiIncludesFilter<T extends Record<string, unknown>>(
    rows: Array<Row<T>>,
    id: IdType<T>,
    filterValue: FilterValue
): Array<Row<T>> {
    const fValueArray: string[] = filterValue.split(",");

    return rows.filter((row) => {
        const rowValue = parseFieldValue(row.values[id[0]]).toString().toLowerCase();
        if (rowValue.includes("//")) {
            let valueArray: string[] = rowValue.split(" // ");
            const filteredArray = valueArray.filter((value) => fValueArray.includes(value));
            return filteredArray.length > 1;
        }
        return fValueArray.includes(rowValue);
    });
}

// This is an autoRemove method on the filter function that
// when given the new filter value and returns true, the filter
// will be automatically removed. Normally this is just an undefined
multiIncludesFilter.autoRemove = (val: any) => !val || !val.length;
