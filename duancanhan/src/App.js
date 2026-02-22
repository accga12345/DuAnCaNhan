import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import routes from './routes'
import DefaultComponent from './components/DefaultComponent/DefaultComponent'
import { isJsonString } from './ultil'
import { useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import { getDetailUser, axiosJwt, refreshToken } from './services/UserServices'
import { useDispatch } from 'react-redux'
import { updateUser } from './redux/slides/userSlide'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import LoadingComponent from './components/Loading/LoadingComponent'

function App() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user)
  const [loading, setLoading] = useState(false)


  useEffect(() => {
    setLoading(true)
    const { storageData, decode } = handleDecode();
    if (storageData && decode) {
      handlegetDetailUser(decode.id, storageData);
    }
    setLoading(false)
  }, [])

  const handleDecode = () => {
    let storageData = localStorage.getItem('access_token');
    let decode = {}
    if (storageData && isJsonString(storageData)) {
      storageData = JSON.parse(storageData);
      decode = jwtDecode(storageData);
    }
    return { storageData, decode }
  }

  axiosJwt.interceptors.request.use(
    async (config) => {
      let token = localStorage.getItem("access_token");

      if (token && isJsonString(token)) {
        token = JSON.parse(token);
        const decode = jwtDecode(token);

        if (decode.exp * 1000 < Date.now()) {
          try {
            const data = await refreshToken();
            token = data.accessToken;
            localStorage.setItem("access_token", JSON.stringify(token));
          } catch (err) {
            // refresh token không tồn tại → user đã logout
            localStorage.removeItem("access_token");
            window.location.href = "/";
            return Promise.reject(err);
          }
        }

        config.headers.token = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );



  const handlegetDetailUser = async (id, accessToken) => {
    const res = await getDetailUser(id, accessToken);
    console.log("res", res);
    dispatch(updateUser({ ...res.data, accessToken }));
  }

  return (
    <LoadingComponent isPending={loading}>
      <Router>
        <Routes>
          {routes.map((route) => {
            const Page = route.page
            const isCheckAuth = !route.isPrivate || user.isAdmin
            const Layout = route.isShowHeader ? DefaultComponent : React.Fragment

            return (
              <Route
                key={route.path}
                path={isCheckAuth ? route.path : "/"}
                element={
                  <Layout isHiddenSearch={route.isHiddenSearch} isCart={route.isCart}>
                    <Page />
                  </Layout>
                }
              />
            )
          })}
        </Routes>
      </Router>
    </LoadingComponent>
  )
}

export default App
