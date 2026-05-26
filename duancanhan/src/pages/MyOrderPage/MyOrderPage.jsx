import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrderByUserId, updateOrderReview } from '../../services/OrderService';
import { useSelector } from 'react-redux';
import { WrapperItemOrder, WrapperListOrder } from '../OrderPage/style';
import { convertPrice } from '../../ultil';
import LoadingComponent from '../../components/Loading/LoadingComponent';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Form, Rate, Input } from 'antd';
import { showSuccess, showError } from "../../components/MessageComponent/MessageComponent";

const MyOrderPage = () => {
    const user = useSelector((state) => state.user);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [formReview] = Form.useForm();

    const { data: orders, isPending: isLoadingOrders } = useQuery({
        queryKey: ['my-orders', user?._id],
        queryFn: () => getOrderByUserId(user?._id, user?.accessToken),
        enabled: !!user?._id && !!user?.accessToken,
    });

    const mutationReview = useMutation({
        mutationFn: (data) => updateOrderReview(currentOrder?._id, data, user.accessToken),
        onSuccess: (data) => {
            showSuccess(data.message || "Đánh giá thành công!");
            setIsReviewOpen(false);
            formReview.resetFields();
            queryClient.invalidateQueries(['my-orders', user?._id]);
        },
        onError: () => {
            showError("Có lỗi xảy ra khi đánh giá");
        }
    });

    const handleDetailsOrder = (id) => {
        navigate(`/orderSuccess`, { state: { id: id } });
    };

    const showReviewModal = (order) => {
        setCurrentOrder(order);
        setIsReviewOpen(true);
    };

    const handleOkReview = async () => {
        const values = await formReview.validateFields();
        console.log("Dữ liệu đánh giá gửi lên:", values);
        mutationReview.mutate(values);
    };

    const renderStatus = (status) => {
        switch (status) {
            case 0: return 'Đợi xác nhận';
            case 1: return 'Xác nhận thành công';
            case 2: return 'Đang giao hàng';
            case 3: return 'Đã hủy';
            case 4: return 'Hoàn thành';
            default: return 'N/A';
        }
    };

    return (
        <LoadingComponent isPending={isLoadingOrders || mutationReview.isPending}>
            <div style={{ background: '#f5f5fa', width: '100%', minHeight: '100vh', padding: '20px 0' }}>
                <div style={{ width: '1270px', margin: '0 auto' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Đơn hàng của tôi</h3>
                    <WrapperListOrder>
                        {orders?.data?.map((order) => (
                            <WrapperItemOrder key={order?._id} style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '20px', gap: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#1890ff', fontSize: '14px' }}>Mã đơn: </span>
                                            <span style={{ fontWeight: '600' }}>{order.orderCode || 'N/A'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontWeight: 'bold', color: 'rgb(255, 66, 78)', fontSize: '14px' }}>Trạng thái: </span>
                                            <span style={{ color: order.status === 3 ? 'red' : 'green', fontWeight: '500' }}>{renderStatus(order.status)}</span>
                                        </div>
                                    </div>
                                    <span onClick={() => handleDetailsOrder(order._id)} style={{ color: 'blue', cursor: 'pointer', fontSize: '13px' }}>Xem chi tiết</span>
                                </div>
                                
                                {order?.orderItems?.map((item) => (
                                    <div key={item?._id} style={{ display: 'flex', width: '100%', gap: '15px' }}>
                                        <img src={item?.image} alt="product" style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1px solid #eee' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: '500' }}>{item?.name}</div>
                                            <div style={{ color: '#888', fontSize: '13px' }}>Số lượng: {item?.amount}</div>
                                        </div>
                                        <div style={{ fontWeight: 'bold' }}>{convertPrice(item?.price)}</div>
                                    </div>
                                ))}
                                
                                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                                    {order.isDelivered && order.rating === 0 && (
                                        <Button type="primary" onClick={() => showReviewModal(order)}>Đánh giá</Button>
                                    )}
                                    {order.rating > 0 && <Rate disabled defaultValue={order.rating} />}
                                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'rgb(255, 66, 78)' }}>Tổng: {convertPrice(order?.totalPrice)}</span>
                                </div>
                            </WrapperItemOrder>
                        ))}
                    </WrapperListOrder>
                </div>

                <Modal title="Đánh giá đơn hàng" open={isReviewOpen} onOk={handleOkReview} onCancel={() => setIsReviewOpen(false)}>
                    <Form form={formReview} layout="vertical">
                        <Form.Item name="rating" label="Số sao" rules={[{ required: true, message: 'Vui lòng chọn số sao' }]}>
                            <Rate />
                        </Form.Item>
                        <Form.Item name="comment" label="Nhận xét">
                            <Input.TextArea rows={4} placeholder="Sản phẩm rất tốt..." />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </LoadingComponent>
    );
};

export default MyOrderPage;
