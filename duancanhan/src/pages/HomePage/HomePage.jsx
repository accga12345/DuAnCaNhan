import React from "react"
import TypeProduct from "../../components/TypeProducts/TypeProduct"
import { WapperHomePage, WrapperButtonMore, WrapperProductGrid } from "./style"
import SliderComponent from "../../components/SliderComponent/SliderComponent"
import slider1 from "../../assets/images/gearvn-build-pc.png"
import slider2 from "../../assets/images/gearvn-build-pc.png"
import slider3 from "../../assets/images/gearvn-build-pc.png"
import CardComponent from "../../components/CardComponent/CardComponent"
import { useQuery } from "@tanstack/react-query"
import { getAllProduct } from "../../services/ProductService";
import { getAllCategories } from "../../services/CategoryService";
import { useSelector } from "react-redux"
import { useState, useRef, useEffect } from "react"
import { useDebounce } from "../../hooks/useDebounce"

const HomePage = () => {
  const searchProduct = useSelector((state) => state.product?.search)
  const searchDebounce = useDebounce(searchProduct, 1000)
  const [limit, setLimit] = useState(6)
  const [pending, setPending] = useState(false)
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

  return (
    <>
      <div style={{ width: "1440px", margin: "0 auto", padding: "0 24px", borderBottom: '1px solid #f0f0f0' }}>
        <WapperHomePage>
          {categories?.data?.map((item) => (
            <TypeProduct name={item.name} id={item._id} key={item._id} />
          ))}
        </WapperHomePage>
      </div>
      <div style={{ backgroundColor: "#efefef" }}>
        <div id="container" style={{ width: "1440px", margin: "0 auto", padding: "10px 24px 0", backgroundColor: "#efefef" }}>
          <SliderComponent arrImgs={[slider1, slider2, slider3]} />
          <h2 style={{ color: "rgb(128, 128, 137)", marginTop: "20px" }}>Sản phẩm mới</h2>
          <WrapperProductGrid>
            {products?.data?.filter((product) => {
              if (searchDebounce === '') {
                return product
              } else if (product?.name?.toLowerCase()?.includes(searchDebounce?.toLowerCase())) {
                return product
              }
            })?.map((product) => (
              <CardComponent key={
              product._id}
              name={product.name}
              image={product.image}
              category={product.category}
              price={product.price}
              countInStock={product.countInStock}
              rating={product.rating}
              description={product.description}
              selled={product.selled}
              discount={product.discount}
              id={product._id} />            ))}
          </WrapperProductGrid>
          <div style={{ display: "flex", justifyContent: "center", marginTop: "20px", marginBottom: "20px" }}>
            <WrapperButtonMore
              textButton={isLoading ? "Loading..." : "Xem thêm"}
              type="outline"
              styleButton={{
                border: "1px solid rgb(11, 116, 229)",
                color: `${products?.totalProducts === products?.data?.length ? "#ccc" : "rgb(11, 116, 229)"}`,
                width: "240px",
                height: "38px",
                borderRadius: "4px"
              }}
              styleTextButton={{ fontWeight: 500 }}
              onClick={() => {
                setLimit((prev) => prev + 6)
              }}
              disabled={products?.totalProducts === products?.data?.length || isLoading}
              ref={refSearch}
            />
          </div>

        </div>
      </div>
    </>
  )
}

export default HomePage