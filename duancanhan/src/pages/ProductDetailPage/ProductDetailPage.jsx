import React from "react";
import ProductDetailComponent from "../../components/ProductDetalComponent/ProductDetailComponent";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDetailProduct, getProductType } from "../../services/ProductService";

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const { data: product, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["product-detail", id],
    queryFn: () => getDetailProduct(id),
    enabled: !!id,
  });

  const { data: similarProducts, isLoading: isLoadingSimilar } = useQuery({
    queryKey: ["similar-products", product?.data?.type],
    queryFn: () => getProductType(product?.data?.type),
    enabled: !!product?.data?.type,
  });

  return (
    <div style={{ background: '#f4f4f4', width: '100%', minHeight: '100vh', paddingBottom: '40px' }}>
      <div style={{ padding: '0 24px', width: '1440px', margin: '0 auto' }}>
        <h5 style={{ color: "rgb(128, 128, 137)", padding: '15px 0', fontSize: '14px', fontWeight: '400' }}>
          <span style={{ color: "#000", cursor: "pointer" }} onClick={() => navigate("/")}>Trang chủ</span> / Chi tiết sản phẩm
        </h5>
        <ProductDetailComponent 
          id={id} 
          product={product} 
          isLoading={isLoadingDetail} 
          similarProducts={similarProducts?.data || []}
          isLoadingSimilar={isLoadingSimilar}
        />
      </div>
    </div>
  );
}
export default ProductDetailPage;