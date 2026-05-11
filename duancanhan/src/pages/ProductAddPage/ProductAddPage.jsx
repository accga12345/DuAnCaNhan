import { Button, Checkbox, Form, Input, InputNumber, Space } from 'antd';
import { useMutationHook } from "../../hooks/useMutationHook";
import { showSuccess, showError } from "../../components/MessageComponent/MessageComponent";
import { createProduct } from "../../services/ProductService";
import { getAllCategories } from "../../services/CategoryService";
import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { getBase64 } from '../../ultil';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { Upload, Select, Modal } from 'antd';
import { useQuery } from '@tanstack/react-query';

function ProductAddPage() {
    const [form] = Form.useForm();
    const [newType, setNewType] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategoryBrands, setSelectedCategoryBrands] = useState([]);
    const user = useSelector((state) => state.user);
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: () => getAllCategories(),
        refetchOnWindowFocus: false,
    });
    const mutation = useMutationHook(
        data => createProduct(data, user.access_token)
    );

    const { isSuccess, isError, isPending, data } = mutation;

    const onFinish = (values) => {
        mutation.mutate({
            name: values.name,
            image: form.getFieldValue("image"),
            images: form.getFieldValue("images"),
            type: values.type,
            category: values.category,
            brand: values.brand,
            price: values.price,
            description: values.description,
            countInStock: values.countInStock,
            discount: values.discount,
            specifications: values.specifications,
        });
    };

    useEffect(() => {
        if (isSuccess && data) {
            showSuccess(data.message);
            form.resetFields();
            setFileList([]);
            setPreviewImage('');
        }

        if (isError) {
            showError(
                mutation.error?.response?.data?.message || "Thêm sản phẩm thất bại"
            );
        }
    }, [isSuccess, isError]);

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

    const [fileListImages, setFileListImages] = useState([]);
    const handleChangeImages = async ({ fileList: newFileList }) => {
        setFileListImages(newFileList);
        const imagesBase64 = await Promise.all(
            newFileList.map(async (file) => {
                if (file.url) return file.url;
                return await getBase64(file.originFileObj || file);
            })
        );
        form.setFieldsValue({ images: imagesBase64 });
    };


    const uploadButton = (
        <button style={{ border: 0, background: 'none' }} type="button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
        </button>
    );
    return (
        <div>
            <h2>Thêm sản phẩm</h2>
            <Form
                name="basic"
                labelCol={{
                    span: 8,
                }}
                wrapperCol={{
                    span: 16,
                }}
                style={{
                    maxWidth: 600,
                }}
                initialValues={{
                    price: 1,
                    countInStock: 1,
                    discount: 0,
                }}
                onFinish={onFinish}
                autoComplete="off"
                form={form}
            >
                <Form.Item
                    label="Tên sản phẩm"
                    name="name"
                    rules={[
                        {
                            required: true,
                            message: 'Tên sản phẩm không được để trống',
                        },
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Danh mục"
                    name="category"
                    rules={[
                        {
                            required: true,
                            message: 'Danh mục không được để trống',
                        },
                    ]}
                >
                    <Select
                        placeholder="Chọn danh mục"
                        options={categoriesData?.data?.map((item) => ({
                            value: item._id,
                            label: item.name,
                        }))}
                        onChange={(value, option) => {
                            form.setFieldsValue({ type: option.label, brand: undefined });
                            const category = categoriesData?.data?.find(item => item._id === value);
                            setSelectedCategoryBrands(category?.brands || []);
                        }}
                    />
                </Form.Item>

                <Form.Item
                    label="Hãng"
                    name="brand"
                    rules={[
                        {
                            required: true,
                            message: 'Hãng không được để trống',
                        },
                    ]}
                >
                    <Select
                        placeholder="Chọn hãng"
                        options={selectedCategoryBrands.map((brand) => ({
                            value: brand,
                            label: brand,
                        }))}
                        disabled={!selectedCategoryBrands.length}
                    />
                </Form.Item>

                <Form.Item name="type" hidden>
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Hình ảnh"
                    name="image"
                    wrapperCol={{ span: 16 }}
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
                    >
                        {uploadButton}
                    </Upload>
                </Form.Item>

                <Form.Item
                    label="Hình ảnh chi tiết"
                    name="images"
                    wrapperCol={{ span: 16 }}
                >
                    <Upload
                        listType="picture-card"
                        onPreview={handlePreview}
                        onChange={handleChangeImages}
                        beforeUpload={() => false}
                        fileList={fileListImages}
                        multiple
                    >
                        {fileListImages.length >= 8 ? null : uploadButton}
                    </Upload>
                </Form.Item>


                <Form.Item
                    label="Giá"
                    name="price"
                    rules={[
                        {
                            required: true,
                            message: 'Giá sản phẩm không được để trống',
                        },
                        {
                            type: 'number',
                            min: 1,
                            message: 'Giá sản phẩm phải lớn hơn 0',
                        }
                    ]}
                >
                    <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    label="Mô tả"
                    name="description"
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Số lượng"
                    name="countInStock"
                    rules={[
                        {
                            required: true,
                            message: 'Số lượng sản phẩm không được để trống',
                        },
                        {
                            type: 'number',
                            min: 0,
                            message: 'Số lượng sản phẩm phải lớn hơn 0',
                        }
                    ]}

                >
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    label="Giảm giá"
                    name="discount"
                    rules={[
                        {
                            type: 'number',
                            min: 0,
                            max: 100,
                            message: 'Giảm giá phải lớn hơn 0 và nhỏ hơn 100',
                        }
                    ]}
                >
                    <InputNumber min={0} max={100} addonAfter="%" style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item label="Thông số kỹ thuật" wrapperCol={{ span: 16 }}>
                    <Form.List name="specifications">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'key']}
                                            rules={[{ required: true, message: 'Nhập tên thông số' }]}
                                        >
                                            <Input placeholder="Tên thông số (VD: RAM)" />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'value']}
                                            rules={[{ required: true, message: 'Nhập giá trị' }]}
                                        >
                                            <Input placeholder="Giá trị (VD: 8GB)" />
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Thêm thông số
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form.Item>

                <Form.Item
                    wrapperCol={{
                        offset: 8,
                        span: 16,
                    }}
                >
                    <Button type="primary" htmlType="submit">
                        Submit
                    </Button>
                </Form.Item>
            </Form>
            <Modal
                title="Thêm loại mới"
                open={isModalOpen}
                onOk={() => {
                    if (!newType) return;

                    form.setFieldsValue({ type: newType });
                    setIsModalOpen(false);
                    setNewType("");
                }}
                onCancel={() => setIsModalOpen(false)}
            >
                <Input
                    placeholder="Nhập loại mới"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                />
            </Modal>
        </div>
    );
}

export default ProductAddPage;