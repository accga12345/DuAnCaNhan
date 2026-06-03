import React from 'react';
import { Card, Radio, Space, Rate } from 'antd';
import { WrapperSidebar } from './style';
import TypeProduct from '../TypeProducts/TypeProduct';
import styled from 'styled-components';

const WapperHomePage = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
`;

const SidebarComponent = ({
    categories,
    brands,
    brandFilter,
    setBrandFilter,
    ratingFilter,
    setRatingFilter,
    setLimit,
    sortOption,
    setSortOption,
    categoryId,
    showPCBuilder = false
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
            <span style={{ fontSize: '14px', color: ratingFilter === stars ? '#1890ff' : 'var(--text-main)', fontWeight: ratingFilter === stars ? 600 : 400 }}>
                từ {stars} sao
            </span>
        </div>
    );

    return (
        <WrapperSidebar>
            <Card style={{ padding: "8px", borderRadius: "8px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 2px 6px 2px rgba(60,64,67,0.15)", border: "none", marginBottom: '16px' }} bodyStyle={{ padding: '12px' }}>
                <h3 style={{ marginBottom: "16px", fontWeight: "700", fontSize: '16px', color: 'var(--text-main)' }}>Danh mục</h3>
                <WapperHomePage>
                    {showPCBuilder && (
                        <div style={{ padding: '8px', border: '1px solid #1890ff', borderRadius: '4px', textAlign: 'center', marginBottom: '8px', cursor: 'pointer' }} onClick={() => window.location.href = '/xay-dung-cau-hinh'}>
                            <span style={{ fontWeight: "700", color: "#1890ff" }}>🛠 Xây dựng cấu hình PC</span>
                        </div>
                    )}
                    {categories?.data?.map((item) => (
                        <TypeProduct name={item.name} id={item._id} image={item.image} key={item._id} isActive={item._id === categoryId} />
                    ))}
                </WapperHomePage>
            </Card>

            <Card style={{ padding: "8px", borderRadius: "8px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 2px 6px 2px rgba(60,64,67,0.15)", border: "none", marginBottom: '16px' }} bodyStyle={{ padding: '12px' }}>
                <h3 style={{ marginBottom: "16px", fontWeight: "700", fontSize: '16px', color: 'var(--text-main)' }}>Thương hiệu</h3>
                <Radio.Group onChange={(e) => { setBrandFilter(e.target.value); if (setLimit) setLimit(12); }} value={brandFilter}>
                    <Space direction="vertical" style={{ display: 'flex' }}>
                        <Radio value="" style={{ color: brandFilter === '' ? '#1890ff' : 'inherit', fontWeight: brandFilter === '' ? 600 : 400 }}>Tất cả</Radio>
                        {brands?.data?.map(brand => (
                            <Radio key={brand._id} value={brand.name}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: brandFilter === brand.name ? '#1890ff' : 'inherit',
                                    fontWeight: brandFilter === brand.name ? 600 : 400
                                }}>
                                    {brand.image && <img src={brand.image} alt={brand.name} style={{ width: 24, height: 24, marginRight: 8, objectFit: 'contain' }} />}
                                    {brand.name}
                                </div>
                            </Radio>
                        ))}
                    </Space>
                </Radio.Group>
            </Card>

            <Card style={{ padding: "8px", borderRadius: "8px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 2px 6px 2px rgba(60,64,67,0.15)", border: "none" }} bodyStyle={{ padding: '12px' }}>
                <h3 style={{ marginBottom: "16px", fontWeight: "700", fontSize: '16px', color: 'var(--text-main)' }}>Đánh giá</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {renderStarFilter(5)}
                    {renderStarFilter(4)}
                    {renderStarFilter(3)}
                    {renderStarFilter(2)}
                    {renderStarFilter(1)}
                    {renderStarFilter(0)}
                </div>
            </Card>

            {sortOption !== undefined && (
                <Card style={{ padding: "8px", borderRadius: "8px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 2px 6px 2px rgba(60,64,67,0.15)", border: "none", marginTop: '16px' }} bodyStyle={{ padding: '12px' }}>
                    <h3 style={{ marginBottom: "16px", fontWeight: "700", fontSize: '16px', color: 'var(--text-main)' }}>Sắp xếp theo</h3>
                    <Radio.Group onChange={(e) => { setSortOption(e.target.value); if (setLimit) setLimit(12); }} value={sortOption}>
                        <Space direction="vertical">
                            <Radio value="" style={{ color: sortOption === '' ? '#1890ff' : 'inherit', fontWeight: sortOption === '' ? 600 : 400 }}>Mặc định</Radio>
                            <Radio value="priceAsc" style={{ color: sortOption === 'priceAsc' ? '#1890ff' : 'inherit', fontWeight: sortOption === 'priceAsc' ? 600 : 400 }}>Giá thấp đến cao</Radio>
                            <Radio value="priceDesc" style={{ color: sortOption === 'priceDesc' ? '#1890ff' : 'inherit', fontWeight: sortOption === 'priceDesc' ? 600 : 400 }}>Giá cao đến thấp</Radio>
                            <Radio value="ratingDesc" style={{ color: sortOption === 'ratingDesc' ? '#1890ff' : 'inherit', fontWeight: sortOption === 'ratingDesc' ? 600 : 400 }}>Đánh giá tốt nhất</Radio>
                            <Radio value="selledDesc" style={{ color: sortOption === 'selledDesc' ? '#1890ff' : 'inherit', fontWeight: sortOption === 'selledDesc' ? 600 : 400 }}>Bán chạy nhất</Radio>
                        </Space>
                    </Radio.Group>
                </Card>
            )}
        </WrapperSidebar>
    );
};

export default SidebarComponent;
