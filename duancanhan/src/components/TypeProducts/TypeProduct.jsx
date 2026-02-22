import React from "react"
import { TextTypeProduct } from "./style"
import { useNavigate } from "react-router-dom"
import { convertToSlug } from "../../ultil"

const TypeProduct = ({ name }) => {
    const navigate = useNavigate();
    const handleNavigate = (type) => {
        const formattedType = convertToSlug(type)

        navigate(`/typeproduct/${formattedType}`, { state: { name: type } });
    };
    return (
        <TextTypeProduct onClick={() => handleNavigate(name)}>
            {name}
        </TextTypeProduct>
    )
}

export default TypeProduct