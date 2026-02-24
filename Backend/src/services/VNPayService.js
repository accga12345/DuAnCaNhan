const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");
require("dotenv").config();

function sortObject(obj) {
    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
        sorted[key] = obj[key];
    });
    return sorted;
}

const createPaymentUrl = (amount, orderId, ipAddr) => {

    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_SECRET_KEY;
    const vnpUrl = process.env.VNPAY_URL;
    const returnUrl = process.env.VNPAY_RETURN_URL;

    const createDate = moment().format("YYYYMMDDHHmmss");

    let vnpParams = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Amount: Number(amount) * 100,
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderId.toString(),
        vnp_OrderInfo: `Thanh_toan_don_hang_${orderId}`, // Không dấu, không space
        vnp_OrderType: "other",
        vnp_Locale: "vn",
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr || "127.0.0.1",
        vnp_CreateDate: createDate
    };

    // 1. sort params
    vnpParams = sortObject(vnpParams);

    // 2. tạo signData bằng chuỗi key=value nối với &
    const signData = Object.keys(vnpParams)
        .map(key => `${key}=${vnpParams[key]}`)
        .join("&");

    // 3. tạo chữ ký HMAC SHA512
    const secureHash = crypto
        .createHmac("sha512", secretKey)
        .update(signData, "utf-8")
        .digest("hex");

    // 4. thêm hash vào params
    vnpParams.vnp_SecureHash = secureHash;

    // 5. tạo URL (encode ở bước này)
    const paymentUrl = vnpUrl + "?" + qs.stringify(vnpParams, { encode: true });

    return paymentUrl;
};

module.exports = { createPaymentUrl };