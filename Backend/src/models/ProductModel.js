const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
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
    type: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    brand: {
        type: String,
        default: "",
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
    specifications: [{
        key: { type: String },
        value: { type: String }
    }],
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;