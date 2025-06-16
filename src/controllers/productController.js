import Product from "../models/product.js";

export const searchProductByName = async (req, res) => {
  try {
    const { name, page = 1, limit = 20, sort = 'name' } = req.query;

    // Validate query parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ message: 'Invalid page or limit parameter' });
    }

    // Build query
    const query = name ? { name: { $regex: name, $options: 'i' } } : {};
    const sortOption = sort === 'name' ? { name: 1 } : {};

    // Fetch products with pagination
    const products = await Product.find(query)
      .select('_id name')
      .sort(sortOption)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Get total count for pagination metadata
    const total = await Product.countDocuments(query);

    res.json({
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách sản phẩm' });
  }
};