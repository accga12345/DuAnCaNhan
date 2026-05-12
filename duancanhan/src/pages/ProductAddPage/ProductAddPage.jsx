import { Button, Form, Input, InputNumber, Space } from 'antd';
import { useMutationHook } from "../../hooks/useMutationHook";
import { showSuccess, showError } from "../../components/MessageComponent/MessageComponent";
import { createProduct } from "../../services/ProductService";
import { getAllCategories } from "../../services/CategoryService";
import { getAllSuppliers } from "../../services/SupplierService";
import { getAllWarehouseItems } from "../../services/WarehouseService";
import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { getBase64 } from '../../ultil';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { Upload, Select, Modal } from 'antd';
import { useQuery } from '@tanstack/react-query';

function ProductAddPage() {
    const [form] = Form.useForm();
    const [selectedCategoryBrands, setSelectedCategoryBrands] = useState([]);
    const [maxStock, setMaxStock] = useState(1000000);
    const user = useSelector((state) => state.user);

    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: () => getAllCategories(),
        refetchOnWindowFocus: false,
    });
    const { data: suppliersData } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => getAllSuppliers(),
        refetchOnWindowFocus: false,
    });
    const { data: warehouseData } = useQuery({
        queryKey: ['warehouseItems'],
        queryFn: () => getAllWarehouseItems(),
        refetchOnWindowFocus: false,
    });

    const mutation = useMutationHook(
        data => createProduct(data, user.accessToken)
    );

    const { isSuccess, isError, isPending, data } = mutation;

    const onFinish = (values) => {
        if (values.countInStock > maxStock) {
            showError(`Số lượng không được vượt quá tồn kho (${maxStock})`);
            return;
        }

        mutation.mutate({
            warehouseItem: values.warehouseItem,
            name: values.name,
            image: form.getFieldValue("image"),
            images: form.getFieldValue("images"),

            category: values.category,
            brand: values.brand,
            supplier: values.supplier,
            price: values.price,
            description: values.description, // Required by Backend
            countInStock: values.countInStock, // Required by Backend
            discount: values.discount,
            specifications: values.specifications,
        });
    };

    useEffect(() => {
        if (isSuccess && data?.status !== 'error') {
            showSuccess(data.message || "Thêm sản phẩm thành công");
            form.resetFields();
            setFileList([]);
            setFileListImages([]);
            setMaxStock(1000000);
        } else if (isSuccess && data?.status === 'error') {
            showError(data.message);
        }

        if (isError) {
            showError(mutation.error?.response?.data?.message || "Thêm sản phẩm thất bại");
        }
    }, [isSuccess, isError, data, form, mutation.error]);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [fileList, setFileList] = useState([]);
    const [fileListImages, setFileListImages] = useState([]);

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
            form.setFieldsValue({ image: base64 });
        }
        setFileList(newFileList.slice(-1));
    };

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
        <div style={{ padding: '20px' }}>
            <h2>Thêm sản phẩm</h2>
            <Form
                name="basic"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                style={{ maxWidth: 800 }}
                initialValues={{ price: 1000, countInStock: 1, discount: 0 }}
                onFinish={onFinish}
                autoComplete="off"
                form={form}
            >
                <Form.Item
                    label="Chọn hàng từ kho"
                    name="warehouseItem"
                    rules={[{ required: true, message: 'Vui lòng chọn hàng từ kho!' }]}
                >
                    <Select
                        placeholder="Chọn sản phẩm trong kho"
                        options={warehouseData?.data?.map((item) => ({
                            value: item._id,
                            label: `${item.name} (Tồn: ${item.quantity})`,
                        }))}
                        onChange={(value) => {
                            const item = warehouseData?.data?.find(i => i._id === value);
                            if (item) {
                                form.setFieldsValue({
                                    name: item.name,
                                    category: item.category?._id,
                                    brand: item.brand,
                                    supplier: item.supplier?._id,
                                    countInStock: item.quantity
                                });
                                setMaxStock(item.quantity);
                                const category = categoriesData?.data?.find(c => c._id === item.category?._id);
                                setSelectedCategoryBrands(category?.brands || []);
                            }
                        }}
                    />
                </Form.Item>

                <Form.Item label="Tên hiển thị web" name="name" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>

                <Form.Item label="Số lượng đưa lên Page" name="countInStock" rules={[{ required: true }]}>
                    <InputNumber min={0} max={maxStock} style={{ width: '100%' }} placeholder={`Tối đa ${maxStock}`} />
                </Form.Item>

                <Form.Item label="Giá bán" name="price" rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>

                <Form.Item label="Danh mục" name="category" rules={[{ required: true }]}>
                    <Select
                        placeholder="Chọn danh mục"
                        options={categoriesData?.data?.map((item) => ({ value: item._id, label: item.name }))}
                        onChange={(value) => {
                            const category = categoriesData?.data?.find(item => item._id === value);
                            setSelectedCategoryBrands(category?.brands || []);
                            form.setFieldsValue({ brand: undefined });
                        }}
                    />
                </Form.Item>

                <Form.Item label="Hãng" name="brand" rules={[{ required: true }]}>
                    <Select
                        placeholder="Chọn hãng"
                        options={selectedCategoryBrands.map((brand) => ({
                            value: typeof brand === 'string' ? brand : brand?.name,
                            label: typeof brand === 'string' ? brand : brand?.name,
                        }))}
                    />
                </Form.Item>

                <Form.Item label="Nhà cung cấp" name="supplier">
                    <Select
                        placeholder="Chọn nhà cung cấp"
                        options={suppliersData?.data?.map((item) => ({ value: item._id, label: item.name }))}
                    />
                </Form.Item>

                <Form.Item label="Hình ảnh chính" name="image">
                    <Upload listType="picture-circle" fileList={fileList} onPreview={handlePreview} onChange={handleChangeImage} beforeUpload={() => false}>
                        {fileList.length >= 1 ? null : uploadButton}
                    </Upload>
                </Form.Item>

                <Form.Item label="Hình ảnh chi tiết" name="images">
                    <Upload listType="picture-card" fileList={fileListImages} onPreview={handlePreview} onChange={handleChangeImages} beforeUpload={() => false}>
                        {fileListImages.length >= 8 ? null : uploadButton}
                    </Upload>
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                    <Input.TextArea rows={4} />
                </Form.Item>

                <Form.Item label="Thông số kỹ thuật" wrapperCol={{ span: 16 }}>
                    <Form.List name="specifications">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        <Form.Item {...restField} name={[name, 'key']} rules={[{ required: true, message: 'Nhập tên thông số' }]}>
                                            <Input placeholder="Tên (VD: RAM)" />
                                        </Form.Item>
                                        <Form.Item {...restField} name={[name, 'value']} rules={[{ required: true, message: 'Nhập giá trị' }]}>
                                            <Input placeholder="Giá trị (VD: 8GB)" />
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm thông số</Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form.Item>

                <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                    <Button type="primary" htmlType="submit" loading={isPending}>
                        Đưa sản phẩm lên Page
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}

export default ProductAddPage;