import React, { useRef } from 'react';
import { Space, Button, Modal, Form, Input, Upload, Image, Popconfirm } from 'antd';
import { getAllUser, deleteUser, getDetailUser, updateUserInfo, deleteManyUser } from '../../services/UserServices';
import { useQuery } from '@tanstack/react-query';
import TableComponent from '../../components/TableComponent/TableComponent';
import { showSuccess } from '../../components/MessageComponent/MessageComponent';
import { useMutationHook } from '../../hooks/useMutationHook';
import { useSelector } from 'react-redux';
import LoadingComponent from '../../components/Loading/LoadingComponent';
import { getBase64, exportExcel } from '../../ultil';
import { PlusOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';



function UserListPage() {
    const [form] = Form.useForm();
    const [userDetail, setUserDetail] = useState({});
    const user = useSelector((state) => state.user);
    const [openModal, setOpenModal] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [fileList, setFileList] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef(null);

    const { data: users, isPending: usersLoading, refetch } = useQuery({
        queryKey: ['users'],
        queryFn: () => getAllUser(),
    });
    const [editing, setEditing] = useState({
        name: false,
        email: false,
        phone: false,
        address: false,
        avatar: false,
    });

    const handleGetDetailUser = async (id) => {
        const res = await getDetailUser(id, user.accessToken)
        console.log(res.data);
        setUserDetail(res.data)
    }
    useEffect(() => {
        if (userDetail) {
            form.setFieldsValue({
                name: userDetail.name,
                email: userDetail.email,
                phone: userDetail.phone,
                address: userDetail.address,
                avatar: userDetail.avatar,
            });
        }
    }, [userDetail]);

    const mutationUpdate = useMutationHook(
        (data) => updateUserInfo(userDetail._id, data, user.accessToken)
    )

    const { data: updateData, isSuccess: updateSuccess, isPending: updateLoading } = mutationUpdate

    const updateField = (field) => {
        const value = form.getFieldValue(field);
        mutationUpdate.mutate({ [field]: value });
        setEditing({ ...editing, [field]: false });
    };
    useEffect(() => {
        if (updateSuccess && updateData) {
            showSuccess(updateData?.message);
            setOpenModal(false);
            refetch()
        }
    }, [updateSuccess]);


    const mutationDelete = useMutationHook(
        (id) => deleteUser(id, user.accessToken)
    )
    const handleDelete = (id) => {
        mutationDelete.mutate(id)
    }
    const { data: deleteData, isSuccess: deleteSuccess, isPending: deleteLoading } = mutationDelete
    useEffect(() => {
        if (deleteSuccess && deleteData) {
            showSuccess(deleteData?.message);
            setOpenModal(false);
            refetch()
        }
    }, [deleteSuccess]);


    const mutationDeleteMany = useMutationHook(
        (ids) => deleteManyUser(ids, user.accessToken)
    )
    const handleDeleteMany = (ids) => {
        mutationDeleteMany.mutate(ids)
    }
    const { data: deleteManyData, isSuccess: deleteManySuccess, isPending: deleteManyLoading } = mutationDeleteMany
    useEffect(() => {
        if (deleteManySuccess && deleteManyData) {
            showSuccess(deleteManyData?.message);
            setOpenModal(false);
            refetch()
        }
    }, [deleteManySuccess]);

    const showModal = (id) => {
        setOpenModal(true);
        form.resetFields();
        setFileList([]);
        handleGetDetailUser(id)
    }
    const handleCancel = () => {
        setOpenModal(false);
    }
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
        if (userDetail?.avatar) {
            setFileList([
                {
                    uid: "-1",
                    name: "avatar.png",
                    status: "done",
                    url: userDetail.avatar,
                },
            ]);
        }
    }, [userDetail]);



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
        form.setFieldsValue({ avatar: base64 });
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
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
            ...getColumnSearchProps('name'),
            sorter: (a, b) => a.name?.length - b.name?.length,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            ...getColumnSearchProps('email'),
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" onClick={() => showModal(record._id)}>Sửa</Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa người dùng này?"
                        onConfirm={() => mutationDelete.mutate(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button type="primary" danger>Xóa</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ]
    const handleExport = () => {
        const excel = users?.data.map((user) => {
            return {
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
            }
        })
        exportExcel(excel, 'users', 'users')
    }
    return (
        <div>
            <div style={{ marginTop: '20px' }}>
                <Button type="primary" onClick={handleExport}>Xuất Excel</Button>
            </div>
            <LoadingComponent isPending={usersLoading || updateLoading || deleteLoading || deleteManyLoading}>
                <TableComponent
                    handleDeleteMany={handleDeleteMany}
                    columns={columns}
                    data={users?.data}
                    rowKey="_id"
                    pagination={{ pageSize: 8 }}
                />
            </LoadingComponent>
            <Modal
                title="Sửa thông tin người dùng"
                open={openModal}
                onCancel={handleCancel}
                okButtonProps={{ style: { display: "none" } }}
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item label="Tên" name="name" style={{ flex: 1, marginBottom: 0 }}>
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
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item label="Email" name="email" style={{ flex: 1, marginBottom: 0 }}>
                            <Input disabled={!editing.email} />
                        </Form.Item>
                        <Button onClick={() =>
                            editing.email
                                ? updateField("email")
                                : setEditing({ ...editing, email: true })
                        }>
                            {editing.email ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>

                    <Popconfirm
                        title="Reset mật khẩu"
                        description="Bạn có chắc chắn muốn reset mật khẩu thành 123456@?"
                        onConfirm={() => {
                            mutationUpdate.mutate({ password: '123456@' });
                        }}
                        onCancel={() => {
                            console.log('Cancel');
                        }}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button type="primary">Reset mật khẩu</Button>
                    </Popconfirm>

                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item
                            name="phone"
                            label="Số điện thoại"
                            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                            style={{ flex: 1, marginBottom: 0 }}
                        >
                            <Input disabled={!editing.phone} />
                        </Form.Item>
                        <Button onClick={() =>
                            editing.phone
                                ? updateField("phone")
                                : setEditing({ ...editing, phone: true })
                        }>
                            {editing.phone ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item
                            name="address"
                            label="Địa chỉ"
                            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                            style={{ flex: 1, marginBottom: 0 }}
                        >
                            <Input disabled={!editing.address} />
                        </Form.Item>
                        <Button onClick={() =>
                            editing.address
                                ? updateField("address")
                                : setEditing({ ...editing, address: true })
                        }>
                            {editing.address ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                        <Form.Item label="Hình ảnh" name="avatar" style={{ flex: 1, marginBottom: 0 }}>
                            <Upload
                                disabled={!editing.avatar}
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
                                editing.avatar
                                    ? updateField("avatar")
                                    : setEditing({ ...editing, avatar: true })
                            }>
                                {editing.avatar ? "Lưu" : "Cập nhật"}
                            </Button>
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div >
    );
}

export default UserListPage;
