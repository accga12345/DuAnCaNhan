import React from "react"
import TypeProduct from "../../components/TypeProducts/TypeProduct"
import { WapperHomePage, WrapperProductItem, WrapperProductList } from "./style"
import SliderComponent from "../../components/SliderComponent/SliderComponent"
import slider1 from "../../assets/images/gearvn-build-pc.png"
import slider2 from "../../assets/images/gearvn-chuot-gaming.png"
import slider3 from "../../assets/images/gearvn-laptop-gaming.png"
import CardComponent from "../../components/CardComponent/CardComponent"
import NavBarComponent from "../../components/NavBarComponent/NavBarComponent"
import { Row, Col, Pagination } from "antd"
import { useParams } from "react-router-dom"
import { getProductByCategory, getAllCategoryProduct } from "../../services/ProductService"
import { convertToSlug } from "../../ultil"
import { useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { useDebounce } from "../../hooks/useDebounce"

const TypeProductPage = () => {
  const { slug } = useParams();
  const searchProduct = useSelector((state) => state.product?.search)
  const searchDebounce = useDebounce(searchProduct, 1000)
  const [products, setProducts] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  
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
    const res = await getProductByCategory(id, 10, 1);
    setProducts(res);
  }

  useEffect(() => {
    if (categoryId) {
      fetchProductsByCategory(categoryId);
    }
  }, [categoryId]);

  return (
    <div style={{ width: '100%', background: '#f5f5fa', minHeight: '100vh' }}>
      <div style={{ width: '100%', background: '#fff' }}>
        <div style={{ padding: '0 24px', width: '1440px', margin: '0 auto', borderBottom: '1px solid #f0f0f0' }}>
          <WapperHomePage>
            {categories?.data?.map((item) => (
              <TypeProduct name={item.name} id={item._id} key={item._id} />
            ))}
          </WapperHomePage>
        </div>
      </div>
      <div id="container" style={{ width: '1440px', margin: '0 auto', padding: '0 24px', backgroundColor: '#f5f5fa' }}>
        <div style={{ paddingTop: '20px' }}>
          <SliderComponent arrImgs={[slider1, slider2, slider3]} />
        </div>
        <Row gutter={20} style={{ marginTop: "20px" }}>
          <Col span={4}>
            <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "5px" }}>
              <NavBarComponent types={categories?.data} />
            </div>
          </Col>

          <Col span={20}>
            <WrapperProductList>
              {products?.data?.filter((product) => {
                if (searchDebounce === '') return product
                else if (product?.name?.toLowerCase()?.includes(searchDebounce?.toLowerCase())) return product
              })?.map((product) => (
                <WrapperProductItem key={product._id}>
                  <CardComponent
                    name={product.name}
                    image={product.image}
                    price={product.price}
                    countInStock={product.countInStock}
                    rating={product.rating}
                    description={product.description}
                    selled={product.selled}
                    discount={product.discount}
                    id={product._id}
                  />
                </WrapperProductItem>
              ))}
            </WrapperProductList>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default TypeProductPage