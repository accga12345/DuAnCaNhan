const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
    },
    costPrice: {
        type: Number,
        required: true,
        default: 0,
    },
}, { timestamps: true });

const Warehouse = mongoose.model('Warehouse', warehouseSchema);
module.exports = Warehouse;
