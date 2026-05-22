import React from "react"
import TypeProduct from "../../components/TypeProducts/TypeProduct"
import { WapperHomePage, WrapperButtonMore, WrapperProductGrid } from "./style"
import SliderComponent from "../../components/SliderComponent/SliderComponent"
import CommitmentBanner from "../../components/CommitmentBanner/CommitmentBanner"
import slider1 from "../../assets/images/gearvn-build-pc.png"
import slider2 from "../../assets/images/gearvn-build-pc.png"
import slider3 from "../../assets/images/gearvn-build-pc.png"
import CardComponent from "../../components/CardComponent/CardComponent"
import { useQuery } from "@tanstack/react-query"
import { getAllProduct } from "../../services/ProductService";
import { getAllCategories } from "../../services/CategoryService";
import { useSelector } from "react-redux"
import { useState, useRef, useEffect } from "react"
import { Card, Radio, Space, Rate } from "antd"
import { useDebounce } from "../../hooks/useDebounce"

const HomePage = () => {
  const searchProduct = useSelector((state) => state.product?.search)
  const searchDebounce = useDebounce(searchProduct, 1000)
  const [limit, setLimit] = useState(12)
  const [sortOption, setSortOption] = useState('')
  const [ratingFilter, setRatingFilter] = useState(0)
  const refSearch = useRef()
  const initialLoad = useRef(true)

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", limit],
    queryFn: () => getAllProduct(limit, 0),
    retry: 3,
    retryDelay: 1000,
    placeholderData: (previousData) => previousData,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getAllCategories(),
    retry: 3,
    retryDelay: 1000,
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false
      return
    }
    if (products?.data?.length > 0) {
      refSearch.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [products])

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

  return (
    <div style={{ backgroundColor: "var(--bg-color)", padding: "20px 0" }}>
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 24px" }}>

        {/* Top Full Width Section */}
        <CommitmentBanner />

        <div style={{ display: "flex", gap: "24px", alignItems: 'flex-start' }}>
          {/* Left Sidebar */}
          <div style={{ width: "200px", flexShrink: 0, position: 'sticky', top: '90px' }}>
            <Card style={{ padding: "8px", borderRadius: "8px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 2px 6px 2px rgba(60,64,67,0.15)", border: "none", marginBottom: '16px' }} bodyStyle={{ padding: '12px' }}>
              <h3 style={{ marginBottom: "16px", fontWeight: "700", fontSize: '16px', color: 'var(--text-main)' }}>Danh mục</h3>
              <WapperHomePage style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
                <div style={{ padding: '8px', border: '1px solid #1890ff', borderRadius: '4px', textAlign: 'center', marginBottom: '8px', cursor: 'pointer' }} onClick={() => window.location.href = '/xay-dung-cau-hinh'}>
                  <span style={{ fontWeight: "700", color: "#1890ff" }}>🛠 Xây dựng cấu hình PC</span>
                </div>

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
              {/* Best Selling Section */}
              <h2 style={{ fontSize: '30px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)', paddingLeft: '8px' }}>Sản phẩm bán chạy</h2>
              <WrapperProductGrid>
                {products?.data
                  ?.sort((a, b) => b.selled - a.selled || b.rating - a.rating)
                  ?.slice(0, 4)
                  ?.map((product) => (
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

              <h2 style={{ fontSize: '30px', fontWeight: 700, margin: '32px 0 16px 8px', color: 'var(--text-main)' }}>Gợi ý hôm nay</h2>

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

              <div style={{ display: "flex", justifyContent: "center", marginTop: "32px", paddingBottom: "16px" }}>
                <WrapperButtonMore
                  textButton={isLoading ? "Đang tải..." : "Xem thêm"}
                  type="outline"
                  styleButton={{
                    border: "1px solid var(--primary-color)",
                    color: `${products?.totalProducts === products?.data?.length ? "#ccc" : "var(--primary-color)"}`,
                    width: "240px",
                    height: "40px",
                    borderRadius: "4px",
                    fontSize: '15px',
                    fontWeight: 500,
                  }}
                  onClick={() => setLimit((prev) => prev + 6)}
                  disabled={products?.totalProducts === products?.data?.length || isLoading}
                  ref={refSearch}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage;