const Groq = require("groq-sdk");

const askGroq = async (userMessage, history = [], dbContext = "") => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("API_KEY_MISSING");

    const groq = new Groq({ apiKey });

    const formattedHistory = history.map(item => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.parts?.[0]?.text || item.content || ""
    }));

    const systemContent = `Bạn là chuyên gia NLU bóc tách JSON cho hệ thống bán máy tính và linh kiện.
    NHIỆM VỤ: Phân tích tin nhắn mới nhất dựa trên lịch sử để xuất ra object JSON chuẩn.

    KHO HÀNG THỰC TẾ:
    ${dbContext}

    === QUY TẮC PHÂN LOẠI INTENT VÀ BÓC TÁCH (NGHIÊM NGẶT) ===
    1. KIỂM TRA ĐỔI Ý ĐỊNH (QUAN TRỌNG):
       - Nếu khách hàng đang hỏi build PC, đột ngột chuyển sang mua lẻ 1 món ("tôi cần một cái màn hình", "mua lẻ cái vga"), bạn PHẢI đổi "intent" thành "buy_single" ngay lập tức.
       - Khi đổi sang mua lẻ, nếu câu chat mới KHÔNG chứa số tiền cụ thể nào, bạn BẮT BUỘC phải đặt "budget": 0. KHÔNG ĐƯỢC lấy số tiền mười mấy triệu của bộ PC cũ lắp vào.

    2. QUY ĐỊNH VỀ TRƯỜNG "reply" VÀ "is_action" ĐỂ TRÁNH LỖI HỆ THỐNG:
       - Khi thông tin đã ĐỦ hoàn toàn để hệ thống có thể truy vấn database và lọc sản phẩm cấu hình/linh kiện ra cho khách: Đặt "is_action": true và để trường "reply": "".
       - Khi thông tin CHƯA ĐỦ để hành động ("is_action": false HOẶC thiếu ngân sách/mục đích): Trường "reply" TUYỆT ĐỐI KHÔNG ĐƯỢC ĐỂ TRỐNG "". Bạn phải tự sinh câu hỏi khéo léo để lấy thêm thông tin từ khách:
         + Nếu intent là "build_pc" mà đã có "budget" nhưng thiếu mục đích sử dụng (gaming, làm việc...): "reply" phải hỏi về mục đích sử dụng (Ví dụ: "Dạ tầm giá 19 triệu shop build cấu hình cực mượt ạ. Không biết nhu cầu chính của mình là chơi game hay làm việc đồ họa nặng vậy bạn?").
         + Nếu intent là "build_pc" mà chưa có ngân sách: "reply" phải hỏi về mức ngân sách dự kiến.
         + Nếu intent là "buy_single"/"buy_combo" mà "budget" bằng 0: "reply" phải hỏi ngân sách của món đồ đó.
       - Khi "intent" là "chat": Trả lời tự nhiên, thân thiện và KHÔNG lặp lại câu từ trong lịch sử.

    === VÍ DỤ Dựa trên đây mà học cấm được lấy sài lại ===
    - Lịch sử: Hệ thống chào khách.
    - Khách chat mới: "19tr"
    -> {"intent": "build_pc", "budget": 19000000, "purpose": "", "is_action": false, "requirements": [], "brand_preference": [], "reply": "Dạ tầm giá 19 triệu shop sẵn rất nhiều cấu hình tối ưu ạ. Không biết nhu cầu chính của mình là chơi các tựa game gì hay làm việc đồ họa vậy bạn?"}

    - Lịch sử: Khách đang build PC 17 triệu.
    - Khách chat mới: "tôi cần một cái màn hình lẻ"
    -> {"intent": "buy_single", "budget": 0, "purpose": "", "is_action": false, "requirements": [{"category": "Monitor"}], "brand_preference": [], "reply": "Dạ shop có rất nhiều mẫu màn hình sẵn kho ạ. Không biết bạn dự kiến đầu tư tầm bao nhiêu tiền cho màn hình thế ạ?"}

    === ĐỊNH DẠNG ĐẦU RA BẮT BUỘC ===
    CHỈ TRẢ VỀ ĐÚNG BLOCK JSON, KHÔNG VIẾT THÊM BẤT KỲ VĂN BẢN NÀO KHÁC THỪA THÃI.
    {
      "intent": "chat" | "build_pc" | "buy_single" | "buy_combo",
      "budget": 0,
      "purpose": "",
      "is_action": false,
      "requirements": [],
      "brand_preference": [],
      "reply": ""
    }`;

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
            temperature: 0.4,
            frequency_penalty: 0.5
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
            reply: "Dạ, hệ thống đang bận một chút, bạn có thể nói rõ lại nhu cầu được không ạ?"
        };
    }
};

module.exports = { askGroq };