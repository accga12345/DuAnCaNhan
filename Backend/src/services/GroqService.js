const Groq = require("groq-sdk");

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

const parseUserIntent = async (userMessage, history = [], validCategories = []) => {
    const messages = history.map(item => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.parts[0].text
    }));
    messages.push({ role: "user", content: userMessage });

    const systemPrompt = {
        role: "system",
        content: `Bạn là chuyên gia phân tích yêu cầu tại shop PC.
        NHIỆM VỤ: Trích xuất thông tin từ tin nhắn và lịch sử. 
        
        CÁC TRƯỜNG JSON CẦN TRẢ VỀ:
        - "intent": "build.pc", "buy.individual", hoặc "chat".
        - "budget": Số tiền VNĐ tổng. (15tr -> 15000000). NẾU CHƯA CÓ, LÀ 0.
        - "purpose": "gaming", "work", "office". NẾU CHƯA CÓ, PHẢI LÀ "unknown".
        - "cpuBrand": "intel", "amd". NẾU CHƯA CÓ, PHẢI LÀ "unknown".
        - "components": Mảng linh kiện: {"cat": "Tên danh mục chuẩn", "budget": số_tiền}.
        
        QUY TẮC CỰC KỲ QUAN TRỌNG:
        1. KHÔNG ĐƯỢC đoán "purpose" hay "cpuBrand" nếu khách chưa nói rõ.
        2. Nếu thiếu bất kỳ thông tin nào trong 3 thứ (budget, purpose, cpuBrand), "intent" PHẢI là "chat".
        3. CHỈ khi nào có ĐỦ CẢ 3 (budget, purpose, cpuBrand), "intent" mới được là "build.pc".
        4. DANH MỤC HỢP LỆ: [${validCategories.join(', ')}]
        
        { "intent": "chat", "budget": 0, "purpose": "unknown", "cpuBrand": "unknown", "components": [] }`
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
    - Danh sách linh kiện đã chọn: \n${productDetails}
    - ${missingText}
    - Tổng cộng: ${actualTotal.toLocaleString()}đ
    - Ngân sách khách: ${budget.toLocaleString()}đ

    NHIỆM VỤ:
    1. Trả lời dưới 30 từ, xác nhận cấu hình và báo tổng giá.
    2. Nếu thiếu món: Báo rõ món thiếu và gợi ý khách tăng ngân sách nhẹ.
    3. TUYỆT ĐỐI KHÔNG nói về phần mềm, cài đặt hay hệ điều hành.
    4. PHẢI trả về một JSON object duy nhất có định dạng: {"reply": "Nội dung phản hồi"}`;

    const completion = await groqClient.chat.completions.create({
        messages: [{ role: "system", content: systemContent }, { role: "user", content: userMessage }],
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" }
    });

    try {
        const responseData = JSON.parse(completion.choices[0].message.content);
        return responseData.reply;
    } catch (e) {
        return `Cấu hình PC giá ${actualTotal.toLocaleString()}đ đã sẵn sàng.`;
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
        content: `Bạn là nhân viên tư vấn PC. 
        NHIỆM VỤ: 
        1. Nếu khách đã cung cấp ngân sách và mục đích (gaming/văn phòng), hãy hỏi duy nhất câu: "Bạn muốn build PC với CPU Intel hay AMD?"
        2. TUYỆT ĐỐI KHÔNG gợi ý linh kiện, không hỏi về màn hình/phím/chuột.
        3. TUYỆT ĐỐI KHÔNG nói về phần mềm/OS.
        4. Trả lời dưới 15 từ.`
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