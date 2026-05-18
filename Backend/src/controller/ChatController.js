const GroqService = require('../services/GroqService');
const ChatService = require('../services/ChatService');
const ProductModel = require('../models/ProductModel');
const CategoryModel = require('../models/CategoryModel');

const handleChat = async (req, res) => {
    let { message, history } = req.body;
    if (!message) return res.status(400).json({ status: 'ERR', message: 'Thiếu tin nhắn' });

    let botReply = "";
    let suggestedProducts = [];
    const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    try {
        const allCategories = await CategoryModel.find({});
        const validCategoryNames = allCategories.map(c => c.name);

        const nluResult = await GroqService.parseUserIntent(message, history || [], validCategoryNames);
        let { intent, budget, purpose, cpuBrand, components } = nluResult;

        if (!budget && history?.length > 0) {
            for (let i = history.length - 1; i >= 0; i--) {
                if (history[i].role === 'user') {
                    const histBudget = await GroqService.extractBudgetWithAI(history[i].parts[0].text);
                    if (histBudget) { budget = histBudget; break; }
                }
            }
        }

        const formatMoneyText = (amount) => {
            if (amount >= 1000000) {
                const millions = amount / 1000000;
                return (millions % 1 === 0 ? millions : millions.toString().replace('.', ',')) + ' triệu đồng';
            }
            return amount.toLocaleString('vi-VN') + 'đ';
        };

        const hasCoreInfo = budget > 0 && purpose !== 'unknown' && cpuBrand !== 'unknown';
        const isBuildIntent = intent === 'build.pc' || (hasCoreInfo && intent !== 'buy.individual');

        if (intent === 'buy.individual' && components?.length > 0) {
            const dbPurpose = (purpose === 'gaming') ? 'chơi game' : (purpose === 'work' ? 'đồ họa' : 'văn phòng');
            let currentTotalSpent = 0;
            let surplus = 0;
            const absoluteMaxTotal = (budget || 100000000) + 1000000;

            const getBestProduct = async (catName, targetPrice, constraints = {}, isMandatory = true) => {
                const cat = allCategories.find(c => c.name === catName);
                if (!cat) return null;
                const safeTarget = targetPrice + surplus;
                const limitPrice = (catName === 'PSU') ? 2000000 : safeTarget * 1.5;
                let query = { category: cat._id, price: { $lte: Math.min(safeTarget, limitPrice) } };
                const techConditions = [];
                for (const [key, value] of Object.entries(constraints)) {
                    if (!value) continue;
                    const specKey = key === 'ramType' ? 'Loại RAM' : 'Socket';
                    techConditions.push({ "$or": [ { "specifications": { $elemMatch: { key: specKey, value: { $regex: new RegExp(value, 'i') } } } }, { "specifications": { $not: { $elemMatch: { key: specKey } } } } ] });
                }
                if (techConditions.length > 0) query["$and"] = techConditions;

                let p = await ProductModel.findOne(query).sort({ price: -1 });
                if (!p) { delete query["$and"]; p = await ProductModel.findOne(query).sort({ price: -1 }); }
                if (!p && isMandatory) { p = await ProductModel.findOne({ category: cat._id, price: { $lte: (absoluteMaxTotal - currentTotalSpent) } }).sort({ price: 1 }); }
                if (p) {
                    const pObj = p.toObject();
                    pObj.categoryName = catName;
                    currentTotalSpent += p.price;
                    surplus = Math.max(0, safeTarget - p.price); 
                    return pObj;
                }
                return null;
            };

            for (const item of components) {
                const p = await getBestProduct(item.cat, item.budget || (budget * 0.1) || 5000000, {}, true);
                if (p) suggestedProducts.push(p);
            }
            botReply = `Danh sách linh kiện lẻ bạn cần đây:`;
        } else if (isBuildIntent || budget > 0 || purpose !== 'unknown' || cpuBrand !== 'unknown') {
            if (purpose === 'unknown') {
                botReply = "Chào bạn! Bạn đang tìm mua bộ PC phục vụ cho mục đích gì (ví dụ: chơi game, văn phòng, đồ họa)?";
            } else if (!budget) {
                botReply = "Cảm ơn bạn! Vậy ngân sách bạn dự kiến cho bộ PC này khoảng bao nhiêu?";
            } else if (cpuBrand === 'unknown') {
                botReply = "Ngân sách rất hợp lý. Bạn muốn sử dụng CPU của Intel hay AMD cho cấu hình này?";
            } else {
                const dbPurpose = (purpose === 'gaming') ? 'chơi game' : (purpose === 'work' ? 'đồ họa' : 'văn phòng');
                let currentTotalSpent = 0;
                let surplus = 0;
                let cpu, main;
                const absoluteMaxTotal = budget + 1000000;

                const mandatoryCore = ['CPU', 'Mainboard', 'RAM', 'SSD', 'PSU', 'Case'];
                const requestedFromAI = (components || []).map(c => c.cat);
                const finalBuildList = [...new Set([...mandatoryCore, ...requestedFromAI])];
                
                const sortedBuildOrder = ['CPU', 'Mainboard', 'Monitor', 'keybroad', 'RAM', 'SSD', 'PSU', 'Case', 'Cooling', 'VGA'];
                const buildOrder = sortedBuildOrder.filter(item => finalBuildList.includes(item) || (['Cooling', 'VGA'].includes(item)));

                const selectedPurposeRatios = {
                    gaming: { CPU: 0.20, Mainboard: 0.10, Monitor: 0.15, keybroad: 0.05, RAM: 0.08, SSD: 0.08, PSU: 0.07, Case: 0.05, Cooling: 0.05, VGA: 0.12, Chuột: 0.05 },
                    office: { CPU: 0.25, Mainboard: 0.12, Monitor: 0.18, keybroad: 0.05, RAM: 0.10, SSD: 0.10, PSU: 0.07, Case: 0.05, Cooling: 0.05, VGA: 0.03, Chuột: 0.05 },
                    work:   { CPU: 0.22, Mainboard: 0.12, Monitor: 0.15, keybroad: 0.05, RAM: 0.12, SSD: 0.10, PSU: 0.08, Case: 0.05, Cooling: 0.05, VGA: 0.10, Chuột: 0.05 }
                }[purpose] || { CPU: 0.2, Mainboard: 0.1, Monitor: 0.15, keybroad: 0.05, RAM: 0.1, SSD: 0.1, PSU: 0.1, Case: 0.1, Cooling: 0.1 };

                const getBestProduct = async (catName, targetPrice, constraints = {}, isMandatory = true, useSurplus = true) => {
                    const cat = allCategories.find(c => c.name === catName);
                    if (!cat) return null;
                    const safeTarget = useSurplus ? (targetPrice + surplus) : targetPrice;
                    
                    let limitPrice = safeTarget * 1.5;
                    if (purpose === 'office') {
                        if (catName === 'PSU') limitPrice = Math.min(limitPrice, 1200000);
                        if (catName === 'Mainboard') limitPrice = Math.min(limitPrice, 2500000);
                        if (catName === 'Case') limitPrice = Math.min(limitPrice, 1000000);
                    }
                    if (catName === 'Cooling') limitPrice = Math.min(limitPrice, 1500000);

                    let query = { category: cat._id };
                    if (catName === 'CPU') query.brand = { $regex: new RegExp(`^${cpuBrand}$`, 'i') };
                    
                    const techConditions = [];
                    techConditions.push({ "$or": [ { "specifications": { $elemMatch: { key: "Mục đích", value: { $regex: new RegExp(dbPurpose, 'i') } } } }, { "specifications": { $not: { $elemMatch: { key: "Mục đích" } } } } ] });
                    for (const [key, value] of Object.entries(constraints)) {
                        if (!value) continue;
                        const specKey = key === 'ramType' ? 'Loại RAM' : 'Socket';
                        techConditions.push({ "$or": [ { "specifications": { $elemMatch: { key: specKey, value: { $regex: new RegExp(value, 'i') } } } }, { "specifications": { $not: { $elemMatch: { key: specKey } } } } ] });
                    }
                    query["$and"] = techConditions;

                    let p = await ProductModel.findOne({ ...query, price: { $lte: Math.min(safeTarget, limitPrice) } }).sort({ price: -1 });
                    if (!p) {
                        p = await ProductModel.findOne({ ...query, price: { $lte: Math.min(safeTarget, limitPrice) } }).sort({ price: -1 });
                    }
                    if (!p && isMandatory) {
                        p = await ProductModel.findOne({ ...query, price: { $lte: (absoluteMaxTotal - currentTotalSpent) } }).sort({ price: 1 });
                    }

                    if (p) {
                        const pObj = p.toObject();
                        pObj.categoryName = catName;
                        currentTotalSpent += p.price;
                        surplus = Math.max(0, safeTarget - p.price); 
                        return pObj;
                    }
                    return null;
                };

                let success = true;
                for (const catName of buildOrder) {
                    if (catName === 'VGA' && purpose === 'office' && !requestedFromAI.includes('VGA')) continue;
                    const isMandatory = mandatoryCore.includes(catName);
                    const isUserRequested = requestedFromAI.includes(catName);
                    const pendingAccessories = buildOrder.slice(buildOrder.indexOf(catName) + 1).some(name => requestedFromAI.includes(name));
                    const canUseSurplus = !pendingAccessories || isUserRequested;

                    let constraints = {};
                    if (catName === 'Mainboard' && cpu) constraints.socket = cpu.specifications?.find(s => s.key === 'Socket')?.value;
                    if (catName === 'RAM' && main) constraints.ramType = main.specifications?.find(s => s.key === 'Loại RAM')?.value;

                    const p = await getBestProduct(catName, budget * (selectedPurposeRatios[catName] || 0.05), constraints, isMandatory, canUseSurplus);
                    if (p) {
                        suggestedProducts.push(p);
                        if (catName === 'CPU') cpu = p;
                        if (catName === 'Mainboard') main = p;
                    } else if (isMandatory) {
                        success = false; break;
                    }
                }

                if (success && currentTotalSpent <= absoluteMaxTotal) {
                    const missingReq = requestedFromAI.filter(name => !suggestedProducts.find(p => p.categoryName === name));
                    botReply = await GroqService.generateNaturalReply(message, suggestedProducts, purpose, budget, currentTotalSpent, missingReq);
                    botReply += `\n\n[Tổng: ${currentTotalSpent.toLocaleString()}đ / Budget: ${budget.toLocaleString()}đ (+1tr dự phòng)]`;
                } else {
                    botReply = `Xin lỗi, ngân sách ${formatMoneyText(budget)} không đủ để build PC ${dbPurpose} theo đúng yêu cầu của bạn.`;
                    suggestedProducts = [];
                }
            }
        } else {
            botReply = await GroqService.askGroqGeneric(message, history || []);
        }
    } catch (e) {
        console.error("❌ LỖI HỆ THỐNG:", e);
        botReply = "Xin lỗi, hệ thống đang gặp sự cố.";
    }
    return res.status(200).json({ status: 'OK', message: botReply, data: suggestedProducts });
};

const replaceComponent = async (req, res) => {
    const { categoryName, newProductId, currentBuild, budgetInput } = req.body;
    try {
        // 1. TRÍCH XUẤT BUDGET (Hỗ trợ cả '4tr' và '4000000')
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
                if (!budget) {
                    budget = await GroqService.extractBudgetWithAI(budgetInput);
                } else if (budget > 0 && budget < 1000) {
                    budget = budget * 1000000;
                }
            }
        }

        console.log(`DEBUG REPLACE: ${categoryName} | Parsed Budget: ${budget}`);

        const cat = await CategoryModel.findOne({ name: categoryName });
        if (!cat) return res.status(404).json({ status: 'ERR', message: 'Danh mục không hợp lệ' });

        if (!newProductId) {
            let constraints = {};
            const currentItem = currentBuild.find(p => p.categoryName === categoryName);
            const cpu = currentBuild.find(p => p.categoryName === 'CPU');
            const main = currentBuild.find(p => p.categoryName === 'Mainboard');

            // TRÍCH XUẤT MỤC ĐÍCH TỪ CẤU HÌNH HIỆN TẠI
            let currentPurpose = 'văn phòng';
            const samplePart = currentBuild.find(p => p.specifications?.some(s => s.key === 'Mục đích'));
            if (samplePart) {
                const spec = samplePart.specifications.find(s => s.key === 'Mục đích');
                currentPurpose = spec.value;
            }

            if (categoryName === 'Mainboard' && cpu) constraints.socket = cpu.specifications?.find(s => s.key === 'Socket')?.value;
            if (categoryName === 'CPU' && main) constraints.socket = main.specifications?.find(s => s.key === 'Socket')?.value;
            if (categoryName === 'RAM' && main) constraints.ramType = main.specifications?.find(s => s.key === 'Loại RAM')?.value;

            // Xây dựng query CHẶT CHẼ TRONG $AND
            const andConditions = [];
            
            // A. Đúng danh mục
            andConditions.push({ category: cat._id });
            
            // B. Đúng tầm giá +/- 500k
            if (budget > 0) {
                andConditions.push({ price: { $gte: budget - 500000, $lte: budget + 500000 } });
            }

            // C. Không lấy lại món cũ
            if (currentItem) {
                andConditions.push({ _id: { $ne: currentItem._id } });
            }

            // D. Đúng mục đích
            andConditions.push({
                "$or": [
                    { "specifications": { $elemMatch: { key: "Mục đích", value: { $regex: new RegExp(currentPurpose, 'i') } } } },
                    { "specifications": { $not: { $elemMatch: { key: "Mục đích" } } } }
                ]
            });

            // E. Khớp kỹ thuật (Socket, RAM)
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

        // 2. THỰC THI THAY THẾ
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