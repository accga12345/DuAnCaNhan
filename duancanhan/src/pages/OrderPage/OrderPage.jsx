import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Checkbox, Image, Radio } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { WrapperContainer, WrapperLeft, WrapperRight, WrapperInfo, WrapperTotal, WrapperListOrder, WrapperItemOrder, WrapperPriceDiscount, WrapperQuantityBuy, WrapperInputQuantityBuy } from './style';
import ButtonComponents from '../../components/ButtonComponents/ButtonComponents';
import { increaseAmount, decreaseAmount, removeOrderProduct, removeAllOrderProduct } from '../../redux/slides/orderSlide';
import { useMemo, useState, useEffect } from 'react';
import { Modal, Form, Input, Typography, Divider } from 'antd';
import { useMutationHook } from '../../hooks/useMutationHook';
import { createOrder } from '../../services/OrderService';
import { showSuccess, showError } from '../../components/MessageComponent/MessageComponent';
import { updateUserInfo } from '../../services/UserServices';
import { updateUser } from '../../redux/slides/userSlide';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { getClientConfig, createSePayPayment } from '../../services/PaymentService';

const { Text } = Typography;

const OrderPage = () => {
  const order = useSelector((state) => state.order);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpenModalUpdateInfo, setIsOpenModalUpdateInfo] = useState(false);
  const [isOpenModalSePay, setIsOpenModalSePay] = useState(false);
  const [sepayData, setSePayData] = useState(null);
  const [stateUserDetails, setStateUserDetails] = useState({
    address: '',
    name: '',
    phone: '',
  });
  const [listChecked, setListChecked] = useState([]);
  const [payment, setPayment] = useState('later_money');
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [sdk, setSdk] = useState(false);

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
  }, [isOpenModalUpdateInfo, user]);

  const handleChangeAddress = () => {
    setIsOpenModalUpdateInfo(true);
  };

  const handleCancelUpdate = () => {
    setStateUserDetails({
      name: '',
      phone: '',
      address: '',
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

  const { data: dataAdd, isPending: isPendingAddOrder, isSuccess: isSuccessAddOrder, isError: isErrorAddOrder } = mutationAddOrder;

  const handleOrderSuccess = (resData, currentPayment) => {
    if (resData?.status === 'OK') {
      const orderItemsOrdered = order?.orderItems?.filter(item =>
        listChecked.includes(item.product)
      )
      const arrayOrdered = orderItemsOrdered.map(item => item.product)
      
      queryClient.invalidateQueries({ queryKey: ['my-orders', user?._id] })
      dispatch(removeAllOrderProduct({ listChecked: arrayOrdered }))
      showSuccess('Đặt hàng thành công')

      if (currentPayment !== 'sepay') {
        navigate('/orderSuccess', {
          state: {
            id: resData?.data?._id,
            delivery: deliveryPriceMemo,
            paymentMethod: currentPayment,
            totalPrice: totalPriceMemo,
            orderItems: orderItemsOrdered,
          }
        })
      }
    }
  }

  useEffect(() => {
    if (isSuccessAddOrder && dataAdd?.status === 'OK' && payment !== 'sepay') {
      handleOrderSuccess(dataAdd, payment)
    } else if (isErrorAddOrder) {
      showError('Đặt hàng thất bại')
    }
  }, [isSuccessAddOrder, isErrorAddOrder, dataAdd]);


  const handleUpdateInformation = () => {
    const { name, address, phone } = stateUserDetails;
    if (name && address && phone) {
      mutationUpdate.mutate({ id: user?._id, token: user?.accessToken, ...stateUserDetails }, {
        onSuccess: () => {
          dispatch(updateUser({ ...user, name, address, phone }));
          setIsOpenModalUpdateInfo(false);
        }
      });
    }
  };

  const handleAddOrder = async (isPaid = false) => {
    if (!user?.accessToken) {
      navigate('/signin');
      return;
    }
    if (!user?.name || !user?.address || !user?.phone) {
      setIsOpenModalUpdateInfo(true);
    } else if (!order?.orderItems?.length) {
      showError('Vui lòng chọn sản phẩm');
    } else if (!listChecked.length) {
      showError('Vui lòng chọn sản phẩm để thanh toán');
    } else {
      if (payment === 'sepay') {
        mutationAddOrder.mutate({
          token: user?.accessToken,
          orderItems: order?.orderItems?.filter(item => listChecked.includes(item.product)),
          fullName: user?.name,
          address: user?.address,
          phone: user?.phone,
          paymentMethod: 'sepay',
          itemsPrice: priceMemo,
          shippingPrice: deliveryPriceMemo,
          totalPrice: totalPriceMemo,
          user: user?._id,
          isPaid: false,
        }, {
          onSuccess: async (resOrder) => {
            if (resOrder?.status === 'OK') {
              const orderCode = resOrder?.data?.orderCode;
              const resPay = await createSePayPayment({
                amount: totalPriceMemo,
                orderCode: orderCode
              }, user?.accessToken);

              if (resPay?.status === 'success' && resPay?.data?.payUrl) {
                setSePayData(resPay.data);
                setIsOpenModalSePay(true);
                // Xóa giỏ hàng và hiện message sau khi đã mở modal SePay thành công
                handleOrderSuccess(resOrder, 'sepay')
              } else {
                showError('Không thể tạo liên kết thanh toán SePay');
              }
            }
          }
        });
        return;
      }

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
        user: user?._id,
        isPaid: isPaid,
        paidAt: isPaid ? new Date().toISOString() : null
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
    const checkStock = order?.orderItems?.every((item) => item.amount <= item.countInStock);
    if (!checkStock) {
      showError('Số lượng sản phẩm không đủ');
      return;
    }
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
    return order?.orderItems?.reduce((total, cur) => {
      if (listChecked.includes(cur.product)) {
        const discount = cur.discount || 0
        const discountMoney =
          (cur.price * discount / 100) * cur.amount
        return total + discountMoney
      }
      return total
    }, 0)
  }, [order, listChecked])

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

  const dataConfig = async () => {
    const { data } = await getClientConfig();
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://www.paypal.com/sdk/js?client-id=${data}`;
    script.onload = () => {
      setSdk(true);
    };
    document.body.appendChild(script);
  };

  useEffect(() => {
    if (!window.paypal) {
      dataConfig();
    } else {
      setSdk(true);
    }
  }, []);


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
                {order?.orderItems?.map((orderItem) => {
                  return (
                    <WrapperItemOrder key={orderItem?.product}>
                      <div style={{ width: '390px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Checkbox onChange={onChangeCheck} value={orderItem?.product} checked={listChecked.includes(orderItem?.product)} />
                        <img src={orderItem?.image} style={{ width: '77px', height: '79px', objectFit: 'cover' }} alt="Sản phẩm" />
                        <div style={{ width: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orderItem?.name}</div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>
                          <span style={{ fontSize: '13px', color: '#242424' }}>{(orderItem?.price || 0)?.toLocaleString()}đ</span>
                          {orderItem?.discount > 0 && <WrapperPriceDiscount>{((orderItem?.price || 0) + ((orderItem?.price || 0) * (orderItem?.discount || 0) / 100))?.toLocaleString()}đ</WrapperPriceDiscount>}
                        </span>
                        <WrapperQuantityBuy>
                          <ButtonComponents textButton="-" size="middle" styleButton={{ width: "35px", padding: "4px" }} disabled={orderItem?.amount === 1} onClick={() => handleOnChangeCount('decrease', orderItem?.product)} />
                          <WrapperInputQuantityBuy size="middle" defaultValue={orderItem?.amount} value={orderItem?.amount} controls={false} />
                          <ButtonComponents textButton="+" size="middle" styleButton={{ width: "35px", padding: "4px" }} disabled={orderItem?.amount === orderItem?.countInStock} onClick={() => handleOnChangeCount('increase', orderItem?.product)} />
                        </WrapperQuantityBuy>
                        <span style={{ color: 'rgb(255, 66, 78)', fontSize: '13px', fontWeight: 500 }}>{((orderItem?.price || 0) * (orderItem?.amount || 0))?.toLocaleString()}đ</span>
                        <DeleteOutlined style={{ cursor: 'pointer' }} onClick={() => handleDeleteOrder(orderItem?.product)} />
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
                  <span style={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>{(priceMemo || 0)?.toLocaleString()}đ</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Giảm giá</span>
                  <span style={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>{(priceDiscountMemo || 0)?.toLocaleString()}đ</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Phí giao hàng</span>
                  <span style={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>{(deliveryPriceMemo || 0)?.toLocaleString()}đ</span>
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '10px', marginTop: '2px', textAlign: 'right' }}>
                  (Phí ship: 20k cho đơn &lt; 200k, 10k cho đơn từ 200k - 500k, Miễn phí cho đơn &ge; 500k)
                </div>
              </WrapperInfo>
              <WrapperInfo>
                <div>
                  <span>Chọn phương thức thanh toán</span>
                  <Radio.Group onChange={handlePayment} value={payment} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    <Radio value="later_money">Thanh toán tiền mặt khi nhận hàng (COD)</Radio>
                    <Radio value="sepay">Chuyển khoản Ngân hàng tự động (SePay)</Radio>
                    <Radio value="paypal">Thanh toán bằng PayPal</Radio>
                  </Radio.Group>
                </div>
              </WrapperInfo>
              <WrapperTotal>
                <span>Tổng tiền</span>
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'rgb(254, 56, 52)', fontSize: '24px', fontWeight: 'bold' }}>{(totalPriceMemo || 0)?.toLocaleString()}đ</span>
                  <span style={{ color: '#000', fontSize: '11px' }}>(Đã bao gồm VAT nếu có)</span>
                </span>
              </WrapperTotal>
              {payment === 'paypal' && sdk ? (
                <div style={{ width: '100%' }}>
                  <PayPalScriptProvider
                    options={{
                      "client-id": "AR58Ggn2424Inh_411TdLu65ceGnrfaFyp-zAYhpC9VCzAIu8GKanfZTPuwAmuuNxcnCBJ73ZqbANeio",
                      currency: "USD"
                    }}
                  >
                    <PayPalButtons
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          purchase_units: [
                            {
                              amount: {
                                currency_code: "USD",
                                value: (totalPriceMemo / 24000).toFixed(2)
                              }
                            }
                          ]
                        });
                      }}
                      onApprove={(data, actions) => {
                        return actions.order.capture().then((details) => {
                          handleAddOrder(true);
                        });
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
              ) : (
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
              )}
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

      <Modal 
        title="Thanh toán qua chuyển khoản Ngân hàng" 
        open={isOpenModalSePay} 
        onCancel={() => {
            setIsOpenModalSePay(false);
            navigate('/my-order');
        }}
        footer={null}
        width={400}
      >
        <div style={{ textAlign: 'center' }}>
          <p>Vui lòng quét mã QR dưới đây để thanh toán</p>
          <img src={sepayData?.payUrl} alt="SePay QR" style={{ width: '100%', maxWidth: '250px', marginBottom: '20px' }} />
          <Divider />
          <div style={{ textAlign: 'left', background: '#f0f2f5', padding: '15px', borderRadius: '8px' }}>
            <div style={{ marginBottom: '10px' }}>
              <Text strong>Số tiền:</Text> <Text type="danger" style={{ fontSize: '18px' }}>{sepayData?.amount?.toLocaleString()}đ</Text>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <Text strong>Nội dung chuyển khoản:</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                <Input value={sepayData?.description} readOnly style={{ fontWeight: 'bold', color: '#1677ff' }} />
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>* Quan trọng: Nhập chính xác nội dung này để đơn hàng được tự động xác nhận.</Text>
            </div>
            <div>
              <Text strong>Số tài khoản:</Text> <Text>{sepayData?.bankAccount}</Text>
            </div>
          </div>
          <p style={{ marginTop: '20px', fontStyle: 'italic', fontSize: '13px' }}>
            Hệ thống sẽ tự động cập nhật sau 1-3 phút khi nhận được tiền.
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default OrderPage;
