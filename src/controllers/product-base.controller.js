import { getCategoryProjectStage } from "../helpers/category.helper.js";
import {
  calculateFinalPrice,
  calulateFinalPricePipeline,
  getPromotionFieldsStage,
  getPromotionLookupStage,
  getPromotionProjectStage,
} from "../helpers/promotion.helper.js";
import Product from "../models/product.js";
import Brand from "../models/brand.model.js";
import Category from "../models/category.model.js";
import mongoose from "mongoose";
import {
  getReviewFieldsStagePro,
  getReviewLookupStagePro,
} from "../helpers/review.helper.js";
import { getFullProjectStage } from "../helpers/product.projection.js";

const getTagTitle = (tag) => {
  switch (tag) {
    case "HOT":
      return "Sản phẩm nổi bật";
    case "NEW":
      return "Sản phẩm mới";
    default:
      return `Sản phẩm ${tag}`;
  }
};

const brandAndCategoryInfo = [
  {
    $lookup: {
      from: "brands",
      localField: "brandId",
      foreignField: "_id",
      as: "brand",
    },
  },
  { $unwind: "$brand" },
  {
    $lookup: {
      from: "categories",
      localField: "categories",
      foreignField: "_id",
      as: "categories",
    },
  },
];

const projectFileds = {
  $project: {
    ...getPromotionProjectStage().$project,
    name: 1,
    slug: 1,
    price: 1,
    mainImage: 1,
    finalPrice: 1,
    brand: {
      _id: "$brand._id",
      name: "$brand.name",
      slug: "$brand.slug",
    },
    categories: {
      $map: {
        input: "$categories",
        as: "cat",
        in: { _id: "$$cat._id", name: "$$cat.name", slug: "$$cat.slug" },
      },
    },
  },
};

export const getProductHome = async (req, res) => {
  try {
    const { tags } = req.query;
    if (!tags || typeof tags !== "string") {
      return res.status(400).json({
        success: false,
        data: [],
      });
    }

    const tagList = tags.split(",").filter((tag) => tag.trim());

    if (tagList.length === 0) {
      return res.status(400).json({
        success: false,
        data: [],
      });
    }

    const currentDate = new Date();
    const productsByTag = [];

    for (const tag of tagList) {
      const tagTitle = getTagTitle(tag);

      const products = await Product.aggregate([
        {
          $match: {
            tags: { $in: [tag] },
            isDeleted: false,
          },
        },
        getPromotionLookupStage(currentDate),
        getPromotionFieldsStage(),

        getReviewLookupStagePro(),
        getReviewFieldsStagePro(),
        
        ...brandAndCategoryInfo,
        {
          $project: {
            ...getPromotionProjectStage().$project,
            ...getCategoryProjectStage(),
            brand: {
              _id: "$brandInfo._id",
              name: "$brandInfo.name",
              slug: "$brandInfo.slug",
            },
            totalReviews: 1,
            averageRating: 1,
            ratingDistribution: 1,
            currentStock: 1,
          },
        },
        {
          $sort: {
            averageRating: -1,
            finalPrice: 1,
          },
        },
        { $limit: 10 },
      ]);

      console.log("products", products);
      

      if (products.length > 0) {
        productsByTag.push({
          tag,
          title: tagTitle,
          products: products.map((p) => ({
            ...p,
            finalPrice: calculateFinalPrice(p),
          })),
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: productsByTag,
    });
  } catch (error) {
    console.error("Get home products error:", error);
    return res.status(500).json({
      success: false,
      data: [],
      error: error.message,
    });
  }
};

export const getProductDetailBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const currentDate = new Date();

    const product = await Product.aggregate([
      {
        $match: {
          slug,
          isDeleted: false,
        },
      },

      getPromotionLookupStage(currentDate),
      getPromotionFieldsStage(),
      getReviewLookupStagePro(),
      getReviewFieldsStagePro(),

      ...brandAndCategoryInfo,

      // Project all fields
      getFullProjectStage(),
    ]);

    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        data: {},
      });
    }
    const finalPrice = calculateFinalPrice(product[0]);
    return res.status(200).json({
      success: true,
      data: {
        ...product[0],
        finalPrice,
      },
    });
  } catch (error) {
    console.error("Get product detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: {},
      error: error.message,
    });
  }
};

export const getAllProductByUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 15;
    const sortField = req.query.sortField || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const currentDate = new Date();

    const aggregationPipeline = [
      { $match: { isDeleted: false } },

      getPromotionLookupStage(currentDate),
      getPromotionFieldsStage(),
      getReviewLookupStagePro(),
      getReviewFieldsStagePro(),

      ...brandAndCategoryInfo,

      getFullProjectStage({ createdAt: 1 }),
      
      {
        $sort: {
          [sortField]: sortOrder,
          _id: 1,
        },
      },

      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
        },
      },
    ];

    const [result] = await Product.aggregate(aggregationPipeline);

    const total = result.metadata[0]?.total || 0;
    const products = result.data;

    return res.status(200).json({
      success: true,
      data:
        products && products.length > 0
          ? products.map((p) => ({
              ...p,
              finalPrice: calculateFinalPrice(p),
            }))
          : [],
      pagination: {
        page,
        pageSize,
        totalPage: Math.ceil(total / pageSize),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
      error: error.message,
    });
  }
};

export const getProductFilters = async (req, res) => {
  try {
    const [categories, brands, products] = await Promise.all([
      Category.find().select("name slug parent level"),
      Brand.find().select("name slug"),
      Product.find().select("price tags"),
    ]);

    const priceStats = await Product.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]);

    const minPrice = priceStats[0]?.minPrice || 0;
    const maxPrice = priceStats[0]?.maxPrice || 0;
    const gap = (maxPrice - minPrice) / 5;

    const priceRanges = [
      { min: minPrice, max: minPrice + gap },
      { min: minPrice + gap, max: minPrice + gap * 2 },
      { min: minPrice + gap * 2, max: minPrice + gap * 3 },
      { min: minPrice + gap * 3, max: minPrice + gap * 4 },
      { min: minPrice + gap * 4, max: maxPrice },
    ];

    return res.status(200).json({
      success: true,
      data: {
        categories,
        brands,
        priceRanges: priceRanges.map((range) => ({
          min: Math.round(range.min),
          max: Math.round(range.max),
        })),
        tags: ["HOT", "NEW"],
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getListFromBrand = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 12;
    const { slug } = req.params;
    const { priceRange, categories, tags, sortOrder = "asc" } = req.query;

    // Find brand
    const brand = await Brand.findOne({ slug });
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Thương hiệu không tồn tại",
        data: [],
      });
    }

    const matchStage = {
      brandId: brand._id,
      isDeleted: false,
    };

    if (categories) {
      const categoryIds = categories
        .split(",")
        .map((id) => new mongoose.Types.ObjectId(`${id}`));
      matchStage.categories = { $in: categoryIds };
    }

    if (tags) {
      matchStage.tags = { $in: tags.split(",") };
    }

    const aggregationPipeline = [
      { $match: matchStage },

      {
        ...calulateFinalPricePipeline,
      },

      {
        $addFields: {
          finalPrice: { $round: ["$finalPrice", 0] },
        },
      },

      // Price filter
      ...(priceRange
        ? [
            {
              $match: {
                finalPrice: {
                  $gte: Number(priceRange.split("-")[0]),
                  $lte: Number(priceRange.split("-")[1]),
                },
              },
            },
          ]
        : []),

      // Get brand & category info
      ...brandAndCategoryInfo,

      // Project fields
      {
        ...projectFileds,
      },

      { $sort: { finalPrice: sortOrder === "asc" ? 1 : -1 } },

      // Pagination
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
        },
      },
    ];

    const [result] = await Product.aggregate(aggregationPipeline);

    return res.status(200).json({
      success: true,
      data: {
        brand: brand.name,
        products: result.data.map((p) => ({
          ...p,
          finalPrice: calculateFinalPrice(p),
        })),
        pagination: {
          page,
          totalPage: Math.ceil((result.metadata[0]?.total || 0) / pageSize),
          totalItems: result.metadata[0]?.total || 0,
          pageSize,
        },
      },
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

export const getProductSearch = async (req, res) => {
  try {
    const { search } = req.query;
    const currentDate = new Date();

    const aggregationPipeline = [
      {
        $match: {
          name: { $regex: search, $options: "i" },
          isDeleted: false,
        },
      },
      // Promotion stages
      getPromotionLookupStage(currentDate),
      getPromotionFieldsStage(),

      ...brandAndCategoryInfo,

      // Final project
      {
        $project: {
          ...getPromotionProjectStage().$project,
          ...getCategoryProjectStage(),
          brand: {
            _id: "$brandInfo._id",
            name: "$brandInfo.name",
            slug: "$brandInfo.slug",
          },
          totalReviews: 1,
          averageRating: 1,
          ratingDistribution: 1,
        },
      },
    ];

    const products = await Product.aggregate(aggregationPipeline);

    return res.status(200).json({
      success: true,
      data:
        products && products.length > 0
          ? products.map((p) => ({
              ...p,
              finalPrice: calculateFinalPrice(p),
            }))
          : [],
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

export const getListFromCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 12;
    const { slug } = req.params;
    const { priceRange, tags, sortOrder = "asc" } = req.query;

    // 1. Tìm category theo slug
    const category = await Category.findOne({ slug });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Danh mục không tồn tại",
        data: [],
      });
    }

    // 2. Điều kiện lọc sản phẩm
    const matchStage = {
      categories: { $in: [category._id] },
      isDeleted: false,
    };

    if (tags) {
      matchStage.tags = { $in: tags.split(",") };
    }

    const aggregationPipeline = [
      { $match: matchStage },

      { ...calulateFinalPricePipeline },

      {
        $addFields: {
          finalPrice: { $round: ["$finalPrice", 0] },
        },
      },

      ...(priceRange
        ? [
            {
              $match: {
                finalPrice: {
                  $gte: Number(priceRange.split("-")[0]),
                  $lte: Number(priceRange.split("-")[1]),
                },
              },
            },
          ]
        : []),

      ...brandAndCategoryInfo,

      { ...projectFileds },

      { $sort: { finalPrice: sortOrder === "asc" ? 1 : -1 } },

      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
        },
      },
    ];

    const [result] = await Product.aggregate(aggregationPipeline);

    return res.status(200).json({
      success: true,
      data: {
        category: category.name,
        products: result.data.map((p) => ({
          ...p,
          finalPrice: calculateFinalPrice(p),
        })),
        pagination: {
          page,
          totalPage: Math.ceil((result.metadata[0]?.total || 0) / pageSize),
          totalItems: result.metadata[0]?.total || 0,
          pageSize,
        },
      },
    });
  } catch (error) {
    console.error("getListFromCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      data: [],
      error: error.message,
    });
  }
};

export const getProductPromotion = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 12;
    const {
      priceRange,
      brands,
      rating,
      categories,
      tags,
      sortOrder = "asc",
    } = req.query;

    const currentDate = new Date();

    // Build match stage
    let matchStage = {
      isDeleted: false,
    };

    if (categories) {
      const categoryIds = categories
        .split(",")
        .map((id) => new mongoose.Types.ObjectId(id));
      matchStage.categories = { $in: categoryIds };
    }

    if (brands) {
      const brandIds = brands
        .split(",")
        .map((id) => new mongoose.Types.ObjectId(id));
      matchStage.brandId = { $in: brandIds };
    }

    if (tags) {
      matchStage.tags = { $in: tags.split(",") };
    }

    const aggregationPipeline = [
      // Lookup promotions
      getPromotionLookupStage(currentDate),
      getPromotionFieldsStage(),

      // Only get products with active promotions
      { $match: { isPromotion: true } },

      // Add other match conditions
      { $match: matchStage },

      {
        ...calulateFinalPricePipeline,
      },

      {
        $addFields: {
          finalPrice: { $round: ["$finalPrice", 0] },
        },
      },

      // Price filter
      ...(priceRange
        ? [
            {
              $match: {
                finalPrice: {
                  $gte: Number(priceRange.split("-")[0]),
                  $lte: Number(priceRange.split("-")[1]),
                },
              },
            },
          ]
        : []),

      // Rating filter
      ...(rating
        ? [
            {
              $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "productId",
                as: "reviews",
              },
            },
            {
              $match: {
                "reviews.rate": Number(rating),
              },
            },
          ]
        : []),

      // Get review stats
      getReviewLookupStagePro(),
      getReviewFieldsStagePro(),

      // Get brand & category info
      ...brandAndCategoryInfo,

      // Project fields
      {
        ...projectFileds,
      },

      // Sort
      {
        $sort: {
          ...(sortOrder === "promotion"
            ? { "promotion.discountPercentage": -1 }
            : { finalPrice: sortOrder === "asc" ? 1 : -1 }),
          _id: 1,
        },
      },

      // Facet for pagination
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
        },
      },
    ];

    const [result] = await Product.aggregate(aggregationPipeline);

    const total = result.metadata[0]?.total || 0;
    const products = result.data;

    return res.status(200).json({
      success: true,
      data: {
        pagination: {
          page,
          pageSize,
          totalPage: Math.ceil(total / pageSize),
          totalItems: total,
        },
        products:
          products && products.length > 0
            ? products.map((p) => ({
                ...p,
                finalPrice: calculateFinalPrice(p),
              }))
            : [],
      },
    });
  } catch (error) {
    console.error("Get promotion products error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
      error: error.message,
    });
  }
};
