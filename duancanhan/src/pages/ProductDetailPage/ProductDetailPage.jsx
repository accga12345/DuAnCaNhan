import React, { useEffect } from "react";
import ProductDetailComponent from "../../components/ProductDetalComponent/ProductDetailComponent";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDetailProduct } from "../../services/ProductService";
import { io } from "socket.io-client";

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
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

  return (
    <div style={{ background: 'var(--bg-color)', width: '100%', minHeight: '100vh', paddingBottom: '40px' }}>
      <div style={{ padding: '0 24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        <h5 style={{ 
          color: "var(--text-secondary)", 
          padding: '24px 0', 
          fontSize: '14px', 
          fontWeight: '500',
          letterSpacing: '0.2px'
        }}>
          <span style={{ color: "var(--primary-color)", cursor: "pointer", fontWeight: '600' }} onClick={() => navigate("/")}>Trang chủ</span>
          <span style={{ margin: '0 8px', color: '#ccc' }}>/</span>
          <span style={{ color: 'var(--text-main)' }}>Chi tiết sản phẩm</span>
        </h5>
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