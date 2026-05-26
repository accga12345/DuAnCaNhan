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
    height: calc(100vh - 110px);
    overflow-y: auto;
    padding-right: 4px;
    
    /* Hide scrollbar for Chrome, Safari and Opera */
    &::-webkit-scrollbar {
        display: none;
    }
    
    /* Hide scrollbar for IE, Edge and Firefox */
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
`;
