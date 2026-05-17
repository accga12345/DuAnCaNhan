import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllOrder, updateOrder } from '../../services/OrderService';
import { useSelector } from 'react-redux';
import { Space, Button, Tag, Typography, Tooltip, Modal, List, Image } from 'antd';
import { CheckCircleOutlined, CarOutlined, CloseCircleOutlined, SyncOutlined, EyeOutlined } from '@ant-design/icons';
import TableComponent from '../../components/TableComponent/TableComponent';
import LoadingComponent from '../../components/Loading/LoadingComponent';
import { useMutationHook } from '../../hooks/useMutationHook';
import * as message from '../../components/MessageComponent/MessageComponent';
import styled from 'styled-components';

const { Title, Text } = Typography;

const PageHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
`;

const OrderAdmin = () => {
    const user = useSelector((state) => state.user);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const { data: orders, isPending: isLoadingOrders, refetch } = useQuery({
        queryKey: ['orders'],
        queryFn: () => getAllOrder(user?.accessToken),
        enabled: !!user?.accessToken,
    });

    const mutationUpdate = useMutationHook(
        (data) => {
            const { id, token, ...rests } = data;
            return updateOrder(id, rests, token);
        }
    );

    const { data: dataUpdate, isSuccess: isSuccessUpdate, isError: isErrorUpdate, isPending: isPendingUpdate } = mutationUpdate;

    useEffect(() => {
        if (isSuccessUpdate && dataUpdate?.status === 'OK') {
            message.showSuccess('Cập nhật trạng thái thành công');
            refetch();
        } else if (isErrorUpdate) {
            message.showError('Cập nhật trạng thái thất bại');
        }
    }, [isSuccessUpdate, isErrorUpdate, dataUpdate, refetch]);

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
            title: 'Khách hàng',
            key: 'customer',
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{record.shippingAddress.fullName}</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.shippingAddress.phone}</div>
                </div>
            ),
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
            render: (_, record) => record.shippingAddress.address,
            width: '20%',
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text) => new Date(text).toLocaleString('vi-VN'),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (text) => renderStatus(text),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (text) => <span style={{ color: '#f5222d', fontWeight: 600 }}>{text.toLocaleString()} đ</span>,
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
            </PageHeader>
            <LoadingComponent isPending={isLoadingOrders || isPendingUpdate}>
                <TableComponent columns={columns} data={orders?.data} rowKey="_id" />
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
        </div>
    );
};

export default OrderAdmin;
