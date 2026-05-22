const Groq = require("groq-sdk");

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

const tools = [
    {
        type: "function",
        function: {
            name: "search_products",
            description: "Tìm kiếm linh kiện lẻ. VD: khách nói 'tìm RAM', 'mua VGA', 'cần màn hình'.",
            parameters: {
                type: "object",
                properties: {
                    components: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                category: { type: "string", description: "CPU, RAM, VGA, Mainboard, SSD, PSU, Case, Monitor" },
                                keyword: { type: "string" },
                                maxPrice: { type: "number" }
                            }
                        }
                    }
                },
                required: ["components"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "build_full_pc",
            description: "Build cấu hình PC trọn bộ. CHỈ GỌI KHI KHÁCH ĐÃ NÓI RÕ SỐ TIỀN.",
            parameters: {
                type: "object",
                properties: {
                    totalBudget: { type: "number", description: "Ngân sách tổng (VNĐ)" },
                    purpose: { type: "string", description: "Mục đích sử dụng" }
                },
                required: ["totalBudget", "purpose"]
            }
        }
    }
];

const analyzeIntentAndCallTools = async (userMessage, history = []) => {
    const formattedHistory = history.slice(-4).map(item => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.parts ? item.parts[0].text : (item.content || "")
    }));

    const systemPrompt = `Bạn là nhân viên bán PC.
QUY TẮC:
1. Nếu khách chào: Trả lời ngắn gọn và hỏi nhu cầu.
2. NẾU KHÁCH CHƯA NÓI RÕ NGÂN SÁCH HOẶC MỤC ĐÍCH (khi ráp PC): PHẢI hỏi.
3. TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ BỊA SỐ TIỀN.
4. CHỈ gọi hàm build_full_pc KHI KHÁCH ĐÃ NÓI RÕ SỐ TIỀN VÀ MỤC ĐÍCH.`;

    formattedHistory.unshift({ role: "system", content: systemPrompt });
    formattedHistory.push({ role: "user", content: userMessage });

    try {
        const completion = await groqClient.chat.completions.create({
            messages: formattedHistory,
            model: "llama-3.1-8b-instant",
            tools: tools,
            tool_choice: "auto",
            temperature: 0.1
        });

        const responseMessage = completion.choices[0].message;

        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            const toolCall = responseMessage.tool_calls[0];
            return {
                type: "tool_call",
                name: toolCall.function.name,
                args: JSON.parse(toolCall.function.arguments)
            };
        }

        return {
            type: "message",
            content: responseMessage.content
        };
    } catch (error) {
        console.error("Groq Intent Analysis Error:", error);
        return { type: "error", content: "Xin lỗi, hệ thống AI đang bảo trì." };
    }
};

module.exports = { analyzeIntentAndCallTools };