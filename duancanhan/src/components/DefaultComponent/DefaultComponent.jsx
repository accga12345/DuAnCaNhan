import HeaderComponent from "../HeaderComponent/HeaderComponent"

const DefaultComponent = ({ children, isHiddenSearch = false, isCart = false }) => {
    return (
        <div>
            <div style={{ width: "100%", borderBottom: "1px solid #e5e5e5" }}>
                <div style={{ width: "1440px", margin: "0 auto" }}>
                    <HeaderComponent isHiddenSearch={isHiddenSearch} isCart={isCart} />
                </div>
            </div>

            {children}
        </div>
    )
}
export default DefaultComponent