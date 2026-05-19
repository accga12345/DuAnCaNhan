import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Card, Select, Button, Typography, Divider, Tabs, message } from 'antd';
import { getProductByCategory, getAllCategoryProduct } from '../../services/ProductService';
import { useDispatch } from 'react-redux';
import { addOrderProduct } from '../../redux/slides/orderSlide';

const { Title } = Typography;
const { Option } = Select;

const PCBuilderPage = () => {
    const dispatch = useDispatch();
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState({});
    const [configs, setConfigs] = useState([
        { id: 1, selection: {}, totalPrice: 0 }
    ]);
    const [activeKey, setActiveKey] = useState("1");

    useEffect(() => {
        const fetchMetadata = async () => {
            const catRes = await getAllCategoryProduct();
            setCategories(catRes.data);
            
            for(let cat of catRes.data) {
                const prodRes = await getProductByCategory(cat._id, 100, 1);
                setProducts(prev => ({...prev, [cat.name]: prodRes.data}));
            }
        };
        fetchMetadata();
    }, []);

    const addConfig = () => {
        if (configs.length >= 5) {
            message.warning('Bạn chỉ có thể tạo tối đa 5 cấu hình.');
            return;
        }
        const newId = configs.length + 1;
        setConfigs([...configs, { id: newId, selection: {}, totalPrice: 0 }]);
        setActiveKey(newId.toString());
    };

    const handleSelect = (configId, categoryName, product) => {
        setConfigs(prev => prev.map(c => {
            if (c.id === configId) {
                const newSelection = { ...c.selection, [categoryName]: product };
                let total = 0;
                Object.values(newSelection).forEach(p => { if(p) total += p.price; });
                return { ...c, selection: newSelection, totalPrice: total };
            }
            return c;
        }));
    };

    const getSpec = (product, key) => {
        return product?.specifications?.find(s => s.key.toLowerCase() === key.toLowerCase())?.value;
    };

    const getAvailableProducts = (config, catName, allProducts) => {
        let filtered = allProducts;
        if (catName === 'Mainboard' && config.selection.CPU) {
            const cpuSocket = getSpec(config.selection.CPU, 'socket');
            if (cpuSocket) filtered = filtered.filter(p => getSpec(p, 'socket') === cpuSocket);
        }
        return filtered;
    };

    const removeConfig = (targetKey) => {
        if (configs.length <= 1) {
            message.warning('Phải có ít nhất một cấu hình.');
            return;
        }
        const newConfigs = configs.filter(c => c.id.toString() !== targetKey);
        setConfigs(newConfigs);
        if (activeKey === targetKey) {
            setActiveKey(newConfigs[0].id.toString());
        }
    };

    const addToCart = (config) => {
        const items = Object.values(config.selection).filter(p => p != null);
        if (items.length === 0) {
            message.warning('Vui lòng chọn ít nhất một linh kiện.');
            return;
        }
        
        items.forEach(p => {
            dispatch(addOrderProduct({
                orderItem: {
                    name: p.name,
                    amount: 1,
                    image: p.image,
                    price: p.price,
                    product: p._id,
                    countInStock: p.countInStock
                }
            }));
        });
        message.success(`Đã thêm cấu hình ${config.id} vào giỏ hàng!`);
    };

    return (
        <Layout style={{ padding: '20px', background: '#fff' }}>
            <Title level={2}>Xây dựng cấu hình PC</Title>
            <Button type="dashed" onClick={addConfig} style={{ marginBottom: 20 }}>+ Thêm cấu hình mới</Button>
            <Tabs 
                activeKey={activeKey} 
                onChange={setActiveKey}
                type="editable-card"
                onEdit={(targetKey, action) => action === 'remove' ? removeConfig(targetKey) : null}
                hideAdd
                items={configs.map(config => ({
                    key: config.id.toString(),
                    label: `Cấu hình ${config.id}`,
                    children: (
                        <Row gutter={24}>
                            <Col span={16}>
                                {categories.map(cat => (
                                    <Card key={cat._id} title={cat.name} style={{ marginBottom: 10 }}>
                                        <Select 
                                            style={{ width: '100%' }} 
                                            placeholder={`Chọn ${cat.name}`}
                                            allowClear
                                            value={config.selection[cat.name]?._id}
                                            onChange={(val) => {
                                                const prod = products[cat.name]?.find(p => p._id === val);
                                                handleSelect(config.id, cat.name, prod);
                                            }}
                                        >
                                            {getAvailableProducts(config, cat.name, products[cat.name] || [])?.map(p => (
                                                <Option key={p._id} value={p._id}>
                                                    {p.name} - {p.price.toLocaleString()}đ 
                                                    {cat.name === 'Mainboard' && config.selection.CPU && ` (Socket ${getSpec(p, 'socket')})`}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Card>
                                ))}
                            </Col>
                            <Col span={8}>
                                <Card title={`Tóm tắt Cấu hình ${config.id}`}>
                                    {Object.entries(config.selection).map(([cat, prod]) => (
                                        <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <span>{cat}: {prod?.name.slice(0, 15)}...</span>
                                            <span>{prod?.price.toLocaleString()}đ</span>
                                        </div>
                                    ))}
                                    <Divider />
                                    <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                                        Tổng tiền: {config.totalPrice.toLocaleString()}đ
                                    </div>
                                    <Button type="primary" style={{ marginTop: 20, width: '100%' }} onClick={() => addToCart(config)}>Thêm vào giỏ hàng</Button>
                                </Card>
                            </Col>
                        </Row>
                    )
                }))}
            />
        </Layout>
    );
};

export default PCBuilderPage;