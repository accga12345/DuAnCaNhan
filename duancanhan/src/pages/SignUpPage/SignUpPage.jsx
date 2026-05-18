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

    const mutation = useMutationHook(
        data => UserService.registerUser(data)
    );

    const { isSuccess, isError, isPending, data } = mutation;

    useEffect(() => {
        if (isSuccess && data) {
            showSuccess(data.message);

            setTimeout(() => {
                navigate("/signin");
            }, 500);
        }

        if (isError) {
            showError(
                mutation.error?.response?.data?.message || "Đăng nhập thất bại"
            );
        }
    }, [isSuccess, isError]);

    const onFinish = (values) => {
        mutation.mutate({
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword
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
                                name="email"
                                placeholder="abc@gmail.com"
                                rules={[{ required: true, message: 'Vui lòng nhập tài khoản' }]}
                                style={{ marginBottom: '5px' }}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item
                                label="Mật khẩu"
                                name="password"
                                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
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
                            {isError && <div style={{ color: "red" }}>{mutation.error.response.data.message}</div>}
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