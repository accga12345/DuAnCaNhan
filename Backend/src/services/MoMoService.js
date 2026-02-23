const axios = require('axios');
const CryptoJS = require('crypto-js');

const createPaymentMoMo = async (amount, orderId, orderInfo) => {
    try {
        const partnerCode = process.env.MOMO_PARTNER_CODE;
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const secretKey = process.env.MOMO_SECRET_KEY;

        const requestId = partnerCode + new Date().getTime();
        const redirectUrl = "http://localhost:3000/orderSuccess";
        const ipnUrl = "http://localhost:3001/api/order/payment/momo-callback";
        const requestType = "captureWallet";
        const extraData = "";

        const rawSignature =
            `accessKey=${accessKey}` +
            `&amount=${amount}` +
            `&extraData=${extraData}` +
            `&ipnUrl=${ipnUrl}` +
            `&orderId=${orderId}` +
            `&orderInfo=${orderInfo}` +
            `&partnerCode=${partnerCode}` +
            `&redirectUrl=${redirectUrl}` +
            `&requestId=${requestId}` +
            `&requestType=${requestType}`;

        const signature = CryptoJS.HmacSHA256(rawSignature, secretKey)
            .toString(CryptoJS.enc.Hex);

        const requestBody = {
            partnerCode,
            accessKey, // ✅ THÊM DÒNG NÀY
            requestId,
            amount: Number(amount),
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            extraData,
            requestType,
            signature,
            lang: "vi"
        };

        const response = await axios.post(
            'https://test-payment.momo.vn/v2/gateway/api/create',
            requestBody
        );

        return response.data;

    } catch (error) {
        if (error.response) {
            console.error("MoMo Error Status:", error.response.status);
            console.error("MoMo Error Data:", error.response.data);
        } else {
            console.error("MoMo Error:", error.message);
        }
        throw error;
    }
};

module.exports = {
    createPaymentMoMo
};