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
    // Tìm danh mục theo cơ chế nới lỏng chứa từ khóa (VGA, Card màn hình, Bộ xử lý...)
    const cat = await CategoryModel.findOne({ name: new RegExp(categoryName, 'i') });
    if (!cat) return null;

    let query = { category: cat._id, ...extraQuery };

    // Bước 1: Tìm sản phẩm tối ưu kịch khung trong phân khúc ngân sách cho phép
    let priceQuery = { ...query };
    if (budgetAllowed && budgetAllowed > 0) priceQuery.price = { $lte: budgetAllowed };
    let item = await ProductModel.findOne(priceQuery).sort({ price: -1 });

    // Bước 2: [TƯ DUY LINH KIỆN VẠN NĂNG]
    // Nếu không tìm thấy do filter strict quá (hoặc do Mainboard ép socket nhưng DB thiếu thông số)
    if (!item && Object.keys(extraQuery).length > 0) {
        console.log(`[FALLBACK] Bỏ bộ lọc thông số nghiêm ngặt cho danh mục ${categoryName} (Xem như linh kiện vạn năng).`);
        let fallbackQuery = { category: cat._id }; // Chỉ giữ lại category
        if (budgetAllowed && budgetAllowed > 0) fallbackQuery.price = { $lte: budgetAllowed };
        item = await ProductModel.findOne(fallbackQuery).sort({ price: -1 });
    }

    // Bước 3: Nếu ngân sách quá thấp không mua nổi món nào thấp nhất phân khúc
    if (!item && budgetAllowed > 0) {
        console.log(`[FALLBACK] Ngân sách quá thấp cho ${categoryName}. Tự động lấy món rẻ nhất có sẵn trong kho.`);
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

        const isMissingBudget = !budget || budget <= 0;
        const isMissingPurpose = intent === 'build_pc' && (!purpose || purpose.trim() === "");

        // TRƯỜNG HỢP 1.1: Luồng chat giao tiếp bình thường
        if (intent === 'chat') {
            botReply = reply || "Dạ, mình có thể hỗ trợ gì thêm cho bạn không ạ?";
        }
        // TRƯỜNG HỢP 1.2: Luồng mua sắm nhưng bị thiếu ngân sách/mục đích
        else if ((intent === 'build_pc' && (isMissingBudget || isMissingPurpose)) ||
            ((intent === 'buy_combo' || intent === 'buy_single') && isMissingBudget)) {
            botReply = reply || "Dạ, để mình tư vấn cấu hình chuẩn nhất, bạn cho mình xin mức ngân sách dự kiến hoặc nhu cầu sử dụng (gaming/văn phòng/đồ họa) nhé!";
        }

        // TRƯỜNG HỢP 2: Luồng tìm mua đúng 1 món linh kiện lẻ (HỎI NGÂN SÁCH)
        // =====================================================================
        else if (intent === 'buy_single') {
            const reqItem = requirements && requirements[0];
            if (reqItem && reqItem.category) {
                // Kiểm tra xem tin nhắn hiện tại khách có tự gõ số tiền vào không
                const hasNumberInMessage = /\d+/.test(message);

                // KỊCH BẢN A: Khách hỏi chung chung, AI bị tràn budget cũ HOẶC budget = 0
                if (!hasNumberInMessage) {
                    console.log(`[FLOW CONTROL] Khách hỏi mua lẻ ${reqItem.category} nhưng chưa cho budget. Ngắt tìm kiếm để hỏi lại.`);

                    // Xóa danh sách sản phẩm gợi ý (không hiển thị card sản phẩm đoán mò)
                    suggestedProducts = [];

                    // Trả về câu hỏi thông minh
                    botReply = `Dạ, shop có rất nhiều mẫu ${reqItem.category} với đầy đủ phân khúc từ phổ thông đến cao cấp. Không biết bạn dự định đầu tư khoảng tầm bao nhiêu tiền cho chiếc ${reqItem.category} này để mình lọc mã tối ưu nhất cho bạn ạ?`;
                }
                // KỊCH BẢN B: Khách có đưa budget rõ ràng trong câu chat hiện tại
                else {
                    let query = applyPreferences({}, brand_preference);
                    if (reqItem.keyword) query.name = { $regex: new RegExp(reqItem.keyword, 'i') };

                    const item = await findBestComponent(reqItem.category, budget, query);
                    if (item) {
                        suggestedProducts.push(item);
                        botReply = reply || `Dạ, đây là mẫu ${reqItem.category} tối ưu nhất trong tầm giá bạn yêu cầu: **${item.name}** (${item.price.toLocaleString()}đ).`;
                    } else {
                        botReply = `Dạ xin lỗi bạn, hiện tại kho hàng trong phân khúc giá này đang tạm hết sẵn sản phẩm ${reqItem.category} phù hợp rồi ạ.`;
                    }
                }
            } else {
                botReply = reply || `Bạn muốn tìm mua linh kiện gì cụ thể thế ạ?`;
            }
        }
        // =====================================================================
        // TRƯỜNG HỢP 3: Luồng mua Combo nhiều món lẻ (HỎI NGÂN SÁCH)
        // =====================================================================
        else if (intent === 'buy_combo') {
            if (!requirements || requirements.length === 0) {
                botReply = reply;
            } else {
                const hasNumberInMessage = /\d+/.test(message);
                const comboNames = requirements.map(r => r.category).join(' + ');

                // KỊCH BẢN A: Hỏi combo nhưng không kèm giá tiền
                if (!hasNumberInMessage) {
                    console.log(`[FLOW CONTROL] Khách hỏi combo (${comboNames}) nhưng chưa cho budget. Ngắt tìm kiếm để hỏi lại.`);

                    suggestedProducts = [];
                    botReply = `Dạ, để mình chọn được combo [${comboNames}] tương thích tốt và đúng nhu cầu, bạn cho mình xin mức ngân sách dự kiến tối đa cho cả combo này là khoảng bao nhiêu nha!`;
                }
                // KỊCH BẢN B: Có budget cụ thể cho combo -> Chia tiền tìm kiếm như cũ
                else {
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
        }
        // TRƯỜNG HỢP 4: THUẬT TOÁN PHỐI CẤU HÌNH PC
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

            // Xác định danh sách linh kiện BẮT BUỘC phải có dựa trên mục đích sử dụng
            const components = ["CPU", "Mainboard", "RAM", "VGA", "SSD", "PSU", "Case", "Cooling"];
            const requiredComponents = components.filter(comp => ratio[comp] > 0);

            for (const comp of requiredComponents) {
                const compBudget = budget * ratio[comp];
                let query = { ...prefQuery };

                // Xử lý đặc thù đồng bộ Socket giữa Mainboard và CPU
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

                // Tìm kiếm linh kiện kèm fallback vạn năng bên trong hàm helper
                build[comp] = await findBestComponent(comp, compBudget, query);
            }

            // Đóng gói mảng linh kiện tìm thấy thực tế
            suggestedProducts = Object.values(build).filter(item => item != null);
            let currentTotal = suggestedProducts.reduce((sum, p) => sum + p.price, 0);

            // --- KIỂM TRA ĐỦ LINH KIỆN & GỢI Ý TĂNG NGÂN SÁCH KHÔN KHÉO ---
            const missingComponents = requiredComponents.filter(comp => !build[comp]);

            if (missingComponents.length > 0 || currentTotal > budget * 1.15) {
                const missingListStr = missingComponents.join(', ');
                botReply = reply ? reply : `Mình đã cố gắng build cấu hình tốt nhất cho nhu cầu ${purpose === 'work' ? 'làm việc' : purpose} của bạn. Tuy nhiên, do mức ngân sách ${budget.toLocaleString()}đ khá hạn chế nên hệ thống hiện tại đang bị thiếu một số linh kiện quan trọng (${missingListStr}) hoặc phải chọn linh kiện giá rẻ không tối ưu được hiệu năng của CPU. Để có một bộ PC hoàn chỉnh, chạy mượt mà và bền bỉ nhất, bạn có thể cân nhắc nâng thêm ngân sách lên khoảng tầm **${Math.ceil((currentTotal * 1.1) / 500000) * 500000}đ** để mình phối lại một cấu hình chuẩn chỉnh nhất không ạ?`;
            } else {
                botReply = reply || `Mình đã phối cấu hình tốt nhất dựa trên tỷ lệ ngân sách cho nhu cầu của bạn. Tổng chi phí thực tế là: **${currentTotal.toLocaleString()}đ**.`;
            }
        }

        // --- CHỐT CHẶN CUỐI CÙNG CHỐNG TIN NHẮN TRẮNG ---
        if (!botReply || botReply.trim() === "") {
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