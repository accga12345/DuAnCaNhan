import HeaderComponent from "../HeaderComponent/HeaderComponent"
import UnifiedChatComponent from "../UnifiedChatComponent/UnifiedChatComponent"
import FooterComponent from "../FooterComponent/FooterComponent"

const DefaultComponent = ({ children, isHiddenSearch = false, isCart = false, isFullWidth = false, isShowFooter = true }) => {
    return (
        <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: "100%", borderBottom: "1px solid #e5e5e5", backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 1000 }}>
                <div style={{ maxWidth: "1440px", margin: "0 auto", width: '100%' }}>
                    <HeaderComponent isHiddenSearch={isHiddenSearch} isCart={isCart} />
                </div>
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ maxWidth: isFullWidth ? '100%' : "1440px", margin: "0 auto", width: '100%' }}>
                    {children}
                </div>
            </div>

            {isShowFooter && <FooterComponent />}
            <UnifiedChatComponent />
        </div>
    )
}
export default DefaultComponent