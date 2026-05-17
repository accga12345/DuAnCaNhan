import { Card } from "antd";
import styled from "styled-components";

export const WrapperCardStyle = styled(Card)`
    border-radius: 8px;
    border: 1px solid #ebebf0;
    background: #fff;
    width: 100%;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    height: 100%;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: rgba(26, 115, 232, 0.4);

        img {
            transform: scale(1.05);
        }
    }

    .ant-card-body {
        padding: 16px;
        display: flex;
        flex-direction: column;
        flex: 1;
        gap: 8px;
        justify-content: space-between;
    }
`;

export const WrapperNameText = styled.div`
    line-height: 1.4;
    height: 42px;   
    font-size: 15px;
    font-weight: 600;
    color: var(--text-main);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    transition: color 0.2s ease;
    margin-bottom: 4px;

    ${WrapperCardStyle}:hover & {
        color: var(--primary-color);
    }
`;

export const WrapperReportText = styled.div`
    font-size: 12px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
`;

export const WrapperPriceText = styled.div`
    font-size: 18px;
    font-weight: 700;
    color: #e53935;
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const WrapperDiscountText = styled.span`
    font-size: 11px;
    font-weight: 700;
    background: #ffebee;
    color: #e53935;
    padding: 4px 8px;
    border-radius: 6px;
    text-transform: uppercase;
`;