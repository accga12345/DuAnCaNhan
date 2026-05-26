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

export const WrapperProductGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
    margin-top: 20px;
    width: 100%;
`;

export const WrapperProductSlider = styled.div`
    margin-top: 20px;
    width: 100%;
    padding-bottom: 40px;
    
    .slick-slide > div {
        margin: 0 10px;
        padding-bottom: 10px;
    }
    .slick-list {
        margin: 0 -10px;
    }
    .slick-prev, .slick-next {
        z-index: 10;
        width: 36px;
        height: 36px;
        background-color: rgba(0, 0, 0, 0.25);
        border-radius: 50%;
        transition: all 0.3s ease;
    }
    .slick-prev:before, .slick-next:before {
        font-size: 20px;
    }
    .slick-prev:hover, .slick-next:hover {
        background-color: rgba(0, 0, 0, 0.6);
    }
    .slick-prev {
        left: -15px;
    }
    .slick-next {
        right: -15px;
    }
    .slick-dots {
        bottom: -25px;
    }
`;


