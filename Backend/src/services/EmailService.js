const nodemailer = require("nodemailer");
const dotenv = require('dotenv');
dotenv.config();

const sendEmailResetPassword = async (email, token) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_IS_USER,
            pass: process.env.EMAIL_IS_PASSWORD,
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Linh Kiện Máy Tính 👻" <no-reply@shop.com>', // sender address
        to: email, // list of receivers
        subject: "Khôi phục mật khẩu tài khoản", // Subject line
        text: "Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu khôi phục mật khẩu cho tài khoản của mình.", // plain text body
        html: `
        <div>
            <p>Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu khôi phục mật khẩu cho tài khoản của mình.</p>
            <p>Vui lòng click vào đường link bên dưới để thực hiện thay đổi mật khẩu (link có hiệu lực trong 15 phút):</p>
            <a href="http://localhost:3000/reset-password?token=${token}">Khôi phục mật khẩu</a>
            <p>Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.</p>
        </div>
        `, // html body
    });
};

const sendEmailVerificationOtp = async (email, otp) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_IS_USER, // user
            pass: process.env.EMAIL_IS_PASSWORD, // password
        },
    });

    let info = await transporter.sendMail({
        from: '"Linh Kiện Máy Tính 👻" <no-reply@shop.com>', // sender address
        to: email, // list of receivers
        subject: "Mã xác thực đăng ký tài khoản", // Subject line
        text: `Mã xác thực OTP của bạn là: ${otp}. Mã này có hiệu lực trong 5 phút.`, // plain text body
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #1677ff; text-align: center;">Xác thực Đăng ký Tài khoản</h2>
            <p>Chào bạn,</p>
            <p>Bạn nhận được email này vì bạn đang thực hiện đăng ký tài khoản trên hệ thống của chúng tôi.</p>
            <p>Vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình đăng ký (mã có hiệu lực trong <b>5 phút</b>):</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0;">
                ${otp}
            </div>
            <p>Nếu bạn không yêu cầu điều này, xin vui lòng bỏ qua email này.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #888; text-align: center;">Cửa Hàng Linh Kiện Máy Tính</p>
        </div>
        `, // html body
    });
};

module.exports = {
    sendEmailResetPassword,
    sendEmailVerificationOtp
};
