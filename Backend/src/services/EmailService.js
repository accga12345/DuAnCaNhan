const { google } = require('googleapis');
const dotenv = require('dotenv');
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

const buildMessage = (to, subject, html) => {
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const fromName = `=?utf-8?B?${Buffer.from(process.env.GMAIL_USER).toString('base64')}?=`;
    const lines = [
        `From: ${fromName} <${process.env.GMAIL_USER_EMAIL}>`,
        `To: ${to}`,
        `Subject: ${utf8Subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        html,
    ];
    return Buffer.from(lines.join('\n'))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

const sendEmail = async (to, subject, html) => {
    await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: buildMessage(to, subject, html) },
    });
};

const sendEmailResetPassword = async (email, token) => {
    await sendEmail(email, 'Khôi phục mật khẩu tài khoản', `
    <div>
        <p>Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu khôi phục mật khẩu cho tài khoản của mình.</p>
        <p>Vui lòng click vào đường link bên dưới để thực hiện thay đổi mật khẩu (link có hiệu lực trong 15 phút):</p>
        <a href="http://localhost:3000/reset-password?token=${token}">Khôi phục mật khẩu</a>
        <p>Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.</p>
    </div>
    `);
};

const sendEmailVerificationOtp = async (email, otp) => {
    await sendEmail(email, 'Mã xác thực đăng ký tài khoản', `
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
    `);
};

module.exports = {
    sendEmailResetPassword,
    sendEmailVerificationOtp
};
