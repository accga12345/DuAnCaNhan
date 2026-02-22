import React from "react";
import { Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import InputComponent from "../InputComponents/InputComponent";


const ButtonInputSearch = (props) => {
    const { size, placeholder, variant, textButton, backgroundColorInput = "#fff", backgroundColorButton = "#fff" } = props;
    const [isHovered, setIsHovered] = React.useState(false);
    return (
        <div style={{
            display: "flex",
            alignItems: "stretch",
            borderRadius: 5,
            border: "1px solid #d9d9d9",
            overflow: "hidden"
        }}>
            <InputComponent
                size={size}
                placeholder={placeholder}
                variant={variant}
                style={{
                    backgroundColor: backgroundColorInput,
                    flex: 1,
                }}
                {...props}
            />
            {/* Divider giữa Input và Button */}
            <div style={{
                display: "flex",
                alignItems: "center",
                padding: "0 1px"
            }}>
                <div style={{
                    width: 1,
                    height: "50%",
                    backgroundColor: "#d9d9d9"
                }}></div>
            </div>
            <Button
                size={size}
                icon={<SearchOutlined />}
                type="text"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    backgroundColor: isHovered ? "#f0f0f0" : backgroundColorButton,
                    borderRadius: 0
                }}
                {...props}
            > {textButton} </Button>
        </div>
    );
};

export default ButtonInputSearch;