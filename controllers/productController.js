const Product = require("../models/Product");

const createSlug = (text) => {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stock
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Product name is required"
      });
    }

    if (
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return res.status(400).json({
        message: "Product price is required"
      });
    }

    if (!category) {
      return res.status(400).json({
        message: "Product category is required"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE UNIQUE SLUG
    |--------------------------------------------------------------------------
    */

    const baseSlug = createSlug(name);

    let slug = baseSlug;

    let counter = 1;

    while (
      await Product.findOne({ slug })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCT IMAGES
    |--------------------------------------------------------------------------
    */

    const images = (req.files || []).map(
      (file) =>
        `/uploads/products/${file.filename}`
    );

    /*
    |--------------------------------------------------------------------------
    | CREATE PRODUCT
    |--------------------------------------------------------------------------
    */

    const product = await Product.create({

      name: name.trim(),

      slug,

      description:
        description
          ? description.trim()
          : "",

      price: Number(price),

      category,

      stock:
        stock !== undefined
          ? Number(stock)
          : 0,

      images,

      vendor: req.user.id,

      status: "pending",

      isActive: true,

    });

    /*
    |--------------------------------------------------------------------------
    | POPULATE PRODUCT
    |--------------------------------------------------------------------------
    */

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
        );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    res.status(201).json({

      message:
        "Product submitted successfully for review",

      product:
        populatedProduct,

    });

  } catch (error) {

    console.error(
      "Create product error:",
      error
    );

    res.status(500).json({

      message:
        "Failed to create product",

      error:
        error.message,

    });
  }
};


// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {
      isActive: true,
      status: "approved"
    };

    // SEARCH
    if (search) {
      filter.$or = [
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

    // CATEGORY
    if (category) {
      filter.category = category;
    }

    // PRICE FILTER
    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // SORT
    let sortOption = {
      createdAt: -1
    };

    if (sort === "price_asc") {
      sortOption = {
        price: 1
      };
    }

    if (sort === "price_desc") {
      sortOption = {
        price: -1
      };
    }

    if (sort === "newest") {
      sortOption = {
        createdAt: -1
      };
    }

    if (sort === "oldest") {
      sortOption = {
        createdAt: 1
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .populate("vendor", "name email")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      products,
      pagination: {
        page: Number(),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      message: "Failed to retrieve products",
      error: error.message
    });
  }
};


// GET SINGLE PRODUCT
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true
    })
      .populate("category", "name slug")
      .populate("vendor", "name email");

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(200).json({
      product
    });

  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      message: "Failed to retrieve product",
      error: error.message
    });
  }
};


// GET MY PRODUCTS
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({
      vendor: req.user.id
    })
      .populate("category", "name slug")
      .sort({
        createdAt: -1
      });

    res.status(200).json({
      products
    });

  } catch (error) {
    console.error("Get my products error:", error);

    res.status(500).json({
      message: "Failed to retrieve your products",
      error: error.message
    });
  }
};


// GET PRODUCTS BY VENDOR
const getProductsByVendor = async (req, res) => {
  try {
    const products = await Product.find({
      vendor: req.params.id,
      isActive: true,
      status: "approved"
    })
      .populate("category", "name slug")
      .populate("vendor", "name email")
      .sort({
        createdAt: -1
      });

    res.status(200).json({
      products
    });

  } catch (error) {
    console.error("Get vendor products error:", error);

    res.status(500).json({
      message: "Failed to retrieve vendor products",
      error: error.message
    });
  }
};


// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    if (product.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to update this product"
      });
    }

    const {
      name,
      description,
      price,
      category,
      stock,
      images
    } = req.body;

    if (name !== undefined) {
      product.name = name;
    }

    if (description !== undefined) {
      product.description = description;
    }

    if (price !== undefined) {
      product.price = price;
    }

    if (category !== undefined) {
      product.category = category;
    }

    if (stock !== undefined) {
      product.stock = stock;
    }

    if (images !== undefined) {
      product.images = images;
    }

    // Re-submit for approval after editing
    product.status = "pending";

    await product.save();

    const updatedProduct = await Product.findById(product._id)
      .populate("category", "name slug")
      .populate("vendor", "name email");

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct
    });

  } catch (error) {
    console.error("Update product error:", error);

    res.status(500).json({
      message: "Failed to update product",
      error: error.message
    });
  }
};


// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    if (product.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to delete this product"
      });
    }

    product.isActive = false;

    await product.save();

    res.status(200).json({
      message: "Product deleted successfully"
    });

  } catch (error) {
    console.error("Delete product error:", error);

    res.status(500).json({
      message: "Failed to delete product",
      error: error.message
    });
  }
};


module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getMyProducts,
  getProductsByVendor,
  updateProduct,
  deleteProduct
};