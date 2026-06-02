import { Button, Form, Input, Upload, Select, Space } from 'antd';
import { useMutationHook } from "../../hooks/useMutationHook";
import { showSuccess, showError } from "../../components/MessageComponent/MessageComponent";
import { registerUser, sendOtp } from "../../services/UserServices";
import { useState, useEffect } from 'react';
import { getBase64 } from '../../ultil';
import { PlusOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';

function UserAddPage() {
    const user = useSelector((state) => state.user);
    const [form] = Form.useForm();
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const mutation = useMutationHook(
        data => {
            const { type, ...rest } = data;
            // Map type '1' (Nhân viên) to isEmployee: true
            const userData = {
                ...rest,
                isEmployee: type === '1'
            };
            return registerUser(userData);
        }
    );

    const { isSuccess, isError, isPending, data } = mutation;

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleSendOtp = async () => {
        try {
            const email = form.getFieldValue("email");
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !regex.test(email)) {
                showError("Vui lòng nhập email hợp lệ trước khi gửi mã!");
                return;
            }
            setIsSendingOtp(true);
            const res = await sendOtp({ email });
            if (res.status === "success" || res.status === "OK") {
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
            name: values.name,
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
            phone: values.phone,
            address: values.address,
            avatar: form.getFieldValue("avatar"),
            type: values.type,
            otp: values.otp,
        });
    };

    useEffect(() => {
        if (isSuccess && data) {
            if (data.status === 'ERR') {
                showError(data.message);
            } else {
                showSuccess(data.message || "Tạo tài khoản thành công");
                form.resetFields();
                setFileList([]);
                setPreviewImage('');
                setCountdown(0);
            }
        }

        if (isError) {
            showError(
                mutation.error?.response?.data?.message || "Tạo tài khoản thất bại"
            );
        }
    }, [isSuccess, isError, data, form, mutation.error]);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [fileList, setFileList] = useState([]);


    const handlePreview = async file => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
    };

    const handleChangeImage = async ({ file, fileList: newFileList }) => {
        const realFile = file.originFileObj || file;

        if (realFile instanceof Blob) {
            const base64 = await getBase64(realFile);
            form.setFieldsValue({ avatar: base64 });
        }
        setFileList(newFileList.slice(-1)); // Only keep the last file
    };


    const uploadButton = (
        <button style={{ border: 0, background: 'none' }} type="button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
        </button>
    );

    return (
        <div>
            <h2>Thêm người dùng</h2>
            <Form
                name="user_add"
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                style={{ maxWidth: 600 }}
                initialValues={{ remember: true, type: '2' }}
                onFinish={onFinish}
                form={form}
                autoComplete="off"
            >
                <Form.Item
                    label="Tên người dùng"
                    name="name"
                    rules={[{ required: true, message: 'Please input user name!' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Email"
                    required
                >
                    <Space.Compact style={{ width: '100%' }}>
                        <Form.Item
                            name="email"
                            noStyle
                            rules={[
                                { required: true, message: 'Please input email!' },
                                { type: 'email', message: 'The input is not valid E-mail!' }
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
                    </Space.Compact>
                </Form.Item>

                <Form.Item
                    label="Mã xác thực (OTP)"
                    name="otp"
                    rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
                >
                    <Input placeholder="Nhập mã 6 chữ số từ email" maxLength={6} />
                </Form.Item>

                <Form.Item
                    label="Mật khẩu"
                    name="password"
                    rules={[
                        { required: true, message: 'Please input password!' },
                        { min: 6, message: 'Mật khẩu phải có tối thiểu 6 ký tự' }
                    ]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item
                    label="Xác nhận mật khẩu"
                    name="confirmPassword"
                    rules={[
                        { required: true, message: 'Please confirm your password!' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('The two passwords that you entered do not match!'));
                            },
                        }),
                    ]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item
                    label="Số điện thoại"
                    name="phone"
                    rules={[
                        { required: true, message: 'Vui lòng nhập số điện thoại' },
                        { len: 10, message: 'Số điện thoại phải có đúng 10 chữ số' },
                        { pattern: /^[0-9]+$/, message: 'Số điện thoại chỉ được chứa chữ số' }
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Địa chỉ"
                    name="address"
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Avatar"
                    name="avatar"
                >
                    <Upload
                        listType="picture-circle"
                        onPreview={handlePreview}
                        onChange={handleChangeImage}
                        beforeUpload={() => false}
                        onRemove={() => {
                            setFileList([]);
                        }}
                        fileList={fileList}
                        maxCount={1}
                    >
                        {fileList.length >= 1 ? null : uploadButton}
                    </Upload>
                </Form.Item>
                {previewImage && (
                    <img src={previewImage} alt="avatar" style={{ maxWidth: '100%', maxHeight: '200px', display: 'none' }} />
                )}

                <Form.Item
                    label="Loại tài khoản"
                    name="type"
                    rules={[{ required: true, message: 'Please select user type!' }]}
                >
                    <Select placeholder="Chọn loại tài khoản">
                        <Select.Option value="1">Nhân viên</Select.Option>
                        <Select.Option value="2">Khách hàng</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
                    <Button type="primary" htmlType="submit">
                        Submit
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}

export default UserAddPage;