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
            borderRadius: 12,
            backgroundColor: '#f5f5f7',
            border: "1px solid transparent",
            overflow: "hidden",
            transition: 'all 0.3s ease',
            width: '100%'
        }}>
            <InputComponent
                size={size}
                placeholder={placeholder}
                variant={variant}
                style={{
                    backgroundColor: 'transparent',
                    flex: 1,
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '14px'
                }}
                {...props}
            />
            <Button
                size={size}
                icon={<SearchOutlined />}
                type="text"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    backgroundColor: isHovered ? "var(--primary-color)" : "transparent",
                    color: isHovered ? "#fff" : "var(--primary-color)",
                    borderRadius: 0,
                    border: 'none',
                    height: 'auto',
                    padding: '0 20px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                }}
                {...props}
            > {textButton} </Button>
        </div>
    );
};

export default ButtonInputSearch;