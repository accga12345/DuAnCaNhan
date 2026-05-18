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
        const nluResult = await GroqService.parseUserIntent(message, history || []);
        let { intent, budget, purpose, accessories } = nluResult;

        // 1. PHỤC HỒI NGÂN SÁCH (Chỉ nếu AI không bóc được từ tin nhắn mới)
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

        if (intent === 'build.pc' || (budget > 0 && purpose !== 'unknown')) {
            if (!budget) {
                botReply = await GroqService.askGroqGeneric("Khách muốn build PC nhưng chưa có ngân sách. Hãy hỏi ngân sách.", []);
            } else if (purpose === 'unknown') {
                botReply = await GroqService.askGroqGeneric("Khách muốn build PC, hãy hỏi mục đích sử dụng.", []);
            } else {
                const allCategories = await CategoryModel.find({});
                const dbPurpose = (purpose === 'gaming') ? 'chơi game' : (purpose === 'work' ? 'đồ họa' : 'văn phòng');
                
                const PURPOSE_RATIOS = {
                    gaming: { CPU: 0.18, Mainboard: 0.10, RAM: 0.08, SSD: 0.07, PSU: 0.07, Case: 0.05, Cooling: 0.05, VGA: 0.35 },
                    office: { CPU: 0.30, Mainboard: 0.15, RAM: 0.12, SSD: 0.12, PSU: 0.08, Case: 0.05, Cooling: 0.05, VGA: 0.08 },
                    work:   { CPU: 0.25, Mainboard: 0.12, RAM: 0.15, SSD: 0.10, PSU: 0.08, Case: 0.05, Cooling: 0.05, VGA: 0.15 }
                };

                let selectedRatios = { ...PURPOSE_RATIOS[purpose] || PURPOSE_RATIOS['gaming'] };
                let buildOrder = ['CPU', 'Mainboard', 'RAM', 'SSD', 'PSU', 'Case', 'Cooling', 'VGA'];

                const accessoryMapping = { 'keyboard': 'keybroad', 'keybroad': 'keybroad', 'Monitor': 'Monitor', 'mouse': 'Chuột' };
                const requestedItems = [];
                if (accessories && accessories.length > 0) {
                    accessories.forEach(acc => {
                        const dbCat = accessoryMapping[acc] || acc;
                        requestedItems.push(dbCat);
                        selectedRatios[dbCat] = 0.05;
                        if (!buildOrder.includes(dbCat)) buildOrder.push(dbCat);
                    });
                }

                let mandatoryList = ['CPU', 'Mainboard', 'RAM', 'SSD', 'PSU', 'Case'];
                accessories.forEach(acc => {
                    const dbCat = accessoryMapping[acc] || acc;
                    if (!mandatoryList.includes(dbCat)) mandatoryList.push(dbCat);
                });

                let currentTotalSpent = 0;
                let surplus = 0;
                let cpu, main;
                const absoluteMaxTotal = budget + 1000000;

                const getBestProduct = async (catName, targetPrice, constraints = {}, isMandatory = true) => {
                    const cat = allCategories.find(c => c.name === catName);
                    if (!cat) return null;
                    const safeTarget = targetPrice + surplus;
                    const limitPrice = (catName === 'PSU') ? 2000000 : safeTarget * 1.5;
                    let query = { category: cat._id, price: { $lte: Math.min(safeTarget, limitPrice) } };
                    const andConditions = [];
                    for (const [key, value] of Object.entries(constraints)) {
                        if (!value) continue;
                        const specKey = key === 'ramType' ? 'Loại RAM' : 'Socket';
                        andConditions.push({ "$or": [ { "specifications": { $elemMatch: { key: specKey, value: { $regex: new RegExp(value, 'i') } } } }, { "specifications": { $not: { $elemMatch: { key: specKey } } } } ] });
                    }
                    andConditions.push({ "$or": [ { "specifications": { $elemMatch: { key: "Mục đích", value: { $regex: new RegExp(dbPurpose, 'i') } } } }, { "specifications": { $not: { $elemMatch: { key: "Mục đích" } } } } ] });
                    query["$and"] = andConditions;

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

                let success = true;
                for (const catName of buildOrder) {
                    const isMandatory = mandatoryList.includes(catName);
                    let constraints = {};
                    if (catName === 'Mainboard' && cpu) constraints.socket = cpu.specifications?.find(s => s.key === 'Socket')?.value;
                    if (catName === 'RAM' && main) constraints.ramType = main.specifications?.find(s => s.key === 'Loại RAM')?.value;
                    const p = await getBestProduct(catName, budget * (selectedRatios[catName] || 0.05), constraints, isMandatory);
                    if (!p && isMandatory) { success = false; break; }
                    if (p) { suggestedProducts.push(p); if (catName === 'CPU') cpu = p; if (catName === 'Mainboard') main = p; }
                }

                if (success && currentTotalSpent <= absoluteMaxTotal) {
                    const missingReq = requestedItems.filter(item => !suggestedProducts.find(p => p.categoryName === item));
                    botReply = await GroqService.generateNaturalReply(message, suggestedProducts, purpose, budget, currentTotalSpent, missingReq);
                    botReply += `\n\n[Tổng: ${currentTotalSpent.toLocaleString()}đ / Budget: ${budget.toLocaleString()}đ (+1tr dự phòng)]`;
                } else {
                    botReply = `Ngân sách ${formatMoneyText(budget)} không đủ linh kiện cần thiết cho ${dbPurpose}. Bạn hãy tăng ngân sách nhé!`;
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
        const budget = await GroqService.extractBudgetWithAI(budgetInput);
        const cat = await CategoryModel.findOne({ name: categoryName });
        if (!cat) return res.status(404).json({ status: 'ERR', message: 'Danh mục không hợp lệ' });

        if (!newProductId) {
            let constraints = {};
            const cpu = currentBuild.find(p => p.categoryName === 'CPU');
            const main = currentBuild.find(p => p.categoryName === 'Mainboard');
            if (categoryName === 'Mainboard' && cpu) constraints.socket = cpu.specifications?.find(s => s.key === 'Socket')?.value;
            if (categoryName === 'RAM' && main) constraints.ramType = main.specifications?.find(s => s.key === 'Loại RAM')?.value;

            let query = { category: cat._id };
            if (budget) query.price = { $gte: Math.max(0, budget - 500000), $lte: budget + 500000 };

            for (const [key, value] of Object.entries(constraints)) {
                if (!value) continue;
                const specKey = key === 'ramType' ? 'Loại RAM' : 'Socket';
                query["$or"] = [
                    { "specifications": { $elemMatch: { key: specKey, value: { $regex: new RegExp(value, 'i') } } } },
                    { "specifications": { $not: { $elemMatch: { key: specKey } } } }
                ];
            }

            const alternatives = await ProductModel.find(query).limit(5);
            return res.status(200).json({ status: 'OK', suggestions: alternatives });
        }

        const newProduct = await ProductModel.findById(newProductId).populate('category');
        if (!newProduct) return res.status(404).json({ status: 'ERR', message: 'Không tìm thấy linh kiện' });

        let updatedBuild = currentBuild.filter(p => p.categoryName !== categoryName);
        let productToAdd = newProduct.toObject();
        productToAdd.categoryName = categoryName;
        updatedBuild.push(productToAdd);

        return res.status(200).json({ status: 'OK', data: updatedBuild });
    } catch (e) {
        console.error("❌ LỖI THAY THẾ:", e);
        return res.status(500).json({ status: 'ERR', message: 'Lỗi thay thế' });
    }
};

module.exports = { handleChat, replaceComponent };