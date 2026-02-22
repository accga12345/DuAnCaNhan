const express = require('express');
const dotenv = require('dotenv');
const { default: mongoose } = require('mongoose');
const router = require('./routes');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.json());
app.use(cookieParser());
router(app);

console.log("ACCESS_TOKEN SECRET =", process.env.ACCESS_TOKEN);

mongoose.connect(process.env.MONGODB_URL, {
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
})


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

