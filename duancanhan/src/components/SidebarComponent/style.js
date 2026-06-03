import styled from 'styled-components';

export const WrapperSidebar = styled.div`
    width: 200px;
    flex-shrink: 0;
    position: sticky;
    top: 90px;
    height: calc(100vh - 110px);
    overflow-y: auto;
    padding-right: 4px;
    
    /* Custom thin scrollbar */
    &::-webkit-scrollbar {
        width: 4px;
    }
    &::-webkit-scrollbar-track {
        background: transparent;
    }
    &::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 4px;
    }
    &::-webkit-scrollbar-thumb:hover {
        background: #aaa;
    }
`;
