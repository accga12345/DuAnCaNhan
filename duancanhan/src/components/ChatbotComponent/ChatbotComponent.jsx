import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import CardComponent from '../CardComponent/CardComponent';

const ChatbotComponent = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Chào bạn! Mình có thể tư vấn PC cho bạn hôm nay.', products: [] }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    useEffect(() => { scrollToBottom() }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userMsg = { sender: 'user', text: inputText, products: [] };

        // Tạo history theo định dạng Gemini yêu cầu (user/model)
        // LỌC BỎ tin nhắn đầu tiên nếu nó là của Bot để đảm bảo tin nhắn đầu là của User
        const chatHistory = messages
            .filter((msg, index) => !(index === 0 && msg.sender === 'bot'))
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{
                    text: msg.products && msg.products.length > 0
                        ? `${msg.text} | Đã gợi ý: ${msg.products.map(p => p.name).join(', ')}`
                        : msg.text
                }],
            }));

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
            const res = await axios.post(`${apiUrl}/chat/message`, {
                message: userMsg.text,
                history: chatHistory // Gửi lịch sử lên
            });

            const botMsg = {
                sender: 'bot',
                text: res.data.message,
                products: res.data.data
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau!', products: [] }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
            {/* Nút bật/tắt Chat */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: 60, height: 60, borderRadius: '50%', background: '#ff4d4f', color: '#fff',
                    border: 'none', cursor: 'pointer', fontSize: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                💬
            </button>

            {/* Cửa sổ Chat */}
            {isOpen && (
                <div style={{
                    position: 'absolute', bottom: 70, right: 0, width: 350, height: 500,
                    background: '#fff', borderRadius: 10, boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}>
                    <div style={{ background: '#ff4d4f', color: '#fff', padding: 15, fontWeight: 'bold' }}>
                        Tư vấn cấu hình PC
                    </div>

                    <div style={{ flex: 1, padding: 10, overflowY: 'auto', background: '#f5f5f5' }}>
                        {messages.map((msg, index) => (
                            <div key={index} style={{ marginBottom: 15, textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                                <div style={{
                                    display: 'inline-block', padding: 10, borderRadius: 10,
                                    background: msg.sender === 'user' ? '#1890ff' : '#fff',
                                    color: msg.sender === 'user' ? '#fff' : '#000',
                                    maxWidth: '80%', textAlign: 'left', border: msg.sender === 'bot' ? '1px solid #ddd' : 'none',
                                    wordBreak: 'break-word'
                                }}>
                                    {msg.text}
                                </div>

                                {/* Render sản phẩm nếu Bot trả về danh sách Build PC */}
                                {msg.products && msg.products.length > 0 && (
                                    <div style={{ marginTop: 10, display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, textAlign: 'left' }}>
                                        {msg.products.map(product => (
                                            <div style={{ minWidth: 150 }} key={product._id}>
                                                <CardComponent
                                                    id={product._id}
                                                    name={product.name}
                                                    image={product.image}
                                                    price={product.price}
                                                    rating={product.rating}
                                                    type={product.type}
                                                    discount={product.discount}
                                                    selled={product.selled}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && <div style={{ color: '#888', fontSize: 12 }}>Bot đang gõ...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: 10, borderTop: '1px solid #ddd', display: 'flex', background: '#fff' }}>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Nhập 'Mình có 15 triệu...'"
                            style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: '1px solid #ddd', outline: 'none' }}
                        />
                        <button onClick={handleSendMessage} style={{ background: 'transparent', border: 'none', color: '#ff4d4f', fontWeight: 'bold', marginLeft: 10, cursor: 'pointer' }}>Gửi</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatbotComponent;