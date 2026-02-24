const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");

// SORT CHUẨN
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
        sorted[key] = obj[key];
    });
    return sorted;
}

// ================== CREATE PAYMENT ==================
const createPaymentUrl = (amount, orderId, ipAddr) => {
    const tmnCode = "0MF54NP8";
    const secretKey = "4HHTZ20QK3E36PKSY7QBEK65R0VJL293";
    const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const returnUrl = "http://localhost:3001/api/order/payment/vnpay-return";

    const createDate = moment().utcOffset(7).format("YYYYMMDDHHmmss");
    const expireDate = moment().utcOffset(7).add(15, "minutes").format("YYYYMMDDHHmmss");

    amount = Number(amount) * 100;

    let vnpParams = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Amount: amount,
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
        vnp_OrderType: "other",
        vnp_Locale: "vn",
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr || "127.0.0.1",
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate
    };

    vnpParams = sortObject(vnpParams);

    // 🔥 KHÔNG ENCODE khi ký
    const signData = qs.stringify(vnpParams, { encode: false });

    const signed = crypto
        .createHmac("sha512", secretKey)
        .update(signData, "utf-8")
        .digest("hex");

    return (
        vnpUrl +
        "?" +
        qs.stringify(vnpParams, { encode: true }) +
        "&vnp_SecureHash=" +
        signed
    );
};

// ================== VERIFY RETURN ==================
const verifyReturnUrl = (vnpParams) => {
    const secretKey = "4HHTZ20QK3E36PKSY7QBEK65R0VJL293";

    const secureHash = vnpParams["vnp_SecureHash"];

    // Xoá hash trước khi ký lại
    delete vnpParams["vnp_SecureHash"];
    delete vnpParams["vnp_SecureHashType"];

    vnpParams = sortObject(vnpParams);

    // 🔥 PHẢI GIỐNG create → encode false
    const signData = qs.stringify(vnpParams, { encode: false });

    const signed = crypto
        .createHmac("sha512", secretKey)
        .update(signData, "utf-8")
        .digest("hex");

    return secureHash === signed;
};

module.exports = {
    createPaymentUrl,
    verifyReturnUrl
};