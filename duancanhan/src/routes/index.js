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

const routes = [
    {
        path: "/",
        page: HomePage,
        isShowHeader: true
    },
    {
        path: "/xay-dung-cau-hinh",
        page: PCBuilderPage,
        isShowHeader: true
    },
    {
        path: "/cam-ket",
        page: CommitmentPage,
        isShowHeader: true
    },
    {
        path: "/order",
        page: OrderPage,
        isShowHeader: true
    },
    {
        path: "/my-order",
        page: MyOrderPage,
        isShowHeader: true
    },
    {
        path: "/orderSuccess",
        page: OrderSuccessPage,
        isShowHeader: true
    },
    {
        path: "/product/category/:slug",
        page: TypeProductPage,
        isShowHeader: true
    },
    {
        path: "/productdetail/:id",
        page: ProductDetailPage,
        isShowHeader: true
    },
    {
        path: "/signin",
        page: SignInPage,
        isShowHeader: false
    },
    {
        path: "/signup",
        page: SignUpPage,
        isShowHeader: false
    },
    {
        path: "/forgot-password",
        page: ForgotPasswordPage,
        isShowHeader: false
    },
    {
        path: "/reset-password",
        page: ResetPasswordPage,
        isShowHeader: false
    },
    {
        path: "/profile",
        page: ProfilePage,
        isShowHeader: true
    },
    {
        path: "/system",
        page: AdminPage,
        isShowHeader: true,
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