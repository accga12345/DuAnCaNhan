import React, { useState, useEffect } from 'react';
import { Button, Upload, List, Image, Card, InputNumber, Row, Col, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { getBase64 } from '../../ultil';
import { useSelector } from 'react-redux';
import { showSuccess, showError } from '../../components/MessageComponent/MessageComponent';
import { getAllSliders, createSlider, deleteSlider } from '../../services/SliderService';
import LoadingComponent from '../../components/Loading/LoadingComponent';

const { Title } = Typography;

const SliderManagementPage = () => {
    const user = useSelector((state) => state.user);
    const [sliderImages, setSliderImages] = useState([]);
    const [maxSlides, setMaxSlides] = useState(parseInt(localStorage.getItem('sliderMaxSlides')) || 5);
    const [autoSpeed, setAutoSpeed] = useState(parseInt(localStorage.getItem('sliderAutoSpeed')) || 3000);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const fetchImages = async () => {
        setIsLoading(true);
        try {
            const res = await getAllSliders();
            setSliderImages(Array.isArray(res) ? res : (res.data || []));
        } catch (error) {
            showError("Không thể tải danh sách slider");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleUpload = async (file) => {
        if (sliderImages.length >= 8) {
            showError("Đã đạt giới hạn tối đa 8 slide!");
            return false;
        }
        
        setIsUploading(true);
        const base64 = await getBase64(file);
        try {
            await createSlider({ image: base64 }, user.accessToken);
            showSuccess("Thêm ảnh thành công");
            await fetchImages();
        } catch (error) {
            showError("Tải ảnh thất bại");
        } finally {
            setIsUploading(false);
        }
        return false;
    };

    const handleDelete = async (id) => {
        setIsLoading(true);
        try {
            await deleteSlider(id, user.accessToken);
            showSuccess("Xóa ảnh thành công");
            await fetchImages();
        } catch (error) {
            showError("Xóa ảnh thất bại");
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = () => {
        localStorage.setItem('sliderMaxSlides', maxSlides);
        localStorage.setItem('sliderAutoSpeed', autoSpeed);
        showSuccess("Đã lưu cấu hình slider");
    };

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}>Quản lý Slider</Title>
            
            <Card title="Cấu hình Slider" style={{ marginBottom: 20 }}>
                <Row gutter={16} align="middle">
                    <Col span={8}>
                        <label>Số lượng slide tối đa (8):</label>
                        <InputNumber min={1} max={8} value={maxSlides} onChange={setMaxSlides} style={{ width: '100%' }} />
                    </Col>
                    <Col span={8}>
                        <label>Tốc độ tự động (ms):</label>
                        <InputNumber min={1000} step={500} value={autoSpeed} onChange={setAutoSpeed} style={{ width: '100%' }} />
                    </Col>
                    <Col span={8}>
                        <Button type="primary" onClick={saveSettings}>Lưu cấu hình</Button>
                    </Col>
                </Row>
            </Card>

            <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*">
                <LoadingComponent isPending={isUploading}>
                    <Button type="primary" icon={<PlusOutlined />} disabled={isUploading}>
                        Thêm ảnh Slider
                    </Button>
                </LoadingComponent>
            </Upload>
            
            <LoadingComponent isPending={isLoading}>
                <List
                    grid={{ gutter: 16, column: 4 }}
                    dataSource={sliderImages}
                    renderItem={item => (
                        <List.Item>
                            <Card 
                                cover={<Image src={item.image} style={{ height: 150, objectFit: 'cover' }} />}
                                actions={[<DeleteOutlined onClick={() => handleDelete(item._id)} style={{ color: 'red' }} />]}
                            >
                                <Card.Meta description="Slider Image" />
                            </Card>
                        </List.Item>
                    )}
                    style={{ marginTop: 20 }}
                />
            </LoadingComponent>
        </div>
    );
};

export default SliderManagementPage;
