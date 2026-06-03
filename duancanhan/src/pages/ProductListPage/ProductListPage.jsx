import React, { useRef, useState, useEffect } from 'react';
import { Button, Space, Modal, Form, Input, Upload, Image, Popconfirm, Select, InputNumber, Typography, Tooltip, Row, Col } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { EditOutlined, DeleteOutlined, FileExcelOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { getAllProduct, deleteProduct, updateProduct, deleteManyProduct, getDetailProduct } from '../../services/ProductService';
import { getAllCategories } from '../../services/CategoryService';
import { getAllSuppliers } from '../../services/SupplierService';
import { getAllWarehouseItems } from '../../services/WarehouseService';
import TableComponent from '../../components/TableComponent/TableComponent';
import { useMutationHook } from '../../hooks/useMutationHook';
import { useSelector } from 'react-redux';
import { getBase64, exportExcel } from '../../ultil';
import { showSuccess, showError } from "../../components/MessageComponent/MessageComponent";
import LoadingComponent from '../../components/Loading/LoadingComponent';
import Highlighter from 'react-highlight-words';
import { PageHeader, ActionToolbar } from './style';

const { Title } = Typography;

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
    const [fileListImages, setFileListImages] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef(null);
    const [selectedCategoryBrands, setSelectedCategoryBrands] = useState([]);

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
    const { data: warehouseData, refetch: refetchWarehouse } = useQuery({
        queryKey: ['warehouseItems'],
        queryFn: () => getAllWarehouseItems(),
        refetchOnWindowFocus: false,
    });

    const { data: products, isPending: productsLoading, refetch } = useQuery({
        queryKey: ['products'],
        queryFn: () => getAllProduct(1000, 1),
        refetchOnWindowFocus: false,
    });

    const mutationUpdate = useMutationHook(
        (data) => updateProduct(product._id, data, user.accessToken)
    );

    const { data: updateData, isSuccess: updateSuccess, isPending: updateLoading, isError: isUpdateError, error: updateErrorObj } = mutationUpdate;

    const onUpdateProduct = () => {
        const values = form.getFieldsValue();
        mutationUpdate.mutate(values);
    };

    useEffect(() => {
        if (updateSuccess && updateData) {
            if (updateData.status === 'error' || updateData.status === 'ERR') {
                showError(updateData.message);
            } else {
                showSuccess(updateData.message || "Cập nhật thành công");
                refetch();
                refetchWarehouse(); 
                setOpenModal(false);
            }
        } else if (isUpdateError) {
            showError(updateErrorObj?.response?.data?.message || updateErrorObj?.message || "Có lỗi xảy ra khi cập nhật!");
        }
    }, [updateSuccess, updateData, isUpdateError, updateErrorObj, refetch, refetchWarehouse]);

    const mutationDelete = useMutationHook(
        (id) => deleteProduct(id, user.accessToken)
    )
    const { data: deleteData, isSuccess: deleteSuccess, isPending: deleteLoading } = mutationDelete
    
    useEffect(() => {
        if (deleteSuccess && deleteData) {
            showSuccess(deleteData?.message)
            refetch()
        }
    }, [deleteSuccess, deleteData, refetch])

    const handleGetDetailsProduct = async (id) => {
        const res = await getDetailProduct(id)
        setProduct(res.data);
    }

    const showModal = (id) => {
        setOpenModal(true);
        form.resetFields();
        setFileList([]);
        setFileListImages([]);
        handleGetDetailsProduct(id);
    };

    useEffect(() => {
        if (product && openModal) {
            form.setFieldsValue({
                name: product.name,
                image: product.image,
                images: product.images,
                category: product.category?._id || product.category,
                price: product.price,
                countInStock: product.countInStock,
                discount: product.discount,
                selled: product.selled,
                specifications: product.specifications,
                brand: product.brand,
                supplier: product.supplier?._id || product.supplier,
                warehouseItem: product.warehouseItem?._id || product.warehouseItem,
                warehouseQuantity: product.warehouseItem?.quantity || 0,
                description: product.description,
            });
            const catId = product.category?._id || product.category;
            const category = categoriesData?.data?.find(item => item._id === catId);
            setSelectedCategoryBrands(category?.brands || []);

            if (product.image) {
                setFileList([{ uid: '-1', name: 'main.png', status: 'done', url: product.image }]);
            }
            if (product.images) {
                setFileListImages(product.images.map((img, idx) => ({
                    uid: idx,
                    name: `img-${idx}.png`,
                    status: 'done',
                    url: img,
                })));
            }
        }
    }, [product, form, openModal, categoriesData]);

    const handleCancel = () => {
        setOpenModal(false);
    };

    const mutationDeleteMany = useMutationHook(
        (data) => deleteManyProduct(data, user.accessToken)
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
    }, [deleteManySuccess, deleteManyData, refetch])

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
                    placeholder={`Tìm ${dataIndex}`}
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
                        Tìm
                    </Button>
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters)}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Xóa
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
        onFilter: (value, record) => {
            const keys = dataIndex.split('.');
            let val = record;
            for (const key of keys) {
                val = val?.[key];
            }
            return val?.toString().toLowerCase().includes(value.toLowerCase());
        },
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

    const handlePreview = async file => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
    };

    const handleChangeMainImage = async ({ file, fileList: newFileList }) => {
        if (newFileList.length === 0) {
            form.setFieldsValue({ image: null });
            setFileList([]);
            return;
        }
        const realFile = file.originFileObj || file;
        if (!(realFile instanceof Blob)) return;
        const base64 = await getBase64(realFile);
        form.setFieldsValue({ image: base64 });
        setFileList(newFileList.slice(-1));
    };

    const handleChangeImages = async ({ fileList: newFileList }) => {
        const imagesBase64 = await Promise.all(
            newFileList.map(async (file) => {
                if (file.url) return file.url;
                return await getBase64(file.originFileObj || file);
            })
        );
        form.setFieldsValue({ images: imagesBase64 });
        setFileListImages(newFileList);
    };

    const columns = [
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            ...getColumnSearchProps('name'),
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            sorter: (a, b) => a.price - b.price,
            render: (price) => price.toLocaleString() + ' đ'
        },
        {
            title: 'Loại',
            key: 'category',
            ...getColumnSearchProps('category.name'),
            render: (record) => record.category?.name || "N/A"
        },
        {
            title: 'Hãng',
            dataIndex: 'brand',
            key: 'brand',
            ...getColumnSearchProps('brand'),
        },
        {
            title: 'Số lượng',
            dataIndex: 'countInStock',
            key: 'countInStock',
            sorter: (a, b) => a.countInStock - b.countInStock,
        },
        {
            title: 'Nhà cung cấp',
            dataIndex: ['supplier', 'name'],
            key: 'supplier',
            ...getColumnSearchProps('supplier.name'),
        },
        {
            title: 'Đã bán',
            dataIndex: 'selled',
            key: 'selled',
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
                            title="Xóa sản phẩm"
                            description="Bạn có chắc chắn muốn xóa sản phẩm này?"
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
    ];

    const handleExportExcel = () => {
        const excelData = products?.data?.map((product) => ({
            "Tên sản phẩm": product.name,
            "Giá": product.price,
            "Loại": product.category?.name || "N/A",
            "Hãng": product.brand,
            "Số lượng": product.countInStock,
            "Nhà cung cấp": product.supplier?.name || "N/A",
            "Đã bán": product.selled
        }))
        exportExcel(excelData, "Danh_sach_san_pham", "Products")
    }

    return (
        <div>
            <PageHeader>
                <Title level={4} style={{ margin: 0 }}>Quản lý sản phẩm</Title>
                <ActionToolbar>
                    <Button
                        icon={<FileExcelOutlined />}
                        onClick={handleExportExcel}
                    >
                        Xuất Excel
                    </Button>
                </ActionToolbar>
            </PageHeader>

            <LoadingComponent isPending={updateLoading || productsLoading || deleteManyLoading || deleteLoading}>
                <TableComponent 
                    columns={columns} 
                    data={products?.data}
                    handleDeleteMany={handleDeleteMany}
                    rowKey="_id"
                    pagination={{ pageSize: 10 }}
                />
            </LoadingComponent>

            <Modal 
                title="Cập nhật thông tin sản phẩm" 
                open={openModal} 
                onCancel={handleCancel} 
                onOk={onUpdateProduct}
                okText="Lưu thay đổi"
                cancelText="Hủy"
                width={800}
                confirmLoading={updateLoading}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}>
                                <Input disabled placeholder="Nhập tên sản phẩm" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Giá (đ)" name="price" rules={[{ required: true, message: 'Vui lòng nhập giá' }]}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Giảm giá (%)" name="discount">
                                <InputNumber min={0} max={100} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item label="Danh mục" name="category" rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}>
                                <Select
                                    disabled
                                    placeholder="Chọn danh mục"
                                    options={categoriesData?.data?.map((item) => ({
                                        value: item._id,
                                        label: item.name,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Thương hiệu" name="brand" rules={[{ required: true, message: 'Vui lòng chọn thương hiệu' }]}>
                                <Select
                                    disabled
                                    placeholder="Chọn thương hiệu"
                                    options={selectedCategoryBrands.map((brand) => ({
                                        value: typeof brand === 'string' ? brand : brand?.name,
                                        label: typeof brand === 'string' ? brand : brand?.name,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Số lượng" name="countInStock" rules={[{ required: true, message: 'Nhập số lượng' }]}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Số lượng trong kho" name="warehouseQuantity">
                                <InputNumber disabled style={{ width: '100%', fontWeight: 'bold', color: '#000' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item label="Mô tả sản phẩm" name="description">
                                <Input.TextArea rows={4} placeholder="Nhập mô tả chi tiết sản phẩm..." />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item label="Thông số kỹ thuật">
                                <Form.List name="specifications">
                                    {(fields, { add, remove }) => (
                                        <>
                                            {fields.map(({ key, name, ...restField }) => (
                                                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                                    <Form.Item {...restField} name={[name, 'key']} rules={[{ required: true, message: 'Tên?' }]}>
                                                        <Input placeholder="Tên (VD: Socket)" />
                                                    </Form.Item>
                                                    <Form.Item {...restField} name={[name, 'value']} rules={[{ required: true, message: 'Giá trị?' }]}>
                                                        <Input placeholder="Giá trị (VD: LGA1700)" />
                                                    </Form.Item>
                                                    <Button danger onClick={() => remove(name)}>Xóa</Button>
                                                </Space>
                                            ))}
                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm thông số</Button>
                                        </>
                                    )}
                                </Form.List>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Ảnh chính" name="image">
                                <Upload
                                    listType="picture-card"
                                    onPreview={handlePreview}
                                    onChange={handleChangeMainImage}
                                    beforeUpload={() => false}
                                    fileList={fileList}
                                    maxCount={1}
                                >
                                    {fileList.length >= 1 ? null : <div><PlusOutlined /><div style={{ marginTop: 8 }}>Tải lên</div></div>}
                                </Upload>
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Form.Item label="Ảnh chi tiết" name="images">
                                <Upload
                                    listType="picture-card"
                                    onPreview={handlePreview}
                                    onChange={handleChangeImages}
                                    beforeUpload={() => false}
                                    fileList={fileListImages}
                                    multiple
                                >
                                    {fileListImages.length >= 8 ? null : <div><PlusOutlined /><div style={{ marginTop: 8 }}>Tải lên</div></div>}
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>
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

export default ProductListPage;
