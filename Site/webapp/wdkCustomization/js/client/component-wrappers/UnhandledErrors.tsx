import React from "react";
import { UnhandledError } from "wdk-client/Actions/UnhandledErrorActions";

//overriding the Ebrc Error handler, which listens to errors on the window (not just react errors, but imperative library errors as well) and shows a modal, which we want to suppress
interface Props {
    errors?: UnhandledError[];
    showStackTraces: boolean;
    clearErrors: () => void;
    children: React.ReactElement;
}

export const UnhandledErrors = () => {
    return function NiagadsErrorOverride(props: Props) {
        //we'll return the children with the understanding that the parent error boundary will embed error messages in the page if the component tree is affected
        return <>{props.children}</>;
    };
};
