import React, { useState } from 'react';
import { AppstoreOutlined, MailOutlined } from '@ant-design/icons';
import { getLevelKeys } from '../../ultil';
import { Menu } from 'antd';
import { useSelector } from 'react-redux';
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

function AdminPage() {
    const user = useSelector((state) => state.user);
    const [stateOpenKeys, setStateOpenKeys] = useState(user?.isEmployee ? ['2'] : ['1']);
    const [stateCurrentKey, setStateCurrentKey] = useState(user?.isEmployee ? '21' : '11');

    const items = [
        {
            key: '1',
            icon: <MailOutlined />,
            label: 'Người dùng',
            disabled: user?.isEmployee,
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
        {
            key: '3',
            icon: <AppstoreOutlined />,
            label: 'Đơn hàng',
            children: [
                { key: '31', label: 'Danh sách đơn hàng' },
            ],
        },
        {
            key: '4',
            icon: <AppstoreOutlined />,
            label: 'Danh mục',
            children: [
                { key: '41', label: 'Danh sách danh mục' },
                { key: '42', label: 'Thêm danh mục' },
            ],
        },
        {
            key: '5',
            icon: <AppstoreOutlined />,
            label: 'Thương hiệu',
            children: [
                { key: '51', label: 'Danh sách thương hiệu' },
                { key: '52', label: 'Thêm thương hiệu' },
            ],
        },
        {
            key: '6',
            icon: <AppstoreOutlined />,
            label: 'Nhà cung cấp',
            children: [
                { key: '61', label: 'Danh sách nhà cung cấp' },
                { key: '62', label: 'Thêm nhà cung cấp' },
            ],
        },
        {
            key: '7',
            icon: <AppstoreOutlined />,
            label: 'Quản lý Kho',
            children: [
                { key: '71', label: 'Tồn kho nội bộ' },
                { key: '72', label: 'Nhập hàng vào kho' },
            ],
        }
    ];

    const levelKeys = getLevelKeys(items);

    const onOpenChange = openKeys => {
        const currentOpenKey = openKeys.find(key => !stateOpenKeys.includes(key));
        if (currentOpenKey !== undefined) {
            const repeatIndex = openKeys
                .filter(key => key !== currentOpenKey)
                .findIndex(key => levelKeys[key] === levelKeys[currentOpenKey]);
            setStateOpenKeys(
                openKeys
                    .filter((_, index) => index !== repeatIndex)
                    .filter(key => levelKeys[key] <= levelKeys[currentOpenKey]),
            );
        } else {
            setStateOpenKeys(openKeys);
        }
    };

    const handleOnClick = (e) => {
        setStateCurrentKey(e.key);
    }

    const handleRenderPage = (key) => {
        switch (key) {
            case '11':
                return <UserListPage />;
            case '12':
                return <UserAddPage />;
            case '21':
                return <ProductListPage />;
            case '22':
                return <ProductAddPage />;
            case '31':
                return <OrderAdmin />;
            case '41':
                return <CategoryListPage />;
            case '42':
                return <CategoryAddPage />;
            case '51':
                return <BrandListPage />;
            case '52':
                return <BrandAddPage />;
            case '61':
                return <SupplierListPage />;
            case '62':
                return <SupplierAddPage />;
            case '71':
                return <WarehouseListPage />;
            case '72':
                return <WarehouseAddPage />;
            default:
                return <UserListPage />;
        }
    }


    return (
        <div style={{ display: 'flex' }}>
            <Menu
                mode="inline"
                openKeys={stateOpenKeys}
                onOpenChange={onOpenChange}
                onClick={handleOnClick}
                style={{ width: 256, height: '100vh' }}
                items={items}
            />

            <div style={{ flex: 1 }}>
                {handleRenderPage(stateCurrentKey)}
            </div>
        </div>
    )
}

export default AdminPage