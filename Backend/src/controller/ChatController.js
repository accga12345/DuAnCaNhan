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

const findBestComponent = async (categoryName, budgetAllowed, extraQuery = {}) => {
    const cat = await CategoryModel.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });
    if (!cat) return null;

    const query = { category: cat._id, ...extraQuery };
    if (budgetAllowed && budgetAllowed > 0) query.price = { $lte: budgetAllowed };

    return await ProductModel.findOne(query).sort({ price: budgetAllowed > 0 ? -1 : 1 });
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
            return `DỮ LIỆU KHO HÀNG THỰC TẾ: [TRỐNG]. 
LỆNH BẮT BUỘC: Hệ thống hiện không khớp được yêu cầu này với danh mục nào trong kho. Ở trường "reply", TUYỆT ĐỐI KHÔNG được phép liệt kê hay gọi tên bất kỳ mã linh kiện cụ thể nào. Bạn chỉ được phép trả lời khéo léo để hỏi lại khách hàng đang cần tìm món linh kiện gì.`;
        }

        const totalCount = await ProductModel.countDocuments({ category: matchedCat._id });

        if (totalCount === 0) {
            return `Hệ thống kho hàng đối với danh mục "${matchedCat.name}" hiện tại đang HẾT HÀNG hoàn toàn. LỆNH CẤM: Không tự động bịa ra các mã sản phẩm thay thế.`;
        }

        const sampleProducts = await ProductModel.find({ category: matchedCat._id })
            .select('name price brand')
            .limit(5);

        const listStr = sampleProducts.map(p => `- ${p.name} (Giá: ${p.price.toLocaleString()}đ) [Hãng: ${p.brand}]`).join('\n');

        return `DỮ LIỆU KHO HÀNG THỰC TẾ (TỐI ƯU TOKEN):\nDanh mục: ${matchedCat.name.toUpperCase()}\n- TỔNG SỐ LƯỢNG MÃ SẢN PHẨM ĐANG CÓ SẴN TRONG KHO DB: ${totalCount} mã. (Bắt buộc dùng con số tổng ${totalCount} này để trả lời nếu người dùng hỏi về số lượng).\n- DANH SÁCH MỘT SỐ MẪU TIÊU BIỂU:\n${listStr}`;
    } catch (err) {
        return "Lỗi truy xuất kho hàng. CẤM CUNG CẤP THÔNG TIN SAI LỆCH.";
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

        const nluResult = await GroqService.askGroq(message, history || [], dbContext);
        let { intent, budget, purpose, requirements, brand_preference, reply, is_action } = nluResult;

        console.log(`[EXPERT ENGINE] Phân tích -> Intent: ${intent} | Budget gốc từ AI: ${budget} | Action: ${is_action}`);

        // ĐÃ XÓA CHỐT CHẶN TỰ HỦY TIỀN Ở ĐÂY

        const isMissingBudget = !budget || budget <= 0;
        const isMissingPurpose = intent === 'build_pc' && (!purpose || purpose.trim() === "");

        console.log(`[EXPERT ENGINE] Dòng tiền thực tế: ${budget}đ | Mục đích: ${purpose || 'CHƯA RÕ'}`);

        // TRƯỜNG HỢP 1.1: Luồng chat giao tiếp bình thường
        if (intent === 'chat') {
            botReply = reply || "Dạ, mình có thể hỗ trợ gì thêm cho bạn không ạ?";
        }
        // TRƯỜNG HỢP 1.2: Luồng mua sắm nhưng bị thiếu ngân sách/mục đích
        else if ((intent === 'build_pc' && (isMissingBudget || isMissingPurpose)) ||
            ((intent === 'buy_combo' || intent === 'buy_single') && isMissingBudget)) {
            botReply = reply || "Dạ, để hệ thống lọc mã chuẩn xác nhất, bạn có thể chia sẻ thêm về mức ngân sách dự kiến hoặc nhu cầu sử dụng cụ thể không ạ?";
        }
        // TRƯỜNG HỢP 2: Luồng tìm mua đúng 1 món linh kiện lẻ
        else if (intent === 'buy_single') {
            const reqItem = requirements && requirements[0];
            if (reqItem && reqItem.category) {
                let query = applyPreferences({}, brand_preference);
                if (reqItem.keyword) query.name = { $regex: new RegExp(reqItem.keyword, 'i') };

                const item = await findBestComponent(reqItem.category, budget, query);
                if (item) {
                    suggestedProducts.push(item);
                    botReply = reply ? reply : `Dạ đây là mẫu ${reqItem.category} tối ưu nhất trong tầm giá ${budget.toLocaleString()}đ bạn yêu cầu ạ.`;
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
                botReply = reply || `Bạn muốn kết hợp những linh kiện nào với nhau ạ?`;
            } else {
                const perItemBudget = budget / requirements.length;
                const promises = requirements.map(async (reqItem) => {
                    let query = applyPreferences({}, brand_preference);
                    if (reqItem.keyword) query.name = { $regex: new RegExp(reqItem.keyword, 'i') };
                    return findBestComponent(reqItem.category, perItemBudget * 1.2, query);
                });

                const results = await Promise.all(promises);
                suggestedProducts = results.filter(item => item != null);

                if (suggestedProducts.length > 0) {
                    const totalActual = suggestedProducts.reduce((sum, p) => sum + p.price, 0);
                    botReply = `Đây là các linh kiện trong combo mình tìm được cho bạn. Tổng chi phí là: **${totalActual.toLocaleString()}đ**.`;
                } else {
                    botReply = `Tiếc quá, mình chưa tìm thấy linh kiện nào khớp với combo yêu cầu trong tầm ngân sách này của bạn rồi.`;
                }
            }
        }
        // TRƯỜNG HỢP 4: THUẬT TOÁN PHỐI CẤU HÌNH PC ĐÃ ĐỦ TIỀN VÀ MỤC ĐÍCH
        else if (intent === 'build_pc') {
            const ratios = {
                gaming: { CPU: 0.18, Mainboard: 0.12, RAM: 0.09, VGA: 0.35, SSD: 0.08, PSU: 0.07, Case: 0.06, Cooling: 0.05 },
                work: { CPU: 0.28, Mainboard: 0.14, RAM: 0.14, VGA: 0.18, SSD: 0.10, PSU: 0.07, Case: 0.05, Cooling: 0.04 },
                office: { CPU: 0.38, Mainboard: 0.18, RAM: 0.14, VGA: 0.00, SSD: 0.14, PSU: 0.08, Case: 0.08, Cooling: 0.00 }
            };
            const ratio = ratios[purpose] || ratios.gaming;
            const prefQuery = applyPreferences({}, brand_preference);
            let build = {};

            build.CPU = await findBestComponent("CPU", budget * ratio.CPU, prefQuery);
            if (!build.CPU) build.CPU = await findBestComponent("CPU", budget * 0.25, prefQuery);
            if (!build.CPU) build.CPU = await findBestComponent("CPU", budget * 0.1, prefQuery);

            const cpuSocket = getSpec(build.CPU, 'Socket');
            let qMain = { ...prefQuery };
            if (cpuSocket) {
                qMain["specifications"] = {
                    $elemMatch: { key: { $regex: /Socket/i }, value: { $regex: new RegExp(cpuSocket, 'i') } }
                };
            }

            build.Mainboard = await findBestComponent("Mainboard", budget * ratio.Mainboard, qMain);
            if (!build.Mainboard) {
                build.Mainboard = await findBestComponent("Mainboard", budget * ratio.Mainboard * 1.4, prefQuery);
            }

            build.RAM = await findBestComponent("RAM", budget * ratio.RAM * 1.3, prefQuery);
            if (ratio.VGA > 0) {
                build.VGA = await findBestComponent("VGA", budget * ratio.VGA, prefQuery);
            }
            build.SSD = await findBestComponent("SSD", budget * ratio.SSD * 1.3, prefQuery);

            build.PSU = await findBestComponent("PSU", budget * ratio.PSU * 1.4, prefQuery);
            if (!build.PSU) build.PSU = await findBestComponent("PSU", budget * 0.05, prefQuery);

            build.Case = await findBestComponent("Case", budget * ratio.Case * 1.5, prefQuery);
            if (!build.Case) build.Case = await findBestComponent("Case", budget * 0.05, prefQuery);

            if (ratio.Cooling > 0) {
                build.Cooling = await findBestComponent("Cooling", budget * ratio.Cooling * 1.5, prefQuery);
                if (!build.Cooling) build.Cooling = await findBestComponent("Cooling", budget * 0.05, prefQuery);
            }

            suggestedProducts = Object.values(build).filter(item => item != null);
            let currentTotal = suggestedProducts.reduce((sum, p) => sum + p.price, 0);

            if (currentTotal > budget) {
                if (build.VGA) {
                    build.VGA = await findBestComponent("VGA", (budget * ratio.VGA) * 0.8, prefQuery);
                    suggestedProducts = Object.values(build).filter(item => item != null);
                    currentTotal = suggestedProducts.reduce((sum, p) => sum + p.price, 0);
                }
            }

            const missingComponents = [];
            if (!build.CPU) missingComponents.push("CPU");
            if (!build.Mainboard) missingComponents.push("Mainboard");
            if (!build.RAM) missingComponents.push("RAM");
            if (!build.SSD) missingComponents.push("Ổ cứng SSD");
            if (!build.PSU) missingComponents.push("Nguồn máy tính (PSU)");
            if (!build.Case) missingComponents.push("Vỏ máy tính (Case)");
            if (!build.Cooling) missingComponents.push("Tản nhiệt (Cooling)");

            if (missingComponents.length > 0) {
                suggestedProducts = [];
                botReply = `Dạ với ngân sách ${budget.toLocaleString()}đ, hệ thống chưa thể cân đối đủ tiền để lên một bộ máy hoàn chỉnh (hiện đang bị thiếu kinh phí hoặc hết mã cho **${missingComponents.join(', ')}**). Bạn có thể cân nhắc nâng thêm ngân sách lên một chút để mình ráp full cấu hình tối ưu nhất cho bạn nhé!`;
            } else {
                botReply = `Mình đã cân đối dòng tiền và lên cấu hình hoàn chỉnh tối ưu nhất trong tầm giá **${currentTotal.toLocaleString()}đ** đúng theo nhu cầu của bạn. Bạn xem chi tiết bên dưới nhé!`;
            }
        }

        // --- CHỐT CHẶN CUỐI CÙNG CHỐNG TIN NHẮN TRẮNG ---
        if (!botReply || botReply.trim() === "") {
            console.log(`[EXPERT WARNING] BotReply rỗng do lọt điều kiện! Intent: ${intent}`);
            botReply = reply || "Hệ thống đang kiểm tra yêu cầu của bạn, bạn có thể nói chi tiết hơn được không ạ?";
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