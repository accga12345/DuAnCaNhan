const Groq = require("groq-sdk");

/**
 * Hàm gọi Llama 3 qua Groq để bóc tách ý định (NLU) bằng kỹ thuật Few-shot Prompting
 * @param {string} userMessage - Tin nhắn mới nhất từ khách hàng
 * @param {Array} history - Lịch sử cuộc trò chuyện
 * @param {string} dbContext - Ngữ cảnh số lượng và sản phẩm tinh gọn từ DB
 */
const askGroq = async (userMessage, history = [], dbContext = "") => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("API_KEY_MISSING");

    const groq = new Groq({ apiKey });

    // Dùng Optional Chaining an toàn cho history
    const formattedHistory = history.map(item => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.parts?.[0]?.text || item.content || ""
    }));

    const systemContent = `Bạn là nhân viên tư vấn ảo (NLU) cho hệ thống e-commerce bán linh kiện máy tính.
    NHIỆM VỤ: Đọc câu chat của khách, lịch sử trò chuyện và dữ liệu kho, sau đó trích xuất thành ĐÚNG định dạng JSON.

    DỮ LIỆU KHO HÀNG THỰC TẾ:
    ${dbContext}

    QUY ĐỊNH CHỐNG ẢO GIÁC & CHỐNG LẶP LỜI (CỰC KỲ NGHIÊM NGẶT):
    1. CẤM LẶP LỜI (ANTI-LOOP): TUYỆT ĐỐI KHÔNG lặp lại câu hỏi mà hệ thống vừa hỏi ở ngay trên.
    2. CẤM BỊA ĐẶT TỒN KHO: Việc kiểm tra xem kho "còn hay hết" là do HỆ THỐNG CODE thực hiện. Ở trường "reply", bạn TUYỆT ĐỐI KHÔNG ĐƯỢC tự ý phán "không có sản phẩm nào", "hết hàng".
    3. CẤM BỊA THÔNG SỐ: Không tự chém gió các thông số nếu khách không đề cập.
    4. Bạn PHẢI đóng vai nhân viên chăm sóc khách hàng. TUYỆT ĐỐI KHÔNG copy y hệt các câu trả lời trong phần "HỌC QUA VÍ DỤ MẪU" nếu ngữ cảnh thực tế của khách không giống.

    QUY TẮC PHÂN LOẠI INTENT VÀ BÓC TÁCH:
    - "intent": "chat" | "build_pc" | "buy_single" | "buy_combo". (Nếu khách nhập SỐ TIỀN để trả lời cho câu hỏi trước đó, BẮT BUỘC giữ nguyên intent là buy_single/buy_combo/build_pc).
    - "is_action": true (muốn hệ thống lọc/tìm/mua) | false (chỉ hỏi phiếm, chào hỏi).
    - "budget": Số tiền (Number). Chỉ trích xuất nếu khách đề cập hoặc bạn tự nhớ từ lịch sử chat. Nếu không có -> để là 0.
    - "purpose": Chỉ ghi "gaming", "work", hoặc "office" NẾU khách có nói rõ. NẾU KHÁCH CHƯA NÓI HOẶC CHỈ MUA LINH KIỆN LẺ (buy_single/buy_combo), BẮT BUỘC để trống "". CẤM TỰ ĐỘNG MẶC ĐỊNH LÀ "gaming".
    - "requirements": Mảng danh mục linh kiện (Category tiếng Anh).
    - "reply": Câu trả lời giao tiếp tự nhiên. 
      + LỆNH BẮT BUỘC: NẾU intent là "chat", BẮT BUỘC phải sinh câu phản hồi tự nhiên trong trường này, TUYỆT ĐỐI KHÔNG được để trống "".
      + NẾU is_action=true và khách đã cấp đủ thông tin chốt đơn, hãy để trống "" để Hệ Thống Code tự xử lý.

    HỌC QUA VÍ DỤ MẪU (LƯU Ý: ĐÂY CHỈ LÀ ĐỊNH DẠNG, BẠN PHẢI TỰ SINH CÂU TRẢ LỜI LINH HOẠT TÙY NGỮ CẢNH):
    - Khách: "chào bạn" / "hi" / "alo" -> JSON: {"intent": "chat", "budget": 0, "purpose": "", "is_action": false, "requirements": [], "brand_preference": [], "reply": "Dạ xin chào ạ! Mình là trợ lý ảo tư vấn PC, bạn đang cần hỗ trợ ráp máy hay tìm mua linh kiện gì thế ạ?"}
    - Khách: "6tr" (Trước đó bot hỏi tiền mua màn hình) -> JSON: {"intent": "buy_single", "budget": 6000000, "purpose": "", "is_action": true, "requirements": [{"category": "Monitor"}], "brand_preference": [], "reply": ""}
    - Khách: "thế sản phẩm khác cũng đc" -> JSON: {"intent": "chat", "budget": 0, "purpose": "", "is_action": false, "requirements": [], "brand_preference": [], "reply": "Dạ vâng, vậy bạn muốn mình tư vấn thêm về danh mục linh kiện nào khác ạ?"}

    BẮT BUỘC TRẢ VỀ CHÍNH XÁC CẤU TRÚC JSON NÀY (KHÔNG THÊM BỚT KEY):
    {
      "intent": "chat" | "build_pc" | "buy_single" | "buy_combo",
      "budget": 0,
      "purpose": "",
      "is_action": false,
      "requirements": [],
      "brand_preference": [],
      "reply": ""
    }

    CHỈ TRẢ VỀ ĐÚNG BLOCK JSON, KHÔNG VIẾT THÊM BẤT KỲ VĂN BẢN NÀO KHÁC THỪA THÃI.`;

    const messages = [
        { role: "system", content: systemContent },
        ...formattedHistory,
        { role: "user", content: userMessage }
    ];

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
            temperature: 0.1
        });
        return JSON.parse(chatCompletion.choices[0].message.content);
    } catch (e) {
        console.error("❌ Lỗi NLU Groq Service:", e.message);
        return {
            intent: "chat",
            budget: 0,
            purpose: "",
            is_action: false,
            requirements: [],
            brand_preference: [],
            reply: "Xin lỗi bạn, hệ thống xử lý ngôn ngữ của mình đang hơi nghẽn một chút. Bạn có thể nhắc lại nhu cầu được không ạ?"
        };
    }
};

module.exports = { askGroq };