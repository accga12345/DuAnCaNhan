import React from "react";
import { Badge, Col } from "antd";
import { HomeOutlined, SmileOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { WapperHeaderComponent, WapperTextHeader, WapperHeaderAction, WapperAvatar } from "./style";
import ButtonInputSearch from "../ButtonInputSearch/ButtonInputSearch";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Dropdown } from "antd";
import { useState } from "react";
import { logoutUser } from "../../services/UserServices";
import { resetUser } from "../../redux/slides/userSlide";
import LoadingComponent from "../../components/Loading/LoadingComponent";
import { searchProduct } from "../../redux/slides/productSlide"
import { resetOrder } from "../../redux/slides/orderSlide";
import { io } from "socket.io-client";
import { BellOutlined } from "@ant-design/icons";
import { notification as antdNotification, Popover, List } from "antd";
import axios from "axios";
const HeaderComponent = ({ isHiddenSearch, isCart }) => {
  const [pending, setPending] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const product = useSelector((state) => state.product);
  const order = useSelector((state) => state.order);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  React.useEffect(() => {
    let socket;
    if (user.accessToken) {
      const backendUrl = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : "http://localhost:3001";
      socket = io(backendUrl);
      
      if (user.isAdmin || user.isEmployee) {
        socket.on("new_order", (newNoti) => {
          antdNotification.success({
            message: newNoti.title,
            description: newNoti.body,
            placement: "topRight"
          });
          setNotifications((prev) => [newNoti, ...prev]);
          setUnreadCount((prev) => prev + 1);
        });
      }

      socket.on("user_notification", (newNoti) => {
        if (newNoti.userId === user._id) {
          antdNotification.info({
            message: newNoti.title,
            description: newNoti.body,
            placement: "topRight"
          });
          setNotifications((prev) => [newNoti, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      });

      // Fetch old notifications
      const fetchNotifications = async () => {
        try {
          const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3001/api";
          const url = (user.isAdmin || user.isEmployee)
            ? `${baseUrl}/notification/get-all`
            : `${baseUrl}/notification/get-all?userId=${user._id}`;
          
          const res = await axios.get(url);
          if (res.data && res.data.data) {
            setNotifications(res.data.data);
            setUnreadCount(res.data.data.filter(n => !n.isRead).length);
          }
        } catch (e) {
          console.error("Fetch notifications error: ", e);
        }
      };
      fetchNotifications();
    }
    return () => {
      if (socket) socket.disconnect();
    };
  }, [user.accessToken, user.isAdmin, user.isEmployee, user._id]);

  const handleReadNotification = async (id) => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3001/api";
      await axios.put(`${baseUrl}/notification/mark-as-read/${id}`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const notificationContent = (
    <List
      itemLayout="horizontal"
      dataSource={notifications}
      renderItem={(item) => (
        <List.Item
          style={{ cursor: "pointer", background: item.isRead ? "transparent" : "#f0f2f5", padding: "10px" }}
          onClick={() => handleReadNotification(item._id)}
        >
          <List.Item.Meta
            title={item.title}
            description={item.body}
          />
        </List.Item>
      )}
      style={{ width: "300px", maxHeight: "400px", overflowY: "auto" }}
    />
  );

  const handleNavigateLogout = async () => {
    setPending(true);
    await logoutUser();
    localStorage.removeItem("access_token");
    dispatch(resetUser());
    dispatch(resetOrder());
    setTimeout(() => {
      setPending(false);
    }, 2000);
    navigate("/");
  };

  const handleNavigateLogin = () => {
    navigate("/signin");
  }

  const handelOnSearch = (e) => {
    setSearch(e.target.value);
    dispatch(searchProduct(e.target.value));
  }

  const items = [
    {
      key: '1',
      label: (
        <span onClick={() => navigate("/profile")}>
          Quản lý tài khoản
        </span>
      ),
    },
    {
      key: '2',
      label: (
        <span onClick={() => navigate("/my-order")}>
          Đơn hàng của tôi
        </span>
      ),
    },
    {
      key: '3',
      label: (
        <span onClick={handleNavigateLogout}>
          Đăng xuất
        </span>
      ),
    },
  ];

  if (user.isAdmin || user.isEmployee) {
    items.push({
      key: '4',
      label: (
        <span onClick={() => navigate("/system")}>
          Quản lý hệ thống
        </span>
      ),
    })
  }
  return (
    <div style={{ background: '#fff', width: '100%', display: 'flex', justifyContent: 'center' }}>
      <WapperHeaderComponent style={{ width: '1440px', justifyContent: isHiddenSearch || isCart ? 'space-between' : 'center' }}>
        <Col span={6}>
          <WapperTextHeader style={{ cursor: 'pointer' }} onClick={() => navigate("/")}>Tech Shop</WapperTextHeader>
        </Col>

        {!isHiddenSearch && (
          <Col span={12}>
            <ButtonInputSearch
              size="large"
              placeholder="Tìm kiếm sản phẩm, hàng hóa hay thương hiệu mong muốn..."
              variant="borderless"
              textButton="Tìm Kiếm"
              onChange={handelOnSearch}
            />
          </Col>
        )}

        <Col span={6}>
          <WapperHeaderAction>
            <div className="item">
              <HomeOutlined />
              <span className="text-item" onClick={() => navigate("/")}>Trang Chủ</span>
            </div>
            <LoadingComponent isPending={pending}>
              {user.accessToken ? (
                <Dropdown menu={{ items }} placement="bottom" arrow>
                  <div className="item">
                    {user?.avatar ? (
                      <WapperAvatar>
                        <img src={user.avatar} alt="avatar" />
                      </WapperAvatar>
                    ) : (
                      <SmileOutlined />
                    )}
                    <span className="user-name text-item">
                      {user.name || user.email}
                    </span>
                  </div>
                </Dropdown>
              ) : (
                <div className="item">
                  <SmileOutlined />
                  <span className="text-item" onClick={handleNavigateLogin}>Tài Khoản</span>
                </div>
              )}
            </LoadingComponent>

            {!isCart && (
              <div className="divider"></div>
            )}

            {!isCart && (
              <div className="item" onClick={() => navigate('/order')} style={{ cursor: 'pointer' }}>
                <Badge count={order?.orderItems?.length || 0} size="small">
                  <ShoppingCartOutlined style={{ fontSize: '16px' }} />
                </Badge>
              </div>
            )}

            {user.accessToken && (
              <>
                <div className="divider"></div>
                <Popover content={notificationContent} title="Thông báo" trigger="click" placement="bottomRight">
                  <div className="item" style={{ cursor: 'pointer' }}>
                    <Badge count={unreadCount} size="small">
                      <BellOutlined style={{ fontSize: '16px' }} />
                    </Badge>
                  </div>
                </Popover>
              </>
            )}
          </WapperHeaderAction>
        </Col>
      </WapperHeaderComponent>
    </div>
  );
};

export default HeaderComponent;
