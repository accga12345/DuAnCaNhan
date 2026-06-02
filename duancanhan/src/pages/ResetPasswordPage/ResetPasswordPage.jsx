import React, { useEffect } from "react";
import { WrapperSignInPage, WrapperSignInContainer, WrapperTextCreateAccount, WrapperExitPage } from "../SignInPage/style";
import { Image, Form, Input, Button } from 'antd';
import ResetPassImg from "../../assets/images/SignIn.png"
import { useNavigate, useLocation } from "react-router-dom";
import { resetPassword } from "../../services/UserServices";
import { useMutationHook } from "../../hooks/useMutationHook";
import LoadingComponent from "../../components/Loading/LoadingComponent";
import { showSuccess, showError } from "../../components/MessageComponent/MessageComponent";

function ResetPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = new URLSearchParams(location.search).get('token');

    const mutation = useMutationHook(
        async data => {
            return await resetPassword(data);
        }
    );

    const { isSuccess, isError, isPending, data } = mutation;

    useEffect(() => {
        if (!token) {
            showError("Mã xác nhận không hợp lệ");
            navigate("/signin");
        }
    }, [token, navigate]);

    useEffect(() => {
        if (isSuccess && data) {
            showSuccess(data.message || "Đổi mật khẩu thành công!");
            setTimeout(() => {
                navigate("/signin");
            }, 2000);
        }

        if (isError) {
            showError(
                mutation.error?.response?.data?.message || "Đổi mật khẩu thất bại"
            );
        }
    }, [isSuccess, isError]);

    const onFinish = (values) => {
        mutation.mutate({
            password: values.password,
            token: token
        });
    };

    return (
        <WrapperSignInContainer>
            <div style={{ position: "relative" }}>
                <WrapperExitPage onClick={() => navigate('/signin')}>X</WrapperExitPage>
                <WrapperSignInPage>
                    <div style={{ flex: 1, padding: "20px" }}>
                        <Form
                            name="reset-password"
                            layout="vertical"
                            onFinish={onFinish}
                            autoComplete="off"
                        >
                            <WrapperTextCreateAccount>Thiết lập mật khẩu mới</WrapperTextCreateAccount>
                            <Form.Item
                                label="Mật khẩu mới"
                                name="password"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                                    { min: 6, message: 'Mật khẩu phải có tối thiểu 6 ký tự' }
                                ]}
                            >
                                <Input.Password placeholder="Nhập mật khẩu mới" />
                            </Form.Item>

                            <Form.Item
                                label="Xác nhận mật khẩu"
                                name="confirmPassword"
                                dependencies={['password']}
                                rules={[
                                    { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password placeholder="Nhập lại mật khẩu mới" />
                            </Form.Item>

                            <Form.Item>
                                <LoadingComponent isPending={isPending}>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        disabled={isPending}
                                        style={{ width: "100%" }}
                                    >
                                        Lưu thay đổi
                                    </Button>
                                </LoadingComponent>
                            </Form.Item>
                        </Form>
                    </div>
                    <div style={{ width: "300px", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "rgb(222, 235, 255)" }}>
                        <Image
                            src={ResetPassImg}
                            alt="Reset Password"
                            style={{ width: "200px", height: "200px" }}
                            preview={false}
                        />
                    </div>
                </WrapperSignInPage>
            </div>
        </WrapperSignInContainer>
    );
}

export default ResetPasswordPage;
