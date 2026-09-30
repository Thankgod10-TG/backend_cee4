const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        }, 
        description: {
            type: String, 
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required:true,
            min: 0
        },
        slug: {
            type: String, 
            required: true, 
            uniqe: true, 
            trim: true,
            lowercase: true
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },
        images: [
            {type: String}
        ], 
        stock: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },

        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },
        isActive: {
            type: Boolen,
            default: true
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Product", productSchema)