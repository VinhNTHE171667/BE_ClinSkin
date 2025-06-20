import { getCategoryProjectStage } from "../helpers/category.helper.js";
import { calculateFinalPrice, getPromotionProjectStage } from "../helpers/promotion.helper.js";
import Product from "../models/product.js";

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
            as: "brandInfo",
        },
    },
    { $unwind: "$brandInfo" },
    {
        $lookup: {
            from: "categories",
            localField: "categories",
            foreignField: "_id",
            as: "categories",
        },
    },
];

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