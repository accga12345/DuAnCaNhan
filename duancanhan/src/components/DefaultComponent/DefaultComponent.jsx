import HeaderComponent from "../HeaderComponent/HeaderComponent"
import ChatbotComponent from "../ChatbotComponent/ChatbotComponent"
import LiveChatComponent from "../LiveChatComponent/LiveChatComponent"

const DefaultComponent = ({ children, isHiddenSearch = false, isCart = false, isFullWidth = false }) => {
    return (
        <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
            <div style={{ width: "100%", borderBottom: "1px solid #e5e5e5", backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 1000 }}>
                <div style={{ maxWidth: "1440px", margin: "0 auto", width: '100%' }}>
                    <HeaderComponent isHiddenSearch={isHiddenSearch} isCart={isCart} />
                </div>
            </div>

            <div style={{ maxWidth: isFullWidth ? '100%' : "1440px", margin: "0 auto", width: '100%' }}>
                {children}
            </div>
            <ChatbotComponent />
            <LiveChatComponent />
        </div>
    )
}
export default DefaultComponent