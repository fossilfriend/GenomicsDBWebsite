import React from "react";
import { FormControl, Input, InputProps, TextField, TextFieldProps } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

//base resset of wdk non-button inputs
const useBaseInputStyles = makeStyles({
    root: {
        backgroundColor: "white!important",
        "&:hover": { backgroundColor: "white!important" },
    },
    input: {
        padding: "6px 0 7px 4px!important",
        border: "none!important",
        backgroundColor: "none!important",
        background: "none!important",
    },
});

const useBaseFormControlStyles = makeStyles({
    root: (props: InputStyleProps) => ({ width: props.fullWidth ? "100%" : "inherit" }),
});

interface InputStyleProps {
    [key: string]: any;
    fullWidth?: boolean;
}

export const UnlabeledTextField: React.FC<InputProps & { fullWidth: boolean }> = React.forwardRef((props, ref) => {
    const inputClasses = useBaseInputStyles(),
        formControlClasses = useBaseFormControlStyles(props);
    return (
        <FormControl classes={formControlClasses}>
            <Input ref={ref} type="search" classes={inputClasses} {...props} />
        </FormControl>
    );
});

export const LabeledTextField = (props: TextFieldProps) => {
    const classes = useBaseInputStyles(props);

    return (
        <TextField {...props} InputProps={{ ...props.InputProps, classes, disableUnderline: true }} variant="filled" />
    );
};
