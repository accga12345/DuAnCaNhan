import styled from "styled-components";
import ButtonComponents from "../../components/ButtonComponents/ButtonComponents";
export const WapperHomePage = styled.div`
    display: flex;
    gap: 12px;
    align-items: center;
    cursor: pointer;
    padding: 12px 0;
    flex-wrap: wrap;
`;

export const WrapperButtonMore = styled(ButtonComponents)`
  width: 240px;
  height: 40px;
  font-weight: 600;
  margin: 20px 0;

  ${props => props.disabled ? `
    background-color: #ccc !important;
    color: #fff !important;
    border-color: #ccc !important;
    cursor: not-allowed !important;
  ` : `
    &:hover {
      background-color: rgb(10, 104, 255) !important;
      color: #fff !important;
      border-color: rgb(10, 104, 255) !important;
    }
  `}
  
`;

export const WrapperProductGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
    margin-top: 20px;
    width: 100%;
`;


