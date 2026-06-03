import React from "react"
import TypeProduct from "../../components/TypeProducts/TypeProduct"
import { WrapperProductGrid } from "./style"
import SliderComponent from "../../components/SliderComponent/SliderComponent"
import CommitmentBanner from "../../components/CommitmentBanner/CommitmentBanner"
import BreadcrumbComponent from "../../components/BreadcrumbComponent/BreadcrumbComponent"
import SidebarComponent from "../../components/SidebarComponent/SidebarComponent"
import slider1 from "../../assets/images/gearvn-build-pc.png"
import slider2 from "../../assets/images/gearvn-chuot-gaming.png"
import slider3 from "../../assets/images/gearvn-laptop-gaming.png"
import CardComponent from "../../components/CardComponent/CardComponent"
import { useParams } from "react-router-dom"
import { getProductByCategory, getAllCategoryProduct } from "../../services/ProductService"
import { getAllBrands } from "../../services/BrandService"
import { convertToSlug } from "../../ultil"
import { useQuery } from "@tanstack/react-query"
import { useState, useEffect, useMemo } from "react"
import { useSelector } from "react-redux"
import { useDebounce } from "../../hooks/useDebounce"
import { Select } from "antd"

const TypeProductPage = () => {
  const { slug } = useParams();
  const searchProduct = useSelector((state) => state.product?.search)
  const searchDebounce = useDebounce(searchProduct, 1000)
  const [products, setProducts] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  
  const [sortOption, setSortOption] = useState('')
  const [ratingFilter, setRatingFilter] = useState(0)
  const [brandFilter, setBrandFilter] = useState('')
  
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getAllCategoryProduct(),
    retry: 3,
    retryDelay: 1000,
  });

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: () => getAllBrands(),
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

  const backendSort = useMemo(() => {
    switch (sortOption) {
      case 'priceAsc': return ['asc', 'price'];
      case 'priceDesc': return ['desc', 'price'];
      case 'ratingDesc': return ['desc', 'rating'];
      case 'selledDesc': return ['desc', 'selled'];
      default: return null;
    }
  }, [sortOption]);

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

  const fetchProductsByCategory = async (id, sort, filterArr) => {
    const res = await getProductByCategory(id, 100, 1, sort, filterArr);
    setProducts(res);
  }

  useEffect(() => {
    if (categoryId) {
      fetchProductsByCategory(categoryId, backendSort, backendFilter);
    }
  }, [categoryId, backendSort, backendFilter]);

  const currentCategoryName = categories?.data?.find(c => c._id === categoryId)?.name || 'Sản phẩm';

  return (
    <div style={{ backgroundColor: "var(--bg-color)", padding: "8px 0", minHeight: '100vh' }}>
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 24px" }}>
        
        <CommitmentBanner />
        <BreadcrumbComponent items={[{ name: currentCategoryName }]} />

        <div style={{ display: "flex", gap: "24px", alignItems: 'flex-start' }}>
          {/* Left Sidebar */}
          <SidebarComponent 
            categories={categories}
            brands={brands}
            brandFilter={brandFilter}
            setBrandFilter={setBrandFilter}
            ratingFilter={ratingFilter}
            setRatingFilter={setRatingFilter}
            sortOption={sortOption}
            setSortOption={setSortOption}
            categoryId={categoryId}
            showPCBuilder={false}
          />

          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: '850px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-soft)', marginBottom: '24px' }}>
                <SliderComponent arrImgs={[slider1, slider2, slider3]} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingLeft: '8px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{currentCategoryName}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: 500 }}>Sắp xếp:</span>
                    <Select
                      value={sortOption}
                      onChange={(value) => { setSortOption(value); }}
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
        </div>
      </div>
    </div>
  )
}

export default TypeProductPage;
