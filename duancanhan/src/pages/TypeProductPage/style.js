import styled from "styled-components";
export const WapperHomePage = styled.div`
    display: flex;
    gap: 12px;
    align-items: center;
    cursor: pointer;
    padding: 12px 0;
    flex-wrap: wrap;
`;

export const WrapperProductGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
    margin-top: 20px;
    width: 100%;
`;

export const WrapperSidebar = styled.div`
    width: 200px;
    flex-shrink: 0;
    position: sticky;
    top: 90px;
    max-height: calc(100vh - 110px);
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
