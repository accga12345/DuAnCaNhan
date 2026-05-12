import React, { useRef, useState, useEffect } from 'react';
import { Space, Button, Modal, Form, Input, Popconfirm } from 'antd';
import { getAllSuppliers, deleteSupplier, getDetailSupplier, updateSupplier } from '../../services/SupplierService';
import { useQuery } from '@tanstack/react-query';
import TableComponent from '../../components/TableComponent/TableComponent';
import { showSuccess, showError } from '../../components/MessageComponent/MessageComponent';
import { useMutationHook } from '../../hooks/useMutationHook';
import { useSelector } from 'react-redux';
import LoadingComponent from '../../components/Loading/LoadingComponent';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';

function SupplierListPage() {
    const [form] = Form.useForm();
    const [supplierDetail, setSupplierDetail] = useState({});
    const user = useSelector((state) => state.user);
    const [openModal, setOpenModal] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef(null);

    const { data: suppliers, isPending: suppliersLoading, refetch } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => getAllSuppliers(),
    });

    const [editing, setEditing] = useState({
        name: false,
        phone: false,
        email: false,
        address: false,
        description: false,
    });

    const handleGetDetailSupplier = async (id) => {
        const res = await getDetailSupplier(id);
        setSupplierDetail(res.data);
    };

    useEffect(() => {
        if (supplierDetail && Object.keys(supplierDetail).length > 0) {
            form.setFieldsValue({
                name: supplierDetail.name,
                phone: supplierDetail.phone,
                email: supplierDetail.email,
                address: supplierDetail.address,
                description: supplierDetail.description,
            });
        }
    }, [supplierDetail, form]);

    const mutationUpdate = useMutationHook(
        (data) => updateSupplier(supplierDetail._id, data, user.accessToken)
    );

    const { data: updateData, isSuccess: updateSuccess, isPending: updateLoading } = mutationUpdate;

    const updateField = (field) => {
        const value = form.getFieldValue(field);
        mutationUpdate.mutate({ [field]: value });
        setEditing({ ...editing, [field]: false });
    };

    useEffect(() => {
        if (updateSuccess && updateData?.status === "success") {
            showSuccess(updateData?.message || "Cập nhật thành công");
            setOpenModal(false);
            refetch();
        } else if (updateData?.status === "error") {
            showError(updateData?.message || "Cập nhật thất bại");
        }
    }, [updateSuccess, updateData, refetch]);

    const mutationDelete = useMutationHook(
        (id) => deleteSupplier(id, user.accessToken)
    );

    const handleDelete = (id) => {
        mutationDelete.mutate(id);
    };

    const { data: deleteData, isSuccess: deleteSuccess, isPending: deleteLoading } = mutationDelete;

    useEffect(() => {
        if (deleteSuccess && deleteData?.status === "success") {
            showSuccess(deleteData?.message || "Xóa thành công");
            setOpenModal(false);
            refetch();
        } else if (deleteData?.status === "error") {
             showError(deleteData?.message || "Xóa thất bại");
        }
    }, [deleteSuccess, deleteData, refetch]);

    const showModal = (id) => {
        setOpenModal(true);
        form.resetFields();
        handleGetDetailSupplier(id);
    };

    const handleCancel = () => {
        setOpenModal(false);
    };

    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const handleReset = clearFilters => {
        clearFilters();
        setSearchText('');
    };

    const getColumnSearchProps = dataIndex => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }} onKeyDown={e => e.stopPropagation()}>
                <Input
                    ref={searchInput}
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Search
                    </Button>
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters)}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Reset
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
        onFilter: (value, record) =>
            record[dataIndex]?.toString().toLowerCase().includes(value?.toLowerCase() || ''),
        render: text =>
            searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={text ? text.toString() : ''}
                />
            ) : (
                text
            ),
    });

    const columns = [
        {
            title: 'Tên nhà cung cấp',
            dataIndex: 'name',
            key: 'name',
            ...getColumnSearchProps('name'),
            sorter: (a, b) => a.name?.localeCompare(b.name),
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" onClick={() => showModal(record._id)}>Sửa</Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa nhà cung cấp này?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button type="primary" danger>Xóa</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <h2 style={{ marginTop: '20px' }}>Danh sách nhà cung cấp</h2>
            <LoadingComponent isPending={suppliersLoading || updateLoading || deleteLoading}>
                <TableComponent
                    columns={columns}
                    data={suppliers?.data}
                    rowKey="_id"
                    pagination={{ pageSize: 8 }}
                />
            </LoadingComponent>
            <Modal
                title="Sửa thông tin nhà cung cấp"
                open={openModal}
                onCancel={handleCancel}
                footer={null}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item label="Tên nhà cung cấp" name="name" style={{ flex: 1, marginBottom: 0 }}>
                            <Input disabled={!editing.name} />
                        </Form.Item>
                        <Button type={editing.name ? "primary" : "default"} onClick={() =>
                            editing.name
                                ? updateField("name")
                                : setEditing({ ...editing, name: true })
                        }>
                            {editing.name ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item label="Số điện thoại" name="phone" style={{ flex: 1, marginBottom: 0 }}>
                            <Input disabled={!editing.phone} />
                        </Form.Item>
                        <Button type={editing.phone ? "primary" : "default"} onClick={() =>
                            editing.phone
                                ? updateField("phone")
                                : setEditing({ ...editing, phone: true })
                        }>
                            {editing.phone ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item label="Email" name="email" style={{ flex: 1, marginBottom: 0 }}>
                            <Input disabled={!editing.email} />
                        </Form.Item>
                        <Button type={editing.email ? "primary" : "default"} onClick={() =>
                            editing.email
                                ? updateField("email")
                                : setEditing({ ...editing, email: true })
                        }>
                            {editing.email ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item label="Địa chỉ" name="address" style={{ flex: 1, marginBottom: 0 }}>
                            <Input disabled={!editing.address} />
                        </Form.Item>
                        <Button type={editing.address ? "primary" : "default"} onClick={() =>
                            editing.address
                                ? updateField("address")
                                : setEditing({ ...editing, address: true })
                        }>
                            {editing.address ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item label="Ghi chú" name="description" style={{ flex: 1, marginBottom: 0 }}>
                            <Input.TextArea disabled={!editing.description} />
                        </Form.Item>
                        <Button type={editing.description ? "primary" : "default"} onClick={() =>
                            editing.description
                                ? updateField("description")
                                : setEditing({ ...editing, description: true })
                        }>
                            {editing.description ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}

export default SupplierListPage;
