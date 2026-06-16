const Groq = require("groq-sdk");

// =====================================================================
// NORMALIZE BUDGET & DETECTION
// =====================================================================
const HAS_BUDGET_REGEX = /(\d+)\s*(triệu|tr|củ|m|k|đồng|d)/i;
const hasBudgetExpression = (message) => HAS_BUDGET_REGEX.test(message);

const normalizeBudget = (raw) => {
    if (!raw || raw === 0) return 0;
    if (typeof raw === 'string') {
        let s = raw.toLowerCase().replace(/\s+/g, '');
        s = s.replace(/củ/g, 'tr').replace(/chai/g, 'tr').replace(/lít/g, 'tr');

        // Dấu chấm phân cách nghìn kiểu Việt (16.000.000)
        const dotCount = (s.match(/\./g) || []).length;
        const lastDotPos = s.lastIndexOf('.');
        const afterLastDot = lastDotPos >= 0 ? s.slice(lastDotPos + 1).replace(/[^0-9]/g, '') : '';
        if (dotCount > 1 || (dotCount === 1 && afterLastDot.length === 3 && !/tr|triệu/i.test(s))) {
            s = s.replace(/\./g, '');
        }

        // Dấu phẩy phân cách nghìn (16,000,000)
        const commaCount = (s.match(/,/g) || []).length;
        const lastCommaPos = s.lastIndexOf(',');
        const afterLastComma = lastCommaPos >= 0 ? s.slice(lastCommaPos + 1).replace(/[^0-9]/g, '') : '';
        if (commaCount > 0 && afterLastComma.length === 3) {
            s = s.replace(/,/g, '');
        } else {
            s = s.replace(/,/g, '.');
        }

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
        if (raw < 1_000) return raw * 1_000_000;
        if (raw < 100_000) return raw * 1_000;
        return raw;
    }
    return 0;
};

// =====================================================================
// CATEGORY ALIASES
// =====================================================================
const CATEGORY_ALIASES = {
    // Màn hình
    'màn hình': 'Monitor', 'man hinh': 'Monitor', 'monitor': 'Monitor',
    'màn': 'Monitor', 'screen': 'Monitor', 'display': 'Monitor',
    // CPU
    'cpu': 'CPU', 'chip': 'CPU', 'vi xử lý': 'CPU', 'processor': 'CPU', 'con chip': 'CPU',
    // Mainboard
    'mainboard': 'Mainboard', 'main': 'Mainboard', 'bo mạch': 'Mainboard',
    'motherboard': 'Mainboard', 'bo mạch chủ': 'Mainboard', 'mobo': 'Mainboard',
    // RAM
    'ram': 'RAM', 'bộ nhớ': 'RAM', 'memory': 'RAM',
    // VGA
    'vga': 'VGA', 'card màn hình': 'VGA', 'gpu': 'VGA', 'card đồ họa': 'VGA',
    'card': 'VGA', 'graphics card': 'VGA', 'video card': 'VGA',
    // SSD
    'ssd': 'SSD', 'ổ cứng': 'SSD', 'hdd': 'SSD', 'nvme': 'SSD', 'ổ ssd': 'SSD',
    'storage': 'SSD', 'hard drive': 'SSD',
    // PSU
    'psu': 'PSU', 'nguồn': 'PSU', 'power supply': 'PSU', 'bộ nguồn': 'PSU',
    // Case
    'case': 'Case', 'vỏ máy': 'Case', 'thùng máy': 'Case', 'vỏ case': 'Case',
    'pc case': 'Case', 'chassis': 'Case',
    // Cooling
    'cooling': 'Cooling', 'tản nhiệt': 'Cooling', 'fan': 'Cooling',
    'quạt': 'Cooling', 'tản': 'Cooling', 'cooler': 'Cooling', 'heatsink': 'Cooling',
    // Phụ kiện
    'bàn phím': 'Keyboard', 'keyboard': 'Keyboard', 'phím': 'Keyboard',
    'chuột': 'Mouse', 'mouse': 'Mouse', 'con chuột': 'Mouse',
    'tai nghe': 'Headset', 'headset': 'Headset', 'headphone': 'Headset',
};

// =====================================================================
// NORMALIZE REQUIREMENTS → [{category, keyword}]
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
            if (CATEGORY_ALIASES[lower]) return { category: CATEGORY_ALIASES[lower], keyword: '' };
            for (const [alias, catName] of Object.entries(CATEGORY_ALIASES)) {
                if (lower.includes(alias)) return { category: catName, keyword: item };
            }
            return { category: '', keyword: item };
        }
        return { category: '', keyword: String(item) };
    });
};

// =====================================================================
// RULE: Budget có được phép kế thừa từ lượt trước không?
// Chỉ giữ budget khi cùng intent hoặc khi user đang chỉnh sửa cùng luồng.
// Mọi trường hợp chuyển intent → budget phải do user nói trong tin mới.
// =====================================================================
const INTENT_CAN_INHERIT_BUDGET = {
    // intent mới → các intent cũ được phép kế thừa budget
    'build_pc': ['build_pc'],
    'buy_single': ['buy_single'],
    'buy_combo': ['buy_combo'],
    'research': [], // research không bao giờ kế thừa
    'chat': [],   // chat không bao giờ kế thừa
};

// =====================================================================
// GROQ NLU
// =====================================================================
const askGroq = async (userMessage, history = [], _dbContext = "") => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("API_KEY_MISSING");

    const groq = new Groq({ apiKey });

    const formattedHistory = history.map(item => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.parts?.[0]?.text || item.content || ""
    }));

    // Lấy state trước từ history để inject vào prompt và dùng cho safeguard.
    // Tìm message gần nhất của bot/assistant mà có chứa JSON state (để tránh bị đứt đoạn bởi các câu chat phụ)
    const botMessages = [...history].reverse().filter(h => h.role === 'assistant' || h.role === 'bot');
    let prevContext = { intent: 'chat', budget: 0 };

    for (const msg of botMessages) {
        try {
            const rawText = msg.parts?.[0]?.text || msg.content || "";
            if (rawText.trim().startsWith('{')) {
                const parsed = JSON.parse(rawText);
                if (parsed.intent) {
                    prevContext.intent = parsed.intent;
                    prevContext.budget = normalizeBudget(parsed.budget);
                    break;
                }
            }
        } catch (_) { }
    }

    // ---------------------------------------------------------------
    // Chỉ inject budget cũ vào prompt để model biết trạng thái trước.
    // Việc kế thừa thực tế được kiểm soát chặt chẽ ở phần POST-PROCESSING.
    // ---------------------------------------------------------------
    const sameIntentHint = prevContext.budget > 0
        ? `\nNGỮ CẢNH: Intent trước = "${prevContext.intent}", budget trước = ${prevContext.budget} VND.\nQuy tắc kế thừa: CHỈ giữ budget cũ nếu intent mới GIỐNG intent cũ VÀ user không nói số tiền mới. Nếu intent đổi sang loại khác → budget = 0, hỏi lại.`
        : `\nNGỮ CẢNH: Chưa có budget.`;

    const systemContent = `Bạn là module NLU cho shop PC & linh kiện. Chỉ xuất JSON, không giải thích.

## INTENT

"chat": chào hỏi, cảm ơn, câu không chứa yêu cầu mua hàng / ráp máy.
"build_pc": ráp nguyên bộ máy hoặc chỉnh cấu hình đang build.
"buy_single": mua lẻ đúng 1 linh kiện / phụ kiện.
"buy_combo": mua combo 2-3 linh kiện đi kèm (không phải nguyên bộ).
"research": tìm kiếm linh kiện dựa trên thông số kỹ thuật cụ thể (dung lượng, tần số quét, socket...).

## BUDGET

Output LUÔN là số nguyên VND. "16tr" / "16 triệu" / "16 củ" / "tầm 16" = 16000000.
Chưa biết budget → 0.
${sameIntentHint}

## IS_ACTION

build_pc: true khi budget > 0 VÀ purpose không rỗng.
buy_single / buy_combo: true khi budget > 0.
research: true (luôn coi là hành động tìm kiếm, không ép buộc có budget).
Mọi trường hợp khác: false.

## PURPOSE (CHỈ dùng cho build_pc)
Phân loại mục đích sử dụng của user vào ĐÚNG 1 trong 4 từ khóa tiếng Anh sau:
- "gaming": Chơi game
- "office": Văn phòng, học tập cơ bản, lướt web
- "render": Đồ họa, thiết kế, edit video, render 3D
- "work": Làm việc nặng, code, giả lập
Nếu không rõ, để trống "".

## SPECS_FILTER (Chỉ dùng cho intent 'research')
Khi người dùng nhắc đến thông số kỹ thuật, hãy trích xuất chúng thành mảng object: [{"key":"<tên thông số>", "value":"<giá trị>"}].
Ví dụ:
- "Mình cần tìm 1 thanh ram 64gb" -> [{"key": "dung lượng", "value": "64GB"}]
- "Màn hình 144Hz 27 inch" -> [{"key": "tần số quét", "value": "144Hz"}, {"key": "kích thước", "value": "27 inch"}]
Nếu không có thông số rõ ràng, để mảng rỗng [].

## REPLY

is_action = true → reply = "".
is_action = false → hỏi ĐÚNG 1 thứ còn thiếu theo ưu tiên:
  1. Thiếu budget (intent build_pc, buy_single, buy_combo): Chỉ hỏi về mức ngân sách (Vd: "Dạ bạn dự định đầu tư tầm bao nhiêu cho món này ạ?").
  2. Có budget, thiếu purpose (CHỈ dành cho build_pc): Hỏi mục đích sử dụng (gaming / đồ họa / văn phòng).
  3. Intent "chat": Phản hồi ngắn gọn, thân thiện.

TUYỆT ĐỐI KHÔNG hỏi mục đích (purpose) khi người dùng mua lẻ (buy_single) hoặc combo (buy_combo).
NGHIÊM CẤM hỏi lan man về: kích thước màn hình, hãng yêu thích, hay phần mềm cụ thể.

## REQUIREMENTS

Luôn là mảng object: [{"category":"<tên chuẩn>","keyword":"<từ khóa nếu có>"}]
Tên chuẩn: CPU, Mainboard, RAM, VGA, SSD, PSU, Case, Cooling, Màn hình, Bàn phím, Chuột, Tai nghe.
"mua màn gaming 27 inch" → [{"category":"Màn hình","keyword":"gaming 27 inch"}]
"mua cpu" → [{"category":"CPU","keyword":""}]
KHÔNG để requirements là mảng string.

## EXAMPLES (FEW-SHOT LEARNING)
- "Build cho mình bộ PC gaming tầm 20 triệu" -> {"intent":"build_pc", "purpose":"gaming", "budget":20000000}
- "Tìm giúp con chuột gaming" -> {"intent":"buy_single", "requirements":[{"category":"Chuột","keyword":"gaming"}]}
- "Báo giá combo Mainboard và RAM" -> {"intent":"buy_combo", "requirements":[{"category":"Mainboard","keyword":""},{"category":"RAM","keyword":""}]}
- "Mình cần tìm màn hình 144Hz" -> {"intent":"research", "requirements":[{"category":"Màn hình","keyword":""}], "specs_filter":[{"key":"tần số quét", "value":"144Hz"}]}
- "Tìm mainboard chạy được chip i9" -> {"intent":"research", "requirements":[{"category":"Mainboard","keyword":""}], "specs_filter":[{"key":"socket", "value":"LGA 1700"}]}
- "Mấy cái linh kiện linh tinh" -> {"intent":"chat"}
- "Mua cái gì cũng được" -> {"intent":"chat"}
- "Ráp bộ máy 1 đồng" -> {"intent":"chat"}
- "Shop sửa máy tính không" -> {"intent":"chat"}
- "Tại sao con chip này đắt thế" -> {"intent":"chat"}

## OUTPUT

{"intent":"...","budget":0,"purpose":"","is_action":false,"requirements":[],"specs_filter":[],"brand_preference":[],"reply":""}`;

    const messages = [
        { role: "system", content: systemContent },
        ...formattedHistory,
        { role: "user", content: userMessage }
    ];

    try {
        const completion = await groq.chat.completions.create({
            messages,
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            temperature: 0.0,
            max_tokens: 300
        });

        const raw = JSON.parse(completion.choices[0].message.content);

        // ---- POST-PROCESSING ----

        // 1. Normalize budget
        raw.budget = normalizeBudget(raw.budget);

        // 2. Normalize requirements
        raw.requirements = normalizeRequirements(raw.requirements);

        // 3. SAFEGUARD: reset budget khi intent đổi loại
        //    Model đôi khi vẫn kế thừa budget dù đã dặn trong prompt
        const allowedPrevIntents = INTENT_CAN_INHERIT_BUDGET[raw.intent] || [];
        const prevIntentAllowed = allowedPrevIntents.includes(prevContext.intent);

        if (!prevIntentAllowed && raw.budget === prevContext.budget && prevContext.budget > 0) {
            console.log(`[SAFEGUARD] Budget ${raw.budget} bị reset — intent đổi từ "${prevContext.intent}" sang "${raw.intent}"`);
            raw.budget = 0;
            raw.is_action = false;
            raw.reply = raw.reply || 'Dạ bạn muốn đầu tư bao nhiêu cho nhu cầu này ạ?';
        }

        // 4. Reset budget nếu buy_single/buy_combo mà user không nhắc tới tiền
        if ((raw.intent === 'buy_single' || raw.intent === 'buy_combo') && !hasBudgetExpression(userMessage)) {
            console.log(`[SAFEGUARD] Reset budget vì user không nhắc tới tiền trong tin nhắn mới`);
            raw.budget = 0;
            raw.is_action = false;
            raw.reply = raw.reply || 'Dạ bạn muốn đầu tư bao nhiêu cho món này ạ?';
        }

        // 5. Đảm bảo is_action không true khi budget = 0
        if (raw.budget <= 0 && raw.is_action === true) {
            raw.is_action = false;
            if (!raw.reply) raw.reply = 'Dạ bạn có thể cho biết ngân sách dự kiến không ạ?';
        }

        return raw;

    } catch (e) {
        console.error("❌ Lỗi NLU Groq:", e.message);
        return {
            intent: 'chat', budget: 0, purpose: '', is_action: false,
            requirements: [], brand_preference: [],
            reply: 'Dạ hệ thống đang bận, bạn có thể nói lại nhu cầu được không ạ?'
        };
    }
};

module.exports = { askGroq, normalizeBudget, normalizeRequirements, CATEGORY_ALIASES };