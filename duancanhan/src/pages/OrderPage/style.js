import { Checkbox, InputNumber } from 'antd';
import styled from 'styled-components';

export const WrapperContainer = styled.div`
  width: 100%;
  background-color: #f5f5fa;
`;

export const WrapperLeft = styled.div`
  width: 100%;
`;

export const WrapperListOrder = styled.div`

`;

export const WrapperItemOrder = styled.div`
  display: flex;
  align-items: center;
  padding: 9px 16px;
  background: #fff;
  margin-top: 12px;
  border-radius: 4px;
`;

export const WrapperPriceDiscount = styled.span`
  color: #999;
  text-decoration: line-through;
  margin-left: 4px;
`;

export const WrapperQuantityBuy = styled.div`
  display: flex;
  align-items: center;
`;

export const WrapperInputQuantityBuy = styled(InputNumber)`
  width: 40px;
  .ant-input-number-handler-wrap {
    display: none;
  }
`;

export const WrapperRight = styled.div`
  width: 100%;
  display: flex ;
  flex-direction: column; 
  gap: 10px; 
  align-items: center
`;

export const WrapperInfo = styled.div`
  padding: 17px 20px;
  border-bottom: 1px solid #f5f5f5;
  background: #fff;
  border-top-right-radius: 6px;
  border-top-left-radius: 6px;
  width: 100%;
`;

export const WrapperTotal = styled.div`
  display: flex;
  align-items: flex-start; 
  justify-content: space-between;
  padding: 17px 20px;
  background: #fff ;
  border-bottom-right-radius: 6px;
  border-bottom-left-radius: 6px;
  width: 100%;
`;
