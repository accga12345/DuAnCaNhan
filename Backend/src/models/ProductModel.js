const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    warehouseItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true,
    },
    name: {
        type: String,
        required: true,
        unique: true,
    },
    image: {
        type: String,
        default: "",
    },
    images: [{
        type: String,
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    brand: {
        type: String,
        default: "",
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
    },
    price: {
        type: Number,
        required: true,
    },
    countInStock: {
        type: Number,
        required: true,
    },
    rating: {
        type: Number,
        default: 0,
    },
    description: {
        type: String,
        default: "",
    },
    selled: {
        type: Number,
        default: 0,
    },
    discount: {
        type: Number,
        default: 0,
    },
    warranty: {
        type: Number,
        default: 12, // Mặc định 12 tháng
    },
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: Number,
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }],
    specifications: [{
        key: { type: String },
        value: { type: String }
    }],
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;