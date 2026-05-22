const createPaymentUrl = async (amount, orderId) => {
    try {
        // Dùng MERCHANT_ID làm số tài khoản (theo cấu hình Sandbox của bạn)
        const bankAccount = process.env.SEPAY_MERCHANT_ID || "0000000001";
        const bankName = "VietinBank";
        const description = orderId; 
        
        const qrUrl = `https://qr.sepay.vn/img?acc=${bankAccount}&bank=${bankName}&amount=${amount}&des=${description}`;
        
        return { 
            payUrl: qrUrl,
            description: description,
            amount: amount,
            bankAccount: bankAccount
        };
    } catch (error) {
        console.error("SePay Service Error:", error.message);
        throw new Error("Không thể tạo mã QR thanh toán");
    }
};

module.exports = {
    createPaymentUrl
};
