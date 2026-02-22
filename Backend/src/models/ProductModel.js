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
    type: {
        type: String,
        required: true,
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
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;