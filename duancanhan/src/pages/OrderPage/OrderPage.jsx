import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Checkbox, Image, Radio } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { WrapperContainer, WrapperLeft, WrapperRight, WrapperInfo, WrapperTotal, WrapperListOrder, WrapperItemOrder, WrapperPriceDiscount, WrapperQuantityBuy, WrapperInputQuantityBuy } from './style';
import ButtonComponents from '../../components/ButtonComponents/ButtonComponents';
import { increaseAmount, decreaseAmount, removeOrderProduct, removeAllOrderProduct } from '../../redux/slides/orderSlide';
import { useMemo, useState, useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import { useMutationHook } from '../../hooks/useMutationHook';
import { createOrder, paymentVnPay } from '../../services/OrderService';
import { showSuccess, showError } from '../../components/MessageComponent/MessageComponent';
import { updateUserInfo } from '../../services/UserServices';
import { updateUser } from '../../redux/slides/userSlide';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const OrderPage = () => {
  const order = useSelector((state) => state.order);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpenModalUpdateInfo, setIsOpenModalUpdateInfo] = useState(false);
  const [stateUserDetails, setStateUserDetails] = useState({
    address: '',
  });
  const [listChecked, setListChecked] = useState([]);
  const [payment, setPayment] = useState('later_money');
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  useEffect(() => {
    form.setFieldsValue(stateUserDetails);
  }, [form, stateUserDetails]);

  useEffect(() => {
    if (isOpenModalUpdateInfo) {
      setStateUserDetails({
        name: user?.name,
        address: user?.address,
        phone: user?.phone,
      });
    }
  }, [isOpenModalUpdateInfo]);

  const handleChangeAddress = () => {
    setIsOpenModalUpdateInfo(true);
  };

  const handleCancelUpdate = () => {
    setStateUserDetails({
      name: '',
      phone: '',
      address: '',
      city: ''
    });
    form.resetFields();
    setIsOpenModalUpdateInfo(false);
  };

  const mutationUpdate = useMutationHook(
    (data) => {
      const { id, token, ...rests } = data;
      const res = updateUserInfo(id, rests, token);
      return res;
    }
  );

  const mutationAddOrder = useMutationHook(
    (data) => {
      const { token, ...rests } = data;
      const res = createOrder(rests, token);
      return res;
    }
  );

  const mutationVnPay = useMutationHook(
    (data) => {
      const res = paymentVnPay(data);
      return res;
    }
  );

  const { isPending: isPendingUpdate, data: dataUpdate } = mutationUpdate;
  const { data: dataAdd, isPending: isPendingAddOrder, isSuccess: isSuccessAddOrder, isError: isErrorAddOrder } = mutationAddOrder;
  const { data: dataVnPay, isPending: isPendingVnPay, isSuccess: isSuccessVnPay } = mutationVnPay;

  useEffect(() => {
    if (isSuccessAddOrder && dataAdd?.status === 'OK') {
      const arrayOrdered = []
      const orderItemsOrdered = order?.orderItems?.filter(item => listChecked.includes(item.product))
      orderItemsOrdered?.forEach(element => {
        arrayOrdered.push(element.product)
      });
      dispatch(removeAllOrderProduct({ listChecked: arrayOrdered }))
      showSuccess('Đặt hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['my-orders', user?._id] })

      if (payment === 'vnpay') {
        mutationVnPay.mutate({
          amount: totalPriceMemo,
          orderId: dataAdd?.data?._id,
          orderInfo: `${dataAdd?.data?._id}`
        })
      } else {
        dispatch(removeAllOrderProduct({ listChecked: arrayOrdered }))
        showSuccess('Đặt hàng thành công');
        navigate('/orderSuccess', {
          state: {
            id: dataAdd?.data?._id,
            delivery: deliveryPriceMemo,
            paymentMethod: payment,
            totalPrice: totalPriceMemo,
            orderItems: orderItemsOrdered,
          }
        })
      }
    } else if (isErrorAddOrder) {
      showError();
    }
  }, [isSuccessAddOrder, isErrorAddOrder]);

  useEffect(() => {
    if (isSuccessVnPay && dataVnPay?.status === 'OK') {
      if (dataVnPay?.payUrl) {
        window.location.href = dataVnPay.payUrl;
      }
    } else if (isSuccessVnPay) {
      showError(dataVnPay?.message || 'Có lỗi khi tạo thanh toán VNPay');
    }
  }, [isSuccessVnPay, dataVnPay]);

  const handleUpdateInformation = () => {
    const { name, address, phone } = stateUserDetails;
    if (name && address && phone) {
      mutationUpdate.mutate({ id: user?._id, token: user?.accessToken, ...stateUserDetails }, {
        onSuccess: () => {
          dispatch(updateUser({ name, address, phone }));
          setIsOpenModalUpdateInfo(false);
        }
      });
    }
  };

  const handleAddOrder = () => {
    if (!user?.accessToken) {
      showError('Vui lòng đăng nhập để đặt hàng');
      return;
    }
    if (!user?.name || !user?.address || !user?.phone) {
      setIsOpenModalUpdateInfo(true);
    } else if (!order?.orderItems?.length) {
      showError('Vui lòng chọn sản phẩm');
    } else if (!listChecked.length) {
      showError('Vui lòng chọn sản phẩm để thanh toán');
    } else {
      mutationAddOrder.mutate({
        token: user?.accessToken,
        orderItems: order?.orderItems?.filter(item => listChecked.includes(item.product)),
        fullName: user?.name,
        address: user?.address,
        phone: user?.phone,
        paymentMethod: payment,
        itemsPrice: priceMemo,
        shippingPrice: deliveryPriceMemo,
        totalPrice: totalPriceMemo,
        user: user?._id
      });
    }
  };

  const handleOnchangeDetails = (e) => {
    setStateUserDetails({
      ...stateUserDetails,
      [e.target.name]: e.target.value
    });
  };

  const handlePayment = (e) => {
    setPayment(e.target.value);
  };

  const onChangeCheck = (e) => {
    if (listChecked.includes(e.target.value)) {
      const newListChecked = listChecked.filter((item) => item !== e.target.value);
      setListChecked(newListChecked);
    } else {
      setListChecked([...listChecked, e.target.value]);
    }
  };

  const handleOnchangeCheckAll = (e) => {
    if (e.target.checked) {
      const newListChecked = [];
      order?.orderItems?.forEach((item) => {
        newListChecked.push(item.product);
      });
      setListChecked(newListChecked);
    } else {
      setListChecked([]);
    }
  };

  const handleOnChangeCount = (type, idProduct) => {
    if (type === 'increase') {
      dispatch(increaseAmount({ idProduct }));
    } else {
      dispatch(decreaseAmount({ idProduct }));
    }
  };

  const handleDeleteOrder = (idProduct) => {
    dispatch(removeOrderProduct({ idProduct }));
  };

  const handleDeleteAllOrder = () => {
    if (listChecked?.length > 0) {
      dispatch(removeAllOrderProduct({ listChecked }));
    }
  };

  const priceMemo = useMemo(() => {
    const result = order?.orderItems?.reduce((total, cur) => {
      if (listChecked.includes(cur.product)) {
        return total + (cur.price * cur.amount);
      }
      return total;
    }, 0);
    return result;
  }, [order, listChecked]);

  const priceDiscountMemo = useMemo(() => {
    const result = order?.orderItems?.reduce((total, cur) => {
      if (listChecked.includes(cur.product)) {
        const discount = cur.discount ? cur.discount : 0;
        return total + ((cur.price * discount / 100) * cur.amount);
      }
      return total;
    }, 0);
    return result;
  }, [order, listChecked]);

  const deliveryPriceMemo = useMemo(() => {
    if (priceMemo === 0) {
      return 0;
    } else if (priceMemo < 200000) {
      return 20000;
    } else if (priceMemo >= 200000 && priceMemo < 500000) {
      return 10000;
    } else {
      return 0;
    }
  }, [priceMemo]);

  const totalPriceMemo = useMemo(() => {
    return Number(priceMemo) - Number(priceDiscountMemo) + Number(deliveryPriceMemo);
  }, [priceMemo, priceDiscountMemo, deliveryPriceMemo]);


  return (
    <div style={{ background: '#f5f5fa', width: '100%', minHeight: '100vh' }}>
      <div style={{ padding: '0 24px', width: '1440px', margin: '0 auto' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '24px', paddingTop: '20px' }}>Giỏ hàng</h3>
        <Row gutter={20} style={{ display: 'flex', justifyContent: 'center' }}>
          <Col span={17}>
            <WrapperLeft>
              <WrapperInfo style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '4px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '390px' }}>
                  <Checkbox onChange={handleOnchangeCheckAll} checked={listChecked?.length === order?.orderItems?.length && order?.orderItems?.length > 0} />
                  <span>Tất cả ({order?.orderItems?.length} sản phẩm)</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Đơn giá</span>
                  <span>Số lượng</span>
                  <span>Thành tiền</span>
                  <DeleteOutlined style={{ cursor: 'pointer' }} onClick={handleDeleteAllOrder} />
                </div>
              </WrapperInfo>
              <WrapperListOrder>
                {order?.orderItems?.map((order) => {
                  return (
                    <WrapperItemOrder key={order?.product}>
                      <div style={{ width: '390px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Checkbox onChange={onChangeCheck} value={order?.product} checked={listChecked.includes(order?.product)} />
                        <img src={order?.image} style={{ width: '77px', height: '79px', objectFit: 'cover' }} alt="Sản phẩm" />
                        <div style={{ width: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order?.name}</div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>
                          <span style={{ fontSize: '13px', color: '#242424' }}>{order?.price?.toLocaleString()}đ</span>
                          {order?.discount > 0 && <WrapperPriceDiscount>{(order?.price + (order?.price * order?.discount / 100)).toLocaleString()}đ</WrapperPriceDiscount>}
                        </span>
                        <WrapperQuantityBuy>
                          <ButtonComponents textButton="-" size="middle" styleButton={{ width: "35px", padding: "4px" }} disabled={order?.amount === 1} onClick={() => handleOnChangeCount('decrease', order?.product)} />
                          <WrapperInputQuantityBuy size="middle" defaultValue={order?.amount} value={order?.amount} controls={false} />
                          <ButtonComponents textButton="+" size="middle" styleButton={{ width: "35px", padding: "4px" }} disabled={order?.amount === order?.countInStock} onClick={() => handleOnChangeCount('increase', order?.product)} />
                        </WrapperQuantityBuy>
                        <span style={{ color: 'rgb(255, 66, 78)', fontSize: '13px', fontWeight: 500 }}>{(order?.price * order?.amount).toLocaleString()}đ</span>
                        <DeleteOutlined style={{ cursor: 'pointer' }} onClick={() => handleDeleteOrder(order?.product)} />
                      </div>
                    </WrapperItemOrder>
                  )
                })}
              </WrapperListOrder>
            </WrapperLeft>
          </Col>
          <Col span={7}>
            <WrapperRight>
              <WrapperInfo>
                <div>
                  <span>Địa chỉ: </span>
                  {user?.address ? (
                    <span style={{ fontWeight: 'bold' }}>{`${user?.address}`}</span>
                  ) : (
                    <span style={{ fontWeight: 'bold' }}>Chưa có địa chỉ</span>
                  )}
                  <span onClick={handleChangeAddress} style={{ color: 'blue', cursor: 'pointer' }}> Thay đổi</span>
                </div>
              </WrapperInfo>
              <WrapperInfo>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Tạm tính</span>
                  <span style={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>{priceMemo.toLocaleString()}đ</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Giảm giá</span>
                  <span style={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>{priceDiscountMemo.toLocaleString()}đ</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Phí giao hàng</span>
                  <span style={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>{deliveryPriceMemo.toLocaleString()}đ</span>
                </div>
              </WrapperInfo>
              <WrapperInfo>
                <div>
                  <span>Chọn phương thức thanh toán</span>
                  <Radio.Group onChange={handlePayment} value={payment} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    <Radio value="later_money">Thanh toán tiền mặt khi nhận hàng (COD)</Radio>
                    <Radio value="vnpay">Thanh toán bằng VNPay</Radio>
                  </Radio.Group>
                </div>
              </WrapperInfo>
              <WrapperTotal>
                <span>Tổng tiền</span>
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'rgb(254, 56, 52)', fontSize: '24px', fontWeight: 'bold' }}>{totalPriceMemo.toLocaleString()}đ</span>
                  <span style={{ color: '#000', fontSize: '11px' }}>(Đã bao gồm VAT nếu có)</span>
                </span>
              </WrapperTotal>
              <ButtonComponents
                onClick={() => handleAddOrder()}
                size={40}
                styleButton={{
                  background: 'rgb(255, 57, 69)',
                  height: '48px',
                  width: '100%',
                  border: 'none',
                  borderRadius: '4px'
                }}
                textButton={'Mua hàng'}
                styleTextButton={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}
              ></ButtonComponents>
            </WrapperRight>
          </Col>
        </Row>
      </div>
      <Modal title="Cập nhật thông tin giao hàng" open={isOpenModalUpdateInfo} onCancel={handleCancelUpdate} onOk={handleUpdateInformation} forceRender>
        <Form
          name="basic"
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 20 }}
          autoComplete="off"
          form={form}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input value={stateUserDetails['name']} onChange={handleOnchangeDetails} name="name" />
          </Form.Item>
          <Form.Item
            label="Phone"
            name="phone"
            rules={[{ required: true, message: 'Please input your phone!' }]}
          >
            <Input value={stateUserDetails['phone']} onChange={handleOnchangeDetails} name="phone" />
          </Form.Item>
          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: 'Please input your address!' }]}
          >
            <Input value={stateUserDetails['address']} onChange={handleOnchangeDetails} name="address" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default OrderPage
