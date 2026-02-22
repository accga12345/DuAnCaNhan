import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrderByUserId } from '../../services/OrderService';
import { useSelector } from 'react-redux';
import { WrapperItemOrder, WrapperListOrder, WrapperInfo } from '../OrderPage/style';
import { convertPrice } from '../../ultil';
import LoadingComponent from '../../components/Loading/LoadingComponent';
import { useNavigate } from 'react-router-dom';

const MyOrderPage = () => {
    const user = useSelector((state) => state.user);
    const navigate = useNavigate();

    const { data: orders, isPending: isLoadingOrders } = useQuery({
        queryKey: ['my-orders', user?._id],
        queryFn: () => getOrderByUserId(user?._id, user?.accessToken),
        enabled: !!user?._id && !!user?.accessToken,
    });

    const handleDetailsOrder = (id) => {
        navigate(`/orderSuccess`, {
            state: {
                id: id
            }
        });
    };

    const renderStatus = (status) => {
        switch (status) {
            case 0:
                return 'Đợi xác nhận';
            case 1:
                return 'Xác nhận thành công';
            case 2:
                return 'Đang giao hàng';
            case 3:
                return 'Đã hủy';
            case 4:
                return 'Hoàn thành';
            default:
                return 'N/A';
        }
    };

    return (
        <LoadingComponent isPending={isLoadingOrders}>
            <div style={{ background: '#f5f5fa', width: '100%', minHeight: '100vh', padding: '20px 0' }}>
                <div style={{ width: '1270px', margin: '0 auto' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Đơn hàng của tôi</h3>
                    <WrapperListOrder>
                        {orders?.data?.map((order) => {
                            return (
                                <WrapperItemOrder key={order?._id} style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '20px', gap: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontWeight: 'bold', color: 'rgb(255, 66, 78)', fontSize: '14px' }}>Trạng thái: </span>
                                            <span style={{ color: order.status === 3 ? 'red' : 'green', fontWeight: '500' }}>{renderStatus(order.status)}</span>
                                        </div>
                                        <span
                                            onClick={() => handleDetailsOrder(order._id)}
                                            style={{ color: 'blue', cursor: 'pointer', fontSize: '13px' }}
                                        >
                                            Xem chi tiết
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#888' }}>
                                        Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
                                    </div>
                                    <div style={{ width: '100%', height: '1px', background: '#f0f0f0' }} />
                                    {(order?.oderItem || order?.orderItems)?.map((item) => {
                                        return (
                                            <div key={item?._id} style={{ display: 'flex', width: '100%', gap: '15px' }}>
                                                <img src={item?.image} alt="product" style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1px solid #eee' }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '15px', fontWeight: '500' }}>{item?.name}</div>
                                                    <div style={{ color: '#888', fontSize: '13px' }}>Số lượng: {item?.amount}</div>
                                                </div>
                                                <div style={{ fontWeight: 'bold' }}>{convertPrice(item?.price)}</div>
                                            </div>
                                        )
                                    })}
                                    <div style={{ width: '100%', height: '1px', background: '#f0f0f0' }} />
                                    <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '15px' }}>Tổng tiền: </span>
                                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'rgb(255, 66, 78)' }}>{convertPrice(order?.totalPrice)}</span>
                                    </div>
                                </WrapperItemOrder>
                            )
                        })}
                    </WrapperListOrder>
                </div>
            </div>
        </LoadingComponent>
    );
};

export default MyOrderPage;
