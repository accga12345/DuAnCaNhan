const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: Number,
    },
    email: {
        type: String,
    },
    address: {
        type: String,
    },
    description: {
        type: String,
    },
}, { timestamps: true });

const Supplier = mongoose.model('Supplier', supplierSchema);
module.exports = Supplier;
