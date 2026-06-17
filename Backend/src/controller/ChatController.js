const GroqService = require('../services/GroqService');
const ChatService = require('../services/ChatService');
const ProductModel = require('../models/ProductModel');
const CategoryModel = require('../models/CategoryModel');
const fs = require('fs');
const path = require('path');
const { normalizeBudget, normalizeRequirements, CATEGORY_ALIASES } = require('../services/GroqService');

const logInteraction = (input, response, isSuccess) => {
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
    const logFile = path.join(logDir, 'evaluation_log.jsonl');

    const logEntry = {
        timestamp: new Date().toISOString(),
        input,
        response,
        isCorrect: isSuccess
    };
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
};

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
    if (!cat) return null;

    const strictQuery = { category: cat._id, ...extraQuery };
    const universalQuery = { category: cat._id };

    if (budgetAllowed > 0) {
        const itemBest = await ProductModel.findOne({ ...strictQuery, price: { $lte: budgetAllowed } }).populate('category').sort({ price: -1 });
        if (itemBest) return itemBest;
    }

    if (budgetAllowed > 0) {
        const itemUniversal = await ProductModel.findOne({ ...universalQuery, price: { $lte: budgetAllowed } }).populate('category').sort({ rating: -1, selled: -1 });
        if (itemUniversal) return itemUniversal;
    }

    const itemStrictCheapest = await ProductModel.findOne(strictQuery).populate('category').sort({ price: 1 });
    const itemUnivCheapest = await ProductModel.findOne(universalQuery).populate('category').sort({ price: 1 });

    if (itemStrictCheapest && itemUnivCheapest) {
        return itemStrictCheapest.price <= itemUnivCheapest.price ? itemStrictCheapest : itemUnivCheapest;
    }
    return itemStrictCheapest || itemUnivCheapest;
};

const getComboWeight = (categoryName) => {
    const COMBO_WEIGHT = {
        'CPU': 0.40, 'Mainboard': 0.30, 'RAM': 0.15, 'SSD': 0.10,
        'VGA': 0.55, 'PSU': 0.12, 'Case': 0.10, 'Cooling': 0.08,
        'Monitor': 0.45, 'Keyboard': 0.15, 'Mouse': 0.10, 'Headphone': 0.15,
    };
    return COMBO_WEIGHT[categoryName.toLowerCase()] ?? (1 / 3);
};

const handleChat = async (req, res) => {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ status: 'ERR', message: 'Thiếu tin nhắn đầu vào' });

    let botReply = '';
    let suggestedProducts = [];
    let intent = 'chat';

    try {
        const nluResult = await GroqService.askGroq(message, history || [], '');
        ({ intent } = nluResult);
        let { budget, purpose, requirements, brand_preference, reply, specs_filter } = nluResult;

        // --- ĐOẠN LOG ĐỂ BẠN LÀM BÁO CÁO (TRACE AI DECISION) ---
        console.log('\n==================================================');
        console.log(`[AI ANALYSIS TRACE] User Input: "${message}"`);
        console.log(`- Phân loại Intent  : [ ${intent.toUpperCase()} ]`);
        console.log(`- Trích xuất Budget : ${budget.toLocaleString('vi-VN')} VNĐ`);
        if (purpose) console.log(`- Mục đích (Purpose): ${purpose}`);
        if (requirements && requirements.length > 0) console.log(`- Yêu cầu linh kiện :`, JSON.stringify(requirements));
        if (specs_filter && specs_filter.length > 0) console.log(`- Bộ lọc Thông số   :`, JSON.stringify(specs_filter));
        console.log('==================================================\n');

        const isMissingBudget = budget <= 0 && intent !== 'research';
        const isMissingPurpose = intent === 'build_pc' && !purpose?.trim();

        if (intent === 'chat' || isMissingBudget || isMissingPurpose) {
            botReply = reply || (isMissingBudget ? 'Dạ bạn có thể cho shop biết mức ngân sách dự kiến được không ạ?' : 'Dạ bạn cần hỗ trợ gì thêm ạ?');
        } else if (intent === 'research') {
            let reqItem = requirements?.[0];
            let query = {};
            let catId = null;

            if (reqItem?.category) {
                const cat = await CategoryModel.findOne({ name: new RegExp(`^${reqItem.category}$`, 'i') });
                if (cat) {
                    catId = cat._id;
                }
            }

            if (catId) {
                query.category = catId;
            }
            
            if (specs_filter && specs_filter.length > 0) {
                const andConditions = specs_filter.map(spec => ({
                    specifications: {
                        $elemMatch: {
                            key: { $regex: new RegExp(spec.key, 'i') },
                            value: { $regex: new RegExp(spec.value, 'i') }
                        }
                    }
                }));
                query['$and'] = andConditions;
            }
            
            let products = await ProductModel.find(query).populate('category').limit(5);

            if (budget > 0) {
                products = await ProductModel.find({ ...query, price: { $lte: budget } }).populate('category').sort({ price: -1 }).limit(5);
            }

            suggestedProducts = products;

            if (suggestedProducts.length > 0) {
                botReply = `Mình tìm thấy ${suggestedProducts.length} sản phẩm phù hợp với yêu cầu kỹ thuật của bạn:`;
            } else {
                botReply = `Tiếc quá, hiện tại shop chưa có sản phẩm nào khớp hoàn toàn với thông số bạn cần.`;
            }
        } else if (intent === 'buy_single') {
            let reqItem = requirements?.[0];
            if (!reqItem?.category) {
                const lower = message.toLowerCase();
                const sorted = Object.entries(CATEGORY_ALIASES).sort((a, b) => b[0].length - a[0].length);
                for (const [alias, catName] of sorted) {
                    if (lower.includes(alias)) {
                        reqItem = { category: catName, keyword: '' };
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
        } else if (intent === 'buy_combo') {
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
        } else if (intent === 'build_pc') {
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
            
            // Xây dựng cấu hình theo thứ tự ưu tiên
            for (const comp of components) {
                const compBudget = budget * ratio[comp];
                const query = { ...prefQuery };

                // Logic tương thích (Cross-component compatibility)
                if (comp !== 'CPU') {
                    if (build.CPU) {
                        const cpuSocket = getSpec(build.CPU, 'socket');
                        if (['Mainboard', 'Cooling'].includes(comp) && cpuSocket) {
                            query.specifications = { $elemMatch: { key: 'socket', value: { $regex: new RegExp(cpuSocket, 'i') } } };
                        }
                    }
                    if (build.Mainboard) {
                        const mb = build.Mainboard;
                        if (comp === 'RAM') {
                            const mbRam = getSpec(mb, 'ram_type');
                            if (mbRam) query.specifications = { $elemMatch: { key: 'ram_type', value: mbRam } };
                        }
                        if (comp === 'SSD') {
                            const mbInt = getSpec(mb, 'interface');
                            if (mbInt) query.specifications = { $elemMatch: { key: 'interface', value: mbInt } };
                        }
                        if (comp === 'VGA') {
                            const mbPcie = getSpec(mb, 'pcie_version');
                            if (mbPcie) query.specifications = { $elemMatch: { key: 'pcie_version', value: mbPcie } };
                        }
                        if (comp === 'Case') {
                            const mbForm = getSpec(mb, 'form_factor');
                            if (mbForm) query.specifications = { $elemMatch: { key: 'form_factor', value: mbForm } };
                        }
                    }
                }
                
                build[comp] = await findBestComponent(comp, compBudget, query);
            }

            suggestedProducts = Object.values(build).filter(Boolean);
            const currentTotal = suggestedProducts.reduce((s, p) => s + p.price, 0);
            
            // Kiểm tra công suất nguồn (PSU)
            if (build.PSU) {
                const tdp = 50 + Number(getSpec(build.CPU, 'tdp') || 65) + Number(getSpec(build.VGA, 'tdp') || 150);
                const minWattage = tdp * 1.3;
                const psuWattage = Number(getSpec(build.PSU, 'power_wattage') || 0);
                if (psuWattage < minWattage) {
                    botReply = `Cấu hình đã phối xong nhưng nguồn hiện tại (${psuWattage}W) không đủ công suất khuyến nghị (${Math.ceil(minWattage)}W).`;
                }
            }

            const missingComponents = components.filter(c => !build[c]);
            if (missingComponents.length > 0 || currentTotal > budget * 1.15) {
                const suggestedBudget = Math.ceil((currentTotal * 1.1) / 500_000) * 500_000;
                botReply = `Mình đã phối cấu hình nhưng ngân sách **${budget.toLocaleString('vi-VN')}đ** đang thiếu một số linh kiện${missingComponents.length ? ` (${missingComponents.join(', ')})` : ''}. Bạn có thể nâng lên khoảng **${suggestedBudget.toLocaleString('vi-VN')}đ** để mình phối lại chuẩn không ạ?`;
            } else {
                botReply = `Đây là cấu hình tối ưu cho nhu cầu **${purposeKey}** trong tầm giá của bạn. Tổng thực tế: **${currentTotal.toLocaleString('vi-VN')}đ**.`;
            }
        }

        if (!botReply?.trim()) botReply = reply || 'Dạ bạn có thể cho shop biết mức ngân sách dự kiến được không ạ?';

        const isSuccess = (intent === 'chat' || suggestedProducts.length > 0);
        logInteraction(message, botReply, isSuccess);

    } catch (error) {
        botReply = 'Hệ thống đang bận, bạn vui lòng thử lại sau vài giây nhé!';
        logInteraction(message, botReply, false);
    }

    return res.status(200).json({ status: 'OK', message: botReply, data: suggestedProducts, intent: intent });
};

module.exports = { handleChat };