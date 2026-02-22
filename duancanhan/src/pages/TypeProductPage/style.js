import styled from "styled-components";
export const WapperHomePage = styled.div`
    display: flex;
    gap: 30px;
    align-items: center;
    cursor: pointer;
    padding: 20px 0;
`;

export const WrapperProductList = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
`;

export const WrapperProductItem = styled.div`
  width: calc((100% - 80px) / 5);
`;
