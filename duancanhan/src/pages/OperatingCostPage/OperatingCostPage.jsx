import React, { useEffect } from 'react';
import { Form, InputNumber, Button, Card, Table, Typography } from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getOperatingCost, updateOperatingCost } from '../../services/OperatingCostService';
import { getAllUser, updateUserInfo } from '../../services/UserServices';
import { useSelector } from 'react-redux';
import { showSuccess, showError } from '../../components/MessageComponent/MessageComponent';

const { Title } = Typography;

const OperatingCostPage = () => {
    const user = useSelector((state) => state.user);
    const [form] = Form.useForm();

    const { data: costData, refetch: refetchCost } = useQuery({
        queryKey: ['operating-cost'],
        queryFn: () => getOperatingCost(),
    });

    const { data: usersData, refetch: refetchUsers } = useQuery({
        queryKey: ['users-dashboard'],
        queryFn: () => getAllUser(user.accessToken),
        enabled: !!user.accessToken,
    });

    const employees = usersData?.data?.filter(u => u.isEmployee) || [];

    const mutationCost = useMutation({
        mutationFn: (data) => updateOperatingCost(data, user.accessToken),
        onSuccess: () => {
            showSuccess('Cập nhật chi phí mặt bằng thành công!');
            refetchCost();
        },
        onError: () => {
            showError('Có lỗi xảy ra!');
        }
    });

    const mutationSalary = useMutation({
        mutationFn: ({ id, salary }) => updateUserInfo(id, { salary }, user.accessToken),
        onSuccess: () => {
            showSuccess('Cập nhật lương nhân viên thành công!');
            refetchUsers();
        },
        onError: () => {
            showError('Có lỗi xảy ra!');
        }
    });

    useEffect(() => {
        if (costData?.data) {
            form.setFieldsValue({ rentCost: costData.data.rentCost });
        }
    }, [costData, form]);

    const onFinish = (values) => {
        mutationCost.mutate(values);
    };

    const handleSalaryChange = (id, value) => {
        mutationSalary.mutate({ id, salary: value });
    };

    const columns = [
        { title: 'Tên nhân viên', dataIndex: 'name', key: 'name' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        {
            title: 'Lương (VNĐ)',
            dataIndex: 'salary',
            key: 'salary',
            render: (salary, record) => (
                <InputNumber
                    style={{ width: 200 }}
                    defaultValue={salary || 0}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/,/g, '')}
                    onBlur={(e) => {
                        const val = parseInt(e.target.value.replace(/,/g, ''), 10);
                        if (val !== (salary || 0)) {
                            handleSalaryChange(record._id, isNaN(val) ? 0 : val);
                        }
                    }}
                    onPressEnter={(e) => {
                        const val = parseInt(e.target.value.replace(/,/g, ''), 10);
                        if (val !== (salary || 0)) {
                            handleSalaryChange(record._id, isNaN(val) ? 0 : val);
                        }
                    }}
                />
            ),
        },
    ];

    return (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Card style={{ flex: 1, minWidth: 400 }}>
                <Title level={4}>Chi phí mặt bằng</Title>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item label="Tiền thuê mặt bằng (VNĐ)" name="rentCost" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={mutationCost.isPending}>Lưu</Button>
                </Form>
            </Card>
            <Card style={{ flex: 2, minWidth: 500 }}>
                <Title level={4}>Lương nhân viên</Title>
                <Table
                    dataSource={employees}
                    columns={columns}
                    rowKey="_id"
                    pagination={false}
                    loading={mutationSalary.isPending}
                />
            </Card>
        </div>
    );
};

export default OperatingCostPage;