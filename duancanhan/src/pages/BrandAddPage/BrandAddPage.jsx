import React, { useEffect } from 'react';
import { Button, Form, Input } from 'antd';
import { useMutationHook } from "../../hooks/useMutationHook";
import { showSuccess, showError } from "../../components/MessageComponent/MessageComponent";
import { createBrand } from "../../services/BrandService";
import { useSelector } from 'react-redux';
import { useState } from 'react';
import { getBase64 } from '../../ultil';
import { PlusOutlined } from '@ant-design/icons';
import { Upload, Modal } from 'antd';

function BrandAddPage() {
    const user = useSelector((state) => state.user);
    const [form] = Form.useForm();
    
    const mutation = useMutationHook(
        (data) => createBrand(data, user?.accessToken)
    );

    const { isSuccess, isError, isPending, data } = mutation;

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
        if (!(realFile instanceof Blob)) return;
        const base64 = await getBase64(realFile);
        form.setFieldsValue({ image: base64 });
        setFileList(newFileList.slice(-1));
    };

    const onFinish = (values) => {
        mutation.mutate({
            name: values.name,
            image: form.getFieldValue("image"),
        });
    };

    useEffect(() => {
        if (isSuccess && data?.status === "success") {
            showSuccess(data?.message || "Thêm thương hiệu thành công");
            form.resetFields();
            setFileList([]);
        } else if (isSuccess && data?.status === 'error') {
            showError(data?.message || "Thêm thương hiệu thất bại");
        }

        if (isError) {
            showError("Có lỗi xảy ra, vui lòng thử lại sau.");
        }
    }, [isSuccess, isError, data, form]);

    return (
        <div>
            <h2>Thêm Thương hiệu mới</h2>
            <Form
                name="brand_add"
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                style={{ maxWidth: 600, marginTop: '20px' }}
                onFinish={onFinish}
                form={form}
                autoComplete="off"
            >
                <Form.Item
                    label="Tên thương hiệu"
                    name="name"
                    rules={[{ required: true, message: 'Vui lòng nhập tên thương hiệu!' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Logo / Hình ảnh"
                    name="image"
                >
                    <Upload
                        listType="picture-circle"
                        onPreview={handlePreview}
                        onChange={handleChangeImage}
                        beforeUpload={() => false}
                        onRemove={() => {
                            setFileList([]);
                            form.setFieldsValue({ image: "" });
                        }}
                        fileList={fileList}
                    >
                        {fileList.length >= 1 ? null : (
                            <button style={{ border: 0, background: 'none' }} type="button">
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </button>
                        )}
                    </Upload>
                </Form.Item>

                <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
                    <Button type="primary" htmlType="submit" loading={isPending}>
                        Thêm mới
                    </Button>
                </Form.Item>
            </Form>
            <Modal open={previewOpen} title="Xem hình ảnh" footer={null} onCancel={() => setPreviewOpen(false)}>
                <img alt="preview" style={{ width: '100%' }} src={previewImage} />
            </Modal>
        </div>
    );
}

export default BrandAddPage;
