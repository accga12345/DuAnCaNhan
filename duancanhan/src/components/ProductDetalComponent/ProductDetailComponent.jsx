import React from "react";
import { Row, Col, Image, Rate } from "antd";
import TestProduct from "../../assets/images/TestProduct.webp"
import { WrapperImageSmall, WrapperTextRate, WrapperTextQuantityBuy, WrapperTextPrice, WrapperProductPrice, WrapperInputQuantityBuy, WrapperQuantityBuy } from "./style"
import { StarFilled } from "@ant-design/icons";
import ButtonComponents from "../ButtonComponents/ButtonComponents";
import { useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { addOrderProduct } from '../../redux/slides/orderSlide';
import { showSuccess, showError } from "../MessageComponent/MessageComponent";

import { useNavigate } from "react-router-dom";

const ProductDetailComponent = (props) => {
    const { id, product, isLoading } = props;
    const [value, setValue] = useState(1);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const order = useSelector((state) => state.order);

    const handleAddOrderProduct = (isBuyNow = false) => {
        const orderItem = order?.oderItems?.find((item) => item?.product === (product?.data?._id || id));
        if (orderItem && (orderItem.amount + value > product?.data?.countInStock)) {
            showError(`Sản phẩm đã đạt giới hạn số lượng trong giỏ hàng!`);
        } else {
            dispatch(addOrderProduct({
                orderItem: {
                    name: product?.data?.name,
                    amount: value,
                    image: product?.data?.image,
                    price: product?.data?.price,
                    product: product?.data?._id,
                    discount: product?.data?.discount || 0,
                    countInstock: product?.data?.countInStock
                }
            }))
            if (isBuyNow) {
                navigate('/order')
            } else {
                showSuccess('Thêm vào giỏ hàng thành công');
            }
        }
    }

    const handleBuyNow = () => {
        handleAddOrderProduct(true)
    }

    const handleOnChangeCount = (type) => {
        if (type === 'increase') {
            setValue(value + 1)
        } else if (type === 'decrease') {
            setValue(value - 1)
        }
    }
    const onChange = (value) => {
        setValue(value);
    }

    return (
        <div style={{ padding: "0 20px", backgroundColor: "#fff", borderRadius: "5px" }}>
            <Row>
                <Col span={10} style={{ padding: "20px", borderRight: "1px solid #f0f0f0" }}>
                    <Image
                        src={product?.data?.image}
                        alt="Product"
                        style={{ width: "100%", height: "auto" }}
                    />
                    <Row style={{ marginTop: "10px", justifyContent: "space-between" }}>
                        <WrapperImageSmall span={4} >
                            <Image
                                src={TestProduct}
                                alt="Product"
                                style={{ width: "64px", height: "64px" }}
                            />
                        </WrapperImageSmall>
                        <WrapperImageSmall span={4}>
                            <Image
                                src={TestProduct}
                                alt="Product"
                                style={{ width: "64px", height: "64px" }}
                            />
                        </WrapperImageSmall>
                        <WrapperImageSmall span={4}>
                            <Image
                                src={TestProduct}
                                alt="Product"
                                style={{ width: "64px", height: "64px" }}
                            />
                        </WrapperImageSmall>
                        <WrapperImageSmall span={4}>
                            <Image
                                src={TestProduct}
                                alt="Product"
                                style={{ width: "64px", height: "64px" }}
                            />
                        </WrapperImageSmall>
                        <WrapperImageSmall span={4}>
                            <Image
                                src={TestProduct}
                                alt="Product"
                                style={{ width: "64px", height: "64px" }}
                            />
                        </WrapperImageSmall>
                        <WrapperImageSmall span={4}>
                            <Image
                                src={TestProduct}
                                alt="Product"
                                style={{ width: "64px", height: "64px" }}
                            />
                        </WrapperImageSmall>
                    </Row>
                </Col>
                <Col span={14} style={{ padding: "20px" }}>
                    <h1>{product?.data?.name}</h1>
                    <div>
                        <WrapperTextRate>
                            <span>{product?.data?.rating}</span>
                            <Rate allowHalf defaultValue={product?.data?.rating} disabled style={{ fontSize: "15px" }} />
                        </WrapperTextRate>
                        <WrapperTextQuantityBuy> ({product?.data?.selled} đã bán)</WrapperTextQuantityBuy>
                    </div>
                    <WrapperProductPrice>
                        <WrapperTextPrice>{product?.data?.price.toLocaleString()}</WrapperTextPrice>
                    </WrapperProductPrice>
                    <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "5px" }}>
                        <WrapperTextRate>Số lượng:</WrapperTextRate>
                        <WrapperQuantityBuy>
                            <ButtonComponents textButton="-" size="middle" disabled={value === 1} styleButton={{ marginRight: "8px", width: "40px" }} onClick={() => handleOnChangeCount('decrease')} />
                            <WrapperInputQuantityBuy onChange={onChange} defaultValue={1} controls={false} value={value} />
                            <ButtonComponents textButton="+" size="middle" disabled={value === product?.data?.countInStock} styleButton={{ marginLeft: "8px", width: "40px" }} onClick={() => handleOnChangeCount('increase')} />
                        </WrapperQuantityBuy>
                    </div>
                    <div style={{ display: "flex", marginTop: "20px" }}>
                        <ButtonComponents textButton="Thêm vào giỏ hàng" size="large" styleButton={{ width: "240px", marginRight: "10px", backgroundColor: "#ff424e", color: "#fff", borderColor: "#ff424e" }} onClick={handleAddOrderProduct} />
                        <ButtonComponents textButton="Mua ngay" size="large" styleButton={{ width: "240px", backgroundColor: "#ffa900", color: "#fff", borderColor: "#ffa900" }} onClick={handleBuyNow} />
                    </div>
                </Col>
            </Row>
        </div>
    );
}
export default ProductDetailComponent;