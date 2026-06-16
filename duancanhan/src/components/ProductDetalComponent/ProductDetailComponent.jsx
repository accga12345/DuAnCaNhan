import React from "react";
import { Row, Col, Image, Rate } from "antd";
import {
    WrapperImageSmall,
    WrapperTextRate,
    WrapperTextQuantityBuy,
    WrapperTextPrice,
    WrapperProductPrice,
    WrapperInputQuantityBuy,
    WrapperQuantityBuy,
    WrapperSimilarProducts,
    WrapperDescription,
    WrapperContentDescription,
    WrapperReadMoreBtn,
    WrapperSpecsContainer,
    WrapperSpecsHeader,
    WrapperSpecsTable,
    WrapperSpecsRow,
    WrapperSeeMoreSpecs,
    WrapperMainImageContainer
} from "./style"
import { StarFilled } from "@ant-design/icons";
import ButtonComponents from "../ButtonComponents/ButtonComponents";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { addOrderProduct } from '../../redux/slides/orderSlide';
import { showSuccess, showError } from "../MessageComponent/MessageComponent";
import { useNavigate } from "react-router-dom";
import CardComponent from "../CardComponent/CardComponent";

const ProductDetailComponent = (props) => {
    const { id, product, isLoading, similarProducts = [], isLoadingSimilar } = props;
    const [value, setValue] = useState(1);
    const [currentImage, setCurrentImage] = useState(null);
    const [showAllDescription, setShowAllDescription] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const order = useSelector((state) => state.order);

    const handleAddOrderProduct = (isBuyNow = false) => {
        const orderItem = order?.orderItems?.find((item) => item?.product === (product?.data?._id || id));
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
                    warranty: product?.data?.warranty || 12,
                    countInStock: product?.data?.countInStock
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

    useEffect(() => {
        if (product?.data?.image) {
            setCurrentImage(product.data.image);
        }
    }, [product]);

    const handleSelectImage = (img) => {
        setCurrentImage(img);
    };

    return (
        <div>
            <div style={{ padding: "20px", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
                <Row>
                    <Col span={10} style={{ padding: "10px", borderRight: "1px solid #f0f0f0" }}>
                        <WrapperMainImageContainer>
                            <Image
                                src={currentImage || product?.data?.image}
                                alt="Product"
                                style={{ width: "100%", height: "100%", objectFit: 'contain' }}
                            />
                        </WrapperMainImageContainer>
                        <Row style={{ marginTop: "15px", gap: "10px", justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                            {(product?.data?.images?.length > 0 ? product.data.images : [product?.data?.image])?.map((img, index) => (
                                <WrapperImageSmall
                                    key={index}
                                    onClick={() => handleSelectImage(img)}
                                    style={{
                                        border: (currentImage === img || (!currentImage && index === 0)) ? '2px solid #ff424e' : '1px solid #ddd',
                                    }}
                                >
                                    <img
                                        src={img}
                                        alt={`Product ${index}`}
                                        style={{ width: "100%", height: "100%", objectFit: 'cover' }}
                                    />
                                </WrapperImageSmall>
                            ))}
                        </Row>
                    </Col>
                    <Col span={14} style={{ padding: "0 20px" }}>
                        <h1 style={{ fontSize: '24px', fontWeight: '500', marginBottom: '10px' }}>{product?.data?.name}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <WrapperTextRate>
                                <span style={{ textDecoration: 'underline', fontWeight: '600' }}>{product?.data?.rating}</span>
                                <Rate value={product?.data?.rating} disabled style={{ fontSize: "14px", color: '#ffbe00' }} />
                            </WrapperTextRate>
                            <span style={{ color: '#f0f0f0' }}>|</span>
                            <WrapperTextQuantityBuy>{product?.data?.selled} đã bán</WrapperTextQuantityBuy>
                        </div>
                        <WrapperProductPrice style={{ background: '#fafafa', padding: '15px', borderRadius: '4px', marginTop: '15px' }}>
                            <WrapperTextPrice>{product?.data?.price?.toLocaleString()} ₫</WrapperTextPrice>
                            {product?.data?.discount > 0 && (
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
                                    <span style={{ textDecoration: 'line-through', color: '#999' }}>
                                        {(product.data.price * (1 + product.data.discount / 100)).toLocaleString()} ₫
                                    </span>
                                    <span style={{ color: '#ff424e', fontWeight: '600' }}>-{product.data.discount}%</span>
                                </div>
                            )}
                        </WrapperProductPrice>
                        <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <span style={{ fontWeight: '500' }}>Số lượng:</span>
                            <WrapperQuantityBuy>
                                <ButtonComponents textButton="-" size="middle" disabled={value === 1} styleButton={{ width: "32px", height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => handleOnChangeCount('decrease')} />
                                <WrapperInputQuantityBuy onChange={onChange} defaultValue={1} controls={false} value={value} style={{ width: '50px', textAlign: 'center' }} />
                                <ButtonComponents textButton="+" size="middle" disabled={value === product?.data?.countInStock} styleButton={{ width: "32px", height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => handleOnChangeCount('increase')} />
                            </WrapperQuantityBuy>
                        </div>
                        <div style={{ display: "flex", marginTop: "30px", gap: '15px' }}>
                            <ButtonComponents
                                textButton="THÊM VÀO GIỎ HÀNG"
                                size="large"
                                styleButton={{
                                    flex: 1,
                                    height: '48px',
                                    backgroundColor: "#fff",
                                    color: "#ff424e",
                                    borderColor: "#ff424e",
                                    fontWeight: '600'
                                }}
                                onClick={() => handleAddOrderProduct(false)}
                            />
                            <ButtonComponents
                                textButton="MUA NGAY"
                                size="large"
                                styleButton={{
                                    flex: 1,
                                    height: '48px',
                                    backgroundColor: "#ff424e",
                                    color: "#fff",
                                    borderColor: "#ff424e",
                                    fontWeight: '600'
                                }}
                                onClick={handleBuyNow}
                            />
                        </div>
                    </Col>
                </Row>
            </div>

            {similarProducts.length > 0 && (
                <WrapperSimilarProducts>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', textTransform: 'uppercase' }}>Sản phẩm tương tự</h2>
                    <Row gutter={[16, 16]}>
                        {similarProducts.slice(0, 6).filter(item => item._id !== id).map((item) => (
                            <Col key={item._id} span={4}>
                                <CardComponent
                                    id={item._id}
                                    name={item.name}
                                    image={item.image}
                                    price={item.price}
                                    rating={item.rating}
                                    selled={item.selled}
                                    discount={item.discount}
                                />
                            </Col>
                        ))}
                    </Row>
                </WrapperSimilarProducts>
            )}

            <Row gutter={[20, 20]} style={{ marginTop: '20px' }}>
                <Col span={16}>
                    <WrapperDescription style={{ marginTop: 0 }}>
                        <h2>Mô tả sản phẩm</h2>
                        <WrapperContentDescription showAll={showAllDescription}>
                            <div
                                dangerouslySetInnerHTML={{ __html: product?.data?.description || "Đang cập nhật nội dung..." }}
                                style={{ fontSize: '15px', color: '#333' }}
                            />
                        </WrapperContentDescription>
                        <WrapperReadMoreBtn>
                            <button onClick={() => setShowAllDescription(!showAllDescription)}>
                                {showAllDescription ? "Thu gọn nội dung" : "Xem thêm nội dung"}
                            </button>
                        </WrapperReadMoreBtn>
                    </WrapperDescription>

                    <WrapperDescription style={{ marginTop: '20px', padding: '20px' }}>
                        <h2>Đánh giá sản phẩm ({product?.data?.reviews?.length || 0})</h2>
                        {product?.data?.reviews?.length > 0 ? (
                            product.data.reviews.map((review, index) => (
                                <div key={index} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Rate disabled defaultValue={review.rating} style={{ fontSize: '14px' }} />
                                        <span style={{ fontWeight: 'bold' }}>{review.user?.name || "Khách hàng"}</span>
                                        <span style={{ color: '#999', fontSize: '12px' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p style={{ marginTop: '5px' }}>{review.comment}</p>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: '#888', fontStyle: 'italic' }}>Chưa có đánh giá nào cho sản phẩm này.</p>
                        )}
                    </WrapperDescription>
                </Col>
                <Col span={8}>
                    <WrapperSpecsContainer>
                        <WrapperSpecsHeader>Thông số kỹ thuật</WrapperSpecsHeader>
                        <WrapperSpecsTable>
                            {product?.data?.specifications?.length > 0 ? (
                                product.data.specifications.slice(0, 10).map((spec, index) => (
                                    <WrapperSpecsRow key={index}>
                                        <div className="specs-key">{spec.key}</div>
                                        <div className="specs-value">{spec.value}</div>
                                    </WrapperSpecsRow>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', color: '#888', padding: '20px 0' }}>
                                    Thông tin đang được cập nhật
                                </div>
                            )}
                        </WrapperSpecsTable>
                        {product?.data?.specifications?.length > 10 && (
                            <WrapperSeeMoreSpecs>
                                <button>Xem cấu hình chi tiết</button>
                            </WrapperSeeMoreSpecs>
                        )}
                    </WrapperSpecsContainer>
                </Col>
            </Row>
        </div>
    );
}

export default ProductDetailComponent;