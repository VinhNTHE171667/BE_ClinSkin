import Product from "../models/product.js";


export const searchProductByName =  async (req, res) => {
 try {
    const { name } = req.query;

    if (name) {
      // Tìm kiếm theo tên nếu có query name
      const products = await Product.find({
        name: { $regex: name, $options: 'i' }
      })
        .select('_id name')
        .limit(10);
      return res.json(products);
    }

    // Lấy tất cả sản phẩm nếu không có query name
    const products = await Product.find()
      .select('_id name')
      .limit(100); // Giới hạn 100 để tránh tải quá nhiều
    res.json(products);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách sản phẩm' });
  }
};