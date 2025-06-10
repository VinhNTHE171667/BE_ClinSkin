import Brand from "../models/brand.model.js";

export const getAllBrand = async (req, res) => {
    try {
        const brands = await Brand.find();
        res.status(200).json(brands);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching brands', error });
    }
};