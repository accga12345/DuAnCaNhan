import React from 'react';
import { Row, Col, Typography, Space } from 'antd';
import { FacebookOutlined, YoutubeOutlined, InstagramOutlined, PhoneOutlined, MailOutlined, HomeOutlined } from '@ant-design/icons';
import { FooterWrapper, FooterContainer, FooterSection, SocialIcon, FooterBottom } from './style';

const { Title, Text } = Typography;

const FooterComponent = () => {
  return (
    <FooterWrapper>
      <FooterContainer>
        <Row gutter={[32, 32]}>
          <Col xs={24} sm={12} md={6}>
            <FooterSection>
              <Title level={5}>Hỗ trợ khách hàng</Title>
              <Space direction="vertical">
                <Text>Hotline: <Text strong>1900 6035</Text> (1000đ/phút)</Text>
                <Text>Các câu hỏi thường gặp</Text>
                <Text>Gửi yêu cầu hỗ trợ</Text>
                <Text>Hướng dẫn đặt hàng</Text>
                <Text>Chính sách đổi trả</Text>
              </Space>
            </FooterSection>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <FooterSection>
              <Title level={5}>Về Tech Shop</Title>
              <Space direction="vertical">
                <Text>Giới thiệu Tech Shop</Text>
                <Text>Tuyển dụng</Text>
                <Text>Chính sách bảo mật</Text>
                <Text>Điều khoản sử dụng</Text>
                <Text>Bán hàng cùng Tech Shop</Text>
              </Space>
            </FooterSection>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <FooterSection>
              <Title level={5}>Liên hệ với chúng tôi</Title>
              <Space direction="vertical">
                <Text><HomeOutlined /> Địa chỉ: 123 Đường ABC, Hà Nội</Text>
                <Text><PhoneOutlined /> Điện thoại: 0123 456 789</Text>
                <Text><MailOutlined /> Email: support@techshop.com</Text>
              </Space>
            </FooterSection>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <FooterSection>
              <Title level={5}>Kết nối với chúng tôi</Title>
              <div style={{ marginTop: '10px' }}>
                <SocialIcon href="#"><FacebookOutlined /></SocialIcon>
                <SocialIcon href="#"><YoutubeOutlined /></SocialIcon>
                <SocialIcon href="#"><InstagramOutlined /></SocialIcon>
              </div>
            </FooterSection>
          </Col>
        </Row>
        <FooterBottom>
          <Text type="secondary">© 2026 Tech Shop. All rights reserved.</Text>
        </FooterBottom>
      </FooterContainer>
    </FooterWrapper>
  );
};

export default FooterComponent;
