import HomePage from "../pages/HomePage/HomePage";
import OrderPage from "../pages/OrderPage/OrderPage";
import NotFoundPage from "../pages/NotFoundPage/NotFoundPage";
import TypeProductPage from "../pages/TypeProductPage/TypeProductPage";
import ProductDetailPage from "../pages/ProductDetailPage/ProductDetailPage";
import SignInPage from "../pages/SignInPage/SignInPage";
import SignUpPage from "../pages/SignUpPage/SignUpPage";
import ProfilePage from "../pages/ProfilePage/ProfilePage";
import AdminPage from "../pages/AdminPage/AdminPage";
import OrderSuccessPage from "../pages/OrderSuccessPage/OrderSuccessPage";
import MyOrderPage from "../pages/MyOrderPage/MyOrderPage";
import CommitmentPage from "../pages/CommitmentPage/CommitmentPage";
import PCBuilderPage from "../pages/PCBuilderPage/PCBuilderPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage/ResetPasswordPage";
import { WarrantyLookupPage } from '../pages/WarrantyLookupPage/WarrantyLookupPage';

export const routes = [
    {
        path: '/',
        page: HomePage,
        isShowHeader: true,
        isShowFooter: true
    },
    {
        path: '/warranty-lookup',
        page: WarrantyLookupPage,
        isShowHeader: true,
        isShowFooter: true
    },
    {
        path: "/xay-dung-cau-hinh",
        page: PCBuilderPage,
        isShowHeader: true,
        isShowFooter: true
    },
    {
        path: "/cam-ket",
        page: CommitmentPage,
        isShowHeader: true,
        isShowFooter: true
    },
    {
        path: "/order",
        page: OrderPage,
        isShowHeader: true,
        isShowFooter: true
    },
    {
        path: "/my-order",
        page: MyOrderPage,
        isShowHeader: true,
        isShowFooter: true
    },
    {
        path: "/orderSuccess",
        page: OrderSuccessPage,
        isShowHeader: true,
        isShowFooter: true
    },
    {
        path: "/product/category/:slug",
        page: TypeProductPage,
        isShowHeader: true,
        isShowFooter: true
    },
    {
        path: "/productdetail/:id",
        page: ProductDetailPage,
        isShowHeader: true,
        isShowFooter: true
    },
    {
        path: "/signin",
        page: SignInPage,
        isShowHeader: false,
        isShowFooter: false
    },
    {
        path: "/signup",
        page: SignUpPage,
        isShowHeader: false,
        isShowFooter: false
    },
    {
        path: "/forgot-password",
        page: ForgotPasswordPage, isShowHeader: false,
        isShowFooter: false
    },
    {
        path: "/reset-password",
        page: ResetPasswordPage,
        isShowHeader: false,
        isShowFooter: false
    },
    {
        path: "/profile",
        page: ProfilePage,
        isShowHeader: true,
        isShowFooter: true
    },
    {
        path: "/system",
        page: AdminPage,
        isShowHeader: true,
        isShowFooter: false,
        isPrivate: true,
        isHiddenSearch: true,
        isCart: true,
        isFullWidth: true,
    },
    {
        path: "*",
        page: NotFoundPage
    }
];
export default routes