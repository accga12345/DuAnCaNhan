const ProductModel = require('../models/ProductModel');

const searchProductsForContext = async (userMessage) => {
    try {
        let budget = 0;
        const budgetMatch = userMessage.match(/(\d+)\s*(tr|triệu|củ|m|k)/i);
        if (budgetMatch) {
            let val = parseInt(budgetMatch[1]);
            if (budgetMatch[2].toLowerCase() === 'k') budget = val * 1000;
            else budget = val * 1000000;
        }

        const stopWords = ['tôi', 'cần', 'muốn', 'tìm', 'mua', 'cho', 'có', 'không', 'shop', 'hỏi', 'tư', 'vấn', 'với', 'giá', 'khoảng', 'tầm', 'triệu', 'tr', 'củ', 'k', 'chào', 'bạn', 'build', 'pc', 'máy'];
        const words = userMessage.toLowerCase().split(/\s+/);
        const keywords = words.filter(w => w.length > 2 && !stopWords.includes(w) && isNaN(w.replace(/tr|k|m/g, '')));

        let products = [];

        // Nếu người dùng có đưa ra ngân sách (nghi vấn build PC)
        if (budget > 0) {
            const ratios = { CPU: 0.18, VGA: 0.45, Main: 0.12, RAM: 0.10, PSU: 0.07 };
            
            // Tìm từng linh kiện khớp với tỉ lệ ngân sách
            const getComp = async (keyword, ratio) => {
                return await ProductModel.findOne({
                    $or: [
                        { name: { $regex: new RegExp(keyword, 'i') } },
                        { "specifications.value": { $regex: new RegExp(keyword, 'i') } }
                    ],
                    price: { $lte: budget * ratio * 1.2 }
                }).sort({ price: -1 }).select('_id name price specifications').lean();
            };

            const cpu = await getComp('intel|amd|ryzen|core', ratios.CPU);
            const vga = await getComp('rtx|gtx|rx|radeon|geforce', ratios.VGA);
            const main = await getComp('mainboard|b760|h610|z790|b650|x670', ratios.Main);
            const ram = await getComp('ram|ddr4|ddr5', ratios.RAM);
            const psu = await getComp('nguồn|psu|corsair|aerocool', ratios.PSU);

            if (cpu) products.push(cpu);
            if (vga) products.push(vga);
            if (main) products.push(main);
            if (ram) products.push(ram);
            if (psu) products.push(psu);

        } else if (keywords.length > 0) {
            // Nếu không có ngân sách, chỉ tìm kiếm bằng từ khóa
            const regexArray = keywords.map(kw => new RegExp(kw, 'i'));
            products = await ProductModel.find({
                $or: [
                    { name: { $in: regexArray } },
                    { "specifications.value": { $in: regexArray } }
                ]
            })
            .limit(10)
            .select('_id name price specifications')
            .lean();
        }

        console.log(`DEBUG: RAG Search - Keywords: [${keywords.join(', ')}], Budget: ${budget} - Context Size: ${products.length}`);
        
        if (products.length === 0) return "[]";

        return JSON.stringify(products);
    } catch (error) {
        console.error("Lỗi tìm kiếm sản phẩm cho RAG:", error);
        return "[]";
    }
};

module.exports = { searchProductsForContext };
