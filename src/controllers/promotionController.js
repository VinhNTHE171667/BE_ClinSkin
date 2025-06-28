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
    const promotions = await Promotion.find(filter).populate({
      path: 'products.pid',
      select: 'name'
    })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sắp xếp mới nhất trước

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
    console.log(error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khuyến mãi', error });
  }
};


export const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await Promotion.findById(id).populate({
      path: 'products.pid',
      select: 'name'
    });
    if (!promotion) return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
    res.status(200).json(promotion);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy khuyến mãi', error });
  }
};

export const createPromotion = async (req, res) => {
  try {
    const { name, description, startDate, endDate, products } = req.body;

    const now = new Date();

    // Tìm tất cả khuyến mãi chưa hết hạn và đang hoạt động
    const activePromotions = await Promotion.find({
      endDate: { $gte: now },
      isActive: true
    });

    // Lấy danh sách pid từ body gửi lên
    const newProductIds = products.map(p => p.pid.toString());

    // Kiểm tra xung đột sản phẩm
    const conflictProductIds = [];

    for (const promo of activePromotions) {
      for (const p of promo.products) {
        if (newProductIds.includes(p.pid.toString())) {
          conflictProductIds.push(p.pid.toString());
        }
      }
    }

    if (conflictProductIds.length > 0) {
      return res.status(400).json({
        message: 'Một số sản phẩm đã có khuyến mãi đang hoạt động.',
        conflictProductIds
      });
    }

    // Nếu không có xung đột => tạo mới
    const newPromotion = new Promotion({
      name,
      description,
      startDate,
      endDate,
      isActive: true,
      products
    });

    const saved = await newPromotion.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Lỗi khi tạo khuyến mãi:', error);
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
