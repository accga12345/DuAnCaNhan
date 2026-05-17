const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const { default: mongoose } = require('mongoose');
const router = require('./routes');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
router(app);


mongoose.connect(process.env.MONGODB_URL, {
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
})


const http = require('http');
const server = http.createServer(app);
const socket = require('./socket');

const io = socket.init(server);
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

