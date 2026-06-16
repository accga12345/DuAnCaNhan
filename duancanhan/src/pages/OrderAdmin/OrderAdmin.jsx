import React, { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Space, Button, Tag, Typography, Tooltip, Modal, List, Image, Input, DatePicker } from 'antd';
import { CheckCircleOutlined, CarOutlined, CloseCircleOutlined, SyncOutlined, EyeOutlined, SearchOutlined, FileExcelOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import dayjs from 'dayjs';

import { getAllOrder, updateOrder } from '../../services/OrderService';
import TableComponent from '../../components/TableComponent/TableComponent';
import LoadingComponent from '../../components/Loading/LoadingComponent';
import { useMutationHook } from '../../hooks/useMutationHook';
import * as message from '../../components/MessageComponent/MessageComponent';
import { exportExcel } from '../../ultil';
import { PageHeader, ActionToolbar } from './style';
import InvoiceTemplate from '../../components/InvoiceTemplate/InvoiceTemplate';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const OrderAdmin = () => {
    const user = useSelector((state) => state.user);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderForInvoice, setOrderForInvoice] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef(null);
    const invoiceRef = useRef(null);
    const [currentOrdersData, setCurrentOrdersData] = useState([]);
    const [dateRangeFilter, setDateRangeFilter] = useState(null);

    const { data: orders, isPending: isLoadingOrders, refetch } = useQuery({
        queryKey: ['orders'],
        queryFn: () => getAllOrder(user?.accessToken),
        enabled: !!user?.accessToken,
    });

    useEffect(() => {
        if (orders?.data) {
            setCurrentOrdersData(orders.data);
        }
    }, [orders?.data]);

    const mutationUpdate = useMutationHook(
        (data) => {
            const { id, token, ...rests } = data;
            return updateOrder(id, rests, token);
        }
    );

    const { data: dataUpdate, isSuccess: isSuccessUpdate, isError: isErrorUpdate, isPending: isPendingUpdate } = mutationUpdate;

    const handleTableChange = (pagination, filters, sorter, extra) => {
        setCurrentOrdersData(extra.currentDataSource);
    };

    const handleExportExcel = () => {
        const dataToExport = currentOrdersData?.map(order => ({
            "Mã đơn hàng": order.orderCode,
            "Ngày đặt": dayjs(order.createdAt).format('DD/MM/YYYY HH:mm'),
            "Khách hàng": order.shippingAddress?.fullName,
            "Số điện thoại": order.shippingAddress?.phone,
            "Địa chỉ": order.shippingAddress?.address,
            "Thanh toán": order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán',
            "Trạng thái": order.status === 0 ? 'Đợi xác nhận' : order.status === 1 ? 'Đã xác nhận' : order.status === 2 ? 'Đang giao hàng' : order.status === 3 ? 'Đã hủy' : 'Hoàn thành',
            "Tổng tiền": order.totalPrice
        })) || [];
        
        const dateStr = dateRangeFilter ? `${dateRangeFilter[0].format('DD/MM/YYYY')} - ${dateRangeFilter[1].format('DD/MM/YYYY')}` : "";
        exportExcel(dataToExport, "Danh_sach_don_hang", "Orders", "DANH SÁCH ĐƠN HÀNG", dateStr);
    };

    const exportPDF = async (order) => {
        if (!order) return;
        
        // Cần đảm bảo component đã render với dữ liệu mới
        setOrderForInvoice(order);
        
        // Đợi một chút để React cập nhật DOM cho InvoiceTemplate
        setTimeout(async () => {
            const element = document.getElementById('invoice-capture');
            if (element) {
                try {
                    const canvas = await html2canvas(element, {
                        scale: 2,
                        logging: false,
                        useCORS: true
                    });
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const imgProps = pdf.getImageProperties(imgData);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                    
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`HoaDon_${order.orderCode || order._id}.pdf`);
                    setOrderForInvoice(null);
                } catch (error) {
                    console.error('Lỗi khi xuất PDF:', error);
                    message.showError('Không thể tạo file PDF');
                }
            }
        }, 500);
    };

    useEffect(() => {
        if (isSuccessUpdate && dataUpdate?.status === 'OK') {
            message.showSuccess('Cập nhật trạng thái thành công');
            
            // Nếu là trạng thái xác nhận (status: 1), thực hiện xuất PDF
            if (dataUpdate?.data?.status === 1) {
                exportPDF(dataUpdate.data);
            }
            
            refetch();
        } else if (isErrorUpdate) {
            message.showError('Cập nhật trạng thái thất bại');
        }
    }, [isSuccessUpdate, isErrorUpdate, dataUpdate, refetch]);

    const getColumnDateSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                <RangePicker
                    style={{ marginBottom: 8, display: 'flex' }}
                    format="DD/MM/YYYY"
                    onChange={(dates) => {
                        setSelectedKeys(dates ? [dates] : []);
                    }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => {
                            confirm();
                            setDateRangeFilter(selectedKeys[0]);
                        }}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Lọc
                    </Button>
                    <Button
                        onClick={() => {
                            clearFilters();
                            setDateRangeFilter(null);
                            confirm();
                        }}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Xóa
                    </Button>
                </Space>
            </div>
        ),
        onFilter: (value, record) => {
            if (!value || value.length !== 2) return true;
            const recordDate = new Date(record[dataIndex]);
            const start = value[0].startOf('day').toDate();
            const end = value[1].endOf('day').toDate();
            return recordDate >= start && recordDate <= end;
        },
    });

    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const handleReset = (clearFilters) => {
        clearFilters();
        setSearchText('');
    };

    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                <Input
                    ref={searchInput}
                    placeholder={`Tìm ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Tìm
                    </Button>
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters)}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Xóa
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => (
            <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
        onFilter: (value, record) => {
            const keys = dataIndex.split('.');
            let val = record;
            for (const key of keys) {
                val = val?.[key];
            }
            return val?.toString().toLowerCase().includes(value.toLowerCase());
        },
        onFilterDropdownOpenChange: (visible) => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
        render: (text) =>
            searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={text ? text.toString() : ''}
                />
            ) : (
                text
            ),
    });

    const handleViewDetails = (record) => {
        setSelectedOrder(record);
        setIsModalOpen(true);
    };

    const handleConfirmOrder = (id) => {
        mutationUpdate.mutate({ id, status: 1, token: user?.accessToken });
    };

    const handleDeliveryOrder = (id) => {
        mutationUpdate.mutate({ id, status: 2, token: user?.accessToken });
    };

    const handleCancelOrder = (id) => {
        mutationUpdate.mutate({ id, status: 3, token: user?.accessToken });
    };

    const renderStatus = (status) => {
        switch (status) {
            case 0: return <Tag icon={<SyncOutlined spin />} color="processing">Đợi xác nhận</Tag>;
            case 1: return <Tag icon={<CheckCircleOutlined />} color="success">Đã xác nhận</Tag>;
            case 2: return <Tag icon={<CarOutlined />} color="warning">Đang giao hàng</Tag>;
            case 3: return <Tag icon={<CloseCircleOutlined />} color="error">Đã hủy</Tag>;
            case 4: return <Tag icon={<CheckCircleOutlined />} color="blue">Hoàn thành</Tag>;
            default: return <Tag color="default">N/A</Tag>;
        }
    };

    const columns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: 'orderCode',
            key: 'orderCode',
            ...getColumnSearchProps('orderCode'),
            render: (text) => <Text strong color="#1890ff">{text || 'N/A'}</Text>,
        },
        {
            title: 'Khách hàng',
            key: 'customer',
            ...getColumnSearchProps('shippingAddress.fullName'),
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 600 }}>
                        {searchedColumn === 'shippingAddress.fullName' ? (
                            <Highlighter
                                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                                searchWords={[searchText]}
                                autoEscape
                                textToHighlight={record.shippingAddress?.fullName ? record.shippingAddress.fullName.toString() : ''}
                            />
                        ) : (
                            record.shippingAddress?.fullName
                        )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.shippingAddress?.phone}</div>
                </div>
            ),
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
            render: (_, record) => record.shippingAddress?.address,
            width: '20%',
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdAt',
            key: 'createdAt',
            ...getColumnDateSearchProps('createdAt'),
            render: (text) => new Date(text).toLocaleString('vi-VN'),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (text) => renderStatus(text),
            filters: [
                { text: 'Đợi xác nhận', value: 0 },
                { text: 'Đã xác nhận', value: 1 },
                { text: 'Đang giao hàng', value: 2 },
                { text: 'Đã hủy', value: 3 },
                { text: 'Hoàn thành', value: 4 },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Thanh toán',
            dataIndex: 'isPaid',
            key: 'isPaid',
            render: (isPaid) => (
                <Tag color={isPaid ? 'success' : 'default'}>
                    {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </Tag>
            ),
            filters: [
                { text: 'Đã thanh toán', value: true },
                { text: 'Chưa thanh toán', value: false },
            ],
            onFilter: (value, record) => record.isPaid === value,
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (text) => <span style={{ color: '#f5222d', fontWeight: 600 }}>{text?.toLocaleString()} đ</span>,
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button type="default" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} />
                    </Tooltip>
                    {record.status === 0 && (
                        <Tooltip title="Xác nhận">
                            <Button type="primary" size="small" onClick={() => handleConfirmOrder(record._id)} style={{ backgroundColor: '#52c41a' }}>Xác nhận</Button>
                        </Tooltip>
                    )}
                    {record.status === 1 && (
                        <Tooltip title="Giao hàng">
                            <Button type="primary" size="small" onClick={() => handleDeliveryOrder(record._id)}>Giao hàng</Button>
                        </Tooltip>
                    )}
                    {(record.status === 0 || record.status === 1 || record.status === 2) && (
                        <Tooltip title="Hủy">
                            <Button type="primary" danger size="small" onClick={() => handleCancelOrder(record._id)}>Hủy</Button>
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <PageHeader>
                <Title level={4} style={{ margin: 0 }}>Quản lý đơn hàng</Title>
                <ActionToolbar>
                    <Button
                        icon={<FileExcelOutlined />}
                        onClick={handleExportExcel}
                        type="primary"
                    >
                        Xuất Excel
                    </Button>
                </ActionToolbar>
            </PageHeader>
            <LoadingComponent isPending={isLoadingOrders || isPendingUpdate}>
                <TableComponent 
                    columns={columns} 
                    data={orders?.data} 
                    rowKey="_id" 
                    onChange={handleTableChange}
                />
            </LoadingComponent>

            <Modal title="Chi tiết đơn hàng" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={600}>
                {selectedOrder && (
                    <List
                        itemLayout="horizontal"
                        dataSource={selectedOrder.orderItems}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Image src={item.image} width={64} />}
                                    title={item.name}
                                    description={
                                        <Space direction="vertical">
                                            <Text>Số lượng: {item.amount}</Text>
                                            <Text type="danger">Giá: {item.price.toLocaleString()} đ</Text>
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Modal>
            <InvoiceTemplate order={orderForInvoice} ref={invoiceRef} />
        </div>
    );
};

export default OrderAdmin;
