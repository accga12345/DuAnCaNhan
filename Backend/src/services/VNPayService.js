const crypto = require("crypto");
const qs = require("qs");

function sortObject(obj) {
    let sorted = {};
    let keys = Object.keys(obj).sort();

    for (let key of keys) {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
    }

    return sorted;
}

const createPaymentUrl = (amount, orderId, orderInfo, ipAddr) => {
    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_HASH_SECRET;
    const vnpUrl = process.env.VNPAY_URL;
    const returnUrl = process.env.VNPAY_RETURN_URL;

    const date = new Date();
    const createDate =
        date.getFullYear().toString() +
        ("0" + (date.getMonth() + 1)).slice(-2) +
        ("0" + date.getDate()).slice(-2) +
        ("0" + date.getHours()).slice(-2) +
        ("0" + date.getMinutes()).slice(-2) +
        ("0" + date.getSeconds()).slice(-2);

    let vnpParams = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: "other",
        vnp_Amount: amount * 100,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr || "127.0.0.1",
        vnp_CreateDate: createDate,
    };

    vnpParams = sortObject(vnpParams);

    const signData = qs.stringify(vnpParams, { encode: false });

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    return (
        vnpUrl +
        "?" +
        signData +
        "&vnp_SecureHash=" +
        signed
    );
};

const verifyReturnUrl = (vnpParams) => {
    const secretKey = process.env.VNPAY_HASH_SECRET;

    const secureHash = vnpParams.vnp_SecureHash;

    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    vnpParams = sortObject(vnpParams);

    const signData = qs.stringify(vnpParams, { encode: false });

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    return secureHash === signed;
};

module.exports = {
    createPaymentUrl,
    verifyReturnUrl,
};