const Category = require("../models/Category");

//CREATE CATEGORY
const createCategory = async (req, res) =>{
    try{

        const {name, description, image} = req.body; // Nike (nike)
        
        if(!name){
            return res.status(400).json({
                message: "Category name is require"
            })
        }

        const slug = name
            .toLowercase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-") // - Nike Air Max 90 - (nike-air-max-90)
            .replace(/^-+|-+$/g, "-")

        const existingCategory = await Category.findOne({
            $or: [
                { name: name.trim()},
                {slug}
            ]
        });

        if(existingCateogry){
            return res.status(400).json({
                message: "Category already exists"
            });
        }

        const category = await Category.create({
            name: name.trim(),
            slug, 
            description: description || "",
            image: image || "",
            isActive: true
        });

        res.status(201).json({
            message: "Category created successfully",
            category
        })
    }   catch(error){
        console.error(error)
    }
}

const getCateogries = async (req, res) => {
    try{
        const categories = await Category.find({
            isActive: true
        }).sort({name: 1}) 

        res.status(200).json({
            categories
        });
    }catch(error){
        console.error("Get categories error:", error);

        res.status(500).json({
            message: "Failed to retrieve categories",
            error: error.message
        })
    }
}

module.exports = {
    createCategory,
    getCategories
}