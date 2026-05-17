import React from 'react';
import { TruckOutlined, SafetyCertificateOutlined, ReloadOutlined, ThunderboltOutlined, DollarCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const WrapperCommitment = styled.div`
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

const CommitmentBanner = () => {
    const navigate = useNavigate();
    
    return (
        <WrapperCommitment onClick={() => navigate('/cam-ket')}>
            <div className="item"><SafetyCertificateOutlined className="icon"/> 100% hàng thật</div>
            <div className="item"><TruckOutlined className="icon"/> Freeship mọi đơn</div>
            <div className="item"><ReloadOutlined className="icon"/> 30 ngày đổi trả</div>
            <div className="item"><ThunderboltOutlined className="icon"/> Giao nhanh 2h</div>
            <div className="item"><DollarCircleOutlined className="icon"/> Giá siêu rẻ</div>
        </WrapperCommitment>
    );
};

export default CommitmentBanner;
