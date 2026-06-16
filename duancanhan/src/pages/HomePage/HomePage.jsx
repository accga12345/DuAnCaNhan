import React from "react"
import { WrapperButtonMore, WrapperProductGrid, WrapperProductSlider } from "./style"
import SliderComponent from "../../components/SliderComponent/SliderComponent"
import CommitmentBanner from "../../components/CommitmentBanner/CommitmentBanner"
import SidebarComponent from "../../components/SidebarComponent/SidebarComponent"
import CardComponent from "../../components/CardComponent/CardComponent"
import { useQuery } from "@tanstack/react-query"
import { getAllProduct } from "../../services/ProductService";
import { getAllCategories } from "../../services/CategoryService";
import { getAllBrands } from "../../services/BrandService";
import { useSelector } from "react-redux"
import { useState, useRef, useEffect, useMemo } from "react"
import { Select } from "antd"
import { useDebounce } from "../../hooks/useDebounce"
import Slider from "react-slick"

const HomePage = () => {
  const searchProduct = useSelector((state) => state.product?.search)
  const searchDebounce = useDebounce(searchProduct, 1000)
  const [limit, setLimit] = useState(12)
  const [sortOption, setSortOption] = useState('')
  const [ratingFilter, setRatingFilter] = useState(0)
  const [brandFilter, setBrandFilter] = useState('')
  const refSearch = useRef()
  const initialLoad = useRef(true)

  // Map sortOption string to backend array format [order, field]
  const backendSort = useMemo(() => {
    switch (sortOption) {
      case 'priceAsc': return ['asc', 'price'];
      case 'priceDesc': return ['desc', 'price'];
      case 'ratingDesc': return ['desc', 'rating'];
      case 'selledDesc': return ['desc', 'selled'];
      default: return null;
    }
  }, [sortOption]);

  // Map filters to backend array format [field, value]
  const backendFilter = useMemo(() => {
    let filters = [];
    if (searchDebounce) {
      filters.push('name', searchDebounce);
    }
    if (ratingFilter > 0) {
      filters.push('rating', ratingFilter.toString());
    }
    if (brandFilter) {
      filters.push('brand', brandFilter);
    }
    return filters.length > 0 ? filters : null;
  }, [searchDebounce, ratingFilter, brandFilter]);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", limit, backendSort, backendFilter],
    queryFn: () => getAllProduct(limit, 1, backendSort, backendFilter),
    retry: 3,
    retryDelay: 1000,
    placeholderData: (previousData) => previousData,
  });

  const { data: bestSellingProducts } = useQuery({
    queryKey: ["bestSellingProducts"],
    queryFn: () => getAllProduct(10, 1, ['desc', 'selled'], null),
    retry: 3,
    retryDelay: 1000,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getAllCategories(),
    retry: 3,
    retryDelay: 1000,
    placeholderData: (previousData) => previousData,
  });

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: () => getAllBrands(),
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

  const bestSellingSliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 2,
    autoplay: true,
    autoplaySpeed: 4000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

  return (
    <div style={{ backgroundColor: "var(--bg-color)", padding: "8px 0" }}>
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 24px" }}>

        {/* Top Full Width Section */}
        <CommitmentBanner />

        <div style={{ display: "flex", gap: "24px", alignItems: 'flex-start', marginTop: '16px' }}>
          {/* Left Sidebar */}
          <div style={{ width: '250px', flexShrink: 0 }}>
            {/* Sidebar Filters */}
            <SidebarComponent
                brands={brands}
                brandFilter={brandFilter}
                setBrandFilter={setBrandFilter}
                ratingFilter={ratingFilter}
                setRatingFilter={setRatingFilter}
                setLimit={setLimit}
            />
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
              {/* Slider Section */}
              <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-soft)', marginBottom: '24px' }}>
                <SliderComponent />
              </div>

              <div>
                {/* Best Selling Section */}
                <h2 style={{ fontSize: '30px', fontWeight: 700, marginTop: 0, marginBottom: '16px', color: 'var(--text-main)', paddingLeft: '8px' }}>Sản phẩm bán chạy</h2>
                {bestSellingProducts?.data && bestSellingProducts.data.length > 0 && (
                  <WrapperProductSlider>
                    <Slider {...bestSellingSliderSettings}>
                      {bestSellingProducts.data.map((product) => (
                        <div key={product._id}>
                          <CardComponent
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
                        </div>
                      ))}
                    </Slider>
                  </WrapperProductSlider>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 16px 8px' }}>
                  <h2 style={{ fontSize: '30px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Gợi ý hôm nay</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: 500 }}>Sắp xếp:</span>
                    <Select
                      value={sortOption}
                      onChange={(value) => { setSortOption(value); setLimit(12); }}
                      style={{ width: 180 }}
                      placeholder="Mặc định"
                      options={[
                        { value: '', label: 'Mặc định' },
                        { value: 'priceAsc', label: 'Giá thấp đến cao' },
                        { value: 'priceDesc', label: 'Giá cao đến thấp' },
                        { value: 'ratingDesc', label: 'Đánh giá tốt nhất' },
                        { value: 'selledDesc', label: 'Bán chạy nhất' },
                      ]}
                    />
                  </div>
                </div>

                <WrapperProductGrid>
                  {products?.data?.map((product) => (
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

        {/* Xem thêm button - full width below sidebar+content */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "32px", paddingBottom: "16px" }}>
          <WrapperButtonMore
            textButton={isLoading ? "Đang tải..." : "Xem thêm"}
            type="outline"
            styleButton={{
              border: "1px solid var(--primary-color)",
              color: `${products?.totalProducts <= products?.data?.length ? "#ccc" : "var(--primary-color)"}`,
              width: "240px",
              height: "40px",
              borderRadius: "4px",
              fontSize: '15px',
              fontWeight: 500,
            }}
            onClick={() => setLimit((prev) => prev + 6)}
            disabled={products?.totalProducts <= products?.data?.length || isLoading}
            ref={refSearch}
          />
        </div>
      </div>
    </div>
  )
}

export default HomePage;
