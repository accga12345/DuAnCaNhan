import React, { useRef, useState, useEffect } from 'react';
import { Space, Button, Modal, Form, Input, Upload, Image, Popconfirm, Card, Typography, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, FileExcelOutlined, SearchOutlined, PlusOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { getAllUser, deleteUser, getDetailUser, updateUserInfo, deleteManyUser } from '../../services/UserServices';
import { useQuery } from '@tanstack/react-query';
import TableComponent from '../../components/TableComponent/TableComponent';
import { showSuccess } from '../../components/MessageComponent/MessageComponent';
import { useMutationHook } from '../../hooks/useMutationHook';
import { useSelector } from 'react-redux';
import LoadingComponent from '../../components/Loading/LoadingComponent';
import { getBase64, exportExcel } from '../../ultil';
import Highlighter from 'react-highlight-words';
import { PageHeader, ActionToolbar } from './style';

const { Title } = Typography;

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

    const handleGetDetailUser = async (id) => {
        const res = await getDetailUser(id, user.accessToken)
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
    }, [userDetail, form]);

    const mutationUpdate = useMutationHook(
        (data) => updateUserInfo(userDetail._id, data, user.accessToken)
    )

    const { data: updateData, isSuccess: updateSuccess, isPending: updateLoading } = mutationUpdate

    const onUpdateUser = () => {
        const values = form.getFieldsValue();
        mutationUpdate.mutate(values);
    };

    useEffect(() => {
        if (updateSuccess && updateData) {
            showSuccess(updateData?.message);
            setOpenModal(false);
            refetch()
        }
    }, [updateSuccess, updateData, refetch]);


    const mutationDelete = useMutationHook(
        (id) => deleteUser(id, user.accessToken)
    )

    const { data: deleteData, isSuccess: deleteSuccess, isPending: deleteLoading } = mutationDelete
    useEffect(() => {
        if (deleteSuccess && deleteData) {
            showSuccess(deleteData?.message);
            refetch()
        }
    }, [deleteSuccess, deleteData, refetch]);


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
            refetch()
        }
    }, [deleteManySuccess, deleteManyData, refetch]);

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

    const columns = [
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
            ...getColumnSearchProps('name'),
            sorter: (a, b) => a.name?.localeCompare(b.name),
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
            title: 'Hành động',
            key: 'action',
            width: '120px',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Sửa">
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => showModal(record._id)}
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Popconfirm
                            title="Xóa người dùng"
                            description="Bạn có chắc chắn muốn xóa người dùng này?"
                            onConfirm={() => mutationDelete.mutate(record._id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                type="primary"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ]

    const handleExport = () => {
        const excelData = users?.data.map((user) => ({
            'Tên': user.name,
            'Email': user.email,
            'Số điện thoại': user.phone,
            'Địa chỉ': user.address,
        }))
        exportExcel(excelData, 'Danh_sach_nguoi_dung', 'Users')
    }

    return (
        <div>
            <PageHeader>
                <Title level={4} style={{ margin: 0 }}>Quản lý người dùng</Title>
                <ActionToolbar>
                    <Button
                        icon={<FileExcelOutlined />}
                        onClick={handleExport}
                    >
                        Xuất Excel
                    </Button>
                </ActionToolbar>
            </PageHeader>

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
                title="Cập nhật thông tin người dùng"
                open={openModal}
                onCancel={handleCancel}
                onOk={onUpdateUser}
                okText="Lưu thay đổi"
                cancelText="Hủy"
                width={600}
                confirmLoading={updateLoading}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={userDetail}
                    style={{ marginTop: 16 }}
                >
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item
                            label="Tên người dùng"
                            name="name"
                            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                            style={{ flex: 1 }}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Nhập tên" />
                        </Form.Item>
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}
                            style={{ flex: 1 }}
                        >
                            <Input prefix={<PlusOutlined style={{ transform: 'rotate(45deg)' }} />} placeholder="Nhập email" />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item
                            name="phone"
                            label="Số điện thoại"
                            rules={[
                                { required: true, message: 'Vui lòng nhập số điện thoại' },
                                { len: 10, message: 'Số điện thoại phải có đúng 10 chữ số' },
                                { pattern: /^[0-9]+$/, message: 'Số điện thoại chỉ được chứa chữ số' }
                            ]}
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="Nhập số điện thoại" />
                        </Form.Item>
                        <Form.Item
                            name="address"
                            label="Địa chỉ"
                            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="Nhập địa chỉ" />
                        </Form.Item>
                    </div>

                    <Form.Item label="Ảnh đại diện" name="avatar">
                        <Upload
                            listType="picture-card"
                            onPreview={handlePreview}
                            onChange={handleChangeAvatar}
                            beforeUpload={() => false}
                            fileList={fileList}
                            maxCount={1}
                        >
                            {fileList.length >= 1 ? null : (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Tải lên</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <Popconfirm
                        title="Đặt lại mật khẩu"
                        description="Bạn có chắc muốn đặt lại mật khẩu về mặc định (123456@)?"
                        onConfirm={() => mutationUpdate.mutate({ password: '123456@' })}
                        okText="Xác nhận"
                        cancelText="Hủy"
                    >
                        <Button icon={<LockOutlined />} danger>Reset mật khẩu</Button>
                    </Popconfirm>
                </Form>
            </Modal>

            {previewImage && (
                <Image
                    wrapperStyle={{ display: 'none' }}
                    preview={{
                        visible: previewOpen,
                        onVisibleChange: (visible) => setPreviewOpen(visible),
                        afterOpenChange: (visible) => !visible && setPreviewImage(''),
                    }}
                    src={previewImage}
                />
            )}
        </div>
    );
}

export default UserListPage;
