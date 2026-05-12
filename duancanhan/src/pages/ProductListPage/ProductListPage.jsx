import React, { useRef } from 'react';
import { Button, Space, Modal, Form, Input, Upload, Image, Popconfirm, Select, InputNumber } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getAllProduct, deleteProduct, updateProduct, deleteManyProduct } from '../../services/ProductService';
import { getAllCategories } from '../../services/CategoryService';
import { getAllSuppliers } from '../../services/SupplierService';
import { getAllWarehouseItems } from '../../services/WarehouseService';
import { useState, useEffect } from 'react';
import TableComponent from '../../components/TableComponent/TableComponent';
import { getDetailProduct } from '../../services/ProductService';
import { useMutationHook } from '../../hooks/useMutationHook';
import { useSelector } from 'react-redux';
import { getBase64, exportExcel } from '../../ultil';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
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
    const { data: warehouseData } = useQuery({
        queryKey: ['warehouseItems'],
        queryFn: () => getAllWarehouseItems(),
        refetchOnWindowFocus: false,
    });

    const { data: products, isPending: productsLoading, refetch } = useQuery({
        queryKey: ['products', page],
        queryFn: () => getAllProduct(limit, page),
        refetchOnWindowFocus: false,
    });

    const [editing, setEditing] = useState({
        name: false,
        image: false,
        category: false,
        price: false,
        countInStock: false,
        selled: false,
        images: false,
        discount: false,
        specifications: false,
        brand: false,
        supplier: false,
        warehouseItem: false,
    });
    const mutation = useMutationHook(
        (data) => updateProduct(product._id, data, user.accessToken)
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
        (id) => deleteProduct(id, user.accessToken)
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
                images: product.images,
                category: product.category,
                price: product.price,
                countInStock: product.countInStock,
                discount: product.discount,
                selled: product.selled,
                specifications: product.specifications,
                brand: product.brand,
                supplier: product.supplier?._id || product.supplier,
                warehouseItem: product.warehouseItem?._id || product.warehouseItem,
            });
            const category = categoriesData?.data?.find(item => item._id === product.category);
            setSelectedCategoryBrands(category?.brands || []);
        }
    }, [product, form]);

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

    useEffect(() => {
        if (product?.images) {
            setFileListImages(product.images.map((img, index) => ({
                uid: index,
                name: `image-${index}.png`,
                status: 'done',
                url: img,
            })));
        } else {
            setFileListImages([]);
        }
    }, [product]);


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
            key: 'type',
            render: (record) => record.category?.name || "N/A"
        },
        {
            title: 'Hãng',
            dataIndex: 'brand',
            key: 'brand',
        },
        {
            title: 'Nhà cung cấp',
            dataIndex: 'supplier',
            key: 'supplier',
            render: (supplier) => supplier?.name || "N/A"
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
                "Loại": product.category?.name || product.type || "N/A",
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
                        <Form.Item label="Danh mục" name="category" style={{ flex: 1, marginBottom: 0 }}>
                            <Select
                                disabled={!editing.category}
                                options={categoriesData?.data?.map((item) => ({
                                    value: item._id,
                                    label: item.name,
                                }))}
                                onChange={(value, option) => {
                                    const category = categoriesData?.data?.find(item => item._id === value);
                                    setSelectedCategoryBrands(category?.brands || []);
                                }}
                            />
                        </Form.Item>
                        <Button onClick={() =>
                            editing.category
                                ? updateField("category")
                                : setEditing({ ...editing, category: true })
                        }>
                            {editing.category ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item label="Hãng" name="brand" style={{ flex: 1, marginBottom: 0 }}>
                            <Select
                                disabled={!editing.brand}
                                placeholder="Chọn hãng"
                                options={selectedCategoryBrands.map((brand) => ({
                                    value: typeof brand === 'string' ? brand : brand?.name,
                                    label: typeof brand === 'string' ? brand : brand?.name,
                                }))}
                            />
                        </Form.Item>
                        <Button onClick={() =>
                            editing.brand
                                ? updateField("brand")
                                : setEditing({ ...editing, brand: true })
                        }>
                            {editing.brand ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item label="Nhà cung cấp" name="supplier" style={{ flex: 1, marginBottom: 0 }}>
                            <Select
                                disabled={!editing.supplier}
                                placeholder="Chọn nhà cung cấp"
                                options={suppliersData?.data?.map((item) => ({
                                    value: item._id,
                                    label: item.name,
                                }))}
                            />
                        </Form.Item>
                        <Button onClick={() =>
                            editing.supplier
                                ? updateField("supplier")
                                : setEditing({ ...editing, supplier: true })
                        }>
                            {editing.supplier ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item label="Liên kết Kho" name="warehouseItem" style={{ flex: 1, marginBottom: 0 }}>
                            <Select
                                disabled={!editing.warehouseItem}
                                placeholder="Chọn hàng từ kho"
                                options={warehouseData?.data?.map((item) => ({
                                    value: item._id,
                                    label: item.name,
                                }))}
                            />
                        </Form.Item>
                        <Button onClick={() =>
                            editing.warehouseItem
                                ? updateField("warehouseItem")
                                : setEditing({ ...editing, warehouseItem: true })
                        }>
                            {editing.warehouseItem ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 16, flexDirection: 'column', width: '100%' }}>
                        <Form.Item label="Hình ảnh chi tiết" name="images" style={{ width: '100%', marginBottom: 0 }}>
                            <Upload
                                disabled={!editing.images}
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
                        <Button style={{ marginTop: "8px", alignSelf: 'flex-start' }} onClick={() =>
                            editing.images
                                ? updateField("images")
                                : setEditing({ ...editing, images: true })
                        }>
                            {editing.images ? "Lưu" : "Cập nhật"}
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
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                        <Form.Item label="Giảm giá (%)" name="discount" style={{ flex: 1, marginBottom: 0 }}>
                            <InputNumber min={0} max={100} disabled={!editing.discount} style={{ width: '100%' }} />
                        </Form.Item>
                        <Button onClick={() =>
                            editing.discount
                                ? updateField("discount")
                                : setEditing({ ...editing, discount: true })
                        }>
                            {editing.discount ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 16, flexDirection: 'column' }}>
                        <Form.Item label="Thông số kỹ thuật" name="specifications" style={{ width: '100%', marginBottom: 0 }}>
                            <Form.List name="specifications">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'key']}
                                                    rules={[{ required: true, message: 'Tên thông số' }]}
                                                >
                                                    <Input placeholder="Tên thông số" disabled={!editing.specifications} />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'value']}
                                                    rules={[{ required: true, message: 'Giá trị' }]}
                                                >
                                                    <Input placeholder="Giá trị" disabled={!editing.specifications} />
                                                </Form.Item>
                                                {editing.specifications && (
                                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                                )}
                                            </Space>
                                        ))}
                                        {editing.specifications && (
                                            <Form.Item>
                                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                    Thêm thông số
                                                </Button>
                                            </Form.Item>
                                        )}
                                    </>
                                )}
                            </Form.List>
                        </Form.Item>
                        <Button style={{ marginTop: '10px' }} onClick={() =>
                            editing.specifications
                                ? updateField("specifications")
                                : setEditing({ ...editing, specifications: true })
                        }>
                            {editing.specifications ? "Lưu" : "Cập nhật"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div >
    );
}

export default ProductListPage;
