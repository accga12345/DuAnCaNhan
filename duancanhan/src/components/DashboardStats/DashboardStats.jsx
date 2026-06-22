import React, { useMemo, useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Modal, List, Button, Input, Pagination, DatePicker, Table } from 'antd';
import { ShoppingOutlined, DollarCircleOutlined, RiseOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useMutationHook } from '../../hooks/useMutationHook';
import { getAllOrder, deleteManyOrder } from '../../services/OrderService';
import { getAllProduct } from '../../services/ProductService';
import { getAllUser } from '../../services/UserServices';
import { getOperatingCost } from '../../services/OperatingCostService';
import { exportExcel } from '../../ultil';
import dayjs from 'dayjs';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import TableComponent from '../TableComponent/TableComponent';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const DashboardStats = () => {
    const [selectedMonthOrders, setSelectedMonthOrders] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchCode, setSearchCode] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [monthRange, setMonthRange] = useState([null, null]);
    const [modalDateRange, setModalDateRange] = useState([null, null]);
    const pageSize = 10;
    const user = useSelector((state) => state.user);

    const { data: orders, status: ordersStatus, refetch: refetchOrders } = useQuery({ 
        queryKey: ['orders-dashboard'], 
        queryFn: () => getAllOrder(user?.accessToken), 
        enabled: !!user?.accessToken 
    });

    const { data: products, status: productsStatus } = useQuery({ 
        queryKey: ['products-dashboard'], 
        queryFn: () => getAllProduct(1000, 1),
        enabled: !!user?.accessToken
    });

    const { data: users, status: usersStatus } = useQuery({ 
        queryKey: ['users-dashboard'], 
        queryFn: () => getAllUser(user?.accessToken), 
        enabled: !!(user?.accessToken && user?.isAdmin),
    });

    const mutationDeleteMany = useMutationHook(
        async (ids) => {
            return await deleteManyOrder(ids, user?.accessToken);
        }
    );

    const { data: dataDeleteMany, isSuccess: isSuccessDeleteMany, isError: isErrorDeleteMany } = mutationDeleteMany;

    useEffect(() => {
        if (isSuccessDeleteMany && dataDeleteMany?.status === 'OK') {
            refetchOrders();
        }
    }, [isSuccessDeleteMany, dataDeleteMany, refetchOrders]);

    const handleDeleteMany = (monthKeys) => {
        const orderIds = monthlyStats
            .filter(stat => monthKeys.includes(stat.key))
            .flatMap(stat => stat.orders.map(o => o._id));
        
        if (orderIds.length > 0) {
            mutationDeleteMany.mutate(orderIds);
        }
    };

    const { data: costData, status: costStatus } = useQuery({
        queryKey: ['operating-cost'],
        queryFn: getOperatingCost,
    });

    const totalStaffSalary = useMemo(() => {
        return users?.data?.filter(user => user.isEmployee).reduce((sum, u) => sum + (u.salary || 0), 0) || 0;
    }, [users]);

    const productCostMap = useMemo(() => {
        const map = {};
        products?.data?.forEach(product => {
            map[product._id] = product.warehouseItem?.costPrice || 0;
        });
        return map;
    }, [products]);

    const filteredOrdersByMonth = useMemo(() => {
        if (!orders?.data) return [];
        if (!monthRange[0] || !monthRange[1]) return orders.data;

        const start = monthRange[0].startOf('month').toDate();
        const end = monthRange[1].endOf('month').toDate();

        return orders.data.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= start && orderDate <= end;
        });
    }, [orders, monthRange]);

    const monthlyStats = useMemo(() => {
        if (!filteredOrdersByMonth || !costData?.data) return [];
        const data = {};
        
        const rentCost = costData.data.rentCost || 0;
        const totalFixedCosts = rentCost + totalStaffSalary;

        filteredOrdersByMonth.forEach(order => {
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
        })).sort((a, b) => {
            const [mA, yA] = a.month.split('/').map(Number);
            const [mB, yB] = b.month.split('/').map(Number);
            // Sắp xếp giảm dần: năm mới hơn lên trước, nếu cùng năm thì tháng lớn hơn lên trước
            if (yB !== yA) return yB - yA;
            return mB - mA;
        });
    }, [filteredOrdersByMonth, productCostMap, totalStaffSalary, costData]);

    const totalRevenue = monthlyStats.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalProfit = monthlyStats.reduce((acc, curr) => acc + curr.profit, 0);
    const totalFixedCosts = monthlyStats.reduce((acc, curr) => acc + curr.fixedCosts, 0);
    const totalOrders = monthlyStats.reduce((acc, curr) => acc + curr.orders.length, 0);
    
    const chartData = useMemo(() => {
        return [...monthlyStats].reverse();
    }, [monthlyStats]);

    const columns = [
        { title: 'Tháng/Năm', dataIndex: 'month', key: 'month' },
        { title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', render: (val) => val.toLocaleString() + ' đ' },
        ...(user?.isAdmin ? [
            { title: 'Giá vốn hàng', dataIndex: 'goodsCost', key: 'goodsCost', render: (val) => val.toLocaleString() + ' đ' },
            { title: 'Chi phí vận hành', dataIndex: 'fixedCosts', key: 'fixedCosts', render: (val) => val.toLocaleString() + ' đ' },
            { title: 'Lợi nhuận', dataIndex: 'profit', key: 'profit', render: (val) => val.toLocaleString() + ' đ' }
        ] : []),
    ];

    const onRowClick = (record) => ({
        onClick: () => {
            setSelectedMonthOrders(record.orders);
            // Thiết lập mặc định là cả tháng
            const [month, year] = record.month.split('/').map(Number);
            const startOfMonth = dayjs(`${year}-${month}-01`).startOf('month');
            const endOfMonth = startOfMonth.endOf('month');
            setModalDateRange([startOfMonth, endOfMonth]);
            setIsModalOpen(true);
        }
    });

    const handleExportMonthlyStats = () => {
        const data = monthlyStats.map(item => {
            const row = {
                "Tháng/Năm": item.month,
                "Doanh thu": item.revenue,
            };
            if (user?.isAdmin) {
                row["Giá vốn hàng"] = item.goodsCost;
                row["Chi phí vận hành"] = item.fixedCosts;
                row["Lợi nhuận"] = item.profit;
            }
            return row;
        });
        
        const dateStr = monthRange[0] && monthRange[1] 
            ? `${monthRange[0].format('MM/YYYY')} - ${monthRange[1].format('MM/YYYY')}`
            : "";
            
        exportExcel(data, "Thong_ke_doanh_thu_theo_thang", "MonthlyStats", "BÁO CÁO DOANH THU & LỢI NHUẬN THEO THÁNG", dateStr);
    };

    const filteredOrdersByModalDate = useMemo(() => {
        if (!selectedMonthOrders) return [];
        if (!modalDateRange[0] || !modalDateRange[1]) return selectedMonthOrders;

        const start = modalDateRange[0].startOf('day').toDate();
        const end = modalDateRange[1].endOf('day').toDate();

        return selectedMonthOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= start && orderDate <= end;
        });
    }, [selectedMonthOrders, modalDateRange]);

    const handleExportMonthOrders = () => {
        const data = filteredOrdersByModalDate.flatMap(order => 
            order.orderItems.map(item => {
                const cost = productCostMap[item.product] || 0;
                return {
                    "Mã đơn hàng": order.orderCode,
                    "Ngày đặt": dayjs(order.createdAt).format('DD/MM/YYYY HH:mm'),
                    "Tên sản phẩm": item.name,
                    "Số lượng": item.amount,
                    "Giá bán": item.price,
                    "Giá nhập": cost,
                    "Lợi nhuận": (item.price - cost) * item.amount,
                    "Thành tiền": item.price * item.amount
                };
            })
        );
        
        const dateStr = modalDateRange[0] && modalDateRange[1]
            ? `${modalDateRange[0].format('DD/MM/YYYY')} - ${modalDateRange[1].format('DD/MM/YYYY')}`
            : "";

        exportExcel(data, `Chi_tiet_don_hang_${dateStr.replace(/\//g, '-')}`, "OrdersDetails", `CHI TIẾT ĐƠN HÀNG`, dateStr);
    };

    const filteredOrders = useMemo(() => {
        return filteredOrdersByModalDate.filter(order => 
            order.orderCode?.toLowerCase().includes(searchCode.toLowerCase())
        );
    }, [filteredOrdersByModalDate, searchCode]);

    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredOrders.slice(start, start + pageSize);
    }, [filteredOrders, currentPage]);

    return (
        <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={24}>
                    <Card title="Lọc theo tháng/năm" style={{ marginBottom: 16 }}>
                        <RangePicker 
                            picker="month"
                            style={{ width: '100%' }} 
                            onChange={(dates) => {
                                setMonthRange(dates || [null, null]);
                            }}
                            placeholder={['Từ tháng', 'Đến tháng']}
                            format="MM/YYYY"
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card><Statistic title="Tổng doanh thu" value={totalRevenue} precision={0} prefix={<DollarCircleOutlined style={{ color: '#cf1322' }} />} suffix="đ" /></Card>
                </Col>
                {user?.isAdmin && (
                    <>
                        <Col span={6}>
                            <Card><Statistic title="Tổng lợi nhuận" value={totalProfit} precision={0} prefix={<RiseOutlined style={{ color: '#52c41a' }} />} suffix="đ" /></Card>
                        </Col>
                        <Col span={6}>
                            <Card><Statistic title="Tổng chi phí VH" value={totalFixedCosts} precision={0} prefix={<ShoppingOutlined style={{ color: '#faad14' }} />} suffix="đ" /></Card>
                        </Col>
                    </>
                )}
                <Col span={6}>
                    <Card><Statistic title="Tổng đơn hàng" value={totalOrders} prefix={<ShoppingOutlined style={{ color: '#1890ff' }} />} /></Card>
                </Col>
            </Row>

            <Card title="Biểu đồ Doanh thu & Lợi nhuận" style={{ marginBottom: 24 }}>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis yAxisId="left" tickFormatter={(value) => `${(value / 1000000)}M`} />
                            <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${(value / 1000000)}M`} />
                            <RechartsTooltip formatter={(value) => `${value.toLocaleString()} đ`} />
                            <Legend />
                            <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#1890ff" barSize={40} />
                            {user?.isAdmin && (
                                <Line yAxisId="right" type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#52c41a" strokeWidth={3} />
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card 
                title="Thống kê doanh thu & Lợi nhuận theo tháng (Bấm vào hàng để xem chi tiết)" 
                extra={<Button type="primary" icon={<FileExcelOutlined />} onClick={handleExportMonthlyStats}>Xuất Excel</Button>}
            >
                <TableComponent 
                    canDelete={user?.isAdmin}
                    data={monthlyStats} 
                    columns={columns} 
                    pagination={{ pageSize: 10 }} 
                    onRow={onRowClick}
                    rowClassName="cursor-pointer"
                    handleDeleteMany={handleDeleteMany}
                />
            </Card>

            <Modal 
                title="Chi tiết đơn hàng" 
                open={isModalOpen} 
                onCancel={() => { setIsModalOpen(false); setCurrentPage(1); }} 
                footer={[
                    <Button key="export" type="primary" icon={<FileExcelOutlined />} onClick={handleExportMonthOrders} style={{ marginBottom: 16 }}>Xuất chi tiết Excel</Button>,
                    <br key="break" />,
                    <Button key="close" onClick={() => { setIsModalOpen(false); setCurrentPage(1); }}>Đóng</Button>
                ]} 
                width={1000}
            >
                <div style={{ display: 'flex', gap: '16px', marginBottom: 16 }}>
                    <RangePicker 
                        style={{ flex: 1 }}
                        value={modalDateRange}
                        onChange={(dates) => {
                            setModalDateRange(dates || [null, null]);
                            setCurrentPage(1);
                        }}
                        placeholder={['Từ ngày', 'Đến ngày']}
                        format="DD/MM/YYYY"
                    />
                    <Input.Search
                        placeholder="Tìm theo mã đơn hàng"
                        onChange={(e) => { setSearchCode(e.target.value); setCurrentPage(1); }}
                        style={{ width: 300 }}
                    />
                </div>
                
                {paginatedOrders.map(order => (
                    <Card key={order._id} title={`Mã: ${order.orderCode} - Ngày: ${dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}`} style={{ marginBottom: 16 }} size="small">
                        <Table 
                            dataSource={order.orderItems}
                            pagination={false}
                            size="small"
                            columns={[
                                { title: 'Sản phẩm', dataIndex: 'name', key: 'name' },
                                { title: 'Số lượng', dataIndex: 'amount', key: 'amount' },
                                { title: 'Giá bán', dataIndex: 'price', key: 'price', render: (val) => val.toLocaleString() + ' đ' },
                                ...(user?.isAdmin ? [
                                    { title: 'Giá nhập', key: 'cost', render: (_, record) => (productCostMap[record.product] || 0).toLocaleString() + ' đ' },
                                    { title: 'Lợi nhuận', key: 'profit', render: (_, record) => ((record.price - (productCostMap[record.product] || 0)) * record.amount).toLocaleString() + ' đ' }
                                ] : [])
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

