import { getCategoryProjectStage } from "../helpers/category.helper.js";
import { calculateFinalPrice, calulateFinalPricePipeline, getPromotionProjectStage } from "../helpers/promotion.helper.js";
import Product from "../models/product.js";
import Brand from "../models/brand.model.js";
import Category from "../models/category.model.js";
import mongoose from "mongoose";

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
                    },
                },
                { $limit: 10 },
            ]);

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

        const product = await Product.aggregate([
            {
                $match: {
                    slug,
                    isDeleted: false,
                },
            },

            ...brandAndCategoryInfo,
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

        const aggregationPipeline = [
            { $match: { isDeleted: false } },

            ...brandAndCategoryInfo,

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
        const [categories, brands, products] =
            await Promise.all([
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
        const {
            priceRange,
            categories,
            tags,
            sortOrder = "asc",
        } = req.query;

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