const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
        required: true,
    },
    isEmployee: {
        type: Boolean,
        default: true,
        required: true,
    },
    phone: {
        type: Number,
    },
    address: {
        type: String,
    },
    avatar: {
        type: String,
    },
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;
