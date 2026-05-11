const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const generateToken = (payload) => {
    const accessToken = jwt.sign({
        ...payload
    }, process.env.ACCESS_TOKEN, {
        expiresIn: '30m'
    });

    return accessToken
};

const generateRefreshToken = (payload) => {
    const refreshToken = jwt.sign({
        ...payload
    }, process.env.REFRESH_TOKEN, {
        expiresIn: '365d'
    });

    return refreshToken
};



module.exports = { generateToken, generateRefreshToken };