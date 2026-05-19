import React from "react";
import { WrapperLabel, WrapperText, WrapperContent } from "./style";
import { Checkbox, Rate } from 'antd';
import { useNavigate } from "react-router-dom";
import { convertToSlug } from "../../ultil";

const NavBarComponent = ({ types, onChange }) => {
    const navigate = useNavigate();

    const handleNavigate = (name) => {
        navigate(`/product/category/${convertToSlug(name)}`);
    };

    const handleFilterClick = (type, value) => {
        if (onChange) {
            onChange({ type, value });
        }
    };

    const renderContent = (type, data) => {
        switch (type) {
            case 'category':
                return data?.map(item => (
                    <WrapperText key={item._id} onClick={() => handleNavigate(item.name)} style={{ cursor: 'pointer' }}>
                        {item.name}
                    </WrapperText>
                )) || [];
            case 'checkbox':
                return data?.map(item => {
                    return (
                        <Checkbox key={item.value} value={item.label}>{item.label}</Checkbox>
                    )
                })
            case 'rate':
                return data?.map(item => {
                    return (
                        <div key={item} onClick={() => handleFilterClick('rating', item)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <Rate style={{ fontSize: '16px' }} disabled defaultValue={item} />
                            <span>từ {item} sao</span>
                        </div>
                    )
                })
            default:
                return {}
        }
    }

    return (
        <div>
            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #1890ff', borderRadius: '5px', textAlign: 'center' }}>
                <WrapperText onClick={() => navigate('/xay-dung-cau-hinh')} style={{ cursor: 'pointer', fontWeight: 'bold', color: '#1890ff', fontSize: '16px' }}>
                    🛠 Xây dựng cấu hình PC
                </WrapperText>
            </div>

            <WrapperLabel>Danh mục</WrapperLabel>
            <WrapperContent>
                {renderContent('category', types)}
            </WrapperContent>

            <WrapperLabel style={{ marginTop: '20px' }}> Đánh giá</WrapperLabel>
            <WrapperContent>
                {renderContent('rate', [2, 3, 4, 5])}
            </WrapperContent>
        </div>
    )
}

export default NavBarComponent