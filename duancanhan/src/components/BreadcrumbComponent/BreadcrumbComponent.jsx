import React from 'react';
import { useNavigate } from 'react-router-dom';

const BreadcrumbComponent = ({ items }) => {
    const navigate = useNavigate();

    return (
        <h5 style={{ 
            color: "var(--text-secondary)", 
            padding: '24px 0', 
            fontSize: '14px', 
            fontWeight: '500',
            letterSpacing: '0.2px',
            margin: 0
        }}>
            <span style={{ color: "var(--primary-color)", cursor: "pointer", fontWeight: '600' }} onClick={() => navigate("/")}>Trang chủ</span>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <span style={{ margin: '0 8px', color: '#ccc' }}>/</span>
                    <span 
                        style={{ color: item.onClick ? "var(--primary-color)" : 'var(--text-main)', cursor: item.onClick ? "pointer" : "default" }} 
                        onClick={() => item.onClick && item.onClick()}
                    >
                        {item.name}
                    </span>
                </React.Fragment>
            ))}
        </h5>
    );
};

export default BreadcrumbComponent;