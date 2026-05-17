const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Tải biến môi trường
dotenv.config({ path: path.join(__dirname, '../../.env') });

const updateSpecs = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to DB');
        
        const Product = require('../models/ProductModel');
        const products = await Product.find({});
        
        for (let p of products) {
            let newSpecs = [...p.specifications];
            const nameLower = p.name.toLowerCase();

            // Hàm hỗ trợ thêm thông số nếu chưa có
            const addSpec = (key, value) => {
                const existingIndex = newSpecs.findIndex(s => s.key.toLowerCase() === key.toLowerCase());
                if (existingIndex === -1) {
                    newSpecs.push({ key, value });
                } else {
                    // Update if existing but we want to force our new categories
                    if (key === 'Mục đích') {
                         newSpecs[existingIndex].value = value;
                    }
                }
            };

            // 1. Phân tích Socket / Platform
            if (nameLower.includes('intel') || nameLower.includes('core i')) {
                if (nameLower.includes('12100') || nameLower.includes('12400') || nameLower.includes('14700') || nameLower.includes('13th')) addSpec('Socket', 'LGA1700');
            }
            
            if (nameLower.includes('amd') || nameLower.includes('ryzen')) {
                if (nameLower.includes('5600') || nameLower.includes('3600') || nameLower.includes('5700')) addSpec('Socket', 'AM4');
                if (nameLower.includes('7600') || nameLower.includes('7700')) addSpec('Socket', 'AM5');
            }

            if (nameLower.includes('b660') || nameLower.includes('h610') || nameLower.includes('z690') || nameLower.includes('z790') || nameLower.includes('b760')) {
                addSpec('Socket', 'LGA1700');
            }
            if (nameLower.includes('b550') || nameLower.includes('x570')) {
                addSpec('Socket', 'AM4');
            }
            if (nameLower.includes('b650') || nameLower.includes('x670')) {
                addSpec('Socket', 'AM5');
            }

            // 2. Phân tích RAM Type
            if (nameLower.includes('ddr4')) addSpec('Loại RAM', 'DDR4');
            if (nameLower.includes('ddr5')) addSpec('Loại RAM', 'DDR5');
            
            // 3. Phân loại MỤC ĐÍCH (chơi game, văn phòng, đồ họa) - Rất quan trọng cho Bot
            let purpose = [];
            
            // Đồ họa / Nặng
            if (nameLower.includes('rtx 4070') || nameLower.includes('rtx 3080') || nameLower.includes('i7') || nameLower.includes('ryzen 7') || nameLower.includes('6000mhz') || nameLower.includes('850e') || nameLower.includes('z790')) {
                purpose.push('đồ họa', 'chơi game');
            } 
            // Gaming tầm trung
            else if (nameLower.includes('rtx 3060') || nameLower.includes('gtx 1650') || nameLower.includes('i5') || nameLower.includes('ryzen 5') || nameLower.includes('gaming') || nameLower.includes('tuf') || nameLower.includes('rog')) {
                purpose.push('chơi game');
            }
            // Văn phòng / Cơ bản
            else if (nameLower.includes('i3') || nameLower.includes('2666mhz') || nameLower.includes('h610') || nameLower.includes('cv650') || nameLower.includes('250gb')) {
                purpose.push('văn phòng');
            }
            
            // Màn hình thì thường dùng được cho mọi mục đích, nhưng tuỳ tần số quét
            if (nameLower.includes('monitor') || nameLower.includes('màn hình') || nameLower.includes('inch') || nameLower.includes('hz')) {
                if (nameLower.includes('165hz') || nameLower.includes('170hz') || nameLower.includes('odyssey') || nameLower.includes('ultragear')) {
                    purpose.push('chơi game', 'đồ họa');
                } else if (nameLower.includes('ultrasharp')) {
                    purpose.push('đồ họa', 'văn phòng');
                } else {
                    purpose.push('văn phòng', 'chơi game');
                }
            }
            
            // Fallback nếu không khớp cái nào ở trên
            if (purpose.length === 0) {
                 if (p.price > 5000000) purpose.push('chơi game', 'đồ họa');
                 else purpose.push('văn phòng', 'chơi game');
            }

            // Lọc trùng lặp và ghép thành chuỗi
            const uniquePurpose = [...new Set(purpose)].join(', ');
            addSpec('Mục đích', uniquePurpose);

            p.specifications = newSpecs;
            await p.save();
        }
        
        console.log(`Đã cập nhật thành công thông số kỹ thuật (Socket, RAM, Mục đích) cho ${products.length} sản phẩm!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateSpecs();