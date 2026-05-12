import { Checkbox, InputNumber } from 'antd';
import styled from 'styled-components';

export const WrapperContainer = styled.div`
  width: 100%;
  background-color: #f5f5fa;
  min-height: 100vh;
`;

export const WrapperLeft = styled.div`
  width: 100%;
`;

export const WrapperListOrder = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const WrapperItemOrder = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
`;

export const WrapperPriceDiscount = styled.span`
  color: #999;
  text-decoration: line-through;
  margin-left: 8px;
  font-size: 12px;
`;

export const WrapperQuantityBuy = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: fit-content;
`;

export const WrapperInputQuantityBuy = styled(InputNumber)`
  width: 40px;
  border-top: none;
  border-bottom: none;
  border-radius: 0;
  &.ant-input-number {
    border-color: #ccc;
  }
  .ant-input-number-handler-wrap {
    display: none;
  }
`;

export const WrapperRight = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const WrapperInfo = styled.div`
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  width: 100%;
`;

export const WrapperTotal = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  width: 100%;
`;

export const WrapperItemHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  font-weight: 500;
`;
