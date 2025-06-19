import Order from '../models/order.js';
import mongoose from 'mongoose';

export const getAllOrders = async (req, res) => {
  try {
    const {
      userId,
      status,
      paymentMethod,
      note,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      startDate
    } = req.query;

    const query = {};

    // 📌 Filter by userId (validate ObjectId)
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = userId;
    }

    // 📌 Filter by status
    if (status) {
      query.status = status;
    }

    // 📌 Filter by paymentMethod
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // 🔍 Search by note (partial match)
    if (note) {
      query.note = { $regex: note, $options: 'i' }; // case-insensitive
    }

    // 🔢 Pagination
    const pageNumber = Math.max(parseInt(page), 1);
    const pageSize = Math.max(parseInt(limit), 1);

    // ⏫ Sorting
    const sortOption = {};
    const allowedSortFields = ['createdAt', 'totalAmount'];
    const allowedOrder = ['asc', 'desc'];

    if (allowedSortFields.includes(sortBy) && allowedOrder.includes(order)) {
      sortOption[sortBy] = order === 'asc' ? 1 : -1;
    } else {
      sortOption.createdAt = -1;
    }

    if (startDate) {
  query.createdAt = {
    $gte: new Date(startDate)
  };
}

    // 📦 Query with filter, sort, paginate
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('userId', 'name email')
        .populate('items.pid', 'name price mainImage')
        .sort(sortOption)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize),
      pageSize,
      orders
    });

  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn hàng', detail: err.message });
  }
};

// GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID đơn hàng không hợp lệ' });
    }

    const order = await Order.findById(id)
      .populate('userId', 'name email')
      .populate('items.pid', 'name price');

    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    res.status(200).json(order);

  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết đơn hàng', detail: err.message });
  }
};
