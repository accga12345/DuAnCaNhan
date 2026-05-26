import React, { useEffect } from "react";
import ProductDetailComponent from "../../components/ProductDetalComponent/ProductDetailComponent";
import BreadcrumbComponent from "../../components/BreadcrumbComponent/BreadcrumbComponent";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDetailProduct, getProductByCategory } from "../../services/ProductService";
import { convertToSlug } from "../../ultil";
import { io } from "socket.io-client";
import Slider from "react-slick";
import CardComponent from "../../components/CardComponent/CardComponent";
import { WrapperProductSlider } from "../HomePage/style";
import { Typography } from "antd";

const { Title } = Typography;

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const { data: product, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["product-detail", id],
    queryFn: () => getDetailProduct(id),
    enabled: !!id,
  });

  const categoryId = product?.data?.category?._id || product?.data?.category;

  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", categoryId],
    queryFn: () => getProductByCategory(categoryId, 10, 1),
    enabled: !!categoryId,
  });

  useEffect(() => {
    const backendUrl = process.env.REACT_APP_API_URL 
      ? process.env.REACT_APP_API_URL.replace('/api', '') 
      : "http://localhost:3001";
    const socket = io(backendUrl);

    socket.on("new_review", (data) => {
      if (data.productId === id) {
        queryClient.invalidateQueries(["product-detail", id]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id, queryClient]);

  const productData = product?.data || product;
  const categoryData = productData?.category;
  
  const breadcrumbItems = [];
  
  // Dùng state từ location thay vì window.location.referrer
  const isFromCategory = location.state?.fromCategory;
  
  if (isFromCategory && categoryData && categoryData._id && categoryData.name) {
      const categoryName = categoryData.name;
      const categorySlug = convertToSlug(categoryName);
      breadcrumbItems.push({ 
          name: categoryName, 
          onClick: () => navigate(`/product/category/${categorySlug}`) 
      });
  }
  
  breadcrumbItems.push({ name: 'Chi tiết sản phẩm' });

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 2,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 2,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      }
    ]
  };

  return (
    <div style={{ background: 'var(--bg-color)', width: '100%', minHeight: '100vh', paddingBottom: '40px' }}>
      <div style={{ padding: '0 24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        <BreadcrumbComponent items={breadcrumbItems} />
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-soft)', marginBottom: '32px' }}>
          <ProductDetailComponent 
            id={id} 
            product={product} 
            isLoading={isLoadingDetail} 
          />
        </div>

        {relatedProducts?.data && relatedProducts.data.length > 1 && (
          <div>
            <Title level={3} style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Sản phẩm liên quan</Title>
            <WrapperProductSlider>
              <Slider {...sliderSettings}>
                {relatedProducts.data
                  .filter((p) => p._id !== id)
                  .map((p) => (
                    <div key={p._id}>
                      <CardComponent
                        name={p.name}
                        image={p.image}
                        category={p.category}
                        price={p.price}
                        countInStock={p.countInStock}
                        rating={p.rating}
                        description={p.description}
                        selled={p.selled}
                        discount={p.discount}
                        id={p._id}
                      />
                    </div>
                  ))}
              </Slider>
            </WrapperProductSlider>
          </div>
        )}
      </div>
    </div>
  );
}
export default ProductDetailPage;