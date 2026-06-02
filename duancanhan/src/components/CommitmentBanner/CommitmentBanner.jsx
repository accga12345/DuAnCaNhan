import React from 'react';
import { TruckOutlined, SafetyCertificateOutlined, ReloadOutlined, ThunderboltOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { WrapperCommitment } from './style';

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
