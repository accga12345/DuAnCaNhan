const mongoose = require('mongoose');
const Product = require('./Backend/src/models/ProductModel');
const Warehouse = require('./Backend/src/models/WarehouseModel');
require('dotenv').config({ path: './Backend/.env' });

const syncWarehouse = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URL, {
            serverSelectionTimeoutMS: 60000,
            socketTimeoutMS: 60000,
            bufferCommands: false,
        });
        console.log("Connected successfully.");

        const products = await Product.find().lean();
        console.log(`Processing ${products.length} products...`);

        for (const product of products) {
            const costPrice = Math.floor(product.price * 0.8);
            
            let warehouse = await Warehouse.findOne({ name: product.name });

            if (!warehouse) {
                warehouse = await Warehouse.create({
                    name: product.name,
                    category: product.category,
                    brand: product.brand || "Unknown",
                    quantity: 100,
                    costPrice: costPrice
                });
                console.log(`Created: ${product.name}`);
            } else {
                warehouse.costPrice = costPrice;
                await warehouse.save();
                console.log(`Updated: ${product.name}`);
            }

            await Product.updateOne({ _id: product._id }, { warehouseItem: warehouse._id });
        }

        console.log("Sync finished.");
        process.exit(0);
    } catch (error) {
        console.error("Sync error:", error);
        process.exit(1);
    }
};

syncWarehouse();
