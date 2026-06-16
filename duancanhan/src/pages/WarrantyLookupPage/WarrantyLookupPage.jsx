import React, { useState } from 'react';
import { Input, Button, Table, Card, Typography, Space, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { showError } from '../../components/MessageComponent/MessageComponent';

const { Title, Text } = Typography;

export const WarrantyLookupPage = () => {
    const [search, setSearch] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!search) return;
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/order/get-warranty/${search}`);
            setOrders(res.data.data);
        } catch (error) {
            setOrders([]);
            showError(error.response?.data?.message || 'Không tìm thấy đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Sản phẩm', dataIndex: 'name', key: 'name' },
        { 
            title: 'Ngày mua', 
            dataIndex: 'orderCreatedAt', 
            key: 'orderCreatedAt',
            render: (text) => dayjs(text).format('DD/MM/YYYY')
        },
        { 
            title: 'Hạn bảo hành', 
            key: 'warranty',
            render: (_, record) => {
                const purchaseDate = dayjs(record.orderCreatedAt);
                const expiryDate = purchaseDate.add(record.warranty || 12, 'month');
                const isExpired = dayjs().isAfter(expiryDate);
                return (
                    <Tag color={isExpired ? 'red' : 'green'}>
                        {isExpired ? 'Đã hết hạn' : `Đến ${expiryDate.format('DD/MM/YYYY')}`}
                    </Tag>
                );
            }
        }
    ];

    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
            <Title level={2} style={{ textAlign: 'center' }}>Tra cứu thông tin bảo hành</Title>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '30px' }}>
                <Input 
                    placeholder="Nhập mã đơn hàng hoặc số điện thoại" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: '300px' }}
                />
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
                    Tra cứu
                </Button>
            </div>

            {orders.map(order => (
                <Card key={order._id} title={`Mã đơn hàng: ${order.orderCode}`} style={{ marginBottom: '20px' }}>
                    <Table 
                        dataSource={order.orderItems.map(item => ({
                            ...item,
                            orderCreatedAt: order.createdAt
                        }))} 
                        columns={columns} 
                        pagination={false}
                        rowKey="product"
                    />
                </Card>
            ))}
        </div>
    );
};