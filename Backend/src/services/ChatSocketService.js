let pendingRequests = []; // [{ customerId, customerName, socketId }]
let activeChats = {}; // { customerId: staffId, staffId: customerId }

const handleChatEvents = (io, socket) => {
    // Staff/Admin tham gia phòng nhận thông báo
    socket.on('join_staff_room', (staffInfo) => {
        socket.join('staff_room');
        socket.staffInfo = staffInfo;
        console.log('Staff joined:', staffInfo.name);
        // Gửi lại danh sách đang chờ cho staff mới vào
        socket.emit('pending_requests', pendingRequests);
    });

    // Khách hàng yêu cầu chat
    socket.on('customer_request_chat', (customerInfo) => {
        const request = {
            customerId: customerInfo.id || socket.id,
            customerName: customerInfo.name || 'Khách hàng',
            socketId: socket.id
        };
        socket.customerId = request.customerId;
        
        // Tránh duplicate
        if (!pendingRequests.find(r => r.customerId === request.customerId)) {
            pendingRequests.push(request);
        }
        
        // Gửi thông báo đến tất cả nhân viên
        io.to('staff_room').emit('new_chat_request', request);
    });

    // Nhân viên chấp nhận chat
    socket.on('staff_accept_chat', (customerId) => {
        const requestIndex = pendingRequests.findIndex(r => r.customerId === customerId);
        if (requestIndex !== -1) {
            const request = pendingRequests[requestIndex];
            pendingRequests.splice(requestIndex, 1);

            const staffId = socket.staffInfo?.id || socket.id;
            
            // Lưu trạng thái chat
            activeChats[customerId] = staffId;
            activeChats[staffId] = customerId;

            // Cho customer và staff vào chung một room riêng
            const roomName = `chat_${customerId}`;
            socket.join(roomName);
            const customerSocket = io.sockets.sockets.get(request.socketId);
            if (customerSocket) {
                customerSocket.join(roomName);
                customerSocket.emit('chat_accepted', { staffName: socket.staffInfo?.name || 'Nhân viên' });
            }

            // Thông báo cho các staff khác để ẩn nút reply
            io.to('staff_room').emit('chat_request_taken', customerId);
            
            // Báo cho staff này biết đã kết nối thành công
            socket.emit('chat_connected', { customerId, customerName: request.customerName, roomName });
        }
    });

    // Gửi tin nhắn
    socket.on('send_chat_message', (data) => {
        const { roomName, message, sender, senderName } = data;
        // Phát lại tin nhắn cho mọi người trong room, kèm theo roomName để client phân loại
        io.to(roomName).emit('receive_chat_message', { 
            roomName, 
            sender, 
            senderName, 
            message, 
            timestamp: new Date() 
        });
    });

    // Kết thúc chat
    socket.on('end_chat', (roomName) => {
        io.to(roomName).emit('chat_ended');
        // Xóa state
        const customerId = roomName.replace('chat_', '');
        const staffId = activeChats[customerId];
        delete activeChats[customerId];
        if (staffId) delete activeChats[staffId];
    });
};

module.exports = {
    handleChatEvents
};
