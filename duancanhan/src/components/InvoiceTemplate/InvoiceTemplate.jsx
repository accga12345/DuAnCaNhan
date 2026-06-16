import React from 'react';
import { Typography, Table } from 'antd';
import {
    InvoiceWrapper,
    Header,
    CompanyInfo,
    InvoiceTitle,
    Section,
    SectionTitle,
    InfoRow,
    Label,
    Value,
    TotalSection
} from './style';

const { Title, Text } = Typography;

const InvoiceTemplate = React.forwardRef(({ order }, ref) => {
    if (!order) return null;

    const columns = [
        {
            title: 'Sản phẩm',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Số lượng',
            dataIndex: 'amount',
            key: 'amount',
            align: 'center',
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            key: 'price',
            align: 'right',
            render: (text) => `${text?.toLocaleString()} đ`,
        },
        {
            title: 'Thành tiền',
            key: 'total',
            align: 'right',
            render: (_, record) => `${(record.price * record.amount).toLocaleString()} đ`,
        },
    ];

    return (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <InvoiceWrapper ref={ref} id="invoice-capture">
                <Header>
                    <CompanyInfo>
                        <Title level={3} style={{ color: '#1890ff', margin: 0 }}>TECH SHOP</Title>
                        <Text>Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</Text><br />
                        <Text>Điện thoại: 0123 456 789</Text><br />
                        <Text>Email: contact@techshop.com</Text>
                    </CompanyInfo>
                    <InvoiceTitle>
                        <Title level={2} style={{ margin: 0 }}>HÓA ĐƠN</Title>
                        <Text strong>Mã đơn hàng: {order.orderCode}</Text><br />
                        <Text>Ngày: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</Text>
                    </InvoiceTitle>
                </Header>

                <Section>
                    <SectionTitle>Thông tin khách hàng</SectionTitle>
                    <InfoRow>
                        <Label>Khách hàng:</Label>
                        <Value>{order.shippingAddress?.fullName}</Value>
                    </InfoRow>
                    <InfoRow>
                        <Label>Số điện thoại:</Label>
                        <Value>{order.shippingAddress?.phone}</Value>
                    </InfoRow>
                    <InfoRow>
                        <Label>Địa chỉ nhận hàng:</Label>
                        <Value>{order.shippingAddress?.address}</Value>
                    </InfoRow>
                </Section>

                <Section>
                    <SectionTitle>Chi tiết đơn hàng</SectionTitle>
                    <Table
                        dataSource={order.orderItems}
                        columns={columns}
                        pagination={false}
                        rowKey="product"
                        size="small"
                        bordered
                    />
                </Section>

                <TotalSection>
                    <InfoRow style={{ justifyContent: 'flex-end' }}>
                        <Label style={{ width: 'auto', marginRight: '20px' }}>Tiền hàng:</Label>
                        <Value style={{ flex: 'none', width: '120px', fontWeight: 'bold' }}>
                            {order.itemsPrice?.toLocaleString()} đ
                        </Value>
                    </InfoRow>
                    <InfoRow style={{ justifyContent: 'flex-end' }}>
                        <Label style={{ width: 'auto', marginRight: '20px' }}>Phí vận chuyển:</Label>
                        <Value style={{ flex: 'none', width: '120px', fontWeight: 'bold' }}>
                            {order.shippingPrice?.toLocaleString()} đ
                        </Value>
                    </InfoRow>
                    <InfoRow style={{ justifyContent: 'flex-end', marginTop: '10px' }}>
                        <Title level={4} style={{ color: '#f5222d', margin: 0, marginRight: '20px' }}>Tổng cộng:</Title>
                        <Title level={4} style={{ color: '#f5222d', margin: 0, width: '120px' }}>
                            {order.totalPrice?.toLocaleString()} đ
                        </Title>
                    </InfoRow>
                </TotalSection>

                <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-around' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Text strong italic>Người mua hàng</Text><br />
                        <Text type="secondary" size="small">(Ký, ghi rõ họ tên)</Text>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <Text strong italic>Người lập hóa đơn</Text><br />
                        <Text type="secondary" size="small">(Ký, ghi rõ họ tên)</Text>
                    </div>
                </div>
            </InvoiceWrapper>
        </div>
    );
});

export default InvoiceTemplate;
