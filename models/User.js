const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true},
        email: {type: String, required: true, unique:true, lowercase: true, trim:true},
        password: {type: String, require: true},
        phone: {type: String, default: ''},
        address: {type: String, default: ''},
        area: {type: String, default: ''},
        role: {
            type: String,
            enum: ['customer', 'vendor', 'admin'],
            default: 'customer'
        },
        isActive: {type: Boolean, default: true},
    }, 
    {timestamps: true},
)

module.exports = mongoose.model("User", userSchema);