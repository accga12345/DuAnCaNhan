import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Modal, List, Button, Input, Pagination } from 'antd';
import { ShoppingOutlined, DollarCircleOutlined, RiseOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getOperatingCost } from '../../services/OperatingCostService';
import { exportExcel } from '../../ultil';

const { Text } = Typography;

const DashboardStats = ({ orders, products, users }) => {
    const [selectedMonthOrders, setSelectedMonthOrders] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchCode, setSearchCode] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

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

    const handleExportMonthlyStats = () => {
        const data = monthlyStats.map(item => ({
            "Tháng/Năm": item.month,
            "Doanh thu": item.revenue,
            "Giá vốn hàng": item.goodsCost,
            "Chi phí vận hành": item.fixedCosts,
            "Lợi nhuận": item.profit
        }));
        exportExcel(data, "Thong_ke_doanh_thu_theo_thang", "MonthlyStats");
    };

    const handleExportMonthOrders = () => {
        const data = selectedMonthOrders.flatMap(order => 
            order.orderItems.map(item => {
                const cost = productCostMap[item.product] || 0;
                return {
                    "Mã đơn hàng": order.orderCode,
                    "Tên sản phẩm": item.name,
                    "Số lượng": item.amount,
                    "Giá bán": item.price,
                    "Giá nhập": cost,
                    "Lợi nhuận": (item.price - cost) * item.amount,
                    "Thành tiền": item.price * item.amount
                };
            })
        );
        exportExcel(data, "Chi_tiet_don_hang_thang", "OrdersDetails");
    };

    const filteredOrders = useMemo(() => {
        return selectedMonthOrders.filter(order => 
            order.orderCode?.toLowerCase().includes(searchCode.toLowerCase())
        );
    }, [selectedMonthOrders, searchCode]);

    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredOrders.slice(start, start + pageSize);
    }, [filteredOrders, currentPage]);

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

            <Card 
                title="Thống kê doanh thu & Lợi nhuận theo tháng (Bấm vào hàng để xem chi tiết)" 
                extra={<Button icon={<FileExcelOutlined />} onClick={handleExportMonthlyStats}>Xuất Excel</Button>}
            >
                <Table 
                    dataSource={monthlyStats} 
                    columns={columns} 
                    pagination={{ pageSize: 10 }} 
                    onRow={onRowClick}
                    rowClassName="cursor-pointer"
                />
            </Card>

            <Modal 
                title="Chi tiết đơn hàng trong tháng" 
                open={isModalOpen} 
                onCancel={() => { setIsModalOpen(false); setCurrentPage(1); }} 
                footer={[
                    <Button key="export" icon={<FileExcelOutlined />} onClick={handleExportMonthOrders} style={{ marginBottom: 16 }}>Xuất chi tiết Excel</Button>,
                    <br key="break" />,
                    <Button key="close" onClick={() => { setIsModalOpen(false); setCurrentPage(1); }}>Đóng</Button>
                ]} 
                width={900}
            >
                <Input.Search
                    placeholder="Tìm kiếm theo mã đơn hàng"
                    onChange={(e) => { setSearchCode(e.target.value); setCurrentPage(1); }}
                    style={{ marginBottom: 16 }}
                />
                {paginatedOrders.map(order => (
                    <Card key={order._id} title={`Mã đơn hàng: ${order.orderCode}`} style={{ marginBottom: 16 }}>
                        <Table 
                            dataSource={order.orderItems}
                            pagination={false}
                            columns={[
                                { title: 'Sản phẩm', dataIndex: 'name', key: 'name' },
                                { title: 'Số lượng', dataIndex: 'amount', key: 'amount' },
                                { title: 'Giá bán', dataIndex: 'price', key: 'price', render: (val) => val.toLocaleString() + ' đ' },
                                { title: 'Giá nhập', key: 'cost', render: (_, record) => (productCostMap[record.product] || 0).toLocaleString() + ' đ' },
                                { title: 'Lợi nhuận', key: 'profit', render: (_, record) => ((record.price - (productCostMap[record.product] || 0)) * record.amount).toLocaleString() + ' đ' }
                            ]}
                        />
                    </Card>
                ))}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                    <Pagination 
                        current={currentPage} 
                        pageSize={pageSize} 
                        total={filteredOrders.length} 
                        onChange={(page) => setCurrentPage(page)} 
                    />
                </div>
            </Modal>
        </>
    );
};

export default DashboardStats;
