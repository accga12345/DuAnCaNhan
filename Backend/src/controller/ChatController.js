const GroqService = require('../services/GroqService');
const ChatService = require('../services/ChatService');
const ProductModel = require('../models/ProductModel');
const CategoryModel = require('../models/CategoryModel');

const handleChat = async (req, res) => {
    let { message, history } = req.body;
    if (!message) return res.status(400).json({ status: 'ERR', message: 'Thiếu tin nhắn' });

    try {
        // 1. Phân tích ngữ cảnh và quyết định gọi Tool bằng Groq (AI tự nhiên 100%)
        const aiAnalysis = await GroqService.analyzeIntentAndCallTools(message, history || []);

        // Trường hợp A: Trả lời giao tiếp thông thường (AI tự hỏi ngân sách, mục đích, trò chuyện)
        if (aiAnalysis.type === "message" || aiAnalysis.type === "error") {
            return res.status(200).json({ status: 'OK', message: aiAnalysis.content, data: [] });
        }

        // Trường hợp B: Groq quyết định dùng Tool để tìm/build sản phẩm
        let suggestedProducts = [];
        let currentTotalSpent = 0;
        let finalReply = "";

        const allCategories = await CategoryModel.find({});

        if (aiAnalysis.name === "search_products") {
            const { components } = aiAnalysis.args;
            for (const item of components || []) {
                const cat = allCategories.find(c => c.name.toLowerCase().includes(item.category?.toLowerCase()));
                if (!cat) continue;

                let query = { category: cat._id, countInStock: { $gt: 0 } };
                if (item.keyword) {
                    query.name = { $regex: new RegExp(item.keyword, 'i') };
                }
                if (item.maxPrice) {
                    query.price = { $lte: item.maxPrice };
                }

                const product = await ProductModel.findOne(query).populate('category').sort({ price: -1 });
                if (product) {
                    const pObj = product.toObject();
                    pObj.categoryName = cat.name;
                    suggestedProducts.push(pObj);
                    currentTotalSpent += pObj.price;
                }
            }
            
            if (suggestedProducts.length > 0) {
                finalReply = `Dạ, em đã tìm thấy các linh kiện phù hợp với yêu cầu của anh/chị. Anh/chị xem chi tiết ở các thẻ sản phẩm bên dưới nhé.`;
            } else {
                finalReply = `Dạ xin lỗi anh/chị, hiện tại cửa hàng em không có linh kiện nào khớp với yêu cầu hoặc mức giá này ạ.`;
            }

        } else if (aiAnalysis.name === "build_full_pc") {
            let { totalBudget, purpose } = aiAnalysis.args;
            
            // XÓA BỎ HOÀN TOÀN ĐOÁN MÒ: Nếu AI ko cung cấp budget thật sự (>1tr), báo lỗi
            if (!totalBudget || totalBudget < 1000000) {
                return res.status(200).json({ status: 'OK', message: "Dạ anh/chị định đầu tư khoảng bao nhiêu tiền cho bộ máy này ạ?", data: [] });
            }

            const buildOrder = ['CPU', 'Mainboard', 'RAM', 'SSD', 'PSU', 'Case', 'VGA'];
            let cpu, main;
            let surplus = 0;

            const getBestProduct = async (catName, targetPrice, constraints = {}, isMandatory = true) => {
                const cat = allCategories.find(c => c.name === catName);
                if (!cat) return null;
                
                const safeTarget = targetPrice + surplus;
                // Ưu tiên cực độ cho những món RẺ NHẤT để không bị vọt ngân sách
                let query = { category: cat._id, countInStock: { $gt: 0 }, price: { $lte: safeTarget } };
                
                const andConditions = [];
                for (const [key, value] of Object.entries(constraints)) {
                    if (!value) continue;
                    const specKey = key === 'ramType' ? 'Loại RAM' : 'Socket';
                    const fuzzyValue = value.replace(/[^a-zA-Z0-9]/g, ' ').split(/\\s+/).filter(Boolean).join('.*');
                    
                    if (catName === 'Mainboard' || catName === 'RAM') {
                        andConditions.push({
                            "specifications": { 
                                $elemMatch: { 
                                    key: { $regex: new RegExp(`^${specKey}$`, 'i') }, 
                                    value: { $regex: new RegExp(fuzzyValue, 'i') } 
                                } 
                            }
                        });
                    }
                }
                if (andConditions.length > 0) query["$and"] = andConditions;

                // 1. Tìm món rẻ nhất thỏa mãn tương thích
                let p = await ProductModel.findOne(query).sort({ price: 1 }).populate('category');
                
                // 2. Nếu không tìm thấy trong tầm giá, nới lỏng ra 20%
                if (!p) {
                    query.price = { $lte: safeTarget * 1.2 };
                    p = await ProductModel.findOne(query).sort({ price: 1 }).populate('category');
                }

                // 3. Nếu vẫn không thấy, lấy món rẻ nhất bất kể giá (để hoàn thành cấu hình)
                if (!p && isMandatory) {
                    delete query.price; 
                    p = await ProductModel.findOne(query).sort({ price: 1 }).populate('category');
                }

                if (p) {
                    const pObj = p.toObject();
                    pObj.categoryName = catName;
                    currentTotalSpent += pObj.price;
                    surplus = Math.max(0, safeTarget - pObj.price);
                    return pObj;
                }
                return null;
            };

            // Phân bổ ngân sách dựa trên mục đích
            let ratios = { CPU: 0.25, Mainboard: 0.15, RAM: 0.1, SSD: 0.1, PSU: 0.1, Case: 0.05, VGA: 0.25 };
            if (purpose?.toLowerCase().includes('văn phòng') || purpose?.toLowerCase().includes('office')) {
                ratios = { CPU: 0.35, Mainboard: 0.2, RAM: 0.15, SSD: 0.15, PSU: 0.05, Case: 0.1, VGA: 0 };
            }

            for (const catName of buildOrder) {
                if (catName === 'VGA' && ratios.VGA === 0) continue;
                let constraints = {};
                if (catName === 'Mainboard' && cpu) constraints.socket = cpu.specifications?.find(s => s.key === 'Socket')?.value;
                if (catName === 'RAM' && main) constraints.ramType = main.specifications?.find(s => s.key === 'Loại RAM')?.value;

                const p = await getBestProduct(catName, totalBudget * ratios[catName], constraints, true);
                if (p) {
                    suggestedProducts.push(p);
                    if (catName === 'CPU') cpu = p;
                    if (catName === 'Mainboard') main = p;
                }
            }
            
            // CHỐT CHẶN CUỐI CÙNG: Chỉ cho phép lố 10%
            const maxAllowedSpend = totalBudget * 1.1;

            if (suggestedProducts.length >= 6 && currentTotalSpent <= maxAllowedSpend) { 
                finalReply = `Dạ, em đã xây dựng xong cấu hình PC đáp ứng nhu cầu của anh/chị. Tổng chi phí là **${currentTotalSpent.toLocaleString()}đ**. Anh/chị xem chi tiết bên dưới nhé!`;
            } else {
                finalReply = `Dạ anh/chị ơi, ngân sách ${totalBudget.toLocaleString()}đ hiện tại chưa đủ để ráp trọn bộ máy tính mới với các linh kiện đang có sẵn tại shop ạ. Bộ rẻ nhất em có thể ráp được là **${currentTotalSpent.toLocaleString()}đ**. Anh/chị có muốn tham khảo bộ này không ạ?`;
            }
        }

        return res.status(200).json({ 
            status: 'OK', 
            message: finalReply, 
            data: suggestedProducts 
        });

    } catch (e) {
        console.error("❌ LỖI HỆ THỐNG CHAT:", e);
        return res.status(200).json({ status: 'OK', message: "Xin lỗi, hệ thống AI đang bảo trì. Vui lòng thử lại sau vài giây.", data: [] });
    }
};

const replaceComponent = async (req, res) => {
    const { categoryName, newProductId, currentBuild, budgetInput } = req.body;
    try {
        let budget = 0;
        if (budgetInput) {
            const m = budgetInput.toString().match(/(\d+(?:\.\d+)?)\s*(tr|trieu|triệu|cu|củ|m|k)/i);
            if (m) {
                const val = parseFloat(m[1].replace(',', '.'));
                const unit = m[2].toLowerCase();
                budget = (unit === 'k') ? val * 1000 : val * 1000000;
            } else {
                const cleanStr = budgetInput.toString().replace(/,/g, '.').replace(/[^0-9.]/g, '');
                const rawNum = parseFloat(cleanStr);
                budget = !isNaN(rawNum) ? rawNum : 0;
            }
        }

        const cat = await CategoryModel.findOne({ name: categoryName });
        if (!cat) return res.status(404).json({ status: 'ERR', message: 'Danh mục không hợp lệ' });

        if (!newProductId) {
            let constraints = {};
            const currentItem = currentBuild.find(p => p.categoryName === categoryName);
            const cpu = currentBuild.find(p => p.categoryName === 'CPU');
            const main = currentBuild.find(p => p.categoryName === 'Mainboard');

            let currentPurpose = 'văn phòng';
            const samplePart = currentBuild.find(p => p.specifications?.some(s => s.key === 'Mục đích'));
            if (samplePart) {
                const spec = samplePart.specifications.find(s => s.key === 'Mục đích');
                currentPurpose = spec.value;
            }

            if (categoryName === 'Mainboard' && cpu) constraints.socket = cpu.specifications?.find(s => s.key === 'Socket')?.value;
            if (categoryName === 'CPU' && main) constraints.socket = main.specifications?.find(s => s.key === 'Socket')?.value;
            if (categoryName === 'RAM' && main) constraints.ramType = main.specifications?.find(s => s.key === 'Loại RAM')?.value;

            const andConditions = [];
            andConditions.push({ category: cat._id });
            if (budget > 0) {
                andConditions.push({ price: { $gte: budget - 500000, $lte: budget + 500000 } });
            }
            if (currentItem) {
                andConditions.push({ _id: { $ne: currentItem._id } });
            }
            andConditions.push({
                "$or": [
                    { "specifications": { $elemMatch: { key: "Mục đích", value: { $regex: new RegExp(currentPurpose, 'i') } } } },
                    { "specifications": { $not: { $elemMatch: { key: "Mục đích" } } } }
                ]
            });

            for (const [key, value] of Object.entries(constraints)) {
                if (!value) continue;
                const specKey = key === 'ramType' ? 'Loại RAM' : 'Socket';
                andConditions.push({
                    "$or": [
                        { "specifications": { $elemMatch: { key: specKey, value: { $regex: new RegExp(value, 'i') } } } },
                        { "specifications": { $not: { $elemMatch: { key: specKey } } } }
                    ]
                });
            }

            const alternatives = await ProductModel.find({ "$and": andConditions }).limit(5).sort({ price: -1 });
            return res.status(200).json({ status: 'OK', suggestions: alternatives });
        }

        const newProduct = await ProductModel.findById(newProductId).populate('category');
        if (!newProduct) return res.status(404).json({ status: 'ERR', message: 'Không tìm thấy linh kiện' });

        let updatedBuild = currentBuild.filter(p => p.categoryName !== categoryName);
        let productToAdd = newProduct.toObject();
        productToAdd.categoryName = categoryName;
        updatedBuild.push(productToAdd);

        const newTotal = updatedBuild.reduce((sum, p) => sum + p.price, 0);
        const botReply = `Đã thay thế ${categoryName} thành công. Tổng giá trị cấu hình mới là ${newTotal.toLocaleString()}đ.`;

        return res.status(200).json({ status: 'OK', message: botReply, data: updatedBuild });
    } catch (e) {
        console.error("❌ LỖI THAY THẾ:", e);
        return res.status(500).json({ status: 'ERR', message: 'Lỗi thay thế' });
    }
};

module.exports = { handleChat, replaceComponent };