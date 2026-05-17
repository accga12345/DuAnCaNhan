const Groq = require("groq-sdk");

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Bước 1: Phân tích ý định người dùng (NLU)
const parseUserIntent = async (userMessage, history = []) => {
    const messages = history.map(item => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.parts[0].text
    }));
    messages.push({ role: "user", content: userMessage });

    const systemPrompt = {
        role: "system",
        content: `Bạn là chuyên gia phân tích yêu cầu tại shop PC.
        TRẢ VỀ JSON. 
        - "intent": "build.pc" hoặc "chat".
        - "budget": Số tiền VNĐ chính xác. VD: "16tr5" -> 16500000. NẾU KHÔNG CÓ, LÀ 0.
        - "purpose": "gaming", "work", "office" hoặc "unknown".
        
        Quy tắc xử lý budget: 
        - 15tr -> 15000000
        - 16tr5 -> 16500000
        - 16.5tr -> 16500000
        
        TUYỆT ĐỐI KHÔNG tự bịa budget.
        { "intent": "build.pc", "budget": 0, "purpose": "unknown" }`
    };
    messages.unshift(systemPrompt);

    const completion = await groqClient.chat.completions.create({
        messages: messages,
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" }
    });
    return JSON.parse(completion.choices[0].message.content);
};

// Bước 2: Tạo câu trả lời tự nhiên dựa trên dữ liệu THẬT
const generateNaturalReply = async (userMessage, productList = [], purpose = "unknown", budget = 0, actualTotal = 0) => {
    const productDetails = productList.map(p => `- ${p.name}: ${p.price.toLocaleString()}đ`).join("\n");
    const isOverBudget = actualTotal > budget;

    let systemContent = `Bạn là nhân viên tư vấn PC chuyên nghiệp. Dữ liệu:
DANH SÁCH:
${productDetails}
TỔNG CỘNG: ${actualTotal.toLocaleString()}đ
NGÂN SÁCH KHÁCH: ${budget.toLocaleString()}đ

NHIỆM VỤ:
1. Trả lời dưới 30 từ.
2. NẾU TỔNG CỘNG <= NGÂN SÁCH: Báo giá tổng và xác nhận cấu hình ổn. TUYỆT ĐỐI KHÔNG HỎI TĂNG NGÂN SÁCH.
3. NẾU TỔNG CỘNG > NGÂN SÁCH: Báo giá tổng và hỏi khách có muốn tăng ngân sách không.
4. Trả về JSON: {"reply": "Nội dung"}`;

    const completion = await groqClient.chat.completions.create({
        messages: [{ role: "system", content: systemContent }, { role: "user", content: userMessage }],
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" }
    });

    try {
        const responseData = JSON.parse(completion.choices[0].message.content);
        return responseData.reply;
    } catch (e) {
        return isOverBudget 
            ? `Cấu hình này giá ${actualTotal.toLocaleString()}đ, vượt ngân sách. Bạn có muốn tăng thêm ngân sách không?`
            : `Đã xong! Bộ máy có giá ${actualTotal.toLocaleString()}đ, hoàn toàn nằm trong ngân sách của bạn.`;
    }
};

// Hàm fallback cho chat bình thường
const askGroqGeneric = async (userMessage, history = []) => {
    const messages = history.map(item => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.parts[0].text
    }));
    messages.push({ role: "user", content: userMessage });

    messages.unshift({
        role: "system",
        content: "Bạn là nhân viên tư vấn PC chuyên nghiệp. Trả lời dưới 20 từ. Chỉ hỏi ngân sách hoặc mục đích nếu chưa có."
    });

    const completion = await groqClient.chat.completions.create({
        messages: messages,
        model: "llama-3.1-8b-instant"
    });
    return completion.choices[0].message.content;
};

module.exports = { parseUserIntent, generateNaturalReply, askGroqGeneric };