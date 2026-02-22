import React from "react";
import { Input } from "antd";
import { WrapperInputStyle } from "./style";

const InputComponent = ({size, placeholder,variant , styleInput, ...rest}) => {
    return (
        <WrapperInputStyle
            size={size}
            placeholder={placeholder}
            variant={variant} 
            style={styleInput}
            {...rest}
        />

    );
}
export default InputComponent;