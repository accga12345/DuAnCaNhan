import React from 'react';
import { WrapperContainer, WrapperInfo, WrapperItemOrder, WrapperLeft, WrapperListOrder, WrapperRight, WrapperTotal } from '../OrderPage/style';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Row, Col, Steps } from 'antd';
import { convertPrice } from '../../ultil';
import { useQuery } from '@tanstack/react-query';
import { getDetailsOrder, updateOrder } from '../../services/OrderService';
import LoadingComponent from '../../components/Loading/LoadingComponent';
import { useMutationHook } from '../../hooks/useMutationHook';
import { useEffect } from 'react';
import * as message from '../../components/MessageComponent/MessageComponent';
import ButtonComponents from '../../components/ButtonComponents/ButtonComponents';

const OrderSuccessPage = () => {
    const location = useLocation();
    const { state } = location;
    const user = useSelector((state) => state.user);

    const { data: orderDetails, isFetching: isLoadingDetail, refetch } = useQuery({
        queryKey: ['order-details', state?.id],
        queryFn: () => getDetailsOrder(state?.id, user?.accessToken),
        enabled: !!state?.id && !!user?.accessToken,
    });

    const mutationUpdate = useMutationHook(
        (data) => {
            const { _id, token, ...rests } = data;
            const res = updateOrder(_id, rests, token);
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

    const handleReceivedOrder = () => {
        mutationUpdate.mutate({ id: state?.id, status: 4, token: user?.accessToken });
    };

    const orderData = orderDetails?.data || state;

    return (
        <div style={{ background: '#f5f5fa', width: '100%', minHeight: '100vh' }}>
            <div style={{ padding: '0 24px', width: '1440px', margin: '0 auto' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '24px', paddingTop: '20px' }}>Chi tiết đơn hàng</h3>
                <LoadingComponent isPending={isLoadingDetail}>
                    <Row gutter={20} style={{ display: 'flex', justifyContent: 'center' }}>
                        <Col span={17}>
                            <WrapperLeft>
                                <WrapperInfo style={{ borderRadius: '4px', marginBottom: '10px' }}>
                                    <Steps
                                        current={orderData?.status === 3 ? 1 : (orderData?.status === 4 ? 3 : orderData?.status)}
                                        status={orderData?.status === 3 ? 'error' : 'finish'}
                                        items={[
                                            {
                                                title: 'Đợi xác nhận',
                                            },
                                            {
                                                title: orderData?.status === 3 ? 'Đơn hàng bị hủy' : 'Xác nhận thành công',
                                            },
                                            {
                                                title: 'Đang giao hàng',
                                            },
                                            {
                                                title: 'Giao hàng thành công',
                                            }
                                        ]}
                                    />
                                </WrapperInfo>
                                <WrapperListOrder>
                                    {orderData?.oderItems?.map((order) => {
                                        return (
                                            <WrapperItemOrder key={order?.product}>
                                                <div style={{ width: '390px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <img src={order?.image} style={{ width: '77px', height: '79px', objectFit: 'cover' }} alt="Sản phẩm" />
                                                    <div style={{ width: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order?.name}</div>
                                                </div>
                                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span>
                                                        <span style={{ fontSize: '13px', color: '#242424' }}>Đơn giá: {convertPrice(order?.price)}</span>
                                                    </span>
                                                    <span>Số lượng: {order?.amount}</span>
                                                    <span style={{ color: 'rgb(255, 66, 78)', fontSize: '13px', fontWeight: 500 }}>Thành tiền: {convertPrice(order?.price * order?.amount)}</span>
                                                </div>
                                            </WrapperItemOrder>
                                        )
                                    })}
                                </WrapperListOrder>
                            </WrapperLeft>
                        </Col>
                        <Col span={7}>
                            <WrapperRight>
                                {orderData?.status === 2 && (
                                    <WrapperInfo style={{ marginBottom: '10px' }}>
                                        <ButtonComponents
                                            onClick={handleReceivedOrder}
                                            size={40}
                                            styleButton={{
                                                background: 'rgb(255, 57, 69)',
                                                height: '48px',
                                                width: '100%',
                                                border: 'none',
                                                borderRadius: '4px'
                                            }}
                                            textButton={'Đã nhận được hàng'}
                                            styleTextButton={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}
                                        />
                                    </WrapperInfo>
                                )}
                                <WrapperInfo>
                                    <div>
                                        <span style={{ fontWeight: 'bold' }}>Phương thức thanh toán: </span>
                                        <span>{orderData?.paymentMethod === 'later_money' ? 'Thanh toán tiền mặt khi nhận hàng' : 'Thanh toán bằng VNPay'}</span>
                                    </div>
                                </WrapperInfo>
                                <WrapperTotal>
                                    <span>Tổng tiền</span>
                                    <span style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ color: 'rgb(254, 56, 52)', fontSize: '24px', fontWeight: 'bold' }}>{convertPrice(orderData?.totalPrice)}</span>
                                        <span style={{ color: '#000', fontSize: '11px' }}>(Đã bao gồm VAT nếu có)</span>
                                    </span>
                                </WrapperTotal>
                            </WrapperRight>
                        </Col>
                    </Row>
                </LoadingComponent>
            </div>
        </div>
    );
};

export default OrderSuccessPage;
