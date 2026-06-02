import React from "react";
import { WrapperSignInPage, WrapperSignInContainer, WrapperTextCreateAccount, WrapperExitPage } from "./style";
import { Image } from 'antd';
import SignInImg from "../../assets/images/SignIn.png"
import { Button, Checkbox, Form, Input } from 'antd';
import { useNavigate } from "react-router-dom";
import * as UserService from "../../services/UserServices";
import { useMutationHook } from "../../hooks/useMutationHook";
import LoadingComponent from "../../components/Loading/LoadingComponent";
import { useEffect } from "react";
import { showSuccess, showError } from "../../components/MessageComponent/MessageComponent";


function SignUpPage() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [isSendingOtp, setIsSendingOtp] = React.useState(false);
    const [countdown, setCountdown] = React.useState(0);

    const mutation = useMutationHook(
        data => UserService.registerUser(data)
    );

    const { isSuccess, isError, isPending, data } = mutation;

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    useEffect(() => {
        if (isSuccess && data) {
            showSuccess(data.message);

            setTimeout(() => {
                navigate("/signin");
            }, 500);
        }

        if (isError) {
            showError(
                mutation.error?.response?.data?.message || "Đăng ký thất bại"
            );
        }
    }, [isSuccess, isError]);

    const handleSendOtp = async () => {
        try {
            const email = form.getFieldValue("email");
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !regex.test(email)) {
                showError("Vui lòng nhập email hợp lệ trước khi gửi mã!");
                return;
            }
            setIsSendingOtp(true);
            const res = await UserService.sendOtp({ email });
            if (res.status === "success") {
                showSuccess(res.message);
                setCountdown(60);
            } else {
                showError(res.message || "Gửi mã thất bại!");
            }
        } catch (error) {
            showError(
                error?.response?.data?.message || "Gửi mã thất bại. Vui lòng thử lại!"
            );
        } finally {
            setIsSendingOtp(false);
        }
    };

    const onFinish = (values) => {
        mutation.mutate({
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
            otp: values.otp
        });
    };

    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    }
    const handleSignIn = () => {
        navigate("/signin");
    }
    return (
        <WrapperSignInContainer>
            <div style={{ position: "relative" }}>
                <WrapperExitPage onClick={() => navigate('/')}>X</WrapperExitPage>
                <WrapperSignInPage>
                    <div style={{ flex: 1, padding: "20px" }}>
                        <Form
                            form={form}
                            name="basic"
                            layout="vertical"
                            initialValues={{ remember: true }}
                            onFinish={onFinish}
                            onFinishFailed={onFinishFailed}
                            autoComplete="off"
                        >
                            <WrapperTextCreateAccount>Đăng ký</WrapperTextCreateAccount>
                            <Form.Item
                                label="Email"
                                style={{ marginBottom: '5px' }}
                                required
                            >
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <Form.Item
                                        name="email"
                                        noStyle
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập email!' },
                                            { type: 'email', message: 'Email không hợp lệ!' }
                                        ]}
                                    >
                                        <Input placeholder="abc@gmail.com" />
                                    </Form.Item>
                                    <Button 
                                        type="primary" 
                                        onClick={handleSendOtp} 
                                        disabled={countdown > 0}
                                        loading={isSendingOtp}
                                        style={{ minWidth: "90px" }}
                                    >
                                        {countdown > 0 ? `${countdown}s` : "Gửi mã"}
                                    </Button>
                                </div>
                            </Form.Item>

                            <Form.Item
                                label="Mã xác thực (OTP)"
                                name="otp"
                                rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
                                style={{ marginBottom: '5px' }}
                            >
                                <Input placeholder="Nhập mã 6 chữ số từ email" maxLength={6} />
                            </Form.Item>

                            <Form.Item
                                label="Mật khẩu"
                                name="password"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                                    { min: 6, message: 'Mật khẩu phải có tối thiểu 6 ký tự' }
                                ]}
                                style={{ marginBottom: '5px' }}
                            >
                                <Input.Password />
                            </Form.Item>

                            <Form.Item
                                label="Nhập lại mật khẩu"
                                name="confirmPassword"
                                rules={[{ required: true, message: 'Vui lòng nhập lại mật khẩu' }]}
                                style={{ marginBottom: '10px' }}
                            >
                                <Input.Password />
                            </Form.Item>
                            {isError && <div style={{ color: "red" }}>{mutation.error?.response?.data?.message || "Đăng ký thất bại"}</div>}
                            <Form.Item name="remember" valuePropName="checked" label={null}>
                                <Checkbox>Remember me</Checkbox>
                            </Form.Item>

                            <Form.Item label={null}>
                                <LoadingComponent isPending={isPending}>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        width="100%"
                                        style={{ width: "100%" }}
                                    >
                                        {isPending ? "...đang đăng ký" : "Đăng ký"}
                                    </Button>
                                </LoadingComponent>
                            </Form.Item>
                            <div style={{ fontSize: "14px" }}>
                                Bạn đã có tài khoản?
                                <span onClick={handleSignIn} style={{ color: "#1677ff", cursor: "pointer" }}> Đăng nhập</span>
                            </div>
                        </Form>
                    </div>
                    <div style={{ width: "300px", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "rgb(222, 235, 255)" }}>
                        <Image
                            src={SignInImg}
                            alt="Sign In"
                            style={{ width: "200px", height: "200px" }}
                            preview={false}

                        />
                    </div>
                </WrapperSignInPage>
            </div>
        </WrapperSignInContainer>
    );
}
export default SignUpPage;