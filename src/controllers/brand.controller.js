import Brand from "../models/brand.model.js";

export const getAllBrand = async (req, res) => {
    try {
        const brands = await Brand.find();
        res.status(200).json({
            success: true,
            message: "Lấy danh sách thương hiệu thành công",
            data: brands
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching brands',
            error
        });
    }
};