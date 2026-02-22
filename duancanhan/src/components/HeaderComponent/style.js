import { Row } from 'antd';
import styled from 'styled-components';

export const WapperHeaderComponent = styled(Row)`
  background-color: #ffffff;
  display: flex;
  height: 60px;
  align-items: center;
  padding: 0 24px;
`;

export const WapperTextHeader = styled.span`
  color: #333;
  font-size: 20px;
  font-weight: 600;
`;

export const WapperHeaderAction = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;

  .item {
    max-width: 150px;    
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
  }
  
  .item .text-item {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }


  .item:hover {
    border-radius: 5px;
    padding: 10px;
    background-color: #f0f0f0;
  }

  .item .text-item {
    font-size: 17px;
    font-weight: 600;
  }

  .item:first-child {
    color: #1890ff;
  }


  .item:last-child {
    position: relative;
  }

  .item svg {
    font-size: larger;
  }
  .divider {
    width: 1px;
    height: 24px;
    background-color: #ddd;
}
`;

export const WapperAvatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;



