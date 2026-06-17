import React, { useState } from 'react';
import {
    UserOutlined,
    AppstoreOutlined,
    FileTextOutlined,
    TagsOutlined,
    CrownOutlined,
    SolutionOutlined,
    DatabaseOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    DashboardOutlined,
    DollarCircleOutlined,
    PictureOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Button, theme, message } from 'antd';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import { StyledLayout, LogoContainer } from './style';
import DashboardStats from '../../components/DashboardStats/DashboardStats';
import UserListPage from '../UserListPage/UserListPage';
import UserAddPage from '../UserAddPage/UserAddPage';
import ProductListPage from '../ProductListPage/ProductListPage';
import ProductAddPage from '../ProductAddPage/ProductAddPage';
import OrderAdmin from '../OrderAdmin/OrderAdmin';
import CategoryListPage from '../CategoryListPage/CategoryListPage';
import CategoryAddPage from '../CategoryAddPage/CategoryAddPage';
import BrandListPage from '../BrandListPage/BrandListPage';
import BrandAddPage from '../BrandAddPage/BrandAddPage';
import SupplierListPage from '../SupplierListPage/SupplierListPage';
import SupplierAddPage from '../SupplierAddPage/SupplierAddPage';
import WarehouseListPage from '../WarehouseListPage/WarehouseListPage';
import WarehouseAddPage from '../WarehouseAddPage/WarehouseAddPage';
import OperatingCostPage from '../OperatingCostPage/OperatingCostPage';
import SliderManagementPage from '../SliderManagementPage/SliderManagementPage';

const { Header, Sider, Content } = Layout;

function AdminPage() {
    const user = useSelector((state) => state.user);
    const [collapsed, setCollapsed] = useState(false);
    const [stateCurrentKey, setStateCurrentKey] = useState('dashboard');

    const isStaff = !user.isAdmin && user.isEmployee;

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const allItems = [
        { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        {
            key: '1',
            icon: <UserOutlined />,
            label: 'Người dùng',
            children: [
                { key: '11', label: 'Danh sách người dùng' },
                { key: '12', label: 'Thêm người dùng' },
            ],
        },
        {
            key: '2',
            icon: <AppstoreOutlined />,
            label: 'Sản phẩm',
            children: [
                { key: '21', label: 'Danh sách sản phẩm' },
                { key: '22', label: 'Thêm sản phẩm' },
            ],
        },
        { key: 'order', icon: <FileTextOutlined />, label: 'Đơn hàng' },
        {
            key: '4',
            icon: <TagsOutlined />,
            label: 'Danh mục',
            children: [
                { key: '41', label: 'Danh sách danh mục' },
                { key: '42', label: 'Thêm danh mục' },
            ],
        },
        {
            key: '5',
            icon: <CrownOutlined />,
            label: 'Thương hiệu',
            children: [
                { key: '51', label: 'Danh sách thương hiệu' },
                { key: '52', label: 'Thêm thương hiệu' },
            ],
        },
        {
            key: '6',
            icon: <SolutionOutlined />,
            label: 'Nhà cung cấp',
            children: [
                { key: '61', label: 'Danh sách nhà cung cấp' },
                { key: '62', label: 'Thêm nhà cung cấp' },
            ],
        },
        {
            key: '7',
            icon: <DatabaseOutlined />,
            label: 'Quản lý Kho',
            children: [
                { key: '71', label: 'Tồn kho nội bộ' },
                { key: '72', label: 'Nhập hàng vào kho' },
            ],
        },
        { key: 'cost-management', icon: <DollarCircleOutlined />, label: 'Quản lý chi phí' },
        { key: 'slider', icon: <PictureOutlined />, label: 'Quản lý Slider' }
    ];

    const allowedKeysForStaff = ['dashboard', '2', '21', '22', 'order'];

    const items = isStaff 
        ? allItems.filter(item => {
            if (item.children) return allowedKeysForStaff.includes(item.key) || item.children.some(child => allowedKeysForStaff.includes(child.key));
            return allowedKeysForStaff.includes(item.key);
          }).map(item => {
            if (item.children) {
                return { ...item, children: item.children.filter(child => allowedKeysForStaff.includes(child.key)) };
            }
            return item;
          })
        : allItems;

    const handleOnClick = (e) => {
        setStateCurrentKey(e.key);
    }

    const getPageTitle = (key) => {
        if (key === 'dashboard') return 'Tổng quan hệ thống';
        if (key === 'cost-management') return 'Quản lý chi phí vận hành';
        if (key === 'order') return 'Quản lý đơn hàng';
        if (key === 'slider') return 'Quản lý Slider';
        for (const item of allItems) {
            if (item.children) {
                const child = item.children.find(c => c.key === key);
                if (child) return child.label;
            } else if (item.key === key) {
                return item.label;
            }
        }
        return 'Admin Dashboard';
    };

    const handleRenderPage = (key) => {
        if (isStaff && !allowedKeysForStaff.includes(key) && !['21', '22'].includes(key)) {
            message.error("Bạn không có quyền truy cập trang này!");
            return <DashboardStats user={user} />;
        }
        
        switch (key) {
            case 'dashboard': return <DashboardStats user={user} />;
            case 'cost-management': return <OperatingCostPage />;
            case 'slider': return <SliderManagementPage />;
            case 'order': return <OrderAdmin />;
            case '11': return <UserListPage />;
            case '12': return <UserAddPage />;
            case '21': return <ProductListPage />;
            case '22': return <ProductAddPage />;
            case '41': return <CategoryListPage />;
            case '42': return <CategoryAddPage />;
            case '51': return <BrandListPage />;
            case '52': return <BrandAddPage />;
            case '61': return <SupplierListPage />;
            case '62': return <SupplierAddPage />;
            case '71': return <WarehouseListPage />;
            case '72': return <WarehouseAddPage />;
            default: return <DashboardStats user={user} />;
        }
    };

    return (
        <StyledLayout>
            <Sider trigger={null} collapsible collapsed={collapsed} width={256} theme="dark">
                <LogoContainer>
                    <div style={{ padding: '16px', color: 'white', fontSize: '18px', fontWeight: 'bold' }}>TECH SHOP ADMIN</div>
                </LogoContainer>
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={['dashboard']}
                    onClick={handleOnClick}
                    items={items}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', alignItems: 'center' }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    />
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{getPageTitle(stateCurrentKey)}</h2>
                </Header>
                <Content
                    style={{
                        margin: '16px',
                        padding: '24px',
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        overflow: 'auto'
                    }}
                >
                    {handleRenderPage(stateCurrentKey)}
                </Content>
            </Layout>
        </StyledLayout>
    );
}

export default AdminPage;
