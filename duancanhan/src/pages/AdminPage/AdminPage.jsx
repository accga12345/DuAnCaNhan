import React, { useState } from 'react';
import { AppstoreOutlined, MailOutlined } from '@ant-design/icons';
import { getLevelKeys } from '../../ultil';
import { Menu } from 'antd';
import UserListPage from '../UserListPage/UserListPage';
import UserAddPage from '../UserAddPage/UserAddPage';
import ProductListPage from '../ProductListPage/ProductListPage';
import ProductAddPage from '../ProductAddPage/ProductAddPage';
import OrderAdmin from '../OrderAdmin/OrderAdmin';

function AdminPage() {
    const [stateOpenKeys, setStateOpenKeys] = useState(['1']);
    const [stateCurrentKey, setStateCurrentKey] = useState('1');

    const items = [
        {
            key: '1',
            icon: <MailOutlined />,
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
        {
            key: '3',
            icon: <AppstoreOutlined />,
            label: 'Đơn hàng',
            children: [
                { key: '31', label: 'Danh sách đơn hàng' },
            ],
        }
    ];

    const levelKeys = getLevelKeys(items);

    const onOpenChange = openKeys => {
        const currentOpenKey = openKeys.find(key => !stateOpenKeys.includes(key));
        // open
        if (currentOpenKey !== undefined) {
            const repeatIndex = openKeys
                .filter(key => key !== currentOpenKey)
                .findIndex(key => levelKeys[key] === levelKeys[currentOpenKey]);
            setStateOpenKeys(
                openKeys
                    // remove repeat key
                    .filter((_, index) => index !== repeatIndex)
                    // remove current level all child
                    .filter(key => levelKeys[key] <= levelKeys[currentOpenKey]),
            );
        } else {
            // close
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