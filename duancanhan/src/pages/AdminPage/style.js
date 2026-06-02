import styled from 'styled-components';
import { Layout } from 'antd';

export const StyledLayout = styled(Layout)`
    min-height: 100vh;
`;

export const LogoContainer = styled.div`
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: #001529;
    color: white;
    font-size: 18px;
    font-weight: bold;
    overflow: hidden;
    white-space: nowrap;
`;
