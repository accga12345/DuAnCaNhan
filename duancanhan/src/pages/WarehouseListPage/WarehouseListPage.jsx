import React, { useState, useEffect } from 'react';
import { Space, Button, Modal, Form, Input, InputNumber, Select, Popconfirm } from 'antd';
import { getAllWarehouseItems, deleteWarehouseItem, getDetailWarehouseItem, updateWarehouseItem } from '../../services/WarehouseService';
import { getAllCategories } from '../../services/CategoryService';
import { getAllSuppliers } from '../../services/SupplierService';
import { useQuery } from '@tanstack/react-query';
import TableComponent from '../../components/TableComponent/TableComponent';
import { showSuccess, showError } from '../../components/MessageComponent/MessageComponent';
import { useMutationHook } from '../../hooks/useMutationHook';
import { useSelector } from 'react-redux';
import LoadingComponent from '../../components/Loading/LoadingComponent';

function WarehouseListPage() {
    const [form] = Form.useForm();
    const [itemDetail, setItemDetail] = useState({});
    const user = useSelector((state) => state.user);
    const [openModal, setOpenModal] = useState(false);
    
    const { data: items, isPending: itemsLoading, refetch } = useQuery({
        queryKey: ['warehouseItems'],
        queryFn: () => getAllWarehouseItems(),
    });

    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: () => getAllCategories(),
    });

    const { data: suppliersData } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => getAllSuppliers(),
    });

    const handleGetDetailItem = async (id) => {
        const res = await getDetailWarehouseItem(id);
        setItemDetail(res.data);
    };

    useEffect(() => {
        if (itemDetail && Object.keys(itemDetail).length > 0) {
            form.setFieldsValue({
                name: itemDetail.name,
                category: itemDetail.category?._id,
                brand: itemDetail.brand,
                supplier: itemDetail.supplier?._id,
                quantity: itemDetail.quantity,
                costPrice: itemDetail.costPrice,
            });
        }
    }, [itemDetail, form]);

    const mutationUpdate = useMutationHook(
        (data) => updateWarehouseItem(itemDetail._id, data, user.accessToken)
    );

    const { data: updateData, isSuccess: updateSuccess, isPending: updateLoading } = mutationUpdate;

    const onUpdate = (values) => {
        mutationUpdate.mutate(values);
    };

    useEffect(() => {
        if (updateSuccess && updateData?.status === "success") {
            showSuccess(updateData?.message || "Cập nhật kho thành công");
            setOpenModal(false);
            refetch();
        } else if (updateData?.status === "error") {
            showError(updateData?.message || "Cập nhật thất bại");
        }
    }, [updateSuccess, updateData, refetch]);

    const mutationDelete = useMutationHook(
        (id) => deleteWarehouseItem(id, user.accessToken)
    );

    const handleDelete = (id) => {
        mutationDelete.mutate(id);
    };

    const { data: deleteData, isSuccess: deleteSuccess, isPending: deleteLoading } = mutationDelete;

    useEffect(() => {
        if (deleteSuccess && deleteData?.status === "success") {
            showSuccess(deleteData?.message || "Xóa thành công");
            refetch();
        }
    }, [deleteSuccess, deleteData, refetch]);

    const showModal = (id) => {
        setOpenModal(true);
        handleGetDetailItem(id);
    };

    const columns = [
        {
            title: 'Tên sản phẩm (Kho)',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name?.localeCompare(b.name),
        },
        {
            title: 'Danh mục',
            dataIndex: ['category', 'name'],
            key: 'category',
        },
        {
            title: 'Hãng',
            dataIndex: 'brand',
            key: 'brand',
        },
        {
            title: 'Tồn kho',
            dataIndex: 'quantity',
            key: 'quantity',
            sorter: (a, b) => a.quantity - b.quantity,
        },
        {
            title: 'Giá nhập',
            dataIndex: 'costPrice',
            key: 'costPrice',
            render: (price) => price?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
        },
        {
            title: 'Nhà cung cấp',
            dataIndex: ['supplier', 'name'],
            key: 'supplier',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" onClick={() => showModal(record._id)}>Sửa</Button>
                    <Popconfirm
                        title="Xóa hàng khỏi kho?"
                        onConfirm={() => handleDelete(record._id)}
                    >
                        <Button type="primary" danger>Xóa</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <h2 style={{ marginTop: '20px' }}>Tồn kho nội bộ</h2>
            <LoadingComponent isPending={itemsLoading || updateLoading || deleteLoading}>
                <TableComponent
                    columns={columns}
                    data={items?.data}
                    rowKey="_id"
                />
            </LoadingComponent>
            <Modal
                title="Sửa thông tin kho"
                open={openModal}
                onCancel={() => setOpenModal(false)}
                onOk={() => form.submit()}
                width={700}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onUpdate}
                >
                    <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Số lượng" name="quantity" rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Giá nhập" name="costPrice" rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Danh mục" name="category">
                        <Select
                            options={categoriesData?.data?.map(c => ({ value: c._id, label: c.name }))}
                        />
                    </Form.Item>
                    <Form.Item label="Nhà cung cấp" name="supplier">
                        <Select
                            options={suppliersData?.data?.map(s => ({ value: s._id, label: s.name }))}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default WarehouseListPage;
