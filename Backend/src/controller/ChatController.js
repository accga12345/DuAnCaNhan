const GroqService = require('../services/GroqService');
const ChatService = require('../services/ChatService');
const ProductModel = require('../models/ProductModel');
const CategoryModel = require('../models/CategoryModel');

const handleChat = async (req, res) => {
    let { message, history } = req.body;
    if (!message) return res.status(400).json({ status: 'ERR', message: 'Thiếu tin nhắn' });

    let botReply = "";
    let suggestedProducts = [];

    try {
        const nluResult = await GroqService.parseUserIntent(message, history || []);
        let { intent, budget, purpose } = nluResult;

        const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const msgLower = removeAccents(message);
        
        let reqMonitor = false;
        if (msgLower.includes('man') || msgLower.includes('monitor') || msgLower.includes('man hinh')) reqMonitor = true;

        if (purpose === 'unknown' && history?.length > 0) {
            for (let i = history.length - 1; i >= 0; i--) {
                const prevMsg = history[i].parts[0].text.toLowerCase();
                if (prevMsg.includes('game')) { purpose = 'gaming'; break; }
                if (prevMsg.includes('đồ họa') || prevMsg.includes('render')) { purpose = 'work'; break; }
                if (prevMsg.includes('văn phòng')) { purpose = 'office'; break; }
            }
        }

        const formatMoneyText = (amount) => amount >= 1000000 ? (amount / 1000000) + ' triệu đồng' : amount.toLocaleString('vi-VN') + 'đ';

        if (intent === 'build.pc' || (budget > 0 && purpose !== 'unknown')) {
            if (!budget) {
                botReply = await GroqService.askGroqGeneric("Khách muốn build PC nhưng chưa có ngân sách. Hãy hỏi khách dự định build bao nhiêu một cách ngắn gọn.", []);
            } else if (purpose === 'unknown') {
                botReply = await GroqService.askGroqGeneric(`Khách muốn build PC ${formatMoneyText(budget)} nhưng chưa rõ mục đích. Hãy hỏi ngắn gọn khách dùng làm gì.`, []);
            } else {
                const allCategories = await CategoryModel.find({});
                const dbPurpose = (purpose === 'gaming') ? 'chơi game' : (purpose === 'work' ? 'đồ họa' : 'văn phòng');
                
                const getBestProduct = async (cat, targetPrice, constraints = {}, isMandatory = true) => {
                    let query = { category: cat._id };
                    for (const [key, value] of Object.entries(constraints)) {
                        if (!value) continue;
                        const keyMap = { 'ramType': 'Loại RAM', 'socket': 'Socket' };
                        const specKey = keyMap[key] || key;
                        query["$or"] = [
                            { "specifications": { $elemMatch: { key: specKey, value: { $regex: new RegExp(value, 'i') } } } },
                            { "specifications": { $not: { $elemMatch: { key: specKey } } } }
                        ];
                    }
                    if (dbPurpose) {
                        query["$or"] = [
                            { "specifications": { $elemMatch: { key: "Mục đích", value: { $regex: new RegExp(dbPurpose, 'i') } } } },
                            { "specifications": { $not: { $elemMatch: { key: "Mục đích" } } } }
                        ];
                    }
                    let p = await ProductModel.findOne({ ...query, price: { $lte: targetPrice * 1.5 } }).sort({ price: -1 });
                    if (!p) p = await ProductModel.findOne(query).sort({ price: 1 });
                    return p;
                };

                const mandatoryList = ['CPU', 'Mainboard', 'RAM', 'SSD', 'PSU', 'Case', 'Cooling', 'VGA'];
                const buildOrder = ['CPU', 'Mainboard', 'RAM', 'SSD', 'PSU', 'Case', 'Cooling', 'VGA', 'Monitor'];
                const ratios = { CPU: 0.20, Mainboard: 0.12, RAM: 0.08, SSD: 0.07, PSU: 0.07, Case: 0.05, Cooling: 0.05, VGA: 0.36, Monitor: 0.15 };
                
                let cpu, main;
                let success = true;

                for (const catName of buildOrder) {
                    if (catName === 'Monitor' && !reqMonitor) continue;
                    if (catName === 'VGA' && purpose === 'office') continue;

                    const cat = allCategories.find(c => c.name === catName);
                    if (!cat) continue;

                    let constraints = {};
                    if (catName === 'Mainboard' && cpu) constraints.socket = cpu.specifications?.find(s => s.key === 'Socket')?.value;
                    if (catName === 'RAM' && main) constraints.ramType = main.specifications?.find(s => s.key === 'Loại RAM')?.value;

                    const p = await getBestProduct(cat, budget * (ratios[catName] || 0.02), constraints, mandatoryList.includes(catName));
                    
                    if (!p && mandatoryList.includes(catName)) { success = false; break; }
                    if (p) {
                        suggestedProducts.push(p);
                        if (catName === 'CPU') cpu = p;
                        if (catName === 'Mainboard') main = p;
                    }
                }

                if (success) {
                    const actualTotal = suggestedProducts.reduce((sum, p) => sum + p.price, 0);
                    botReply = await GroqService.generateNaturalReply(message, suggestedProducts, purpose, budget, actualTotal);
                    botReply += `\n\n[Đã tối ưu: ${actualTotal.toLocaleString()}đ / ${budget.toLocaleString()}đ]`;
                } else {
                    botReply = `Ngân sách ${formatMoneyText(budget)} không đủ linh kiện cần thiết. Bạn có thể cân nhắc tăng ngân sách hoặc điều chỉnh cấu hình không?`;
                }
            }
        } else {
            botReply = await GroqService.askGroqGeneric(message, history || []);
        }
    } catch (error) {
        botReply = "Xin lỗi, hệ thống đang gặp sự cố.";
    }
    return res.status(200).json({ status: 'OK', message: botReply, data: suggestedProducts });
};

module.exports = { handleChat };