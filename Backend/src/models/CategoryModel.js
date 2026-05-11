const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    parent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
    },
    image: {
        type: String,
        default: "",
    },
    brands: {
        type: [String],
        default: [],
    }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
