import styled from "styled-components";

export const TextTypeProduct = styled.div`
    font-size: 14px;
    font-weight: 500;
    padding: 6px 20px;
    background-color: ${(props) => (props.isActive ? 'var(--primary-color)' : '#fff')};
    color: ${(props) => (props.isActive ? '#fff' : 'var(--text-main)')};
    border-radius: 10px;
    border: 1px solid ${(props) => (props.isActive ? 'var(--primary-color)' : '#eee')};
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    box-sizing: border-box;
    box-shadow: ${(props) => (props.isActive ? '0 4px 12px rgba(26, 115, 232, 0.2)' : '0 2px 4px rgba(0,0,0,0.02)')};

    &:hover {
        background-color: ${(props) => (props.isActive ? 'var(--primary-color)' : '#fff')};
        color: ${(props) => (props.isActive ? '#fff' : 'var(--primary-color)')};
        border-color: var(--primary-color);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(26, 115, 232, 0.12);
    }

    &:active {
        transform: translateY(0);
    }
`;