import styled from 'styled-components';

export const WrapperCommitment = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 24px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    width: 100%;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .item {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        gap: 8px;
        font-weight: 500;
        color: #555;
    }
    
    .icon {
        font-size: 20px;
        color: #1a73e8;
    }
`;
