import { Row } from 'antd';
import styled from 'styled-components';

export const WapperHeaderComponent = styled(Row)`
  background-color: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  height: 70px;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid var(--glass-border);
  transition: all 0.3s ease;
`;

export const WapperTextHeader = styled.span`
  color: var(--primary-color);
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
`;

export const WapperHeaderAction = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  height: 70px;

  .item {
    padding: 0 4px;
    min-width: auto;
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--text-main);
    white-space: nowrap;
    height: 44px;
  }
  
  .item .user-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item:hover {
    background-color: rgba(0, 0, 0, 0.04);
    transform: translateY(-1px);
  }

  .item:active {
    transform: translateY(0);
  }

  .item:first-child {
    color: var(--text-main);
    background-color: transparent;
  }

  .item:first-child:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  .item svg {
    font-size: 20px;
  }

  .divider {
    width: 1px;
    height: 20px;
    background-color: var(--glass-border);
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
