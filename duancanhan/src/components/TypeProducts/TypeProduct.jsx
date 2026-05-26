import React from "react"
import { TextTypeProduct } from "./style"
import { useNavigate } from "react-router-dom"
import { convertToSlug } from "../../ultil"

const TypeProduct = ({ name, id, isActive }) => {
    const navigate = useNavigate();
    const handleNavigate = (name) => {
        navigate(`/product/category/${convertToSlug(name)}`);
    };
    return (
        <TextTypeProduct onClick={() => handleNavigate(name)} isActive={isActive}>
            {name}
        </TextTypeProduct>
    )
}

export default TypeProduct