import Product from "../models/product.js";
import Promotion from "../models/promotion.model.js";
import { uploadImage, deleteImage } from "../ultis/cloudinary.js";

export const searchProductByName = async (req, res) => {
  try {
    const { name, page = 1, limit = 20, sort = "name" } = req.query;

    // Validate query parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res
        .status(400)
        .json({ message: "Invalid page or limit parameter" });
    }

    // Build query
    const query = name ? { name: { $regex: name, $options: "i" } } : {};
    const sortOption = sort === "name" ? { name: 1 } : {};

    // Fetch products with pagination
    const products = await Product.find(query)
      .select("_id name")
      .sort(sortOption)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Get total count for pagination metadata
    const total = await Product.countDocuments(query);

    res.json({
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách sản phẩm" });
  }
};

export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      name = "",
      category,
      brandId,
      minPrice,
      maxPrice,
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const filter = {};
    if (name) filter.name = { $regex: name, $options: "i" };
    if (category) filter.categories = category;
    if (brandId) filter.brandId = brandId;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const products = await Product.find(filter)
      .populate("categories", "name")
      .populate("brandId", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalItems = await Product.countDocuments(filter);
    const totalPage = Math.ceil(totalItems / limit);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        totalPage,
        totalItems,
        pageSize: limit,
        hasMore: skip + limit < totalItems,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách sản phẩm",
    });
  }
};
// get product by id

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate("categories", "name slug")
      .populate("brandId", "name slug");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết sản phẩm",
    });
  }
};
// create product
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      currentStock = 0,
      categories,
      brandId,
      mainImageBase64,
      additionalImagesBase64 = [],
      description,
      tags = [],
    } = req.body;

    if (!name || !price || !brandId || !mainImageBase64) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin bắt buộc",
      });
    }

    let mainImage;
    try {
      mainImage = await uploadImage(mainImageBase64);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          "Không thể tải lên hình ảnh chính. Vui lòng kiểm tra định dạng hình ảnh.",
      });
    }

    const images = [];
    if (additionalImagesBase64 && additionalImagesBase64.length > 0) {
      for (const base64 of additionalImagesBase64) {
        try {
          const uploadedImage = await uploadImage(base64);
          images.push(uploadedImage);
        } catch (error) {
          for (const img of images) {
            await deleteImage(img.public_id);
          }
          await deleteImage(mainImage.public_id);

          return res.status(400).json({
            success: false,
            message:
              "Không thể tải lên một số hình ảnh. Vui lòng kiểm tra định dạng.",
          });
        }
      }
    }

    const newProduct = new Product({
      name,
      price,
      currentStock,
      categories,
      brandId,
      mainImage,
      images,
      description,
      tags,
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: "Tạo sản phẩm thành công",
      data: savedProduct,
    });
  } catch (error) {
    console.error("Lỗi khi tạo sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo sản phẩm",
    });
  }
};
//  update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      categories,
      brandId,
      mainImageBase64,
      additionalImagesBase64,
      removeImageIds = [],
      description,
      tags,
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    let mainImage = product.mainImage;
    if (mainImageBase64) {
      try {
        if (product.mainImage && product.mainImage.public_id) {
          await deleteImage(product.mainImage.public_id);
        }
        mainImage = await uploadImage(mainImageBase64);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message:
            "Không thể tải lên hình ảnh chính mới. Vui lòng kiểm tra định dạng.",
        });
      }
    }

    let images = [...product.images];

    if (removeImageIds && removeImageIds.length > 0) {
      for (const public_id of removeImageIds) {
        await deleteImage(public_id);
      }
      images = images.filter((img) => !removeImageIds.includes(img.public_id));
    }

    if (additionalImagesBase64 && additionalImagesBase64.length > 0) {
      for (const base64 of additionalImagesBase64) {
        try {
          const uploadedImage = await uploadImage(base64);
          images.push(uploadedImage);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message:
              "Không thể tải lên một số hình ảnh bổ sung. Vui lòng kiểm tra định dạng.",
          });
        }
      }
    }
// cap nhat san pham
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: name || product.name,
        price: price !== undefined ? price : product.price,
        categories: categories || product.categories,
        brandId: brandId || product.brandId,
        mainImage,
        images,
        description:
          description !== undefined ? description : product.description,
        tags: tags || product.tags,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật sản phẩm",
    });
  }
};
// xoa san pham

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    if (product.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Sản phẩm đã bị xoá trước đó",
      });
    }

    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    res.json({
      success: true,
      message: "Xoá sản phẩm thành công (xoá mềm)",
    });
  } catch (error) {
    console.error("Lỗi khi xoá sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xoá sản phẩm",
    });
  }
};

// khoi phuc san pham
export const restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    if (!product.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Sản phẩm chưa bị xoá",
      });
    }

    product.isDeleted = false;
    product.deletedAt = null;
    await product.save();

    res.json({
      success: true,
      message: "Khôi phục sản phẩm thành công",
    });
  } catch (error) {
    console.error("Lỗi khi khôi phục sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi khôi phục sản phẩm",
    });
  }
};
// lay san pham
export const getProductByPromotionAdd = async (req, res) => {
  try {
    console.log("kkkkkkkkkkkkkkkkkkkkk");
    
    const page = parseInt(req.query.page) || 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : null;
    const { name, sort } = req.query;
    const skip = pageSize ? (page - 1) * pageSize : 0;

    let filter = {};
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    let sortOption = {};
    if (sort === "asc") {
      sortOption = { price: 1 };
    } else if (sort === "desc") {
      sortOption = { price: -1 };
    }

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate({ path: "categories", select: "name" })
        .populate({ path: "brandId", select: "name" })
        .sort(sortOption)
        .skip(skip)
        .limit(pageSize || 0)
        .lean(),
    ]);

    const currentDate = new Date();
    const activeAndFuturePromotions = await Promotion.find({
      endDate: { $gte: currentDate },
    }).lean();

    const promotionMap = new Map();
    activeAndFuturePromotions.forEach((promo) => {
      promo.products.forEach((p) => {
        promotionMap.set(p.product.toString(), {
          promotionId: promo._id,
          promotionName: promo.name,
          discountPercentage: p.discountPercentage,
          maxQty: p.maxQty,
          startDate: promo.startDate,
          endDate: promo.endDate,
        });
      });
    });

    const productsWithPromotionInfo = products.map((product) => {
      const promotionInfo = promotionMap.get(product._id.toString());
      return {
        ...product,
        promotion: promotionInfo
          ? {
              id: promotionInfo.promotionId,
              name: promotionInfo.promotionName,
              discountPercentage: promotionInfo.discountPercentage,
              maxQty: promotionInfo.maxQty,
              startDate: promotionInfo.startDate,
              endDate: promotionInfo.endDate,
            }
          : null,
      };
    });

    const hasMore = pageSize && products.length === pageSize;

    return res.status(200).json({
      success: true,
      pagination: {
        page: page,
        totalPage: pageSize ? Math.ceil(total / pageSize) : 1,
        pageSize: pageSize || total,
        totalItems: total,
        hasMore: hasMore,
      },
      data: productsWithPromotionInfo,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
      error: error.message,
    });
  }
};
