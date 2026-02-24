import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllOrder, updateOrder } from '../../services/OrderService';
import { useSelector } from 'react-redux';
import TableComponent from '../../components/TableComponent/TableComponent';
import LoadingComponent from '../../components/Loading/LoadingComponent';
import { useMutationHook } from '../../hooks/useMutationHook';
import { useEffect } from 'react';
import * as message from '../../components/MessageComponent/MessageComponent';

const OrderAdmin = () => {
    const user = useSelector((state) => state.user);

    const { data: orders, isPending: isLoadingOrders, refetch } = useQuery({
        queryKey: ['orders'],
        queryFn: () => getAllOrder(user?.accessToken),
        enabled: !!user?.accessToken,
    });

    const mutationUpdate = useMutationHook(
        (data) => {
            const { id, token, ...rests } = data;
            const res = updateOrder(id, rests, token);
            return res;
        }
    );

    const { data: dataUpdate, isSuccess: isSuccessUpdate, isError: isErrorUpdate } = mutationUpdate;

    useEffect(() => {
        if (isSuccessUpdate && dataUpdate?.status === 'OK') {
            message.showSuccess('Cập nhật trạng thái thành công');
            refetch();
        } else if (isErrorUpdate) {
            message.showError('Cập nhật trạng thái thất bại');
        }
    }, [isSuccessUpdate, isErrorUpdate]);

    const handleConfirmOrder = (id) => {
        mutationUpdate.mutate({ id, status: 1, token: user?.accessToken });
    };

    const handleDeliveryOrder = (id) => {
        mutationUpdate.mutate({ id, status: 2, token: user?.accessToken });
    };

    const handleCancelOrder = (id) => {
        mutationUpdate.mutate({ id, status: 3, token: user?.accessToken });
    };

    const columns = [
        {
            title: 'Họ tên',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text, record) => record.shippingAddress.fullName,
        },
        {
            title: 'SĐT',
            dataIndex: 'phone',
            key: 'phone',
            render: (text, record) => record.shippingAddress.phone,
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
            render: (text, record) => record.shippingAddress.address,
        },
        {
            title: 'Ngày/Giờ',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text) => new Date(text).toLocaleString('vi-VN'),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (text) => {
                if (text === 0) return 'Đợi xác nhận';
                if (text === 1) return 'Đã xác nhận';
                if (text === 2) return 'Đang giao hàng';
                if (text === 3) return 'Đã hủy';
                if (text === 4) return 'Hoàn thành';
                return 'N/A';
            },
        },
        {
            title: 'Trạng thái thanh toán',
            dataIndex: 'isPaid',
            key: 'isPaid',
            render: (text) => text ? 'Đã thanh toán' : 'Chưa thanh toán',
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (text) => text.toLocaleString() + ' đ',
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (text, record) => (
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => handleConfirmOrder(record._id)}
                        disabled={record.status !== 0}
                        style={{ background: '#52c41a', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: record.status !== 0 ? 'not-allowed' : 'pointer', opacity: record.status !== 0 ? 0.5 : 1 }}
                    >
                        Xác nhận
                    </button>
                    <button
                        onClick={() => handleDeliveryOrder(record._id)}
                        disabled={record.status !== 1}
                        style={{ background: '#1890ff', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: record.status !== 1 ? 'not-allowed' : 'pointer', opacity: record.status !== 1 ? 0.5 : 1 }}
                    >
                        Giao hàng
                    </button>
                    {record.status === 4 ? (
                        <button
                            disabled
                            style={{ background: '#bfbfbf', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'not-allowed' }}
                        >
                            Đã giao
                        </button>
                    ) : (
                        <button
                            onClick={() => handleCancelOrder(record._id)}
                            disabled={record.status === 3 || record.status === 2}
                            style={{ background: '#ff4d4f', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: (record.status === 3 || record.status === 2) ? 'not-allowed' : 'pointer', opacity: (record.status === 3 || record.status === 2) ? 0.5 : 1 }}
                        >
                            Hủy
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Quản lý đơn hàng</h2>
            <LoadingComponent isPending={isLoadingOrders}>
                <TableComponent columns={columns} data={orders?.data} rowKey="_id" />
            </LoadingComponent>
        </div>
    );
};

export default OrderAdmin;
