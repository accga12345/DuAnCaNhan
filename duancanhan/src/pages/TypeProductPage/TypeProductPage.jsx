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
import { useLocation, useParams } from "react-router-dom"
import { getProductType, getAllTypeProduct } from "../../services/ProductService"
import { useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { convertToSlug } from "../../ultil"
import { useSelector } from "react-redux"
import { useDebounce } from "../../hooks/useDebounce"

const TypeProductPage = () => {
  const { state } = useLocation();
  const { type: typeSlug } = useParams();
  const searchProduct = useSelector((state) => state.product?.search)
  const searchDebounce = useDebounce(searchProduct, 1000)
  const [products, setProducts] = useState([]);
  const [typeName, setTypeName] = useState(state?.name);
  const [filter, setFilter] = useState({ type: '', value: '' });

  const { data: typeProducts } = useQuery({
    queryKey: ["typeProducts"],
    queryFn: () => getAllTypeProduct(),
    retry: 3,
    retryDelay: 1000,
    placeholderData: (previousData) => previousData,
  });

  const handleOnchangeFilter = (filter) => {
    setFilter(filter);
  }

  useEffect(() => {
    if (state?.name) {
      setTypeName(state.name);
    } else if (typeSlug && typeProducts?.data) {
      const actualName = typeProducts.data.find(t => convertToSlug(t) === typeSlug);
      if (actualName) {
        setTypeName(actualName);
      }
    }
  }, [state, typeSlug, typeProducts]);

  const fetchTypeProducts = async (type, filterType, filterValue) => {
    const res = await getProductType(type, filterType, filterValue);
    setProducts(res);
  }

  useEffect(() => {
    if (typeName) {
      fetchTypeProducts(typeName, filter.type, filter.value);
    }
  }, [typeName, filter]);

  return (
    <div style={{ width: '100%', background: '#f5f5fa', minHeight: '100vh' }}>
      <div style={{ width: '100%', background: '#fff' }}>
        <div style={{ padding: '0 24px', width: '1440px', margin: '0 auto', borderBottom: '1px solid #f0f0f0' }}>
          <WapperHomePage>
            {typeProducts?.data?.map((item) => (
              <TypeProduct name={item} key={item} />
            ))}
          </WapperHomePage>
        </div>
      </div>
      <div id="container" style={{ width: '1440px', margin: '0 auto', padding: '0 24px', backgroundColor: '#f5f5fa' }}>
        <div style={{ paddingTop: '20px' }}>
          <SliderComponent arrImgs={[slider1, slider2, slider3]} />
        </div>
        <Row
          gutter={20}
          style={{ marginTop: "20px" }}
        >
          <Col span={4}>
            <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "5px" }}>
              <NavBarComponent types={typeProducts?.data} onChange={handleOnchangeFilter} />
            </div>
          </Col>

          <Col span={20}>
            <WrapperProductList>
              {products?.data?.filter((product) => {
                if (searchDebounce === '') {
                  return product
                } else if (product?.name?.toLowerCase()?.includes(searchDebounce?.toLowerCase())) {
                  return product
                }
              })?.map((product) => (
                <WrapperProductItem key={product._id}>
                  <CardComponent
                    name={product.name}
                    image={product.image}
                    type={product.type}
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

          <Col span={24} style={{ display: "flex", justifyContent: "center", marginTop: "20px", marginBottom: "20px" }}>
            <Pagination defaultCurrent={1} total={50} />
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default TypeProductPage