import { Button, Checkbox, Form, Input, Upload } from 'antd';
import { useMutationHook } from "../../hooks/useMutationHook";
import { showSuccess, showError } from "../../components/MessageComponent/MessageComponent";
import { registerUser } from "../../services/UserServices";
import { useState, useEffect } from 'react';
import { getBase64 } from '../../ultil';
import { PlusOutlined } from '@ant-design/icons';

function UserAddPage() {
    const [form] = Form.useForm();
    const mutation = useMutationHook(
        data => registerUser(data)
    );

    const { isSuccess, isError, isPending, data } = mutation;

    const onFinish = (values) => {
        mutation.mutate({
            name: values.name,
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
            isAdmin: values.isAdmin || false,
            phone: values.phone,
            address: values.address,
            avatar: form.getFieldValue("avatar"),
        });
    };

    useEffect(() => {
        if (isSuccess && data) {
            showSuccess(data.message || "Tạo tài khoản thành công");
            form.resetFields();
            setFileList([]);
            setPreviewImage('');
        } else if (isSuccess && data?.status === 'ERR') {
            showError(data.message);
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
                initialValues={{ remember: true, isAdmin: false }}
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
                    name="email"
                    rules={[
                        { required: true, message: 'Please input email!' },
                        { type: 'email', message: 'The input is not valid E-mail!' }
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Mật khẩu"
                    name="password"
                    rules={[{ required: true, message: 'Please input password!' }]}
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
                    name="isAdmin"
                    valuePropName="checked"
                    wrapperCol={{ offset: 6, span: 18 }}
                >
                    <Checkbox>Is Admin</Checkbox>
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