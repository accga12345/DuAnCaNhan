const Groq = require("groq-sdk");

// =====================================================================
// NORMALIZE BUDGET
// Xử lý mọi cách user Việt nhập tiền → VND nguyên (số nguyên)
// =====================================================================
const normalizeBudget = (raw) => {
    if (!raw || raw === 0) return 0;
    if (typeof raw === 'string') {
        let s = raw.toLowerCase().replace(/\s+/g, '');

        // Tiếng lóng: củ / chai / lít = triệu
        s = s.replace(/củ/g, 'tr').replace(/chai/g, 'tr').replace(/lít/g, 'tr');

        // Dấu chấm kiểu Việt (16.000.000) → xóa dấu chấm phân cách nghìn
        const dotCount = (s.match(/\./g) || []).length;
        const lastDotPos = s.lastIndexOf('.');
        const afterLastDot = lastDotPos >= 0 ? s.slice(lastDotPos + 1).replace(/[^0-9]/g, '') : '';
        if (dotCount > 1 || (dotCount === 1 && afterLastDot.length === 3 && !/tr|triệu/i.test(s))) {
            s = s.replace(/\./g, '');
        }

        // Dấu phẩy kiểu Việt (16,000,000) → xóa; dấu phẩy thập phân → thành .
        const commaCount = (s.match(/,/g) || []).length;
        const lastCommaPos = s.lastIndexOf(',');
        const afterLastComma = lastCommaPos >= 0 ? s.slice(lastCommaPos + 1).replace(/[^0-9]/g, '') : '';
        if (commaCount > 0 && afterLastComma.length === 3) {
            s = s.replace(/,/g, '');
        } else {
            s = s.replace(/,/g, '.');
        }

        // "16tr5" → "16tr.5"
        s = s.replace(/tr(\d)$/, 'tr.$1');

        const trMatch = s.match(/([\d.]+)\s*tr(iệu|ieu)?\.?(\d*)/);
        if (trMatch) {
            const main = parseFloat(trMatch[1]);
            const decimal = trMatch[3] ? parseFloat('0.' + trMatch[3]) : 0;
            return Math.round((main + decimal) * 1_000_000);
        }

        const kMatch = s.match(/([\d.]+)\s*k$/);
        if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1_000);

        const clean = s.replace(/[^0-9]/g, '');
        return parseInt(clean) || 0;
    }
    if (typeof raw === 'number') {
        if (raw < 1_000) return raw * 1_000_000;   // "16"     → 16tr
        if (raw < 100_000) return raw * 1_000;        // "16000"  → 16tr
        return raw;                                     // "16000000" → đúng rồi
    }
    return 0;
};

// =====================================================================
// CATEGORY ALIASES — map mọi cách user gọi về tên chuẩn trong DB
// =====================================================================
const CATEGORY_ALIASES = {
    'màn hình': 'Monitor', 'man hinh': 'Monitor', 'monitor': 'Monitor', 'màn': 'Monitor',
    'cpu': 'CPU', 'chip': 'CPU', 'vi xử lý': 'CPU', 'processor': 'CPU', 'con chip': 'CPU',
    'mainboard': 'Mainboard', 'main': 'Mainboard', 'bo mạch': 'Mainboard', 'motherboard': 'Mainboard', 'bo mạch chủ': 'Mainboard',
    'ram': 'RAM', 'bộ nhớ': 'RAM', 'memory': 'RAM',
    'vga': 'VGA', 'card màn hình': 'VGA', 'gpu': 'VGA', 'card đồ họa': 'VGA', 'card': 'VGA',
    'ssd': 'SSD', 'ổ cứng': 'SSD', 'hdd': 'SSD', 'nvme': 'SSD', 'ổ ssd': 'SSD',
    'psu': 'PSU', 'nguồn': 'PSU', 'power supply': 'PSU', 'bộ nguồn': 'PSU',
    'case': 'Case', 'vỏ máy': 'Case', 'thùng máy': 'Case', 'vỏ case': 'Case',
    'cooling': 'Cooling', 'tản nhiệt': 'Cooling', 'fan': 'Cooling', 'quạt': 'Cooling', 'tản': 'Cooling',
    'bàn phím': 'Bàn phím', 'keyboard': 'Bàn phím', 'phím': 'Bàn phím',
    'chuột': 'Chuột', 'mouse': 'Chuột', 'con chuột': 'Chuột',
    'tai nghe': 'Tai nghe', 'headset': 'Tai nghe', 'headphone': 'Tai nghe',
};

// =====================================================================
// NORMALIZE REQUIREMENTS
// Đảm bảo luôn là [{category: string, keyword: string}]
// =====================================================================
const normalizeRequirements = (raw) => {
    if (!Array.isArray(raw) || raw.length === 0) return [];

    return raw.map(item => {
        if (item && typeof item === 'object' && item.category) {
            const normalized = CATEGORY_ALIASES[item.category.toLowerCase()] || item.category;
            return { category: normalized, keyword: item.keyword || '' };
        }
        if (typeof item === 'string') {
            const lower = item.toLowerCase().trim();
            // Exact match
            if (CATEGORY_ALIASES[lower]) return { category: CATEGORY_ALIASES[lower], keyword: '' };
            // Substring match
            for (const [alias, catName] of Object.entries(CATEGORY_ALIASES)) {
                if (lower.includes(alias)) return { category: catName, keyword: item };
            }
            return { category: '', keyword: item };
        }
        return { category: '', keyword: String(item) };
    });
};

// =====================================================================
// GROQ NLU
// =====================================================================
const askGroq = async (userMessage, history = [], dbContext = "") => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("API_KEY_MISSING");

    const groq = new Groq({ apiKey });

    const formattedHistory = history.map(item => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.parts?.[0]?.text || item.content || ""
    }));

    const lastAssistantJSON = [...history].reverse().find(item => item.role === 'assistant');
    let prevContext = { intent: "chat", budget: 0 };
    if (lastAssistantJSON) {
        try {
            const parsed = JSON.parse(lastAssistantJSON.parts?.[0]?.text || lastAssistantJSON.content || "{}");
            prevContext.intent = parsed.intent || "chat";
            prevContext.budget = normalizeBudget(parsed.budget) || 0;
        } catch (_) { }
    }

    const systemContent = `Bạn là module NLU cho shop PC & linh kiện. Chỉ xuất JSON, không giải thích.

## INTENT — chọn đúng 1 trong 4

"chat": chào hỏi, cảm ơn, câu bâng quơ, không có yêu cầu mua hàng hay ráp máy cụ thể.
"build_pc": muốn ráp nguyên bộ máy hoặc chỉnh sửa cấu hình đang build.
"buy_single": mua lẻ đúng 1 linh kiện hoặc phụ kiện.
"buy_combo": mua combo 2-3 linh kiện đi kèm (không phải nguyên bộ).

## BUDGET

- Output LUÔN là số nguyên VND. Ví dụ: 16 triệu = 16000000.
- Cách user nhập: "16tr" / "16 triệu" / "16 củ" / "khoảng 16" / "tầm 16" → tất cả = 16000000.
- Chưa biết budget → output 0.

## IS_ACTION

- build_pc: true khi budget > 0 VÀ purpose không rỗng.
- buy_single / buy_combo: true khi budget > 0.
- Mọi trường hợp còn lại: false.

## REPLY

- is_action = true → reply = "" (không hỏi thêm).
- is_action = false → hỏi ĐÚNG 1 thứ còn thiếu:
  + Thiếu budget → hỏi ngân sách.
  + Có budget, thiếu purpose (build_pc) → hỏi mục đích: gaming / văn phòng / đồ họa / render.
  + intent = chat → phản hồi thân thiện.
- NGHIÊM CẤM hỏi: game cụ thể, màn mấy inch, phần mềm gì, xem phim gì.

## REQUIREMENTS — bắt buộc là mảng object

[{"category": "<tên chuẩn>", "keyword": "<từ khóa thêm nếu có>"}]
Tên category chuẩn: CPU, Mainboard, RAM, VGA, SSD, PSU, Case, Cooling, Màn hình, Bàn phím, Chuột, Tai nghe.
Ví dụ "mua màn hình gaming 27 inch" → [{"category":"Màn hình","keyword":"gaming 27 inch"}]
Ví dụ "mua cpu" → [{"category":"CPU","keyword":""}]
KHÔNG để requirements là mảng string.

## CONTEXT TRƯỚC ĐÓ

Intent cũ: ${prevContext.intent} | Budget cũ: ${prevContext.budget}

## OUTPUT

{"intent":"...","budget":0,"purpose":"","is_action":false,"requirements":[],"brand_preference":[],"reply":""}`;

    const messages = [
        { role: "system", content: systemContent },
        ...formattedHistory,
        { role: "user", content: userMessage }
    ];

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            temperature: 0.0,
            max_tokens: 300
        });

        const raw = JSON.parse(chatCompletion.choices[0].message.content);

        // POST-PROCESSING (không tin hoàn toàn model)
        raw.budget = normalizeBudget(raw.budget);
        raw.requirements = normalizeRequirements(raw.requirements);

        // Safeguard reset budget khi chuyển build_pc → buy_single/buy_combo
        const prevWasBuild = prevContext.intent === "build_pc";
        const nowIsBuy = raw.intent === "buy_single" || raw.intent === "buy_combo";
        if (prevWasBuild && nowIsBuy && raw.budget === prevContext.budget && prevContext.budget > 0) {
            raw.budget = 0;
            raw.is_action = false;
            raw.reply = raw.reply || "Dạ bạn muốn đầu tư bao nhiêu cho món này ạ?";
        }

        // Đảm bảo is_action không bao giờ true khi budget = 0
        if (raw.budget <= 0 && raw.is_action === true) {
            raw.is_action = false;
            if (!raw.reply) raw.reply = "Dạ bạn có thể cho biết ngân sách dự kiến không ạ?";
        }

        return raw;

    } catch (e) {
        console.error("❌ Lỗi NLU Groq:", e.message);
        return {
            intent: "chat", budget: 0, purpose: "", is_action: false,
            requirements: [], brand_preference: [],
            reply: "Dạ hệ thống đang bận, bạn có thể nói lại nhu cầu được không ạ?"
        };
    }
};

module.exports = { askGroq, normalizeBudget, normalizeRequirements, CATEGORY_ALIASES };