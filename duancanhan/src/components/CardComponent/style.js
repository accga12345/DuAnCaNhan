import { Card } from "antd";
import styled from "styled-components";

export const WrapperCardStyle = styled(Card)`
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    width:200px;
    cursor: pointer;
    overflow: hidden;
    & img{
        width: 100%;
        height: 200px;
    }
    .ant-card-body {
        padding: 20px 10px;
        display: flex;
        flex-direction: column;
        flex: 1;
        justify-content: space-between
    }
`;

export const WrapperNameText = styled.div`
    line-height: 22px;
    height: 66px;   
    font-size: 16px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
`;
export const WrapperReportText = styled.div`
    font-size: 12px;
    color: #666;
    margin: 6px 0 0;
`;

export const WrapperPriceText = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: rgb(169 21 21);
    display: flex;
    align-items: center;
    gap: 10px;
`;
export const WrapperDiscountText = styled.span`
    font-size: 12px;
    background: var(--Alias-Theme-Variant, #f5f5fa);
    color: var(--Alias-Primary---On-Theme, #27272a);
    padding: 2px 6px;
    border-radius: 4px;
`;