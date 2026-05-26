import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Modal, List } from 'antd';
import { ShoppingOutlined, DollarCircleOutlined, UserOutlined, RiseOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getOperatingCost } from '../../services/OperatingCostService';

const DashboardStats = ({ orders, products, users }) => {
    const [selectedMonthOrders, setSelectedMonthOrders] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: costData } = useQuery({
        queryKey: ['operating-cost'],
        queryFn: getOperatingCost,
    });

    const staffCount = useMemo(() => {
        return users?.data?.filter(user => user.isEmployee).length || 0;
    }, [users]);

    const productCostMap = useMemo(() => {
        const map = {};
        products?.data?.forEach(product => {
            map[product._id] = product.warehouseItem?.costPrice || 0;
        });
        return map;
    }, [products]);

    const monthlyStats = useMemo(() => {
        if (!orders?.data || !costData?.data) return [];
        const data = {};
        
        const rentCost = costData.data.rentCost || 0;
        const staffCostPerPerson = costData.data.salaryPerStaff || 0;
        const totalFixedCosts = rentCost + (staffCount * staffCostPerPerson);

        orders.data.forEach(order => {
            // Kiểm tra theo thuộc tính status === 4 (Hoàn thành) hoặc isDelivered
            if (order.status !== 4 && order.isDelivered !== true) return; 

            const date = new Date(order.createdAt);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

            if (!data[monthYear]) {
                data[monthYear] = { revenue: 0, cost: 0, orders: [] };
            }

            data[monthYear].revenue += order.totalPrice;
            data[monthYear].orders.push(order);

            order.orderItems.forEach(item => {
                const itemCost = productCostMap[item.product] || 0;
                data[monthYear].cost += (itemCost * item.amount);
            });
        });

        return Object.keys(data).map(key => ({
            key,
            month: key,
            revenue: data[key].revenue,
            goodsCost: data[key].cost,
            fixedCosts: totalFixedCosts,
            profit: data[key].revenue - data[key].cost - totalFixedCosts,
            orders: data[key].orders
        })).sort((a, b) => new Date(b.month) - new Date(a.month));
    }, [orders, productCostMap, staffCount, costData]);

    const totalRevenue = monthlyStats.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalProfit = monthlyStats.reduce((acc, curr) => acc + curr.profit, 0);
    const totalFixedCosts = monthlyStats.reduce((acc, curr) => acc + curr.fixedCosts, 0);
    const totalOrders = orders?.data?.length || 0;
    const totalUsers = users?.data?.length || 0;

    const columns = [
        { title: 'Tháng/Năm', dataIndex: 'month', key: 'month' },
        { title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', render: (val) => val.toLocaleString() + ' đ' },
        { title: 'Giá vốn hàng', dataIndex: 'goodsCost', key: 'goodsCost', render: (val) => val.toLocaleString() + ' đ' },
        { title: 'Chi phí vận hành', dataIndex: 'fixedCosts', key: 'fixedCosts', render: (val) => val.toLocaleString() + ' đ' },
        { title: 'Lợi nhuận', dataIndex: 'profit', key: 'profit', render: (val) => val.toLocaleString() + ' đ' },
    ];

    const onRowClick = (record) => ({
        onClick: () => {
            setSelectedMonthOrders(record.orders);
            setIsModalOpen(true);
        }
    });

    return (
        <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Card><Statistic title="Tổng doanh thu" value={totalRevenue} precision={0} prefix={<DollarCircleOutlined style={{ color: '#cf1322' }} />} suffix="đ" /></Card>
                </Col>
                <Col span={6}>
                    <Card><Statistic title="Tổng lợi nhuận" value={totalProfit} precision={0} prefix={<RiseOutlined style={{ color: '#52c41a' }} />} suffix="đ" /></Card>
                </Col>
                <Col span={6}>
                    <Card><Statistic title="Tổng chi phí VH" value={totalFixedCosts} precision={0} prefix={<ShoppingOutlined style={{ color: '#faad14' }} />} suffix="đ" /></Card>
                </Col>
                <Col span={6}>
                    <Card><Statistic title="Tổng đơn hàng" value={totalOrders} prefix={<ShoppingOutlined style={{ color: '#1890ff' }} />} /></Card>
                </Col>
            </Row>

            <Card title="Thống kê doanh thu & Lợi nhuận theo tháng (Bấm vào hàng để xem chi tiết)">
                <Table 
                    dataSource={monthlyStats} 
                    columns={columns} 
                    pagination={{ pageSize: 5 }} 
                    onRow={onRowClick}
                    rowClassName="cursor-pointer"
                />
            </Card>

            <Modal title="Chi tiết đơn hàng trong tháng" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={800}>
                <List
                    dataSource={selectedMonthOrders}
                    renderItem={order => (
                        <List.Item>
                            <List.Item.Meta
                                title={`Đơn hàng ID: ${order._id}`}
                                description={`Khách: ${order.shippingAddress?.fullName} - Tổng: ${order.totalPrice.toLocaleString()} đ`}
                            />
                        </List.Item>
                    )}
                />
            </Modal>
        </>
    );
};

export default DashboardStats;
