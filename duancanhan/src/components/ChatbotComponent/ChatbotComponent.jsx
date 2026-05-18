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
    const [replaceMode, setReplaceMode] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    useEffect(() => { scrollToBottom() }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        // Hàm helper để parse ngân sách qua AI (Backend sẽ xử lý)
        const fetchBudgetFromAI = async (text) => {
            const apiUrl = process.env.REACT_APP_API_URL;
            try {
                // Gửi text lên để backend dùng Groq phân tích
                const res = await axios.post(`${apiUrl}/chat/message`, { message: `Trích xuất ngân sách từ: ${text}` });
                return res.data.budget || parseInt(text.replace(/[^0-9]/g, ''));
            } catch (e) { return parseInt(text.replace(/[^0-9]/g, '')); }
        };

        if (replaceMode && replaceMode.step === 'budget') {
            const budget = await fetchBudgetFromAI(inputText);
            if (isNaN(budget) || budget === 0) {
                setMessages(prev => [...prev, { sender: 'bot', text: 'Vui lòng nhập ngân sách hợp lệ (ví dụ: 2000000)', products: [] }]);
            } else {
                setReplaceMode({ ...replaceMode, step: 'select', budget: budget });
                fetchAlternatives(replaceMode.product, budget);
            }
            setInputText('');
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
            const botMsg = { sender: 'bot', text: res.data.message, products: res.data.data };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Xin lỗi, hệ thống đang bận.', products: [] }]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAlternatives = async (product, budget) => {
        try {
            const apiUrl = process.env.REACT_APP_API_URL;
            const res = await axios.post(`${apiUrl}/chat/replace`, {
                categoryName: product.categoryName,
                targetPrice: budget,
                currentBuild: messages[messages.length - 2].products
            });
            setMessages(prev => [...prev, {
                sender: 'bot',
                text: res.data.suggestions && res.data.suggestions.length > 0 ? `Đã tìm thấy các lựa chọn ${product.categoryName} thay thế:` : `Không tìm thấy linh kiện thay thế nào trong tầm giá.`,
                products: res.data.suggestions || []
            }]);
        } catch (e) {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Không tìm thấy linh kiện thay thế.', products: [] }]);
            setReplaceMode(null);
        }
    };

    const handleSelectReplacement = async (newProduct) => {
        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
            const lastBuildMsg = [...messages].reverse().find(msg => msg.products && msg.products.length > 0);

            const resUpdate = await axios.post(`${apiUrl}/chat/replace`, {
                categoryName: replaceMode.product.categoryName,
                newProductId: newProduct._id,
                currentBuild: lastBuildMsg.products
            });
            setMessages(prev => [...prev, { sender: 'bot', text: 'Đã thay thế thành công!', products: resUpdate.data.data }]);
            setReplaceMode(null);
        } catch (e) { alert('Lỗi thay thế'); }
    };

    const handleReplace = (product) => {
        setReplaceMode({ step: 'budget', product: product });
        setMessages(prev => [...prev, {
            sender: 'bot',
            text: `Bạn muốn thay ${product.name} với ngân sách khoảng bao nhiêu? (Ví dụ: 2000000)`,
            products: []
        }]);
    };

    return (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, fontFamily: 'Arial' }}>
            <button onClick={() => setIsOpen(!isOpen)} style={{ width: 60, height: 60, borderRadius: '50%', background: '#ff4d4f', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 24 }}>💬</button>
            {isOpen && (
                <div style={{ position: 'absolute', bottom: 70, right: 0, width: 380, height: 550, background: '#fff', borderRadius: 15, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: 15, background: '#ff4d4f', color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Tư vấn cấu hình</div>
                    <div style={{ flex: 1, padding: 15, overflowY: 'auto', background: '#f9f9f9' }}>
                        {messages.map((msg, index) => (
                            <div key={index} style={{ marginBottom: 15 }}>
                                <div style={{ padding: 12, borderRadius: 15, background: msg.sender === 'user' ? '#1890ff' : '#fff', color: msg.sender === 'user' ? '#fff' : '#333', border: '1px solid #eee' }}>{msg.text}</div>
                                {msg.products && msg.products.length > 0 && (
                                    <div style={{ marginTop: 10, display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 5 }}>
                                        {msg.products.map(p => (
                                            <div key={p._id} style={{ minWidth: 160, background: '#fff', padding: 8, borderRadius: 10, border: '1px solid #ddd' }}>
                                                <CardComponent
                                                    {...p}
                                                    onReplace={() => handleReplace(p)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div style={{ padding: 10, borderTop: '1line solid #eee', display: 'flex' }}>
                        <input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} style={{ flex: 1, padding: 10, borderRadius: 20, border: '1px solid #ddd' }} />
                        <button onClick={handleSendMessage} style={{ marginLeft: 5, background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: 20, padding: '0 15px' }}>Gửi</button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default ChatbotComponent;