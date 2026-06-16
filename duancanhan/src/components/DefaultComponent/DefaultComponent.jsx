import HeaderComponent from "../HeaderComponent/HeaderComponent"
import UnifiedChatComponent from "../UnifiedChatComponent/UnifiedChatComponent"
import FooterComponent from "../FooterComponent/FooterComponent"
import UtilitiesComponent from "../UtilitiesComponent/UtilitiesComponent"
import { useLocation } from 'react-router-dom';

const DefaultComponent = ({ children, isHiddenSearch = false, isCart = false, isFullWidth = false, isShowFooter = true, categories }) => {
    const location = useLocation();
    const isCategoryOrHome = location.pathname === '/' || location.pathname.startsWith('/product/category/');

    return (
        <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: "100%", borderBottom: "1px solid #e5e5e5", backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 1000 }}>
                <div style={{ maxWidth: "1440px", margin: "0 auto", width: '100%' }}>
                    <HeaderComponent isHiddenSearch={isHiddenSearch} isCart={isCart} />
                </div>
            </div>
            
            {isCategoryOrHome && (
                <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e5e5' }}>
                    <div style={{ maxWidth: "1440px", margin: "0 auto", width: '100%' }}>
                        <UtilitiesComponent categories={categories} showPCBuilder={true} />
                    </div>
                </div>
            )}

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