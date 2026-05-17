const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    image: {
        type: String,
        default: "",
    },
    brands: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
    }],
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
