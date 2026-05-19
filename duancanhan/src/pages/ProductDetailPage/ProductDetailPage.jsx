import React, { useEffect } from "react";
import ProductDetailComponent from "../../components/ProductDetalComponent/ProductDetailComponent";
import BreadcrumbComponent from "../../components/BreadcrumbComponent/BreadcrumbComponent";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDetailProduct } from "../../services/ProductService";
import { convertToSlug } from "../../ultil";
import { io } from "socket.io-client";

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

  return (
    <div style={{ background: 'var(--bg-color)', width: '100%', minHeight: '100vh', paddingBottom: '40px' }}>
      <div style={{ padding: '0 24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        <BreadcrumbComponent items={breadcrumbItems} />
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-soft)' }}>
          <ProductDetailComponent 
            id={id} 
            product={product} 
            isLoading={isLoadingDetail} 
          />
        </div>
      </div>
    </div>
  );
}
export default ProductDetailPage;