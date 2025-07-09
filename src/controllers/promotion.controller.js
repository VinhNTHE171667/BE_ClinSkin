import Promotion from "../models/promotion.model.js";
import Product from "../models/product.js";

export const getDetailPromotion = async (req, res) => {
  try {
    const id = req.params.id;
    const promotion = await Promotion.findById(id).populate(
      "products.product",
      "name mainImage"
    );
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Khuyến mãi không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      data: promotion,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      data: {},
      error: error.message,
    });
  }
};

export const getAllPromotions = async (req, res) => {
  try {
    const { startDate, endDate, page, pageSize } = req.query;

    let query = {};
    let paginationOptions = {};

    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }

    if (page && pageSize) {
      const skip = (Number(page) - 1) * Number(pageSize);
      paginationOptions = {
        skip: skip,
        limit: Number(pageSize),
      };
    }

    const promotions = await Promotion.find(query)
      .sort({ createdAt: -1 })
      .skip(paginationOptions.skip || 0)
      .limit(paginationOptions.limit || 0)
      .populate("products.product", "name price");

    const total = await Promotion.countDocuments(query);

    const response = {
      success: true,
      data: promotions,
    };

    if (page && pageSize) {
      response.pagination = {
        page: Number(page),
        totalPage: Math.ceil(total / Number(pageSize)),
        totalItems: total,
        pageSize: Number(pageSize),
      };
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in getAllPromotions:", error);
    return res.status(500).json({
      success: false,
      data: [],
      error: error.message,
    });
  }
};

export const createPromotion = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      isActive,
      products,
      banner = null,
    } = req.body;

    if (products && products.length > 0) {
      const productIds = products.map((p) => p.product);
      const productCount = await Product.countDocuments({
        _id: { $in: productIds },
      });
      if (productCount !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: "Một số sản phẩm không tồn tại",
        });
      }
    }

    const newPromotion = new Promotion({
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive,
      banner,
      products: products.map((item) => ({
        product: item.product,
        discountPercentage: item.discountPercentage,
        maxQty: item.maxQty,
        maxDiscountAmount: item.maxDiscountAmount,
      })),
    });

    const savedPromotion = await newPromotion.save();

    return res.status(201).json({
      success: true,
      message: "Tạo thông tin khuyến mãi thành công",
      data: savedPromotion,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tạo khuyến mãi",
      error: error.message,
    });
  }
};

export const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      startDate,
      endDate,
      isActive,
      products,
      banner = null,
    } = req.body;

    const promotion = await Promotion.findById(id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin khuyến mãi",
      });
    }

    if (products && products.length > 0) {
      const productIds = products.map((p) => p.product);
      const productCount = await Product.countDocuments({
        _id: { $in: productIds },
      });
      if (productCount !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: "Một số sản phẩm không tồn tại",
        });
      }
    }

    promotion.name = name || promotion.name;
    promotion.description = description || promotion.description;
    promotion.startDate = startDate ? new Date(startDate) : promotion.startDate;
    promotion.endDate = endDate ? new Date(endDate) : promotion.endDate;
    promotion.isActive = isActive !== undefined ? isActive : promotion.isActive;
    promotion.banner = banner || promotion.banner;

    if (products) {
      promotion.products = products.map((p) => {
        const existingProduct = promotion.products.find(
          (prod) => prod.product.toString() === p.product.toString()
        );
        return {
          product: p.product,
          discountPercentage: p.discountPercentage,
          maxQty: p.maxQty,
          usedQty: p?.usedQty || existingProduct?.usedQty || 0,
          maxDiscountAmount:
            p?.maxDiscountAmount || existingProduct?.maxDiscountAmount || 0,
        };
      });
    }

    const updatedPromotion = await promotion.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật khuyến mãi thành công",
      data: updatedPromotion,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi cập nhật khuyến mãi",
      error: error.message,
    });
  }
};

export const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findById(id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin khuyến mãi",
      });
    }

    await Promotion.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Xóa khuyến mãi thành công",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xóa khuyến mãi",
      error: error.message,
    });
  }
};

export const getPromotionalProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive = 'true',
      name = '',
      startDate,
      endDate,
      discountMin,
      discountMax
    } = req.query;

    const currentDate = new Date();

    const filter = {
      isActive: isActive === 'true',
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    };

    // Optional: filter by custom start-end date
    if (startDate && endDate) {
      filter.startDate = { $gte: new Date(startDate) };
      filter.endDate = { $lte: new Date(endDate) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const promotions = await Promotion.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'products.pid',
        match: {
          name: { $regex: name, $options: 'i' }
        }
      })
      .lean();

    // 🔎 Filter discount
    const min = discountMin ? parseFloat(discountMin) : 0;
    const max = discountMax ? parseFloat(discountMax) : Infinity;

    const result = promotions.map(promo => {
      const filteredProducts = promo.products.filter(p =>
        p.pid !== null &&
        p.discount >= min &&
        p.discount <= max
      );

      return {
        _id: promo._id,
        name: promo.name,
        description: promo.description,
        startDate: promo.startDate,
        endDate: promo.endDate,
        isActive: promo.isActive,
        createdAt: promo.createdAt,
        updatedAt: promo.updatedAt,
        products: filteredProducts.map(p => ({
          product: p.pid,
          discount: p.discount
        }))
      };
    }).filter(promo => promo.products.length > 0);

    const totalCount = await Promotion.countDocuments(filter);

    res.json({
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalItems: totalCount,
      data: result
    });

  } catch (error) {
    console.error('Error getting promotional products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getActivePromotions = async (req, res) => {
  try {
    const currentDate = new Date();
    const promotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    }).select("_id name slug");

    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getListFromPromotion = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      name = "",
      discountMin = 0,
      discountMax = 100,
      minPrice = 0,
      maxPrice = Number.MAX_SAFE_INTEGER,
    } = req.query;

    // Tìm promotion và populate sản phẩm
    const promotion = await Promotion.findOne({ slug }).populate({
      path: "products.product",
      model: "Product"
    });

    // Không tìm thấy promotion
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khuyến mãi",
        data: [],
      });
    }

    // Lọc theo tên khuyến mãi nếu cần
    if (
      name &&
      !promotion.name.toLowerCase().includes(name.toString().toLowerCase())
    ) {
      return res.status(200).json({
        success: true,
        message: "Không tìm thấy khuyến mãi phù hợp với tên",
        data: null,
      });
    }

    // Lọc sản phẩm theo điều kiện
    const filteredProducts = promotion.products.filter((item) => {
      const discount = Number(item.discountPercentage || 0);
      const product = item.product;

      // Nếu product null (do populate thất bại), bỏ qua
      if (!product) return false;

      const price = product.price || 0;
      const priceAfterDiscount = price - (price * discount) / 100;

      return (
        discount >= discountMin &&
        discount <= discountMax &&
        priceAfterDiscount >= minPrice &&
        priceAfterDiscount <= maxPrice
      );
    });

    return res.status(200).json({
      success: true,
      message: "Thành công",
      data: {
        ...promotion.toObject(),
        products: filteredProducts,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      data: [],
      error: error.message,
    });
  }
};
