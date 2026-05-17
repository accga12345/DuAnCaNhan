import React, { useEffect } from 'react';
import { Form, InputNumber, Button, Card, Typography } from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getOperatingCost, updateOperatingCost } from '../../services/OperatingCostService';
import { useSelector } from 'react-redux';
import { showSuccess, showError } from '../../components/MessageComponent/MessageComponent';

const { Title } = Typography;

const OperatingCostPage = () => {
    const user = useSelector((state) => state.user);
    const [form] = Form.useForm();

    const { data: costData, refetch } = useQuery({
        queryKey: ['operating-cost'],
        queryFn: () => getOperatingCost(),
    });

    const mutation = useMutation({
        mutationFn: (data) => updateOperatingCost(data, user.accessToken),
        onSuccess: (data) => {
            showSuccess('Cập nhật chi phí thành công!');
            refetch();
        },
        onError: () => {
            showError('Có lỗi xảy ra!');
        }
    });

    useEffect(() => {
        if (costData?.data) {
            form.setFieldsValue(costData.data);
        }
    }, [costData, form]);

    const onFinish = (values) => {
        mutation.mutate(values);
    };

    return (
        <Card style={{ maxWidth: 600, margin: '0 auto' }}>
            <Title level={4}>Quản lý chi phí vận hành</Title>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item label="Chi phí thuê mặt bằng (VNĐ)" name="rentCost" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
                <Form.Item label="Lương mỗi nhân viên (VNĐ)" name="salaryPerStaff" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={mutation.isPending}>Lưu thay đổi</Button>
            </Form>
        </Card>
    );
};

export default OperatingCostPage;