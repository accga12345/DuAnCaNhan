import React, { useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, Select } from 'antd';
import { useMutationHook } from "../../hooks/useMutationHook";
import { showSuccess, showError } from "../../components/MessageComponent/MessageComponent";
import { createWarehouseItem } from "../../services/WarehouseService";
import { getAllCategories } from "../../services/CategoryService";
import { getAllSuppliers } from "../../services/SupplierService";
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

function WarehouseAddPage() {
    const user = useSelector((state) => state.user);
    const [form] = Form.useForm();
    const [selectedCategoryBrands, setSelectedCategoryBrands] = useState([]);
    
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: () => getAllCategories(),
    });

    const { data: suppliersData } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => getAllSuppliers(),
    });

    const mutation = useMutationHook(
        (data) => createWarehouseItem(data, user?.accessToken)
    );

    const { isSuccess, isError, isPending, data } = mutation;

    const onFinish = (values) => {
        mutation.mutate(values);
    };

    useEffect(() => {
        if (isSuccess && data?.status === "success") {
            showSuccess(data?.message || "Nhập kho thành công");
            form.resetFields();
        } else if (isSuccess && data?.status === 'error') {
            showError(data?.message || "Nhập kho thất bại");
        }

        if (isError) {
            showError("Có lỗi xảy ra, vui lòng thử lại sau.");
        }
    }, [isSuccess, isError, data, form]);

    return (
        <div>
            <h2>Nhập hàng vào kho (Internal)</h2>
            <Form
                name="warehouse_add"
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                style={{ maxWidth: 800, marginTop: '20px' }}
                onFinish={onFinish}
                form={form}
                autoComplete="off"
            >
                <Form.Item
                    label="Tên sản phẩm (Kho)"
                    name="name"
                    rules={[{ required: true, message: 'Vui lòng nhập tên hàng hóa!' }]}
                >
                    <Input placeholder="Ví dụ: Laptop MSI Katana GF66" />
                </Form.Item>

                <Form.Item
                    label="Danh mục"
                    name="category"
                    rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
                >
                    <Select
                        showSearch
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        placeholder="Chọn danh mục"
                        options={categoriesData?.data?.map((item) => ({
                            value: item._id,
                            label: item.name,
                        }))}
                        onChange={(value) => {
                            const category = categoriesData?.data?.find(item => item._id === value);
                            setSelectedCategoryBrands(category?.brands || []);
                            form.setFieldsValue({ brand: undefined });
                        }}
                    />
                </Form.Item>

                <Form.Item
                    label="Thương hiệu (Hãng)"
                    name="brand"
                    rules={[{ required: true, message: 'Vui lòng chọn thương hiệu!' }]}
                >
                    <Select
                        showSearch
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        placeholder="Chọn hãng"
                        options={selectedCategoryBrands.map((brand) => ({
                            value: typeof brand === 'string' ? brand : brand?.name,
                            label: typeof brand === 'string' ? brand : brand?.name,
                        }))}
                        disabled={!selectedCategoryBrands.length}
                    />
                </Form.Item>

                <Form.Item
                    label="Nhà cung cấp"
                    name="supplier"
                >
                    <Select
                        showSearch
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        placeholder="Chọn nhà cung cấp"
                        options={suppliersData?.data?.map((item) => ({
                            value: item._id,
                            label: item.name,
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    label="Số lượng nhập"
                    name="quantity"
                    rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
                >
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    label="Giá nhập (Cost Price)"
                    name="costPrice"
                    rules={[{ required: true, message: 'Vui lòng nhập giá nhập!' }]}
                >
                    <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                    />
                </Form.Item>

                <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
                    <Button type="primary" htmlType="submit" loading={isPending}>
                        Lưu vào kho
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}

export default WarehouseAddPage;
