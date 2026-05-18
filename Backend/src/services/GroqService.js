const Groq = require("groq-sdk");

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
        - "accessories": Mảng các phụ kiện khách muốn thêm. 
          CHỈ ĐƯỢC CHỌN TỪ DANH SÁCH: ["Monitor", "keybroad"].
          Lưu ý: Nếu khách nói "bàn phím" hoặc "keyboard", hãy trả về "keybroad".
        
        { "intent": "build.pc", "budget": 0, "purpose": "unknown", "accessories": [] }`
    };
    messages.unshift(systemPrompt);

    const completion = await groqClient.chat.completions.create({
        messages: messages,
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" }
    });
    return JSON.parse(completion.choices[0].message.content);
};

const generateNaturalReply = async (userMessage, productList = [], purpose = "unknown", budget = 0, actualTotal = 0, missingItems = []) => {
    const productDetails = productList.map(p => `- ${p.name}: ${p.price.toLocaleString()}đ`).join("\n");
    const missingText = missingItems.length > 0 
        ? `CÁC MÓN KHÔNG THỂ THÊM VÌ HẾT NGÂN SÁCH: ${missingItems.join(', ')}` 
        : "ĐÃ ĐỦ TẤT CẢ LINH KIỆN YÊU CẦU.";

    let systemContent = `Bạn là nhân viên tư vấn phần cứng PC. 
    Dữ liệu:
    - Danh sách: \n${productDetails}
    - ${missingText}
    - Tổng: ${actualTotal.toLocaleString()}đ
    - Ngân sách: ${budget.toLocaleString()}đ

    NHIỆM VỤ:
    1. Trả lời dưới 30 từ, tập trung vào cấu hình phần cứng.
    2. Nếu thiếu món: Báo rõ món thiếu và gợi ý tăng ngân sách.
    3. Nếu đủ: Xác nhận cấu hình RẤT TỐT.
    4. Trả về JSON: {"reply": "Nội dung phản hồi của bạn"}
    KHÔNG ĐƯỢC CHÈN THÊM BẤT KỲ KÝ TỰ NÀO NGOÀI JSON.`;

    const completion = await groqClient.chat.completions.create({
        messages: [{ role: "system", content: systemContent }, { role: "user", content: userMessage }],
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" }
    });

    try {
        const responseData = JSON.parse(completion.choices[0].message.content);
        return responseData.reply;
    } catch (e) {
        return `Cấu hình giá ${actualTotal.toLocaleString()}đ đã sẵn sàng.`;
    }
};

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

module.exports = { parseUserIntent, generateNaturalReply, askGroqGeneric, extractBudgetWithAI };

async function extractBudgetWithAI(text) {
    const prompt = `Trích xuất ngân sách từ câu: "${text}". Trả về JSON duy nhất: {"budget": số_tiền_VNĐ}. Nếu không có số, trả về 0. VD: "16tr5" -> 16500000.`;
    const response = await askGroqGeneric(prompt, []);
    try {
        const jsonMatch = response.match(/\{.*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]).budget : 0;
    } catch { return 0; }
}