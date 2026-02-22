import { Col, InputNumber } from "antd";
import styled from "styled-components";

export const WrapperImageSmall = styled(Col)`
    display: flex;
    justify-content: center;
    border: 1px solid #ddd;
    padding: 4px;
    cursor: pointer;
    flex-basis: 0
`;

export const WrapperTextRate = styled.span`
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 150%;
    display: flex;
    align-items: center;
    gap: 4px;
`;

export const WrapperTextQuantityBuy = styled.span`
    color: rgb(128, 128, 137);
    text-align: center;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    
`;
export const WrapperTextPrice = styled.span`
    color: rgb(255, 66, 78);
    font-size: 24px;
    font-weight: 600;
    line-height: 150%;
`;
export const WrapperProductPrice = styled.div`
    margin-top: 12px;
`;

export const WrapperQuantityBuy = styled.div`
    display: flex;
    align-items: center;
    margin-top: 8px;
`;

export const WrapperInputQuantityBuy = styled(InputNumber)`
    width: 40px;
    
`;
