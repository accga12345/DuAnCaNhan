# Kết quả Phân tích Kiến trúc Dự án (Code Review)

Chào bạn, mình đã lướt qua toàn bộ cấu trúc Backend và Frontend của bạn. Dự án của bạn có cấu trúc khá rõ ràng theo mô hình MVC (Routes - Controllers - Services - Models). Tuy nhiên, có một số điểm **chưa hợp lý (Anti-patterns)** rất phổ biến mà bạn nên cân nhắc tối ưu lại để dự án chuyên nghiệp và dễ bảo trì hơn:

## 1. Dư thừa Model Người dùng (Lỗi nghiêm trọng nhất)
- **Tình trạng:** Bạn đang có 2 model là `UserModel.js` và `EmployeeModel.js` với cấu trúc gần như giống hệt nhau (chỉ khác cờ `isEmployee`).
- **Tại sao không hợp lý:** Việc tách làm 2 bảng khiến bạn phải viết gấp đôi các logic (đăng nhập, đăng ký, quên mật khẩu, cập nhật profile). Khi check quyền, hệ thống phải query ở 2 bảng khác nhau.
- **Cách khắc phục:** Xóa `EmployeeModel`. Gom tất cả vào `UserModel` và thêm một trường `role` (VD: `role: 'user' | 'employee' | 'admin'`) hoặc dùng các cờ boolean (`isAdmin: true/false`, `isEmployee: true/false`).

## 2. Lưu trữ Hình ảnh bằng Base64 vào Database
- **Tình trạng:** Trong `index.js`, bạn cấu hình `app.use(express.json({ limit: "50mb" }));` và trên frontend bạn chuyển ảnh thành chuỗi `Base64` rồi lưu thẳng vào MongoDB (trường `image` của Category, Product).
- **Tại sao không hợp lý:** MongoDB không sinh ra để lưu trữ file. Lưu chuỗi Base64 dài hàng triệu ký tự sẽ khiến Database phình to cực kỳ nhanh. Khi query danh sách sản phẩm, payload trả về sẽ khổng lồ, làm sập server hoặc lag trình duyệt người dùng.
- **Cách khắc phục:** Dùng thư viện `multer` để upload ảnh lên server (thư mục `/public/uploads`), hoặc dùng các dịch vụ Cloud như **Cloudinary** / **AWS S3**. MongoDB chỉ nên lưu `URL` (đường dẫn text ngắn) của ảnh đó.

## 3. Lỗi Đánh vần (Typo) ở Tên File Model
- **Tình trạng:** Tên file `OderProduct.js`.
- **Tại sao không hợp lý:** Thiếu chữ `r`. Nên đổi thành `OrderProduct.js` để chuẩn tiếng Anh và dễ tìm kiếm trong source code.

## 4. Bắt Lỗi HTTP Status Code Sai
- **Tình trạng:** Trong `UserController.js`, bạn dùng `res.status(401)` cho mọi loại lỗi. (Ví dụ: Thiếu trường nhập liệu, email không hợp lệ, lỗi hệ thống (catch block)).
- **Tại sao không hợp lý:** Mã `401` có nghĩa là "Unauthorized" (Chưa xác thực/Sai token).
  - Lỗi thiếu thông tin, email không hợp lệ: Phải dùng `400 (Bad Request)`.
  - Lỗi trùng email: Phải dùng `409 (Conflict)`.
  - Lỗi trong block `catch(error)` (lỗi server): Phải dùng `500 (Internal Server Error)`.
- **Cách khắc phục:** Phân loại lại các status code khi trả về `res.status()`.


