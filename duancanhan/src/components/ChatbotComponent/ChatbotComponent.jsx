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
    const [replaceMode, setReplaceMode] = useState(null); // { step: 'budget', product: p }
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    useEffect(() => { scrollToBottom() }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        // Xử lý luồng nhập ngân sách thay thế
        if (replaceMode && replaceMode.step === 'budget') {
            const userText = inputText;
            setMessages(prev => [...prev, { sender: 'user', text: userText }]);
            setInputText('');

            try {
                if (!userText || userText.trim() === "") {
                    setMessages(prev => [...prev, { sender: 'bot', text: 'Vui lòng nhập ngân sách hợp lệ (ví dụ: 2 triệu)', products: [] }]);
                } else {
                    setReplaceMode({ ...replaceMode, step: 'select', budget: userText });
                    fetchAlternatives(replaceMode.product, userText);
                }
            } catch (e) {
                setMessages(prev => [...prev, { sender: 'bot', text: 'Lỗi xử lý ngân sách.', products: [] }]);
            }
            return;
        }

        const userMsg = { sender: 'user', text: inputText, products: [] };
        const chatHistory = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
        }));

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
            const res = await axios.post(`${apiUrl}/chat/message`, { message: userMsg.text, history: chatHistory });
            const botMsg = { sender: 'bot', text: res.data.message, products: res.data.data, type: 'build' };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Xin lỗi, hệ thống đang bận.', products: [] }]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAlternatives = async (product, budget) => {
        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
            // Tìm cấu hình build gần nhất
            const lastBuildMsg = [...messages].reverse().find(msg => msg.products && msg.products.length > 0 && msg.type === 'build');

            const res = await axios.post(`${apiUrl}/chat/replace`, {
                categoryName: product.categoryName,
                budgetInput: budget.toString(),
                currentBuild: lastBuildMsg ? lastBuildMsg.products : []
            });

            setMessages(prev => [...prev, {
                sender: 'bot',
                text: res.data.suggestions?.length > 0 ? `Gợi ý ${product.categoryName} thay thế:` : `Không có món nào trong tầm giá.`,
                products: res.data.suggestions || [],
                type: 'suggestions'
            }]);
        } catch (e) {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Lỗi tìm linh kiện thay thế.', products: [] }]);
            setReplaceMode(null);
        }
    };

    const handleSelectReplacement = (newProduct) => {
        const lastBuildMsg = [...messages].reverse().find(msg => msg.products && msg.products.length > 0 && msg.type === 'build');
        if (!lastBuildMsg) return;

        // Sử dụng _id của category để so sánh cho chính xác
        const targetCategoryId = replaceMode.product.category?._id || replaceMode.product.category;

        const updatedBuild = lastBuildMsg.products.map(p => {
            const pCategoryId = p.category?._id || p.category;
            return (pCategoryId === targetCategoryId) ? newProduct : p;
        });

        const totalActual = updatedBuild.reduce((s, p) => s + p.price, 0);

        setMessages(prev => [...prev, {
            sender: 'bot',
            text: `Đã thay thế thành công. Tổng cấu hình mới: **${totalActual.toLocaleString('vi-VN')}đ**.`,
            products: updatedBuild,
            type: 'build'
        }]);
        setReplaceMode(null);
    };

    const handleReplaceClick = async (product) => {
        setIsLoading(true);
        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
            const lastBuildMsg = [...messages].reverse().find(msg => msg.products && msg.products.length > 0 && msg.type === 'build');

            // Gọi API mới (sẽ triển khai sau) hoặc tận dụng 1 endpoint hiện có để lấy sản phẩm cùng category/tương thích
            const res = await axios.post(`${apiUrl}/product/get-compatible`, {
                categoryName: product.category,
                currentBuild: lastBuildMsg ? lastBuildMsg.products : [],
                replacedProduct: product
            });

            setMessages(prev => [...prev, {
                sender: 'bot',
                text: `Gợi ý các linh kiện thay thế cho ${product.name}:`,
                products: res.data.data,
                type: 'suggestions'
            }]);
            setReplaceMode({ step: 'select', product: product });
        } catch (e) {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Lỗi tìm linh kiện thay thế.', products: [] }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, fontFamily: 'Arial' }}>
            <button onClick={() => setIsOpen(!isOpen)} style={{ width: 60, height: 60, borderRadius: '50%', background: '#ff4d4f', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 24 }}>💬</button>
            {isOpen && (
                <div style={{ position: 'absolute', bottom: 0, right: 65, width: 400, height: 580, background: '#fff', borderRadius: 15, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: 15, background: '#ff4d4f', color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Tư vấn cấu hình</div>
                    <div style={{ flex: 1, padding: 15, overflowY: 'auto', background: '#f9f9f9' }}>
                        {messages.map((msg, index) => (
                            <div key={index} style={{ marginBottom: 15 }}>
                                <div style={{
                                    padding: 12,
                                    borderRadius: 15,
                                    background: msg.sender === 'user' ? '#1890ff' : '#fff',
                                    color: msg.sender === 'user' ? '#fff' : '#333',
                                    border: '1px solid #eee',
                                    maxWidth: '85%',
                                    marginLeft: msg.sender === 'user' ? 'auto' : '0'
                                }}>
                                    {msg.text}
                                </div>
                                {msg.products && msg.products.length > 0 && (
                                    <div style={{ marginTop: 10, display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
                                        {msg.products.map(p => (
                                            <div key={p._id} style={{ minWidth: 180 }}>
                                                <CardComponent
                                                    {...p}
                                                    id={p._id}
                                                    onReplace={msg.type === 'suggestions'
                                                        ? () => handleSelectReplacement(p)
                                                        : () => handleReplaceClick(p)
                                                    }
                                                    replaceLabel={msg.type === 'suggestions' ? 'Chọn' : 'Thay thế'}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && <div style={{ color: '#888', fontSize: 12 }}>Bot đang xử lý...</div>}
                        <div ref={messagesEndRef} />
                    </div>
                    <div style={{ padding: 10, borderTop: '1px solid #eee', display: 'flex' }}>
                        <input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} style={{ flex: 1, padding: 10, borderRadius: 20, border: '1px solid #ddd' }} placeholder="Nhập tin nhắn..." />
                        <button onClick={handleSendMessage} style={{ marginLeft: 5, background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: 20, padding: '0 15px', cursor: 'pointer' }}>Gửi</button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default ChatbotComponent;