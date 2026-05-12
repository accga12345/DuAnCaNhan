import React, { useEffect } from 'react';
import { Button, Form, Input } from 'antd';
import { useMutationHook } from "../../hooks/useMutationHook";
import { showSuccess, showError } from "../../components/MessageComponent/MessageComponent";
import { createSupplier } from "../../services/SupplierService";
import { useSelector } from 'react-redux';

function SupplierAddPage() {
    const user = useSelector((state) => state.user);
    const [form] = Form.useForm();
    
    const mutation = useMutationHook(
        (data) => createSupplier(data, user?.accessToken)
    );

    const { isSuccess, isError, isPending, data } = mutation;

    const onFinish = (values) => {
        mutation.mutate(values);
    };

    useEffect(() => {
        if (isSuccess && data?.status === "success") {
            showSuccess(data?.message || "Thêm nhà cung cấp thành công");
            form.resetFields();
        } else if (isSuccess && data?.status === 'error') {
            showError(data?.message || "Thêm nhà cung cấp thất bại");
        }

        if (isError) {
            showError("Có lỗi xảy ra, vui lòng thử lại sau.");
        }
    }, [isSuccess, isError, data, form]);

    return (
        <div>
            <h2>Thêm Nhà cung cấp mới</h2>
            <Form
                name="supplier_add"
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                style={{ maxWidth: 600, marginTop: '20px' }}
                onFinish={onFinish}
                form={form}
                autoComplete="off"
            >
                <Form.Item
                    label="Tên nhà cung cấp"
                    name="name"
                    rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp!' }]}
                >
                    <Input placeholder="Ví dụ: Công ty Digiworld" />
                </Form.Item>

                <Form.Item
                    label="Số điện thoại"
                    name="phone"
                >
                    <Input placeholder="Ví dụ: 0912345678" />
                </Form.Item>

                <Form.Item
                    label="Email"
                    name="email"
                    rules={[{ type: 'email', message: 'Email không hợp lệ!' }]}
                >
                    <Input placeholder="Ví dụ: contact@digiworld.com.vn" />
                </Form.Item>

                <Form.Item
                    label="Địa chỉ"
                    name="address"
                >
                    <Input placeholder="Ví dụ: Quận 1, TP. HCM" />
                </Form.Item>

                <Form.Item
                    label="Ghi chú"
                    name="description"
                >
                    <Input.TextArea rows={4} placeholder="Thông tin thêm về đối tác..." />
                </Form.Item>

                <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
                    <Button type="primary" htmlType="submit" loading={isPending}>
                        Thêm mới
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}

export default SupplierAddPage;
