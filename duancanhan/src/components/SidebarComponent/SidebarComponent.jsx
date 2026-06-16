import React from 'react';
import { Card, Radio, Space, Rate } from 'antd';
import { WrapperSidebar } from './style';
import styled from 'styled-components';

const WrapperSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const SidebarComponent = ({
    brands,
    brandFilter,
    setBrandFilter,
    ratingFilter,
    setRatingFilter,
    setLimit
}) => {

    const renderStarFilter = (stars) => (
        <div
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 0' }}
            onClick={() => {
                setRatingFilter(ratingFilter === stars ? 0 : stars);
                if (setLimit) setLimit(12);
            }}
        >
            <Rate disabled defaultValue={stars} style={{ fontSize: '14px', color: ratingFilter === stars ? '#1890ff' : '#fadb14' }} />
            <span style={{ fontSize: '14px', color: ratingFilter === stars ? '#1890ff' : '#333', fontWeight: ratingFilter === stars ? 600 : 400 }}>
                {stars === 0 ? 'Tất cả' : `từ ${stars} sao`}
            </span>
        </div>
    );

    const cardStyle = { 
        borderRadius: "8px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)", 
        border: "none", 
        marginBottom: '16px',
        overflow: 'hidden'
    };

    const headerStyle = {
        fontWeight: "700",
        fontSize: '16px',
        color: '#333',
        marginBottom: '12px',
        borderBottom: '1px solid #eee',
        paddingBottom: '8px'
    };

    return (
        <WrapperSidebar>
            <Card style={cardStyle} bodyStyle={{ padding: '16px' }}>
                <h3 style={headerStyle}>Thương hiệu</h3>
                <Radio.Group onChange={(e) => { setBrandFilter(e.target.value); if (setLimit) setLimit(12); }} value={brandFilter}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Radio value="">Tất cả</Radio>
                        {brands?.data?.map(brand => (
                            <Radio key={brand._id} value={brand.name}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    {brand.image && <img src={brand.image} alt={brand.name} style={{ width: 20, height: 20, marginRight: 8, objectFit: 'contain' }} />}
                                    {brand.name}
                                </div>
                            </Radio>
                        ))}
                    </Space>
                </Radio.Group>
            </Card>

            <Card style={cardStyle} bodyStyle={{ padding: '16px' }}>
                <h3 style={headerStyle}>Đánh giá</h3>
                <WrapperSection>
                    {[5, 4, 3, 2, 1, 0].map(star => renderStarFilter(star))}
                </WrapperSection>
            </Card>
        </WrapperSidebar>
    );
};

export default SidebarComponent;
