import styled from 'styled-components';

export const ChatWindowWrapper = styled.div`
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    width: 400px;
    height: 600px;
    background: #fff;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    display: ${props => props.isOpen ? 'flex' : 'none'};
`;

export const ChatHeader = styled.div`
    padding: 10px;
    background: #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #ddd;
`;

export const ChatBubble = styled.div`
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #ff4d4f;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    cursor: pointer;
    font-size: 24px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    transition: all 0.3s;

    &:hover {
        transform: scale(1.1);
    }
`;
