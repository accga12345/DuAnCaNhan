import React, { useState } from 'react';
import { Button } from 'antd';
import { MessageOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import ChatbotComponent from '../ChatbotComponent/ChatbotComponent';
import LiveChatComponent from '../LiveChatComponent/LiveChatComponent';
import { ChatWindowWrapper, ChatHeader, ChatBubble } from './style';
import { useSelector } from 'react-redux';

const UnifiedChatComponent = () => {
    const user = useSelector((state) => state.user);
    const [isOpen, setIsOpen] = useState(false);
    const [activeChat, setActiveChat] = useState('ai'); // 'ai' or 'live'

    // Check if the user is an admin or employee
    const isAdminOrStaff = user?.isAdmin || user?.isEmployee;

    return (
        <>
            {!isOpen && (
                <ChatBubble onClick={() => setIsOpen(true)}><MessageOutlined /></ChatBubble>
            )}
            
            <ChatWindowWrapper isOpen={isOpen}>
                <ChatHeader>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <Button 
                            type={activeChat === 'ai' ? 'primary' : 'default'} 
                            onClick={() => setActiveChat('ai')}
                            icon={<MessageOutlined />}
                            size="small"
                        >
                            Chat với AI
                        </Button>
                        {!isAdminOrStaff && (
                            <Button 
                                type={activeChat === 'live' ? 'primary' : 'default'} 
                                onClick={() => setActiveChat('live')}
                                icon={<CustomerServiceOutlined />}
                                size="small"
                            >
                                Tư vấn viên
                            </Button>
                        )}
                    </div>
                    <Button type="text" onClick={() => setIsOpen(false)}>✕</Button>
                </ChatHeader>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                    {activeChat === 'ai' ? <ChatbotComponent isInline={true} /> : 
                     (!isAdminOrStaff ? <LiveChatComponent isInline={true} /> : <div style={{padding: 20}}>Tư vấn viên không khả dụng cho quản trị viên.</div>)}
                </div>
            </ChatWindowWrapper>
        </>
    );
};

export default UnifiedChatComponent;
