const mongoose = require('mongoose');

const operatingCostSchema = new mongoose.Schema({
    rentCost: {
        type: Number,
        required: true,
        default: 0,
    },
}, { timestamps: true });

const OperatingCost = mongoose.model('OperatingCost', operatingCostSchema);
module.exports = OperatingCost;