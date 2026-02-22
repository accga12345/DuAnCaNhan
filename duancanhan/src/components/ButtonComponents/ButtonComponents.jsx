import { forwardRef } from "react";
import { Button } from "antd";

const ButtonComponents = forwardRef(({ size, textButton, bordered, styleButton, ref, ...rest }) => {
    return (
        <Button
            size={size}
            bordered={bordered}
            style={{ ...styleButton }}
            {...rest}
            ref={ref}
        > {textButton} </Button>
    );
})
export default ButtonComponents;