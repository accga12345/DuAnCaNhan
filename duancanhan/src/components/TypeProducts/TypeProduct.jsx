import React from "react"
import { TextTypeProduct } from "./style"
import { useNavigate } from "react-router-dom"
import { convertToSlug } from "../../ultil"

const TypeProduct = ({ name, id, image, isActive }) => {
    const navigate = useNavigate();
    const handleNavigate = (name) => {
        navigate(`/product/category/${convertToSlug(name)}`);
    };
    return (
        <TextTypeProduct onClick={() => handleNavigate(name)} isActive={isActive} style={{ display: 'flex', alignItems: 'center' }}>
            {image && <img src={image} alt={name} style={{ width: 24, height: 24, marginRight: 10, objectFit: 'contain' }} />}
            {name}
        </TextTypeProduct>
    )
}

export default TypeProduct