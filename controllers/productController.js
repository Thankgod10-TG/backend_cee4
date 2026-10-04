const Product = requires("../models/Product");

const createSlug = (text) => {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-") // - Nike Air Max 90 - (nike-air-max-90)
        .replace(/^-+|-+$/g, "-")
}

const createProduct = async(req, res) => {
    try{


        const {name, description, price, category, stock} = req.body;

        if(!name || !name.trim()){
            return res.status(400).json({
                message: "Product name is required"
            })
        }

        if(price === undefined || price === null || price === ""){
            return res.status(400).json({
                message: "Price is required and must be a number"
            })
        }

        if(!category){
                return res.status(400).json({
                message: "category is required"
            })
        }


        const baseSlug = createSlug(name)

        let slug = baseSlug

        let counter = 1

        while(
            await Product.findOne({slug})
        ){
            slug = `${baseSlug}-${counter}`;
            counter++
        }

        const images = (req.files || []).map(
            (file) =>  `/uploads/products/${file.filename}`
        )

        const product = await Product.create({
            name: name.trim(),
            slug,
            description: description ? description.trim() : "",
            price: Number(price),
            category,
            stock: stock !== undefined ? Number(stock) : 1, // 40, 50
            images,
            vendor: req.user.id,
            status: "pending",
            isActive: true
        })

        const populatedProduct = 
        await Product.findById(
            product._id
        )
        .populate(
            "category",
            "name slug image"
        )
        .populate(
            "vendor",
            "name email"
        )

        res.staus(201).json({
            message: "Product submitted successfully for review",
            product: populatedProduct
        })

    }catch(error){
        console.error("Create product error:", error);

        res.status(500).json({
            message: "Failed to create product",
            error: error.message
        })
    }
}

const getProducts = async(req, res) => {
    try{
        const {
            search, category,minPrice, maxPrice, sort, page = 1, limit = 10
        } = req.query;

        const filter = {
            isActive: true,
            status: "approved"
        };

        if(search){
            filter.$or[
                {
                 name: {
                    $regex: search,
                    $options: "i" 
                 } 
                },
                {
                    description: {
                     $regex: search,
                        $options: "i"
                 }
                }
            ];
        }

        if(category){
            filter.category = category;
        }

        if(minPrice || maxPrice){
            filter.price = {};

            if(minPrice){
                filter.price.$gte = Number(minPrice)
            }

            if(maxPrice){
                filter.price.$lte = Number(maxPrice)
            }
        }

        let sortOption = {
            createdAt: -1
        }

        if(sort === "price-asc"){
            sortOption = {
                price: 1
            }
        }

        
        if(sort === "price-desc"){
            sortOption = {
                price: -1
            }
        }
        
        if (sort === "newest"){
            sortOption = {
                createdAt: -1
            }
        }    

        if (sort === "oldest"){
            sortOption = {
                createdAt: 1
            }
        }    

        const skip = (Number(page) - 1) * Number(limit); // 0, 10, 20, 30

        const products = await Product.find(filter)
            .populate("category", "name slug image")
            .populate("vendor", "name email")
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit));

            const total = await Product.countDocuments(filter)

            res.status(200).json({ 
                products,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit)) // 35 products 3.5 4
                }
            })

    }catch(error){
        console.error("Can't get Products", error);

        res.status(500).json({
            message: "Failed to get products",
            error: error.message
        })
    }
}

const getProductById = async(req, res) => {
    try{
        const product = await Product.findByOne({
            _id: req.params.id,
            isActive: true
        })
        .populate("category", "name slug image")
        .populate("vendor", "name email")

        if (!product){
            return res.status(404).json({
                message: "Product not found"
            })
        }

        res.status(200).json({
            product
        })  
    }catch(error){
        console.error("Can't get Product by that Id", error);

        res.status(500).json({
            message: "Failed to get products",
            error: error.message
        })
    }
}


const getMyProducts = async(req, res) => {
    try{
        const products = await Product.find({
            vendor: req.user.id
        })
        .populate("category", "name slug image")
        .populate("vendor", "name email")

        res.status(200).json({
            products
        });
    }catch(error){
        console.error("Can't get Product by that Id", error);

        res.status(500).json({
            message: "Failed to get products",
            error: error.message
        })
    }
}

const getProductsByVendor = async(req, res) => {
    try{
        const products = await Product.find({
            vendor: req.params.vendorId,
            isActive: true,
        })
        .populate("category", "name slug image")
        .populate("vendor", "name email")
        .sort({
            createdAt: -1
        })
        res.status(200).json({
            products
        });
    }catch(error){
        console.error("Can't get Products by Vendor", error);

        res.status(500).json({
            message: "Failed to get products by vendor",
            error: error.message
        })
    }
}

const updateProduct = async(req, res) => {
    try{
        const product = await Product.findById(req.params.id);

        if(!product){
            return res.status(404).json({
                message: "Product not found"
            })
        }

        if(product.vendor.toString() !== req.user.id){
            return res.status(403).json({
                message: "You are not authorized to update this product"
            })
        }

    const { name, description, price, category, stock } = req.body; //   2 3 similar product name 

    if(name !== undefined){
        product.name = name
    }
    if(description !== undefined){
        product.description = description
    }
    if(price !== undefined){
        product.price = price
    }
    if(category !== undefined){
        product.category = category
    }
    if(stock !== undefined){
        product.stock = stock
    }

    if(images !== undefined){
        product.images = images;
    }

    product.status = "pending";

    await product.save();

    const updateProduct = await Product.findById(product._id)
    .populate("category", "name slug image")
    .populate("vendor", "name email")

    res.status(200).json({
        message: "Product updated successfully and submitted for review",
        product: updateProduct
    })

    }catch(error){
        console.error("Can't Update Product", error);

        res.status(500).json({
            message: "Failed to update product",
            error: error.message
        })
    }
}

const deleteProduct = async(req, res) => {
    try{
        const product = await Product.findById(req.params.id);

        if(!product){
            return res.status(404).json({
                message: "Product not found"
            })
        }

        if(product.vendor.toString() !== req.user.id){
            return res.status(403).json({
                message: "You are not authorized to delete this product"
            })
        }

        product.isActive = false;

        await product.save()

        res.status(200).json({
            message: "Product deleted successfully"
        })

    }catch(error){
        console.error("Can't delete product", error);

        res.status(500).json({
            message: "Failed to delete product",
            error: error.message
        })
    }
}

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    getProductsByVendor,
    updateProduct,
    deleteProduct
}





