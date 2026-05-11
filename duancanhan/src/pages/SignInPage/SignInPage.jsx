import React from "react";
import { WrapperSignInPage, WrapperSignInContainer, WrapperTextCreateAccount, WrapperExitPage } from "./style";
import { Image } from 'antd';
import SignInImg from "../../assets/images/SignIn.png"
import { Button, Checkbox, Form, Input } from 'antd';
import { useNavigate } from "react-router-dom";
import { loginUser, getDetailUser, loginEmployee, getDetailEmployee } from "../../services/UserServices";
import { useMutationHook } from "../../hooks/useMutationHook";
import LoadingComponent from "../../components/Loading/LoadingComponent";
import { useEffect } from "react";
import { showSuccess, showError } from "../../components/MessageComponent/MessageComponent";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import { updateUser } from "../../redux/slides/userSlide";

function SignInPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const mutation = useMutationHook(
        async data => {
            try {
                return await loginUser(data);
            } catch (err) {
                try {
                    return await loginEmployee(data);
                } catch (err2) {
                    throw err;
                }
            }
        }
    );

    const { isSuccess, isError, isPending, data } = mutation;

    useEffect(() => {
        if (isSuccess && data) {
            showSuccess(data.message);
            localStorage.setItem("access_token", JSON.stringify(data.accessToken));
            console.log("data", data.accessToken);
            if (data?.accessToken) {
                const decodedToken = jwtDecode(data.accessToken);
                if (decodedToken.id) {
                    if (decodedToken.isEmployee) {
                        handlegetDetailEmployee(decodedToken.id, data.accessToken);
                    } else {
                        handlegetDetailUser(decodedToken.id, data.accessToken);
                    }
                }
            }
            setTimeout(() => {
                navigate("/");
            }, 500);
        }

        if (isError) {
            showError(
                mutation.error?.response?.data?.message || "Đăng nhập thất bại"
            );
        }
    }, [isSuccess, isError]);



    const handlegetDetailUser = async (id, accessToken) => {
        const res = await getDetailUser(id, accessToken);
        console.log("res", res);
        dispatch(updateUser({ ...res.data, accessToken }));
    }

    const handlegetDetailEmployee = async (id, accessToken) => {
        const res = await getDetailEmployee(id, accessToken);
        console.log("res emp", res);
        dispatch(updateUser({ ...res.data, accessToken }));
    }

    const onFinish = (data) => {
        mutation.mutate({
            email: data.email,
            password: data.password
        });
    };

    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    }
    const handleSignUp = () => {
        navigate("/signup");
    }

    return (
        <WrapperSignInContainer>
            <div style={{ position: "relative" }}>
                <WrapperExitPage>X</WrapperExitPage>
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
                            <WrapperTextCreateAccount>Đăng nhập hoặc Tạo tài khoản</WrapperTextCreateAccount>
                            <Form.Item
                                label="Email"
                                name="email"
                                placeholder="abc@gmail.com"
                                rules={[{ required: true, message: 'Please input your username!' }]}
                                style={{ marginBottom: '5px' }}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item
                                label="Mật khẩu"
                                name="password"
                                rules={[{ required: true, message: 'Please input your password!' }]}
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
                                        disabled={isPending}
                                        style={{ width: "100%" }}
                                    >
                                        {isPending ? "Đang đăng nhập..." : "Đăng Nhập"}
                                    </Button>
                                </LoadingComponent>
                            </Form.Item>


                            <span style={{ color: "#1677ff", cursor: "pointer", fontSize: "14px" }}> Quên mật khẩu</span>
                            <div style={{ fontSize: "14px" }}>
                                Bạn chưa có tài khoản?
                                <span onClick={handleSignUp} style={{ color: "#1677ff", cursor: "pointer" }}> Đăng ký</span>
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
export default SignInPage;