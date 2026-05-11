import { Col, InputNumber } from "antd";
import styled from "styled-components";

export const WrapperImageSmall = styled.div`
    border: 1px solid #ddd;
    padding: 2px;
    cursor: pointer;
    width: 64px;
    height: 64px;
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #fff;
    transition: all 0.2s;
    
    &:hover {
        border-color: #ff424e;
    }
`;

export const WrapperMainImageContainer = styled.div`
    width: 100%;
    height: 480px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
    padding: 10px;
    background: #fff;
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

export const WrapperSimilarProducts = styled.div`
    margin-top: 20px;
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
`;

export const WrapperDescription = styled.div`
    margin-top: 20px;
    background-color: #fff;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    
    h2 {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 16px;
        color: #333;
        border-left: 4px solid #ff424e;
        padding-left: 12px;
    }

    p {
        font-size: 15px;
        line-height: 1.6;
        color: #444;
    }

    img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 16px auto;
        border-radius: 4px;
    }
`;

export const WrapperContentDescription = styled.div`
    position: relative;
    max-height: ${(props) => (props.showAll ? "none" : "800px")};
    overflow: hidden;
    transition: max-height 0.3s ease-in-out;

    ${(props) => !props.showAll && `
        &::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 150px;
            background: linear-gradient(transparent, #fff);
        }
    `}
`;

export const WrapperReadMoreBtn = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 20px;
    z-index: 10;
    position: relative;

    button {
        padding: 8px 32px;
        border: 1px solid #ff424e;
        color: #ff424e;
        border-radius: 20px;
        background: transparent;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;

        &:hover {
            background: #ff424e;
            color: #fff;
        }
    }
`;

export const WrapperSpecsContainer = styled.div`
    margin-top: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    overflow: hidden;
    height: fit-content;
`;

export const WrapperSpecsHeader = styled.div`
    background-color: #ff424e;
    color: #fff;
    padding: 12px 16px;
    font-size: 16px;
    font-weight: 600;
    text-transform: uppercase;
`;

export const WrapperSpecsTable = styled.div`
    padding: 16px;
`;

export const WrapperSpecsRow = styled.div`
    display: flex;
    padding: 12px 8px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 14px;
    
    &:last-child {
        border-bottom: none;
    }

    .specs-key {
        width: 40%;
        color: #888;
        font-weight: 400;
        padding-right: 10px;
    }

    .specs-value {
        width: 60%;
        color: #333;
        font-weight: 500;
    }
`;

export const WrapperSeeMoreSpecs = styled.div`
    padding: 12px;
    text-align: center;
    border-top: 1px solid #f0f0f0;
    
    button {
        background: transparent;
        border: 1px solid #ff424e;
        color: #ff424e;
        padding: 6px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;

        &:hover {
            background: #ff424e;
            color: #fff;
        }
    }
`;
