import React from "react";
import { StarFilled } from "@ant-design/icons";
import { WrapperNameText, WrapperReportText, WrapperPriceText, WrapperDiscountText, WrapperCardStyle } from "./style";
import { Image } from "antd";
import certification from "../../assets/images/certification.png"
import { useNavigate } from "react-router-dom";

const CardComponent = (props) => {
    const { name, image, type, price, countInStock, rating, description, selled, discount, id } = props;
    const navigate = useNavigate();
    const handleDetailProduct = (id) => {
        navigate(`/productdetail/${id}`)
    }

    return (
        <WrapperCardStyle
            hoverable
            style={{ width: 210, height: 410 }}
            onClick={() => handleDetailProduct(id)}
            cover={
                <div style={{ position: "relative" }}>
                    <img
                        draggable={false}
                        alt="example"
                        src={image}
                    />
                    <Image
                        src={certification}
                        preview={false}
                        style={{
                            width: 200,
                            height: 200,
                            position: "absolute",
                            top: -102,
                            left: -210,
                            zIndex: 100,
                        }}
                    />
                </div>
            }
        >

            <WrapperNameText>{name}</WrapperNameText>
            <WrapperReportText>
                <span>
                    <span>{rating}</span> <StarFilled style={{ color: "#fadb14", fontSize: "10px" }} />
                </span>
                <span> | đã bán {selled}</span>
            </WrapperReportText>
            <WrapperPriceText>
                <span>{price?.toLocaleString()}</span>
                <WrapperDiscountText>-{discount}%</WrapperDiscountText>
            </WrapperPriceText>

        </WrapperCardStyle>
    )
};
export default CardComponent;