const GroqService = require('../services/GroqService');
const ChatService = require('../services/ChatService');
const ProductModel = require('../models/ProductModel');
const CategoryModel = require('../models/CategoryModel');

// =====================================================================
// CÁC HÀM BỔ TRỢ HỆ THỐNG TRÍCH XUẤT DB (HELPERS)
// =====================================================================
const getSpec = (product, key) => {
    if (!product || !product.specifications || !Array.isArray(product.specifications)) return null;
    const spec = product.specifications.find(s => s.key && s.key.toLowerCase().includes(key.toLowerCase()));
    return spec ? spec.value : null;
};

const applyPreferences = (query, brandPreference) => {
    if (brandPreference && Array.isArray(brandPreference) && brandPreference.length > 0) {
        const cleanBrands = brandPreference.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        query.brand = { $regex: new RegExp(cleanBrands.join('|'), 'i') };
    }
    return query;
};

/**
 * Hàm tìm kiếm linh kiện tối ưu kèm cơ chế Fallback (Linh kiện vạn năng)
 */
const findBestComponent = async (categoryName, budgetAllowed, extraQuery = {}) => {
    const cat = await CategoryModel.findOne({ name: new RegExp(categoryName, 'i') });
    if (!cat) return null;

    let query = { category: cat._id, ...extraQuery };

    let priceQuery = { ...query };
    if (budgetAllowed && budgetAllowed > 0) priceQuery.price = { $lte: budgetAllowed };
    let item = await ProductModel.findOne(priceQuery).sort({ price: -1 });

    if (!item && Object.keys(extraQuery).length > 0) {
        console.log(`[FALLBACK] Bỏ bộ lọc thông số nghiêm ngặt cho danh mục ${categoryName}.`);
        let fallbackQuery = { category: cat._id };
        if (budgetAllowed && budgetAllowed > 0) fallbackQuery.price = { $lte: budgetAllowed };
        item = await ProductModel.findOne(fallbackQuery).sort({ price: -1 });
    }

    if (!item && budgetAllowed > 0) {
        console.log(`[FALLBACK] Ngân sách quá thấp cho ${categoryName}. Tự động lấy món rẻ nhất.`);
        item = await ProductModel.findOne({ category: cat._id }).sort({ price: 1 });
    }

    return item;
};

/**
 * Hàm quét DB lấy ngữ cảnh siêu tiết kiệm Token
 */
const getAvailableProductsContext = async (message) => {
    try {
        const categories = await CategoryModel.find({});
        let matchedCat = null;

        const safeMessage = message.toLowerCase();
        for (const cat of categories) {
            const regex = new RegExp(`\\b${cat.name}\\b`, 'i');
            if (regex.test(safeMessage) || safeMessage.includes(cat.name.toLowerCase())) {
                matchedCat = cat;
                break;
            }
        }

        if (!matchedCat) {
            return `DỮ LIỆU KHO HÀNG THỰC TẾ: [TRỐNG]. LỆNH BẮT BUỘC: Hỏi lại khách hàng xem cần tìm món linh kiện gì.`;
        }

        const totalCount = await ProductModel.countDocuments({ category: matchedCat._id });
        if (totalCount === 0) return `Hệ thống kho hàng đối với danh mục "${matchedCat.name}" hiện tại đang HẾT HÀNG.`;

        const sampleProducts = await ProductModel.find({ category: matchedCat._id }).select('name price brand').limit(5);
        const listStr = sampleProducts.map(p => `- ${p.name} (Giá: ${p.price.toLocaleString()}đ) [Hãng: ${p.brand}]`).join('\n');

        return `DỮ LIỆU KHO HÀNG THỰC TẾ:\nDanh mục: ${matchedCat.name.toUpperCase()}\n- TỔNG SỐ LƯỢNG MÃ: ${totalCount}.\n- DANH SÁCH TIÊU BIỂU:\n${listStr}`;
    } catch (err) {
        return "Lỗi truy xuất kho hàng.";
    }
};

// =====================================================================
// HÀM XỬ LÝ CHAT CHÍNH (MAIN CONTROLLER)
// =====================================================================
const handleChat = async (req, res) => {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ status: 'ERR', message: 'Thiếu tin nhắn đầu vào' });

    let botReply = "";
    let suggestedProducts = [];
    let engine = "NLU + Expert Engine";

    try {
        const dbContext = await getAvailableProductsContext(message);

        // Gọi NLU lấy kết quả phân tích
        const nluResult = await GroqService.askGroq(message, history || [], dbContext);
        let { intent, budget, purpose, requirements, brand_preference, reply, is_action } = nluResult;

        // -----------------------------------------------------------------
        // CHỐT CHẶN 1: CƯỠNG CHẾ KHỐNG CHẾ BUDGET BẰNG CODE KHI ĐỔI NGỮ CẢNH
        // -----------------------------------------------------------------
        if (history && history.length > 0) {
            const userHistory = history.filter(h => h.role === 'user' || h.role === 'client');
            if (userHistory.length > 0) {
                const lastMessage = userHistory[userHistory.length - 1].content || "";

                // Nếu tin nhắn trước đó liên quan đến build PC, mà tin nhắn này đổi sang mua lẻ/combo
                const isPrevBuildPc = lastMessage.toLowerCase().includes("build") || lastMessage.toLowerCase().includes("ráp");
                const isCurrentSingle = intent === 'buy_single' || intent === 'buy_combo';
                const hasNumberInCurrentMessage = /\d+/.test(message);

                if (isPrevBuildPc && isCurrentSingle && !hasNumberInMessage) {
                    console.log(`[CODE CONTROL] Cưỡng chế xóa budget lây nhiễm từ luồng PC cũ.`);
                    budget = 0; // Đưa về 0 để ép hệ thống rơi vào luồng hỏi tiền
                }
            }
        }

        console.log(`[EXPERT ENGINE] Sau xử lý Code -> Intent: ${intent} | Budget thực tế: ${budget} | Action: ${is_action}`);

        const isMissingBudget = !budget || budget <= 0;
        const isMissingPurpose = intent === 'build_pc' && (!purpose || purpose.trim() === "");

        // TRƯỜNG HỢP 1: Luồng chat bình thường hoặc THIẾU thông tin (Ngân sách/Mục đích)
        // Ưu tiên tuyệt đối đưa câu hỏi phản hồi của AI ra ngoài, chặn đứng việc tự động tìm sản phẩm bậy
        if (intent === 'chat' || isMissingBudget || (intent === 'build_pc' && isMissingPurpose)) {
            botReply = reply;
        }

        // TRƯỜNG HỢP 2: Luồng tìm mua đúng 1 món linh kiện lẻ (ĐÃ ĐỦ NGÂN SÁCH ĐƯỢC CHỨNG THỰC)
        else if (intent === 'buy_single') {
            const reqItem = requirements && requirements[0];
            if (reqItem && reqItem.category) {
                let query = applyPreferences({}, brand_preference);
                if (reqItem.keyword) query.name = { $regex: new RegExp(reqItem.keyword, 'i') };

                const item = await findBestComponent(reqItem.category, budget, query);
                if (item) {
                    suggestedProducts.push(item);
                    botReply = reply || `Dạ, đây là mẫu ${reqItem.category} tối ưu nhất trong tầm giá bạn yêu cầu: **${item.name}** (${item.price.toLocaleString()}đ).`;
                } else {
                    botReply = `Dạ xin lỗi bạn, hiện tại kho hàng trong phân khúc giá này đang tạm hết sẵn sản phẩm ${reqItem.category} phù hợp rồi ạ.`;
                }
            } else {
                botReply = reply || `Bạn muốn tìm mua linh kiện gì cụ thể thế ạ?`;
            }
        }

        // TRƯỜNG HỢP 3: Luồng mua Combo nhiều món lẻ
        else if (intent === 'buy_combo') {
            if (!requirements || requirements.length === 0) {
                botReply = reply;
            } else {
                const perItemBudget = budget / requirements.length;
                const promises = requirements.map(async (reqItem) => {
                    let query = applyPreferences({}, brand_preference);
                    if (reqItem.keyword) query.name = { $regex: new RegExp(reqItem.keyword, 'i') };
                    return findBestComponent(reqItem.category, perItemBudget * 1.1, query);
                });

                const results = await Promise.all(promises);
                suggestedProducts = results.filter(item => item != null);

                if (suggestedProducts.length > 0) {
                    const totalActual = suggestedProducts.reduce((sum, p) => sum + p.price, 0);
                    botReply = reply || `Dạ, mình đã phối combo theo tầm giá bạn yêu cầu. Tổng chi phí thực tế là: **${totalActual.toLocaleString()}đ**.`;
                } else {
                    botReply = `Tiếc quá, mình chưa tìm thấy linh kiện nào khớp với combo yêu cầu trong phân khúc ngân sách này của bạn rồi.`;
                }
            }
        }

        // TRƯỜNG HỢP 4: THUẬT TOÁN PHỐI CẤU HÌNH PC (ĐÃ ĐỦ ĐIỀU KIỆN)
        else if (intent === 'build_pc') {
            const ratios = {
                gaming: { CPU: 0.18, Mainboard: 0.12, RAM: 0.09, VGA: 0.35, SSD: 0.08, PSU: 0.07, Case: 0.06, Cooling: 0.05 },
                work: { CPU: 0.28, Mainboard: 0.14, RAM: 0.14, VGA: 0.18, SSD: 0.10, PSU: 0.07, Case: 0.05, Cooling: 0.04 },
                office: { CPU: 0.38, Mainboard: 0.18, RAM: 0.14, VGA: 0.00, SSD: 0.14, PSU: 0.08, Case: 0.08, Cooling: 0.00 }
            };

            const purposeKey = purpose.trim().toLowerCase();
            const ratio = ratios[purposeKey] || ratios.gaming;
            const prefQuery = applyPreferences({}, brand_preference);
            let build = {};

            const components = ["CPU", "Mainboard", "RAM", "VGA", "SSD", "PSU", "Case", "Cooling"];
            const requiredComponents = components.filter(comp => ratio[comp] > 0);

            for (const comp of requiredComponents) {
                const compBudget = budget * ratio[comp];
                let query = { ...prefQuery };

                if (comp === "Mainboard" && build.CPU) {
                    const cpuSocket = getSpec(build.CPU, 'Socket');
                    if (cpuSocket) {
                        query["specifications"] = {
                            $elemMatch: {
                                key: { $regex: /Socket/i },
                                value: { $regex: new RegExp(cpuSocket, 'i') }
                            }
                        };
                    }
                }
                build[comp] = await findBestComponent(comp, compBudget, query);
            }

            suggestedProducts = Object.values(build).filter(item => item != null);
            let currentTotal = suggestedProducts.reduce((sum, p) => sum + p.price, 0);

            const missingComponents = requiredComponents.filter(comp => !build[comp]);

            if (missingComponents.length > 0 || currentTotal > budget * 1.15) {
                const missingListStr = missingComponents.join(', ');
                botReply = reply ? reply : `Mình đã cố gắng cấu hình hệ thống phù hợp, tuy nhiên ngân sách ${budget.toLocaleString()}đ đang bị thiếu linh kiện (${missingListStr}). Bạn có thể cân nhắc nâng tầm giá lên khoảng **${Math.ceil((currentTotal * 1.1) / 500000) * 500000}đ** để mình phối lại chuẩn chỉ không ạ?`;
            } else {
                botReply = reply || `Mình đã phối cấu hình tốt nhất dựa trên tỷ lệ ngân sách cho nhu cầu của bạn. Tổng chi phí thực tế là: **${currentTotal.toLocaleString()}đ**.`;
            }
        }

        // CHỐT CHẶN CUỐI CÙNG CHỐNG TIN NHẮN TRẮNG VĂN MẪU
        if (!botReply || botReply.trim() === "") {
            botReply = reply || "Dạ, bạn có thể chia sẻ cụ thể hơn mức chi phí dự kiến để shop hỗ trợ nhanh nhất nhé!";
        }

    } catch (error) {
        console.error("❌ LỖI HỆ THỐNG TẠI CHATCONTROLLER:", error.stack);
        const nlpResult = await ChatService.processLocalNLP(message);
        botReply = nlpResult.answer || "Hệ thống đang bận xử lý dữ liệu, bạn vui lòng thử lại sau vài giây nhé!";
    }

    return res.status(200).json({
        status: 'OK',
        engine: engine,
        message: botReply,
        data: suggestedProducts
    });
};

module.exports = { handleChat };