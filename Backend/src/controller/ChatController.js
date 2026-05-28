const GroqService = require('../services/GroqService');
const ChatService = require('../services/ChatService');
const ProductModel = require('../models/ProductModel');
const CategoryModel = require('../models/CategoryModel');
const { normalizeBudget, normalizeRequirements, CATEGORY_ALIASES } = require('../services/GroqService');

// =====================================================================
// HELPERS
// =====================================================================
const getSpec = (product, key) => {
    if (!product?.specifications || !Array.isArray(product.specifications)) return null;
    const spec = product.specifications.find(s => s.key?.toLowerCase().includes(key.toLowerCase()));
    return spec ? spec.value : null;
};

const applyPreferences = (query, brandPreference) => {
    if (Array.isArray(brandPreference) && brandPreference.length > 0) {
        const cleanBrands = brandPreference.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        query.brand = { $regex: new RegExp(cleanBrands.join('|'), 'i') };
    }
    return query;
};

const findBestComponent = async (categoryName, budgetAllowed, extraQuery = {}) => {
    const cat = await CategoryModel.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });
    if (!cat) {
        console.log(`[DB] Không tìm thấy category: "${categoryName}"`);
        return null;
    }

    const strictQuery = { category: cat._id, ...extraQuery };
    const universalQuery = { category: cat._id }; // Không filter thông số

    // 1. Ưu tiên 1: Khớp Thông số + Khớp Ngân sách (ưu tiên giá cao nhất trong tầm giá)
    if (budgetAllowed > 0) {
        const itemBest = await ProductModel.findOne({ ...strictQuery, price: { $lte: budgetAllowed } }).populate('category').sort({ price: -1 });
        if (itemBest) return itemBest;
    }

    // 2. Ưu tiên 2: Vạn năng (không filter thông số, sản phẩm phổ biến) + Khớp Ngân sách
    if (budgetAllowed > 0) {
        const itemUniversal = await ProductModel.findOne({ ...universalQuery, price: { $lte: budgetAllowed } }).populate('category').sort({ rating: -1, selled: -1 });
        if (itemUniversal) return itemUniversal;
    }

    // 3. Ưu tiên 3: Khớp Thông số hoặc vạn năng + Rẻ nhất (fallback cuối cùng)
    const itemStrictCheapest = await ProductModel.findOne(strictQuery).populate('category').sort({ price: 1 });
    const itemUnivCheapest = await ProductModel.findOne(universalQuery).populate('category').sort({ price: 1 });
    
    if (itemStrictCheapest && itemUnivCheapest) {
        return itemStrictCheapest.price <= itemUnivCheapest.price ? itemStrictCheapest : itemUnivCheapest;
    }
    return itemStrictCheapest || itemUnivCheapest;
};

/**
 * Lấy intent + budget từ assistant message cuối trong history.
 */
const getPrevAssistantIntent = (history) => {
    if (!history?.length) return null;
    const lastBot = [...history].reverse().find(h => h.role === 'assistant' || h.role === 'bot');
    if (!lastBot) return null;
    try {
        const raw = lastBot.parts?.[0]?.text || lastBot.content || '{}';
        const parsed = JSON.parse(raw);
        if (parsed.intent) return { intent: parsed.intent, budget: normalizeBudget(parsed.budget) };
    } catch (_) { }
    return null;
};

/**
 * Weight phân bổ ngân sách cho buy_combo — thực tế hơn chia đều.
 */
const COMBO_WEIGHT = {
    'cpu': 0.40, 'mainboard': 0.30, 'ram': 0.15, 'ssd': 0.10,
    'vga': 0.55, 'psu': 0.12, 'case': 0.10, 'cooling': 0.08,
    'màn hình': 0.45, 'bàn phím': 0.15, 'chuột': 0.10, 'tai nghe': 0.15,
};

const getComboWeight = (categoryName) => COMBO_WEIGHT[categoryName.toLowerCase()] ?? (1 / 3);

// =====================================================================
// MAIN CONTROLLER
// =====================================================================
const handleChat = async (req, res) => {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ status: 'ERR', message: 'Thiếu tin nhắn đầu vào' });

    let botReply = '';
    let suggestedProducts = [];

    try {
        // BƯỚC 1: Gọi NLU
        const nluResult = await GroqService.askGroq(message, history || [], '');
        let { intent, budget, purpose, requirements, brand_preference, reply, is_action } = nluResult;

        console.log('[NLU_RAW]', JSON.stringify(nluResult));

        console.log(`[CONTROLLER] Intent: ${intent} | Budget: ${budget} | is_action: ${is_action}`);

        const isMissingBudget = budget <= 0;
        const isMissingPurpose = intent === 'build_pc' && !purpose?.trim();

        // ---------------------------------------------------------------
        // TRƯỜNG HỢP 1: chat / thiếu thông tin → không query DB
        // ---------------------------------------------------------------
        if (intent === 'chat' || isMissingBudget || isMissingPurpose) {
            botReply = reply || 'Dạ bạn cần hỗ trợ gì thêm ạ?';
        }

        // ---------------------------------------------------------------
        // TRƯỜNG HỢP 2: buy_single
        // ---------------------------------------------------------------
        else if (intent === 'buy_single') {
            // Lấy category từ requirements (đã được normalize thành [{category, keyword}])
            let reqItem = requirements?.[0];

            // Rescue: scan message qua CATEGORY_ALIASES (match dài nhất trước)
            if (!reqItem?.category) {
                const lower = message.toLowerCase();
                const sorted = Object.entries(CATEGORY_ALIASES).sort((a, b) => b[0].length - a[0].length);
                for (const [alias, catName] of sorted) {
                    if (lower.includes(alias)) {
                        reqItem = { category: catName, keyword: '' };
                        console.log('[RESCUE] Category từ scan message:', catName);
                        break;
                    }
                }
            }

            if (reqItem?.category) {
                const query = applyPreferences({}, brand_preference);
                if (reqItem.keyword) query.name = { $regex: new RegExp(reqItem.keyword, 'i') };

                const item = await findBestComponent(reqItem.category, budget, query);
                if (item) {
                    suggestedProducts.push(item);
                    botReply = `Đây là mẫu **${reqItem.category}** tối ưu trong tầm giá của bạn: **${item.name}** — ${item.price.toLocaleString('vi-VN')}đ.`;
                } else {
                    botReply = `Xin lỗi bạn, kho hàng hiện chưa có **${reqItem.category}** phù hợp trong phân khúc này ạ.`;
                }
            } else {
                botReply = reply || 'Bạn muốn tìm mua linh kiện gì cụ thể thế ạ?';
            }
        }

        // ---------------------------------------------------------------
        // TRƯỜNG HỢP 3: buy_combo (weight thực tế, không chia đều)
        // ---------------------------------------------------------------
        else if (intent === 'buy_combo') {
            if (!requirements?.length) {
                botReply = reply || 'Bạn muốn combo bao gồm những linh kiện nào ạ?';
            } else {
                const totalWeight = requirements.reduce((s, r) => s + getComboWeight(r.category), 0);
                const promises = requirements.map(async (r) => {
                    const ratio = getComboWeight(r.category) / totalWeight;
                    const compBudget = budget * ratio;
                    const query = applyPreferences({}, brand_preference);
                    if (r.keyword) query.name = { $regex: new RegExp(r.keyword, 'i') };
                    return findBestComponent(r.category, compBudget, query);
                });

                const results = await Promise.all(promises);
                suggestedProducts = results.filter(Boolean);

                if (suggestedProducts.length > 0) {
                    const totalActual = suggestedProducts.reduce((s, p) => s + p.price, 0);
                    botReply = `Mình đã phối combo theo tầm giá của bạn. Tổng thực tế: **${totalActual.toLocaleString('vi-VN')}đ**.`;
                } else {
                    botReply = 'Tiếc quá, chưa tìm thấy linh kiện nào khớp combo trong phân khúc này rồi ạ.';
                }
            }
        }

        // ---------------------------------------------------------------
        // TRƯỜNG HỢP 4: build_pc
        // ---------------------------------------------------------------
        else if (intent === 'build_pc') {
            const ratios = {
                gaming: { CPU: 0.18, Mainboard: 0.12, RAM: 0.09, VGA: 0.35, SSD: 0.08, PSU: 0.07, Case: 0.06, Cooling: 0.05 },
                work: { CPU: 0.28, Mainboard: 0.14, RAM: 0.14, VGA: 0.18, SSD: 0.10, PSU: 0.07, Case: 0.05, Cooling: 0.04 },
                office: { CPU: 0.38, Mainboard: 0.18, RAM: 0.14, VGA: 0.00, SSD: 0.14, PSU: 0.08, Case: 0.08, Cooling: 0.00 },
                render: { CPU: 0.30, Mainboard: 0.12, RAM: 0.18, VGA: 0.20, SSD: 0.10, PSU: 0.06, Case: 0.04, Cooling: 0.00 },
            };

            const purposeKey = purpose.trim().toLowerCase();
            const ratio = ratios[purposeKey] || ratios.gaming;
            const prefQuery = applyPreferences({}, brand_preference);
            const build = {};
            const components = Object.keys(ratio).filter(k => ratio[k] > 0);

            for (const comp of components) {
                const compBudget = budget * ratio[comp];
                const query = { ...prefQuery };

                if (comp === 'Mainboard' && build.CPU) {
                    const cpuSocket = getSpec(build.CPU, 'Socket');
                    if (cpuSocket) {
                        query.specifications = {
                            $elemMatch: {
                                key: { $regex: /Socket/i },
                                value: { $regex: new RegExp(cpuSocket, 'i') }
                            }
                        };
                    }
                }
                build[comp] = await findBestComponent(comp, compBudget, query);
            }

            suggestedProducts = Object.values(build).filter(Boolean);
            const currentTotal = suggestedProducts.reduce((s, p) => s + p.price, 0);
            const missingComponents = components.filter(c => !build[c]);

            if (missingComponents.length > 0 || currentTotal > budget * 1.15) {
                const suggestedBudget = Math.ceil((currentTotal * 1.1) / 500_000) * 500_000;
                botReply = `Mình đã cố phối cấu hình nhưng ngân sách **${budget.toLocaleString('vi-VN')}đ** đang thiếu một số linh kiện${missingComponents.length ? ` (${missingComponents.join(', ')})` : ''}. Bạn có thể nâng lên khoảng **${suggestedBudget.toLocaleString('vi-VN')}đ** để mình phối lại chuẩn không ạ?`;
            } else {
                botReply = `Đây là cấu hình tối ưu cho nhu cầu **${purposeKey}** trong tầm giá của bạn. Tổng thực tế: **${currentTotal.toLocaleString('vi-VN')}đ**.`;
            }
        }

        // Chốt chặn reply rỗng
        if (!botReply?.trim()) {
            botReply = reply || 'Dạ bạn có thể cho shop biết mức ngân sách dự kiến được không ạ?';
        }

    } catch (error) {
        console.error('[CHATCONTROLLER_ERR]', error.stack);
        try {
            const nlpResult = await ChatService.processLocalNLP(message);
            botReply = nlpResult.answer || 'Hệ thống đang bận, bạn vui lòng thử lại sau vài giây nhé!';
        } catch (_) {
            botReply = 'Hệ thống đang bận, bạn vui lòng thử lại sau vài giây nhé!';
        }
    }

    return res.status(200).json({ status: 'OK', message: botReply, data: suggestedProducts });
};

module.exports = { handleChat };