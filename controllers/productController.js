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

