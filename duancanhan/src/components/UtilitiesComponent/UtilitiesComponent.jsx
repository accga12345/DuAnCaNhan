import React from 'react';
import { Button } from 'antd';
import { FileSearchOutlined, ToolOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { convertToSlug } from '../../ultil';

const UtilitiesComponent = ({ categories, showPCBuilder = false }) => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', gap: '8px', padding: '10px 24px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            {categories?.data?.map((item) => (
                <Button key={item._id} type="text" onClick={() => navigate(`/product/category/${convertToSlug(item.name).toLowerCase()}`, { state: item.name })}>
                    {item.name}
                </Button>
            ))}
            <div style={{ borderLeft: '1px solid #e5e5e5', height: '24px', margin: '0 8px' }} />
            <Button type="text" icon={<FileSearchOutlined />} onClick={() => navigate('/warranty-lookup')} style={{ fontWeight: 600 }}>
                Tra cứu bảo hành
            </Button>
            {showPCBuilder && (
                <Button type="text" icon={<ToolOutlined />} onClick={() => navigate('/xay-dung-cau-hinh')} style={{ fontWeight: 600 }}>
                    Xây dựng cấu hình PC
                </Button>
            )}
        </div>
    );
};

export default UtilitiesComponent;
