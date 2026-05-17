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
