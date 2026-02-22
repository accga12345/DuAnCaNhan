import React, { useRef } from 'react';
import { Button, Space, Modal, Form, Input, Upload, Image, Popconfirm } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getAllProduct, deleteProduct, updateProduct, deleteManyProduct } from '../../services/ProductService';
import { useState, useEffect } from 'react';
import TableComponent from '../../components/TableComponent/TableComponent';
import { getDetailProduct } from '../../services/ProductService';
import { useMutationHook } from '../../hooks/useMutationHook';
import { useSelector } from 'react-redux';
import { getBase64, exportExcel } from '../../ultil';
import { PlusOutlined } from '@ant-design/icons';
import { showSuccess } from "../../components/MessageComponent/MessageComponent";
import LoadingComponent from '../../components/Loading/LoadingComponent';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';

function ProductListPage() {
    const user = useSelector((state) => state.user);
    const [openModal, setOpenModal] = useState(false);
    const limit = 8;
    const [page, setPage] = useState(1);
    const [form] = Form.useForm();
    const [product, setProduct] = useState({});
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [fileList, setFileList] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef(null);

    const { data: products, isPending: productsLoading, refetch } = useQuery({
        queryKey: ['products', page],
        queryFn: () => getAllProduct(limit, page),
        refetchOnWindowFocus: false,
    });

    const [editing, setEditing] = useState({
        name: false,
        image: false,
        type: false,
        price: false,
        countInStock: false,
        selled: false,
    });
    const mutation = useMutationHook(
        (data) => updateProduct(product._id, data, user.access_token)
    );

    const { data: updateData, isSuccess: updateSuccess, isPending: updateLoading } = mutation

    const updateField = (field) => {
        const value = form.getFieldValue(field);
        mutation.mutate({ [field]: value });
        setEditing({ ...editing, [field]: false });
    };

    useEffect(() => {
        if (updateSuccess && updateData) {
            showSuccess(updateData.message);
            refetch();
            setOpenModal(false);
        }
    }, [updateSuccess]);

    const mutationDelete = useMutationHook(
        (id) => deleteProduct(id, user.access_token)
    )
    const { data: deleteData, isSuccess: deleteSuccess, isPending: deleteLoading } = mutationDelete
    const handleDelete = (id) => {
        mutationDelete.mutate(id)
    }
    useEffect(() => {
        if (deleteSuccess && deleteData) {
            showSuccess(deleteData?.message)
            refetch()
        }
    }, [deleteSuccess])

    const showModal = (id) => {
        setOpenModal(true);
        form.resetFields();
        setFileList([]);
        handleGetDetailsProduct(id);
    };
    const handleGetDetailsProduct = async (id) => {
        const res = await getDetailProduct(id)
        setProduct(res.data);
    }
    useEffect(() => {
        if (product) {
            form.setFieldsValue({
                name: product.name,
                image: product.image,
                type: product.type,
                price: product.price,
                countInStock: product.countInStock,
                selled: product.selled,
            });
        }
    }, [product]);


    const handleCancel = () => {
        setOpenModal(false);
    };
    const mutationDeleteMany = useMutationHook(
        (data) => deleteManyProduct(data, user.access_token)
    )
    const { data: deleteManyData, isSuccess: deleteManySuccess, isPending: deleteManyLoading } = mutationDeleteMany
    const handleDeleteMany = (ids) => {
        mutationDeleteMany.mutate(ids)
    }
    useEffect(() => {
        if (deleteManySuccess && deleteManyData) {
            showSuccess(deleteManyData?.message)
            refetch()
        }
    }, [deleteManySuccess])

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
        filterDropdownProps: {
            onOpenChange(open) {
                if (open) {
                    setTimeout(() => searchInput.current?.select(), 100);
                }
            },
        },
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


    useEffect(() => {
        if (product?.image) {
            setFileList([
                {
                    uid: product._id,
                    name: "product.png",
                    status: "done",
                    url: product.image,
                },
            ]);
        }
    }, [product]);

    const handlePreview = async file => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
    };

    const handleChangeAvatar = async ({ file, fileList: newFileList }) => {
        const realFile = file.originFileObj || file;

        if (!(realFile instanceof Blob)) return;

        const base64 = await getBase64(realFile);
        form.setFieldsValue({ image: base64 });
        setFileList(newFileList.slice(-1));
    };


    const uploadButton = (
        <button style={{ border: 0, background: 'none' }} type="button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
        </button>
    );

    const columns = [
        {
            title: 'STT',
            render: (text, record, index) => index + 1,
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            ...getColumnSearchProps('name'),
            sorter: (a, b) => a.name.localeCompare(b.name),
            sortDirections: ['ascend', 'descend'],
            defaultSortOrder: 'ascend',
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            sorter: (a, b) => a.price - b.price,
            sortDirections: ['ascend', 'descend'],
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: 'Tồn kho',
            dataIndex: 'countInStock',
            key: 'countInStock',
        },
        {
            title: 'Selled',
            dataIndex: 'selled',
            key: 'selled',
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" onClick={() => showModal(record._id)}>Sửa</Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa sản phẩm này?"
                        onConfirm={() => mutationDelete.mutate(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button type="primary" danger>Xóa</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const handleExportExcel = () => {
        const excel = products?.data?.map((product) => {
            return {
                "Tên sản phẩm": product.name,
                "Giá": product.price,
                "Loại": product.type,
                "Tồn kho": product.countInStock,
                "Đã bán": product.selled
            }
        })
        exportExcel(excel, "Danh sách sản phẩm", "Danh sách sản phẩm")
    }

    return (
        <div>
            <div style={{ marginTop: '20px' }}>
                <Button type="primary" onClick={handleExportExcel}>Xuất Excel</Button>
            </div>
            <LoadingComponent isPending={updateLoading || productsLoading || deleteManyLoading || deleteLoading}>
                <TableComponent columns={columns} data={products?.data}
                    handleDeleteMany={handleDeleteMany}
                    rowKey="_id"
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total: products?.totalProducts,
                        onChange: (page) => setPage(page),
                    }} />
            </LoadingComponent>
            <Modal title="Sửa thông tin sản phẩm" open={openModal} onCancel={handleCancel} okButtonProps={{ style: { display: 'none' } }}>
                <Form form={form} layout="vertical">
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item label="Tên sản phẩm" name="name" style={{ flex: 1, marginBottom: 0 }}>
                            <Input disabled={!editing.name} />
                        </Form.Item>
                        <Button onClick={() =>
                            editing.name
                                ? updateField("name")
                                : setEditing({ ...editing, name: true })
                        }>
                            {editing.name ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                        <Form.Item label="Hình ảnh" name="image" style={{ flex: 1, marginBottom: 0 }}>
                            <Upload
                                disabled={!editing.image}
                                listType="picture-circle"
                                onPreview={handlePreview}
                                onChange={handleChangeAvatar}
                                beforeUpload={() => false}
                                onRemove={() => {
                                    setFileList([]);
                                }}
                                fileList={fileList}
                            >
                                {uploadButton}
                            </Upload>
                            {previewImage && (
                                <Image
                                    styles={{ root: { display: 'none' } }}
                                    preview={{
                                        open: previewOpen,
                                        onOpenChange: visible => setPreviewOpen(visible),
                                        afterOpenChange: visible => !visible && setPreviewImage(''),
                                    }}
                                    src={previewImage}
                                />
                            )}
                            <Button style={{ marginTop: "8px" }} onClick={() =>
                                editing.image
                                    ? updateField("image")
                                    : setEditing({ ...editing, image: true })
                            }>
                                {editing.image ? "Lưu" : "Cập nhật"}
                            </Button>
                        </Form.Item>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item label="Giá" name="price" style={{ flex: 1, marginBottom: 0 }}>
                            <Input disabled={!editing.price} />
                        </Form.Item>
                        <Button onClick={() =>
                            editing.price
                                ? updateField("price")
                                : setEditing({ ...editing, price: true })
                        }>
                            {editing.price ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item label="Loại" name="type" style={{ flex: 1, marginBottom: 0 }}>
                            <Input disabled={!editing.type} />
                        </Form.Item>
                        <Button onClick={() =>
                            editing.type
                                ? updateField("type")
                                : setEditing({ ...editing, type: true })
                        }>
                            {editing.type ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item label="Tồn kho" name="countInStock" style={{ flex: 1, marginBottom: 0 }}>
                            <Input disabled={!editing.countInStock} />
                        </Form.Item>
                        <Button onClick={() =>
                            editing.countInStock
                                ? updateField("countInStock")
                                : setEditing({ ...editing, countInStock: true })
                        }>
                            {editing.countInStock ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div >
    );
}

export default ProductListPage;
