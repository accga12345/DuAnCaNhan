import React from "react";
import { StarFilled } from "@ant-design/icons";
import { WrapperNameText, WrapperReportText, WrapperPriceText, WrapperDiscountText, WrapperCardStyle } from "./style";
import { useNavigate } from "react-router-dom";

const CardComponent = (props) => {
    const { name, image, category, price, selled, rating, discount, id, _id, onReplace, replaceLabel = 'Thay thế' } = props;
    const navigate = useNavigate();
    const productId = id || _id;

    const handleDetailProduct = (id) => {
        navigate(`/productdetail/${id}`)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <WrapperCardStyle
                onClick={() => handleDetailProduct(productId)}
                cover={
                    <div style={{
                        position: "relative",
                        overflow: 'hidden',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                        height: '200px',
                        backgroundColor: '#f8f9fa'
                    }}>
                        <img
                            draggable={false}
                            alt={name}
                            src={image}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                transition: 'transform 0.5s ease',
                                padding: '12px'
                            }}
                        />
                        {discount > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                zIndex: 10
                            }}>
                                <WrapperDiscountText>-{discount}%</WrapperDiscountText>
                            </div>
                        )}
                    </div>
                }
            >
                <WrapperNameText>{name}</WrapperNameText>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {category?.name}
                    </div>

                    <WrapperReportText>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: 600 }}>{rating}</span>
                            <StarFilled style={{ color: "#ffc107", fontSize: "14px" }} />
                        </div>
                        <span style={{ color: '#e5e5e5' }}>|</span>
                        <span>Đã bán {selled}+</span>
                    </WrapperReportText>

                    <WrapperPriceText>
                        <span style={{ fontSize: '20px' }}>{price?.toLocaleString()}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, alignSelf: 'flex-end', marginBottom: '2px' }}>₫</span>
                    </WrapperPriceText>
                </div>
            </WrapperCardStyle>

            {onReplace && (
                <button onClick={(e) => { 
                    e.stopPropagation(); 
                    onReplace(); 
                }} style={{ marginTop: 10, padding: 8, background: replaceLabel === 'Chọn' ? '#52c41a' : '#1890ff', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
                    {replaceLabel}
                </button>
            )}
        </div>
    )
};
export default CardComponent;
