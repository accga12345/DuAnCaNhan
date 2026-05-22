import React, { useEffect } from "react";
import { WrapperSignInPage, WrapperSignInContainer, WrapperTextCreateAccount, WrapperExitPage } from "../SignInPage/style";
import { Image, Form, Input, Button } from 'antd';
import ForgotPassImg from "../../assets/images/SignIn.png" // Reuse the same image or a different one
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/UserServices";
import { useMutationHook } from "../../hooks/useMutationHook";
import LoadingComponent from "../../components/Loading/LoadingComponent";
import { showSuccess, showError } from "../../components/MessageComponent/MessageComponent";

function ForgotPasswordPage() {
    const navigate = useNavigate();

    const mutation = useMutationHook(
        async data => {
            return await forgotPassword(data);
        }
    );

    const { isSuccess, isError, isPending, data } = mutation;

    useEffect(() => {
        if (isSuccess && data) {
            showSuccess(data.message || "Vui lòng kiểm tra email!");
            setTimeout(() => {
                navigate("/signin");
            }, 3000);
        }

        if (isError) {
            showError(
                mutation.error?.response?.data?.message || "Gửi yêu cầu thất bại"
            );
        }
    }, [isSuccess, isError]);

    const onFinish = (data) => {
        mutation.mutate({
            email: data.email
        });
    };

    return (
        <WrapperSignInContainer>
            <div style={{ position: "relative" }}>
                <WrapperExitPage onClick={() => navigate('/signin')}>X</WrapperExitPage>
                <WrapperSignInPage>
                    <div style={{ flex: 1, padding: "20px" }}>
                        <Form
                            name="forgot-password"
                            layout="vertical"
                            onFinish={onFinish}
                            autoComplete="off"
                        >
                            <WrapperTextCreateAccount>Khôi phục mật khẩu</WrapperTextCreateAccount>
                            <p style={{ marginBottom: "20px" }}>Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</p>
                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email!' },
                                    { type: 'email', message: 'Email không hợp lệ!' }
                                ]}
                            >
                                <Input placeholder="abc@gmail.com" />
                            </Form.Item>

                            <Form.Item>
                                <LoadingComponent isPending={isPending}>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        disabled={isPending}
                                        style={{ width: "100%" }}
                                    >
                                        Gửi yêu cầu
                                    </Button>
                                </LoadingComponent>
                            </Form.Item>

                            <div style={{ fontSize: "14px", textAlign: "center" }}>
                                <span onClick={() => navigate("/signin")} style={{ color: "#1677ff", cursor: "pointer" }}>Quay lại Đăng nhập</span>
                            </div>
                        </Form>
                    </div>
                    <div style={{ width: "300px", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "rgb(222, 235, 255)" }}>
                        <Image
                            src={ForgotPassImg}
                            alt="Forgot Password"
                            style={{ width: "200px", height: "200px" }}
                            preview={false}
                        />
                    </div>
                </WrapperSignInPage>
            </div>
        </WrapperSignInContainer>
    );
}

export default ForgotPasswordPage;
