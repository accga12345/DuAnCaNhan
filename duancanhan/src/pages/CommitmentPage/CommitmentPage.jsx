import React from 'react';
import { Card } from 'antd';

const CommitmentPage = () => {
    return (
        <div style={{ backgroundColor: "var(--bg-color)", padding: "20px 0", minHeight: 'calc(100vh - 64px)' }}>
            <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 24px" }}>
                <Card style={{ borderRadius: '8px', overflow: 'hidden', padding: 0 }} bodyStyle={{ padding: 0 }}>
                    <img 
                        src="https://res.cloudinary.com/dy1fkhsmu/image/upload/v1778603611/TechShop/whwfh9zzlvwoetndhiil.webp" 
                        alt="Chính sách cam kết" 
                        style={{ width: '100%', display: 'block' }}
                    />
                </Card>
            </div>
        </div>
    );
};

export default CommitmentPage;
