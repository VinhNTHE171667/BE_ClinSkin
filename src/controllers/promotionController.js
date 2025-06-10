import Promotion from '../models/promotion.js';

export const getAllPromotions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { isActive, fromDate, toDate } = req.query;

    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (fromDate || toDate) {
      filter.startDate = {};
      if (fromDate) {
        filter.startDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.startDate.$lte = new Date(toDate);
      }
    }

    if (fromDate || toDate) {
      filter.endDate = {};
      if (fromDate) {
        filter.endDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.endDate.$lte = new Date(toDate);
      }
    }


    const total = await Promotion.countDocuments(filter);
    const promotions = await Promotion.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ startDate: -1 }); // Sắp xếp mới nhất trước

    res.status(200).json({
      data: promotions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khuyến mãi', error });
  }
};


export const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await Promotion.findById(id);
    if (!promotion) return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
    res.status(200).json(promotion);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy khuyến mãi', error });
  }
};


export const createPromotion = async (req, res) => {
  try {
    const newPromotion = new Promotion(req.body);
    const saved = await newPromotion.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi tạo khuyến mãi', error });
  }
};


export const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Promotion.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy khuyến mãi để cập nhật' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi cập nhật khuyến mãi', error });
  }
};


export const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Promotion.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy khuyến mãi để xóa' });
    res.status(200).json({ message: 'Đã xóa khuyến mãi thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa khuyến mãi', error });
  }
};
