import React, { useRef } from "react";
import { Badge, Col, Button } from "antd";
import { HomeOutlined, SmileOutlined, ShoppingCartOutlined, CloseOutlined } from "@ant-design/icons";
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
import { showSuccess, showError } from "../MessageComponent/MessageComponent";

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

  // === LIVE CHAT STATES ===
  const [socketObj, setSocketObj] = useState(null);
  const [pendingChats, setPendingChats] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [openChats, setOpenChats] = useState([]); // Array of customerIds
  const [selectedChat, setSelectedChat] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState({});
  const [chatInputs, setChatInputs] = useState({}); // { customerId: '' }
  const messagesEndRef = useRef(null);

  const getCustomerLabel = (customerName, index) => {
    if (customerName && customerName !== 'Khách hàng') return customerName;
    return `Khách hàng ${index + 1}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }
  React.useEffect(() => { scrollToBottom() }, [chatMessages, openChats]);

  const toggleChatWindow = (chat) => {
    if (openChats.includes(chat.customerId)) {
      setOpenChats(prev => prev.filter(id => id !== chat.customerId));
    } else {
      if (openChats.length >= 3) {
        antdNotification.warning({ message: 'Thông báo', description: 'Bạn chỉ có thể mở tối đa 3 khung chat cùng lúc. Hãy đóng bớt 1 khung.' });
      } else {
        setOpenChats(prev => [...prev, chat.customerId]);
      }
    }
  };

  const handleEndChat = (customerId) => {
    const chat = activeChats.find(c => c.customerId === customerId);
    if (socketObj && chat) {
      socketObj.emit('end_chat', chat.roomName);
      setActiveChats(prev => prev.filter(c => c.customerId !== customerId));
      setOpenChats(prev => prev.filter(id => id !== customerId));
    }
  };

  React.useEffect(() => {
    let socket;
    if (user.accessToken) {
      const backendUrl = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : "http://localhost:3001";
      socket = io(backendUrl);
      setSocketObj(socket);

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

        // Live Chat Events cho Staff
        socket.emit('join_staff_room', { id: user._id, name: user.name || 'Nhân viên' });

        socket.on('pending_requests', (requests) => {
          setPendingChats(requests);
        });

        socket.on('new_chat_request', (request) => {
          setPendingChats(prev => {
            if (!prev.find(r => r.customerId === request.customerId)) {
              antdNotification.info({
                message: 'Yêu cầu hỗ trợ mới',
                description: `Khách hàng ${request.customerName} đang cần tư vấn.`,
                placement: "topRight"
              });
              return [...prev, request];
            }
            return prev;
          });
        });

        socket.on('chat_request_taken', (customerId) => {
          setPendingChats(prev => prev.filter(r => r.customerId !== customerId));
        });

        socket.on('chat_connected', (data) => {
          setActiveChats(prev => {
            if (!prev.find(c => c.customerId === data.customerId)) {
              return [...prev, data];
            }
            return prev;
          });
          // Tự động mở khung chat cho nhân viên
          setOpenChats(prev => {
            if (!prev.includes(data.customerId) && prev.length < 3) {
              return [...prev, data.customerId];
            }
            return prev;
          });
        });

        socket.on('receive_chat_message', (data) => {
          const customerId = data.roomName?.replace('chat_', '');
          if (customerId) {
            setChatMessages(prev => {
              const existing = prev[customerId] || [];

              const currentUserId = String(user?._id);
              const isMe = String(data.sender) === currentUserId;

              return {
                ...prev,
                [customerId]: [...existing, {
                  sender: isMe ? 'me' : 'customer',
                  text: data.message,
                  senderName: data.senderName,
                  timestamp: data.timestamp
                }]
              };
            });
          }
        });

        socket.on('chat_ended', (roomName) => {
          const customerId = roomName?.replace('chat_', '');
          if (customerId) {
            setChatMessages(prev => ({
              ...prev,
              [customerId]: [...(prev[customerId] || []), { sender: 'system', text: 'Khách hàng đã kết thúc cuộc trò chuyện.' }]
            }));
          }
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

  const handleAcceptChat = (customerId) => {
    if (socketObj) {
      socketObj.emit('staff_accept_chat', customerId);
      // Auto-open the chat window when accepted
      if (!openChats.includes(customerId)) {
        if (openChats.length < 3) {
          setOpenChats(prev => [...prev, customerId]);
        }
      }
    }
  };

  const handleSendChatMessage = (customerId) => {
    const message = chatInputs[customerId];
    if (!message || !message.trim()) return;
    const chat = activeChats.find(c => c.customerId === customerId);
    if (!chat) return;
    socketObj.emit('send_chat_message', {
      roomName: chat.roomName,
      message: message,
      sender: user?._id || user?.id || socketObj.id,
      senderName: user?.name || 'Nhân viên'
    });
    setChatInputs(prev => ({ ...prev, [customerId]: '' }));
  };

  const notificationContent = (
    <div style={{ width: "320px", maxHeight: "400px", overflowY: "auto" }}>
      {pendingChats.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 'bold', padding: '5px 10px', background: '#e6f7ff', color: '#1890ff' }}>
            Yêu cầu Chat ({pendingChats.length})
          </div>
          <List
            itemLayout="horizontal"
            dataSource={pendingChats}
            renderItem={(item) => (
              <List.Item
                style={{ padding: "10px", background: '#fff' }}
                actions={[<Button type="primary" size="small" onClick={() => handleAcceptChat(item.customerId)}>Reply</Button>]}
              >
                <List.Item.Meta
                  title={item.customerName}
                  description="Đang chờ hỗ trợ..."
                />
              </List.Item>
            )}
          />
        </div>
      )}
      {activeChats.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 'bold', padding: '5px 10px', background: '#f6ffed', color: '#52c41a' }}>
            Đang diễn ra ({activeChats.length})
          </div>
          <List
              itemLayout="horizontal"
              dataSource={activeChats}
              renderItem={(item) => (
                <List.Item
                  style={{ padding: "10px", background: '#fff' }}
                  actions={[
                    <Button 
                      type="primary" 
                      ghost 
                      size="small" 
                      onClick={() => {
                        if (!openChats.includes(item.customerId)) {
                          if (openChats.length < 3) {
                            setOpenChats(prev => [...prev, item.customerId]);
                          } else {
                            showError('Bạn chỉ có thể mở tối đa 3 khung chat cùng lúc. Hãy đóng bớt 1 khung.');
                          }
                        }
                      }}
                    >
                      Mở
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={item.customerName}
                    description="Bạn đang tư vấn"
                  />
                </List.Item>
              )}
            />
        </div>
      )}
      <div style={{ fontWeight: 'bold', padding: '5px 10px', background: '#f5f5f5' }}>
        Thông báo hệ thống
      </div>
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
      />
    </div>
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
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <WapperHeaderComponent style={{ width: '100%', maxWidth: '1440px' }} justify={isHiddenSearch ? "space-between" : "start"}>
        <Col span={isHiddenSearch ? 12 : 4}>
          <WapperTextHeader style={{ cursor: 'pointer' }} onClick={() => navigate("/")}>Tech Shop</WapperTextHeader>
        </Col>

        {!isHiddenSearch && (
          <Col span={14} style={{ padding: '0 20px' }}>
            <ButtonInputSearch
              size="large"
              placeholder="Tìm kiếm sản phẩm..."
              variant="borderless"
              textButton="Tìm Kiếm"
              onChange={handelOnSearch}
            />
          </Col>
        )}

        <Col span={isHiddenSearch ? 12 : 6}>
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
                    <span className="user-name">
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
                <Popover 
                  content={notificationContent} 
                  title="Thông báo" 
                  trigger="click" 
                  placement="bottomRight"
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                >
                  <div className="item" style={{ cursor: 'pointer' }}>
                    <Badge count={unreadCount + pendingChats.length} size="small" style={{ pointerEvents: 'none' }}>
                      <BellOutlined style={{ fontSize: '16px' }} />
                    </Badge>
                  </div>
                </Popover>
              </>
            )}
          </WapperHeaderAction>
        </Col>
      </WapperHeaderComponent>

      {/* Floating Chat Windows for Staff */}
      {openChats.map((customerId, index) => {
        const chat = activeChats.find(c => c.customerId === customerId);
        if (!chat) return null;
        return (
          <div key={customerId} style={{ position: 'fixed', bottom: 20, left: 20 + (index * 370), width: 350, height: 450, background: '#fff', borderRadius: 15, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 9999 }}>
            <div style={{ padding: 15, background: '#1890ff', color: '#fff', textAlign: 'center', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '15px 15px 0 0' }}>
              <span>{getCustomerLabel(chat.customerName, activeChats.indexOf(chat))}</span>
              <div>
                <Button size="small" danger onClick={() => handleEndChat(customerId)} style={{ marginRight: 5 }}>Kết thúc</Button>
                <Button size="small" type="text" style={{ color: 'white' }} onClick={() => setOpenChats(prev => prev.filter(id => id !== customerId))}><CloseOutlined /></Button>
              </div>
            </div>

            <div style={{ flex: 1, padding: 15, overflowY: 'auto', background: '#f9f9f9' }}>
              {(chatMessages[customerId] || []).map((msg, i) => (
                <div key={i} style={{ marginBottom: 15, textAlign: msg.sender === 'system' ? 'center' : 'left' }}>
                  {msg.sender === 'system' ? (
                    <span style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>{msg.text}</span>
                  ) : (
                    <div style={{
                      padding: '8px 12px', borderRadius: 15,
                      background: msg.sender === 'me' ? '#1890ff' : '#eee',
                      color: msg.sender === 'me' ? '#fff' : '#000',
                      maxWidth: '75%',
                      marginLeft: msg.sender === 'me' ? 'auto' : '0',
                      marginRight: msg.sender === 'me' ? '0' : 'auto',
                      display: 'block', textAlign: 'left',
                      wordBreak: 'break-word', marginBottom: '5px'
                    }}>                      {msg.sender === 'customer' && <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{msg.senderName}</div>}
                      {msg.text}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: 10, borderTop: '1px solid #eee', display: 'flex' }}>
              <input
                value={chatInputs[customerId] || ''}
                onChange={(e) => setChatInputs(prev => ({ ...prev, [customerId]: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage(customerId)}
                style={{ flex: 1, padding: 10, borderRadius: 20, border: '1px solid #ddd', outline: 'none' }}
                placeholder="Nhập tin nhắn..."
              />
              <button onClick={() => handleSendChatMessage(customerId)} style={{ marginLeft: 5, background: '#1890ff', color: '#fff', border: 'none', borderRadius: 20, padding: '0 15px', cursor: 'pointer' }}>Gửi</button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HeaderComponent;