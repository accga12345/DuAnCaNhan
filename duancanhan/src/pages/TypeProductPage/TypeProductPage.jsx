import React from "react"
import TypeProduct from "../../components/TypeProducts/TypeProduct"
import { WapperHomePage, WrapperProductGrid } from "./style"
import SliderComponent from "../../components/SliderComponent/SliderComponent"
import CommitmentBanner from "../../components/CommitmentBanner/CommitmentBanner"
import BreadcrumbComponent from "../../components/BreadcrumbComponent/BreadcrumbComponent"
import slider1 from "../../assets/images/gearvn-build-pc.png"
import slider2 from "../../assets/images/gearvn-chuot-gaming.png"
import slider3 from "../../assets/images/gearvn-laptop-gaming.png"
import CardComponent from "../../components/CardComponent/CardComponent"
import { useParams, useNavigate } from "react-router-dom"
import { getProductByCategory, getAllCategoryProduct } from "../../services/ProductService"
import { convertToSlug } from "../../ultil"
import { useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { useDebounce } from "../../hooks/useDebounce"
import { Card, Radio, Space, Rate } from "antd"

const TypeProductPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const searchProduct = useSelector((state) => state.product?.search)
  const searchDebounce = useDebounce(searchProduct, 1000)
  const [products, setProducts] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  
  const [sortOption, setSortOption] = useState('')
  const [ratingFilter, setRatingFilter] = useState(0)
  
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getAllCategoryProduct(),
    retry: 3,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (categories?.data && slug) {
      const category = categories.data.find(c => convertToSlug(c.name) === slug);
      if (category) {
        setCategoryId(category._id);
      }
    }
  }, [categories, slug]);

  const fetchProductsByCategory = async (id) => {
    const res = await getProductByCategory(id, 100, 1); // fetch a large number for client side filtering
    setProducts(res);
  }

  useEffect(() => {
    if (categoryId) {
      fetchProductsByCategory(categoryId);
    }
  }, [categoryId]);

  const getFilteredAndSortedProducts = () => {
      let result = products?.data || [];
      
      if (searchDebounce) {
          result = result.filter(product => product?.name?.toLowerCase()?.includes(searchDebounce?.toLowerCase()));
      }

      if (ratingFilter > 0) {
          result = result.filter(product => product.rating >= ratingFilter);
      }

      if (sortOption === 'priceAsc') {
          result = [...result].sort((a, b) => a.price - b.price);
      } else if (sortOption === 'priceDesc') {
          result = [...result].sort((a, b) => b.price - a.price);
      } else if (sortOption === 'ratingDesc') {
          result = [...result].sort((a, b) => b.rating - a.rating);
      } else if (sortOption === 'selledDesc') {
          result = [...result].sort((a, b) => b.selled - a.selled);
      }

      return result;
  }

  const renderStarFilter = (stars) => (
      <div 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 0' }}
          onClick={() => setRatingFilter(ratingFilter === stars ? 0 : stars)}
      >
          <Rate disabled defaultValue={stars} style={{ fontSize: '14px', color: ratingFilter === stars ? '#1890ff' : '#fadb14' }} />
          <span style={{ fontSize: '14px', color: ratingFilter === stars ? '#1890ff' : 'var(--text-main)', fontWeight: ratingFilter === stars ? 600 : 400 }}>
              từ {stars} sao
          </span>
      </div>
  );

  const currentCategoryName = categories?.data?.find(c => c._id === categoryId)?.name || 'Sản phẩm';

  return (
    <div style={{ backgroundColor: "var(--bg-color)", padding: "20px 0", minHeight: '100vh' }}>
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 24px" }}>
        
        <BreadcrumbComponent items={[{ name: currentCategoryName }]} />

        <CommitmentBanner />

        <div style={{ display: "flex", gap: "24px", alignItems: 'flex-start' }}>
          {/* Left Sidebar */}
          <div style={{ width: "200px", flexShrink: 0, position: 'sticky', top: '90px' }}>
            <Card style={{ padding: "8px", borderRadius: "8px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 2px 6px 2px rgba(60,64,67,0.15)", border: "none", marginBottom: '16px' }} bodyStyle={{ padding: '12px' }}>
              <h3 style={{ marginBottom: "16px", fontWeight: "700", fontSize: '16px', color: 'var(--text-main)' }}>Danh mục</h3>
              <WapperHomePage style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
                  {categories?.data?.map((item) => (
                  <TypeProduct name={item.name} id={item._id} key={item._id} />
                  ))}
              </WapperHomePage>
            </Card>

            <Card style={{ padding: "8px", borderRadius: "8px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 2px 6px 2px rgba(60,64,67,0.15)", border: "none", marginBottom: '16px' }} bodyStyle={{ padding: '12px' }}>
              <h3 style={{ marginBottom: "16px", fontWeight: "700", fontSize: '16px', color: 'var(--text-main)' }}>Đánh giá</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {renderStarFilter(5)}
                  {renderStarFilter(4)}
                  {renderStarFilter(3)}
                  {renderStarFilter(2)}
                  {renderStarFilter(1)}
                  {renderStarFilter(0)}
              </div>
            </Card>

            <Card style={{ padding: "8px", borderRadius: "8px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 2px 6px 2px rgba(60,64,67,0.15)", border: "none" }} bodyStyle={{ padding: '12px' }}>
              <h3 style={{ marginBottom: "16px", fontWeight: "700", fontSize: '16px', color: 'var(--text-main)' }}>Sắp xếp theo</h3>
              <Radio.Group onChange={(e) => setSortOption(e.target.value)} value={sortOption}>
                <Space direction="vertical">
                  <Radio value="">Mặc định</Radio>
                  <Radio value="priceAsc">Giá thấp đến cao</Radio>
                  <Radio value="priceDesc">Giá cao đến thấp</Radio>
                  <Radio value="ratingDesc">Đánh giá tốt nhất</Radio>
                  <Radio value="selledDesc">Bán chạy nhất</Radio>
                </Space>
              </Radio.Group>
            </Card>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-soft)', marginBottom: '24px' }}>
              <SliderComponent arrImgs={[slider1, slider2, slider3]} />
            </div>

            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)', paddingLeft: '8px' }}>{currentCategoryName}</h2>

              <WrapperProductGrid>
              {getFilteredAndSortedProducts().map((product) => (
                <CardComponent key={product._id}
                  name={product.name}
                  image={product.image}
                  category={product.category}
                  price={product.price}
                  countInStock={product.countInStock}
                  rating={product.rating}
                  description={product.description}
                  selled={product.selled}
                  discount={product.discount}
                  id={product._id}
                />
              ))}
              </WrapperProductGrid>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TypeProductPage;