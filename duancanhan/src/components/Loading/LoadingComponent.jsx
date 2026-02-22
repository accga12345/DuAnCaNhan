import React from "react";
import { Spin } from "antd";

function LoadingComponent({ children, isPending }) {
    return (
        <Spin spinning={isPending}>
            {children}
        </Spin>
    );
}

export default LoadingComponent;
