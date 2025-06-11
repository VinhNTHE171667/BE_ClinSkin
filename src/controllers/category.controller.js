import { buildCategoryTree } from "../helpers/category.helper.js";
import Category from "../models/category.model.js";


export const getAllCategory = async (req, res) => {
    try {
        const { page, pageSize, name } = req.query;
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(pageSize) || 10;
        const skip = (pageNumber - 1) * limitNumber;
        const filter = name ? { name: { $regex: name, $options: "i" } } : {};

        if (!page && !pageSize && !name) {
            const categories = await Category.find().sort({ level: 1 }).lean().exec();
            const categoryTree = buildCategoryTree(categories);
            return res.status(200).json({
                success: true,
                data: categoryTree,
            });
        } else {
            const [categories, total] = await Promise.all([
                Category.find(filter)
                    .sort({ level: 1, name: 1 })
                    .skip(skip)
                    .limit(limitNumber)
                    .lean()
                    .exec(),
                Category.countDocuments(filter),
            ]);

            let response = {
                success: true,
                data: categories,
                pagination: {
                    page: pageNumber,
                    totalPage: Math.ceil(total / limitNumber),
                    totalItems: total,
                    pageSize: limitNumber,
                },
            };

            return res.status(200).json(response);
        }
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

export const createCategory = async (req, res) => {
    try {
        const { name, parent } = req.body;

        // Check if category already exists
        const existingCategory = await Category.findOne({ name }).lean();
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Danh mục đã tồn tại",
            });
        }

        let level = 0;
        let parentCategory = null;

        // If parent is provided, find it and set the level
        if (parent) {
            parentCategory = await Category.findById(parent);
            if (!parentCategory) {
                return res.status(400).json({
                    success: false,
                    message: "Danh mục cha không tồn tại",
                });
            }
            level = parentCategory.level + 1;
        }

        // Create new category
        const newCategory = new Category({
            name,
            parent: parent || null,
            level,
        });

        const savedCategory = await newCategory.save({ validateBeforeSave: false });

        return res.status(201).json({
            success: true,
            message: "Tạo mới danh mục thành công",
            data: savedCategory,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi tạo danh mục",
            error: error.message,
        });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { deleteChildren } = req.query;

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy danh mục cần xóa",
            });
        }

        // Check if the category has children
        const childrenCount = await Category.countDocuments({ parent: id });

        if (childrenCount > 0 && deleteChildren !== "true") {
            return res.status(400).json({
                success: false,
                message: "Danh mục này có danh mục con. Vui lòng xác nhận xóa tất",
            });
        }

        if (deleteChildren === "true") {
            // Delete all descendants recursively
            await deleteDescendants(id);
        } else {
            // Move children to parent category
            await Category.updateMany(
                { parent: id },
                { $set: { parent: category.parent, level: category.level } }
            );
        }

        // Delete the category
        await Category.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Xóa danh mục thành công",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi xóa danh mục",
            error: error.message,
        });
    }
};