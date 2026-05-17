const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const updateSpecs = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        const Product = require('../models/ProductModel');
        const products = await Product.find({});
        
        for (let p of products) {
            let newSpecs = p.specifications.filter(s => s.key !== 'Mục đích' && s.key !== 'Socket' && s.key !== 'Loại RAM');
            const nameLower = p.name.toLowerCase();

            // 1. Xác định Socket
            let socket = "";
            if (nameLower.includes('12100') || nameLower.includes('12400') || nameLower.includes('14700') || nameLower.includes('h610') || nameLower.includes('b760') || nameLower.includes('z790')) socket = "LGA1700";
            if (nameLower.includes('5600') || nameLower.includes('3600') || nameLower.includes('b550') || nameLower.includes('x570')) socket = "AM4";
            if (nameLower.includes('7600') || nameLower.includes('7700') || nameLower.includes('b650') || nameLower.includes('x670')) socket = "AM5";
            if (socket) newSpecs.push({ key: "Socket", value: socket });

            // 2. Xác định Loại RAM
            let ramType = "";
            if (nameLower.includes('ddr4')) ramType = "DDR4";
            if (nameLower.includes('ddr5') || nameLower.includes('6000mhz') || nameLower.includes('b650') || nameLower.includes('z790')) ramType = "DDR5";
            if (ramType) newSpecs.push({ key: "Loại RAM", value: ramType });

            // 3. Xác định Mục đích (Tiếng Việt chuẩn)
            let purposes = [];
            if (nameLower.includes('rtx') || nameLower.includes('gtx') || nameLower.includes('rx ') || nameLower.includes('ryzen 5') || nameLower.includes('ryzen 7') || nameLower.includes('i5') || nameLower.includes('i7') || nameLower.includes('gaming')) {
                purposes.push("chơi game", "đồ họa");
            }
            if (nameLower.includes('i3') || nameLower.includes('văn phòng') || nameLower.includes('office') || p.price < 3000000) {
                purposes.push("văn phòng");
            }
            if (nameLower.includes('ultrasharp') || nameLower.includes('z790') || nameLower.includes('32gb')) {
                purposes.push("đồ họa");
            }
            
            if (purposes.length === 0) purposes.push("chơi game", "văn phòng");
            newSpecs.push({ key: "Mục đích", value: [...new Set(purposes)].join(', ') });

            p.specifications = newSpecs;
            await p.save();
        }
        console.log("✅ Database đã được chuẩn hóa Socket và Mục đích Tiếng Việt!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
updateSpecs();