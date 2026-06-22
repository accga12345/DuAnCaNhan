import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Card, Select, Button, Typography, Divider, Tabs } from 'antd';
import * as message from '../../components/MessageComponent/MessageComponent';
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
            message.showError('Bạn chỉ có thể tạo tối đa 5 cấu hình.');
            return;
        }
        const newId = configs.length + 1;
        setConfigs([...configs, { id: newId, selection: {}, totalPrice: 0 }]);
        setActiveKey(newId.toString());
    };

    const handleSelect = (configId, categoryName, product) => {
        setConfigs(prev => prev.map(c => {
            if (c.id === configId) {
                let newSelection = { ...c.selection, [categoryName]: product };
                
                // --- CROSS-CATEGORY INVALIDATION LOGIC ---
                // If a core component changes, remove incompatible downstream components
                
                if (categoryName === 'CPU' && product) {
                    const newCpuSocket = getSpec(product, 'socket');
                    // Remove incompatible Mainboard
                    if (newSelection.Mainboard && !isCompatible(getSpec(newSelection.Mainboard, 'socket'), newCpuSocket)) {
                        delete newSelection.Mainboard;
                        // Cascading removal since Mainboard changed
                        delete newSelection.RAM;
                        delete newSelection.Case;
                    }
                    // Remove incompatible Cooling
                    if (newSelection.Cooling && !isCompatible(getSpec(newSelection.Cooling, 'socket'), newCpuSocket)) {
                        delete newSelection.Cooling;
                    }
                } 
                else if (categoryName === 'Mainboard' && product) {
                    const newMbSocket = getSpec(product, 'socket');
                    const newMbRamType = getSpec(product, 'ram_type');
                    const newMbForm = getSpec(product, 'form_factor');

                    // Remove incompatible CPU: check if CPU's socket is in Mainboard's socket list
                    if (newSelection.CPU && !isCompatible(newMbSocket, getSpec(newSelection.CPU, 'socket'))) delete newSelection.CPU;
                    // Remove incompatible Cooling (tied to socket)
                    if (newSelection.Cooling && !isCompatible(newMbSocket, getSpec(newSelection.Cooling, 'socket'))) delete newSelection.Cooling;
                    // Remove incompatible RAM
                    if (newSelection.RAM && !isCompatible(newMbRamType, getSpec(newSelection.RAM, 'ram_type'))) delete newSelection.RAM;
                    // Remove incompatible Case
                    if (newSelection.Case && !isCompatible(newMbForm, getSpec(newSelection.Case, 'form_factor'))) delete newSelection.Case;
                }

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

    // Helper để check tương thích đa giá trị (phân tách bằng dấu phẩy)
    const isCompatible = (productSpec, targetValue) => {
        if (!productSpec || !targetValue) return true;
        const values = productSpec.split(',').map(v => v.trim().toLowerCase());
        return values.includes(targetValue.toLowerCase());
    };

    const calculateTotalTDP = (selection) => {
        let total = 50; // Base system draw
        if (selection.CPU) total += Number(getSpec(selection.CPU, 'tdp') || 65);
        if (selection.VGA) total += Number(getSpec(selection.VGA, 'tdp') || 150);
        return total;
    };

    const getAvailableProducts = (config, catName, allProducts) => {
        let filtered = allProducts;
        const sel = config.selection;
        
        // 1. CPU <-> Mainboard <-> Cooling (Socket Matching)
        if (catName === 'Mainboard' && sel.CPU) {
            const cpuSocket = getSpec(sel.CPU, 'socket');
            if (cpuSocket) filtered = filtered.filter(p => isCompatible(getSpec(p, 'socket'), cpuSocket));
        } else if (catName === 'CPU' && sel.Mainboard) {
            const mbSocket = getSpec(sel.Mainboard, 'socket');
            if (mbSocket) filtered = filtered.filter(p => isCompatible(getSpec(p, 'socket'), mbSocket));
        } else if (catName === 'Cooling') {
            const activeSocket = getSpec(sel.CPU, 'socket') || getSpec(sel.Mainboard, 'socket');
            if (activeSocket) filtered = filtered.filter(p => isCompatible(getSpec(p, 'socket'), activeSocket));
        }

        // 2. RAM <-> Mainboard (RAM Type Matching)
        if (catName === 'RAM' && sel.Mainboard) {
            const mbRamType = getSpec(sel.Mainboard, 'ram_type');
            if (mbRamType) filtered = filtered.filter(p => isCompatible(getSpec(p, 'ram_type'), mbRamType));
        } else if (catName === 'Mainboard' && sel.RAM) {
            const ramType = getSpec(sel.RAM, 'ram_type');
            if (ramType) filtered = filtered.filter(p => isCompatible(getSpec(p, 'ram_type'), ramType));
        }

        // 3. VGA <-> Mainboard (PCIe Version Matching)
        if (catName === 'VGA' && sel.Mainboard) {
            const mbPcie = getSpec(sel.Mainboard, 'pcie_version');
            if (mbPcie) filtered = filtered.filter(p => isCompatible(getSpec(p, 'pcie_version'), mbPcie));
        } else if (catName === 'Mainboard' && sel.VGA) {
            const vgaPcie = getSpec(sel.VGA, 'pcie_version');
            if (vgaPcie) filtered = filtered.filter(p => isCompatible(getSpec(p, 'pcie_version'), vgaPcie));
        }

        // 4. SSD <-> Mainboard (Interface Matching)
        if (catName === 'SSD' && sel.Mainboard) {
            const mbInterface = getSpec(sel.Mainboard, 'interface');
            if (mbInterface) filtered = filtered.filter(p => isCompatible(getSpec(p, 'interface'), mbInterface));
        } else if (catName === 'Mainboard' && sel.SSD) {
            const ssdInterface = getSpec(sel.SSD, 'interface');
            if (ssdInterface) filtered = filtered.filter(p => isCompatible(getSpec(p, 'interface'), ssdInterface));
        }

        // 5. Case <-> Mainboard (Form Factor)
        if (catName === 'Case' && sel.Mainboard) {
            const mbForm = getSpec(sel.Mainboard, 'form_factor');
            if (mbForm) filtered = filtered.filter(p => isCompatible(getSpec(p, 'form_factor'), mbForm));
        } else if (catName === 'Mainboard' && sel.Case) {
            const caseForm = getSpec(sel.Case, 'form_factor');
            if (caseForm) filtered = filtered.filter(p => isCompatible(getSpec(p, 'form_factor'), caseForm));
        }

        // 6. PSU (Total Wattage)
        if (catName === 'PSU') {
            const totalTDP = calculateTotalTDP(sel);
            const recommendedWattage = totalTDP * 1.3;
            filtered = filtered.filter(p => !getSpec(p, 'power_wattage') || Number(getSpec(p, 'power_wattage')) >= recommendedWattage);
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

    const MANDATORY_CATEGORIES = ['CPU', 'Mainboard', 'RAM', 'VGA', 'SSD', 'PSU', 'Case', 'Cooling'];

    const addToCart = (config) => {
        const items = Object.values(config.selection).filter(p => p != null);
        if (items.length === 0) {
            message.showError('Vui lòng chọn ít nhất một linh kiện.');
            return;
        }

        const cpu = config.selection.CPU;
        const vga = config.selection.VGA;

        // VGA chỉ bắt buộc nếu CPU không có iGPU
        const vgaRequired = cpu && getSpec(cpu, 'has_igpu') === 'false';
        const requiredCats = vgaRequired
            ? MANDATORY_CATEGORIES
            : MANDATORY_CATEGORIES.filter(c => c !== 'VGA');

        const missing = requiredCats.filter(cat => !config.selection[cat]);
        if (missing.length > 0) {
            if (vgaRequired && missing.length === 1 && missing[0] === 'VGA') {
                message.showError('CPU bạn chọn không có card đồ họa tích hợp (iGPU). Vui lòng chọn thêm VGA rời!');
            } else {
                message.showError(`Vui lòng chọn đầy đủ các linh kiện bắt buộc: ${missing.join(', ')}`);
            }
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
        message.showSuccess(`Đã thêm cấu hình ${config.id} vào giỏ hàng!`);
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