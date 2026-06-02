import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useSelector } from 'react-redux';

const LiveChatComponent = ({ isInline = false }) => {
    const user = useSelector((state) => state.user);
    const [isOpen, setIsOpen] = useState(isInline);
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isWaiting, setIsWaiting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    useEffect(() => { scrollToBottom() }, [messages, isOpen]);

    useEffect(() => {
        if (isInline) setIsOpen(true);
    }, [isInline]);

    useEffect(() => {
        const backendUrl = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:3001';
        const newSocket = io(backendUrl);
        setSocket(newSocket);

        newSocket.on('chat_accepted', (data) => {
            setIsWaiting(false);
            setIsConnected(true);
            setMessages(prev => [...prev, { sender: 'system', text: `${data.staffName} đã tham gia cuộc trò chuyện.` }]);
        });

        newSocket.on('receive_chat_message', (data) => {
            setMessages(prev => {
                const isDuplicate = prev.some(m => m.text === data.message && m.timestamp === data.timestamp);
                if (isDuplicate) return prev;
                const isMe = (user?._id && String(data.sender) === String(user._id)) || (data.sender === newSocket.id);
                return [...prev, {
                    sender: isMe ? 'me' : 'other',
                    text: data.message,
                    senderName: data.senderName,
                    timestamp: data.timestamp
                }];
            });
        });

        newSocket.on('chat_ended', () => {
            setMessages(prev => [...prev, { sender: 'system', text: 'Nhân viên đã kết thúc cuộc trò chuyện.' }]);
            setIsConnected(false);
            setIsWaiting(false);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user?._id]);

    const handleStartChat = () => {
        if (!socket) return;
        setIsWaiting(true);
        setMessages([{ sender: 'system', text: 'Vui lòng đợi để chúng tôi liên hệ với nhân viên tư vấn...' }]);
        socket.emit('customer_request_chat', { id: user?._id, name: user?.name || 'Khách hàng' });
    };

    const handleSendMessage = () => {
        if (!inputText.trim() || !isConnected) return;
        const msg = {
            roomName: `chat_${user?._id || socket.id}`,
            message: inputText,
            sender: user?._id || socket.id,
            senderName: user?.name || 'Khách hàng'
        };
        socket.emit('send_chat_message', msg);
        setInputText('');
    };

    const handleEndChat = () => {
        if (socket && isConnected) {
            socket.emit('end_chat', `chat_${user?._id || socket.id}`);
        }
        if(!isInline) setIsOpen(false);
    }

    const chatContent = (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f9f9f9', height: '100%' }}>
            <div style={{ padding: 15, background: '#52c41a', color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Tư vấn viên</div>
            <div style={{ flex: 1, padding: 15, overflowY: 'auto' }}>
                {!isWaiting && !isConnected && messages.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '50%' }}>
                        <p style={{ color: '#666', marginBottom: 20 }}>Bạn cần hỗ trợ trực tiếp?</p>
                        <button onClick={handleStartChat} style={{ padding: '10px 20px', background: '#52c41a', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold' }}>Bắt đầu Chat</button>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} style={{ marginBottom: 15, textAlign: msg.sender === 'system' ? 'center' : 'left' }}>
                            {msg.sender === 'system' ? (
                                <span style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>{msg.text}</span>
                            ) : (
                                <div style={{
                                    padding: '8px 12px',
                                    borderRadius: 15,
                                    background: msg.sender === 'me' ? '#52c41a' : '#eee',
                                    color: msg.sender === 'me' ? '#fff' : '#000',
                                    maxWidth: '75%',
                                    marginLeft: msg.sender === 'me' ? 'auto' : '0',
                                    marginRight: msg.sender === 'me' ? '0' : 'auto',
                                    display: 'block',
                                    width: 'fit-content',
                                    textAlign: 'left',
                                    wordBreak: 'break-word',
                                    marginBottom: '5px'
                                }}>
                                    {msg.sender === 'other' && <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{msg.senderName}</div>}
                                    {msg.text}
                                </div>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {isConnected && (
                <div style={{ padding: 10, borderTop: '1px solid #eee', display: 'flex' }}>
                    <input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        style={{ flex: 1, padding: 10, borderRadius: 20, border: '1px solid #ddd', outline: 'none' }}
                        placeholder="Nhập tin nhắn..."
                    />
                    <button onClick={handleSendMessage} style={{ marginLeft: 5, background: '#52c41a', color: '#fff', border: 'none', borderRadius: 20, padding: '0 15px', cursor: 'pointer' }}>Gửi</button>
                </div>
            )}
        </div>
    );

    if (isInline) return chatContent;

    return (
        <div style={{ position: 'fixed', bottom: 90, right: 20, zIndex: 9999, fontFamily: 'Arial' }}>
            <button onClick={() => setIsOpen(!isOpen)} style={{ width: 60, height: 60, borderRadius: '50%', background: '#52c41a', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 24, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>🎧</button>
            {isOpen && (
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 350, height: 500, background: '#fff', borderRadius: 15, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {chatContent}
                </div>
            )}
        </div>
    );
};
export default LiveChatComponent;
