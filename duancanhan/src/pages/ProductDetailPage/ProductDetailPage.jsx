import React from "react";
import ProductDetailComponent from "../../components/ProductDetalComponent/ProductDetailComponent";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDetailProduct } from "../../services/ProductService";

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getDetailProduct(id),
    enabled: !!id,
    retry: 3,
    retryDelay: 1000,
  });

  return (
    <div style={{ background: '#efefef', width: '100%', minHeight: '100vh' }}>
      <div style={{ padding: '0 24px', width: '1440px', margin: '0 auto' }}>
        <h2 style={{ color: "rgb(128, 128, 137)", paddingTop: '20px' }}><span style={{ color: "#000", cursor: "pointer" }} onClick={() => navigate("/")}>Trang chủ</span> / Chi tiết sản phẩm</h2>
        <ProductDetailComponent id={id} product={product} isLoading={isLoading} />
      </div>
    </div>
  );
}
export default ProductDetailPage;