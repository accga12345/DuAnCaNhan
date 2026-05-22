const nodemailer = require("nodemailer");
const dotenv = require('dotenv');
dotenv.config();

const sendEmailResetPassword = async (email, token) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_IS_USER, // user
            pass: process.env.EMAIL_IS_PASSWORD, // password
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

module.exports = {
    sendEmailResetPassword
};
