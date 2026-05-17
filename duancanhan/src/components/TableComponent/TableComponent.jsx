import { Table, Button, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import React from 'react';
import { useState } from 'react';
import styled from 'styled-components';

const TableWrapper = styled.div`
    .ant-table-wrapper {
        background: #fff;
        border-radius: 8px;
    }
    .ant-table-thead > tr > th {
        background: #fafafa;
        font-weight: 600;
    }
`;

const Toolbar = styled.div`
    margin-bottom: 16px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;
`;

const TableComponent = (props) => {
    const { selectionType = 'checkbox', data = [], columns = [], handleDeleteMany } = props
    const [rowSelectedKeys, setRowSelectedKeys] = useState([])

    const rowSelection = {
        onChange: (selectedRowKeys, selectedRows) => {
            setRowSelectedKeys(selectedRowKeys)
        },
    };

    const handleDeleteAll = () => {
        handleDeleteMany(rowSelectedKeys)
        setRowSelectedKeys([]) // Clear selection after delete
    }

    return (
        <TableWrapper>
            {rowSelectedKeys.length > 0 && (
                <Toolbar>
                    <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleDeleteAll}
                    >
                        Xóa tất cả ({rowSelectedKeys.length})
                    </Button>
                </Toolbar>
            )}

            <Table
                rowSelection={{
                    type: selectionType,
                    ...rowSelection,
                }}
                columns={columns}
                dataSource={data}
                bordered
                {...props}
            />
        </TableWrapper>
    )
}

export default TableComponent
