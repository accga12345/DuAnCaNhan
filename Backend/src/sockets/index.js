const { Server } = require("socket.io");
const chatSocketService = require("../services/ChatSocketService");

let io;

const init = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: true, // Phản hồi theo origin của client
            methods: ["GET", "POST"],
            credentials: true
        },
        allowEIO3: true,
        transports: ['websocket', 'polling']
    });

    io.on("connection", (socket) => {
        try {
            chatSocketService.handleChatEvents(io, socket);
        } catch (error) {
            console.error("Error in handleChatEvents:", error);
        }

        socket.on("disconnect", (reason) => {
            // Socket disconnected
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = {
    init,
    getIO
};
