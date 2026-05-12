import React, { useRef, useState, useEffect } from 'react';
import { Space, Button, Modal, Form, Input, Popconfirm, Upload } from 'antd';
import { getAllBrands, deleteBrand, getDetailBrand, updateBrand } from '../../services/BrandService';
import { useQuery } from '@tanstack/react-query';
import TableComponent from '../../components/TableComponent/TableComponent';
import { showSuccess, showError } from '../../components/MessageComponent/MessageComponent';
import { useMutationHook } from '../../hooks/useMutationHook';
import { useSelector } from 'react-redux';
import LoadingComponent from '../../components/Loading/LoadingComponent';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import { getBase64 } from '../../ultil';

function BrandListPage() {
    const [form] = Form.useForm();
    const [brandDetail, setBrandDetail] = useState({});
    const user = useSelector((state) => state.user);
    const [openModal, setOpenModal] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [fileList, setFileList] = useState([]);

    const { data: brands, isPending: brandsLoading, refetch } = useQuery({
        queryKey: ['brands'],
        queryFn: () => getAllBrands(),
    });

    const [editing, setEditing] = useState({
        name: false,
        image: false,
    });

    const handleGetDetailBrand = async (id) => {
        const res = await getDetailBrand(id);
        setBrandDetail(res.data);
    };

    useEffect(() => {
        if (brandDetail && Object.keys(brandDetail).length > 0) {
            form.setFieldsValue({
                name: brandDetail.name,
                image: brandDetail.image,
            });
            if (brandDetail.image) {
                setFileList([{
                    uid: '-1',
                    name: 'image.png',
                    status: 'done',
                    url: brandDetail.image,
                }]);
            } else {
                setFileList([]);
            }
        }
    }, [brandDetail, form]);

    const handlePreview = async file => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
    };

    const handleChangeImage = async ({ file, fileList: newFileList }) => {
        const realFile = file.originFileObj || file;
        if (!(realFile instanceof Blob)) {
             setFileList(newFileList.slice(-1));
             return;
        }
        const base64 = await getBase64(realFile);
        form.setFieldsValue({ image: base64 });
        setFileList(newFileList.slice(-1));
    };

    const mutationUpdate = useMutationHook(
        (data) => updateBrand(brandDetail._id, data, user.accessToken)
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
        (id) => deleteBrand(id, user.accessToken)
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
        handleGetDetailBrand(id);
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
        onFilterDropdownOpenChange: visible => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
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

    const columns = [
        {
            title: 'Tên thương hiệu',
            dataIndex: 'name',
            key: 'name',
            ...getColumnSearchProps('name'),
            sorter: (a, b) => a.name?.localeCompare(b.name),
        },
        {
            title: 'Logo',
            dataIndex: 'image',
            key: 'image',
            render: (image) => (
                <img src={image} alt="logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" onClick={() => showModal(record._id)}>Sửa</Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa thương hiệu này?"
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
            <h2 style={{ marginTop: '20px' }}>Danh sách thương hiệu</h2>
            <LoadingComponent isPending={brandsLoading || updateLoading || deleteLoading}>
                <TableComponent
                    columns={columns}
                    data={brands?.data}
                    rowKey="_id"
                    pagination={{ pageSize: 8 }}
                />
            </LoadingComponent>
            <Modal
                title="Sửa thông tin thương hiệu"
                open={openModal}
                onCancel={handleCancel}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item label="Tên thương hiệu" name="name" style={{ flex: 1, marginBottom: 0 }}>
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
                        <Form.Item label="Hình ảnh / Logo" name="image" style={{ flex: 1, marginBottom: 0 }}>
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
                                disabled={!editing.image}
                            >
                                {fileList.length >= 1 ? null : (
                                    <button style={{ border: 0, background: 'none' }} type="button">
                                        <PlusOutlined />
                                        <div style={{ marginTop: 8 }}>Upload</div>
                                    </button>
                                )}
                            </Upload>
                        </Form.Item>
                        <Button type={editing.image ? "primary" : "default"} onClick={() =>
                            editing.image
                                ? updateField("image")
                                : setEditing({ ...editing, image: true })
                        }>
                            {editing.image ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>
                </Form>
            </Modal>
            <Modal open={previewOpen} title="Xem hình ảnh" footer={null} onCancel={() => setPreviewOpen(false)}>
                <img alt="preview" style={{ width: '100%' }} src={previewImage} />
            </Modal>
        </div>
    );
}

export default BrandListPage;
