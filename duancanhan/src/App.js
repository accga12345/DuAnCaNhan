import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import routes from './routes'
import DefaultComponent from './components/DefaultComponent/DefaultComponent'
import { isJsonString } from './ultil'
import { useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import { getDetailUser, axiosJwt, refreshToken } from './services/UserServices'
import { useDispatch } from 'react-redux'
import { updateUser, resetUser } from './redux/slides/userSlide'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import LoadingComponent from './components/Loading/LoadingComponent'
import { MessageComponent } from './components/MessageComponent/MessageComponent'


axiosJwt.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem("access_token");

    if (token && isJsonString(token)) {
      token = JSON.parse(token);
      const decode = jwtDecode(token);

      if (decode.exp * 1000 < Date.now()) {
        try {
          let data = await refreshToken();
          token = data.accessToken;
          localStorage.setItem("access_token", JSON.stringify(token));
        } catch (err) {
          localStorage.removeItem("access_token");
          return Promise.reject(err);
        }
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

function App() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user)
  const [loading, setLoading] = useState(false)


  useEffect(() => {
    setLoading(true)
    const { storageData, decode } = handleDecode();
    if (storageData && decode) {
      handlegetDetailUser(decode.id, storageData);
    } else {
      dispatch(resetUser());
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

  const handlegetDetailUser = async (id, accessToken) => {
    try {
      const res = await getDetailUser(id, accessToken);
      dispatch(updateUser({ ...res.data, accessToken }));
    } catch (error) {
      console.error(error);
      dispatch(resetUser());
      localStorage.removeItem("access_token");
    }
  }

  return (
    <LoadingComponent isPending={loading}>
      <MessageComponent>
        <Router>
          <Routes>
            {routes.map((route) => {
              const Page = route.page
              const isCheckAuth = !route.isPrivate || user.isAdmin || user.isEmployee
              const Layout = route.isShowHeader ? DefaultComponent : React.Fragment

              return (
                <Route
                  key={route.path}
                  path={isCheckAuth ? route.path : "/"}
                  element={
                    <Layout isHiddenSearch={route.isHiddenSearch} isCart={route.isCart} isShowFooter={route.isShowFooter}>
                            <Page />
                    </Layout>
                  }
                />
              )
            })}
          </Routes>
        </Router>
      </MessageComponent>
    </LoadingComponent>
  )
}

export default App
