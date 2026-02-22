import styled from "styled-components";

export const WrapperSignInContainer = styled.div`
    position: fixed;
    background: rgba(0, 0, 0, 0.53);
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100vh;
`;

export const WrapperSignInPage = styled.div`
    background: rgb(248, 248, 248);
    width: 900px;
    height: 500px;
    display: flex;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
`;

export const WrapperTextSignIn = styled.h4`
    margin: 0px 0px 10px;
    font-size: 24px;
    font-weight: 500;

`;

export const WrapperTextCreateAccount = styled.p`
    margin: 20 0px;
    font-size: 20px;
    font-weight: 500;
`;

export const WrapperExitPage = styled.div`
    position: absolute;
    top: -16px;
    right: -16px;
    cursor: pointer;
    font-size: 18px;
    font-weight: 600;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    background-color: #f0f0f0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    color: #bb9292
`;


    