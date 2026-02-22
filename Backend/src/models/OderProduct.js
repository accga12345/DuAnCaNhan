const mongoose = require('mongoose');

const oderProductSchema = new mongoose.Schema({
    oderItem: [
        {
            name: {
                type: String,
                required: true,
            },
            amount: {
                type: Number,
                required: true,
            },
            image: {
                type: String,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            }
        }],
    shippingAddress: {
        fullName: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        phone: {
            type: Number,
            required: true,
        }
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    itemsPrice: {
        type: Number,
        required: true,
    },
    shippingPrice: {
        type: Number,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isPaid: {
        type: Boolean,
        default: false,
        required: true,
    },
    paidAt: {
        type: Date,
    },
    isDelivered: {
        type: Boolean,
        default: false,
        required: true,
    },
    deliveredAt: {
        type: Date,
    },
    status: {
        type: Number,
        default: 0,
    }
}, { timestamps: true });

const OderProduct = mongoose.model('OderProduct', oderProductSchema);
module.exports = OderProduct;