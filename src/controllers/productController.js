import Product from "../models/product.js";
import { uploadImage, deleteImage } from "../ultis/cloudinary.js";

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

// Lấy danh sách sản phẩm có phân trang và lọc
export const getProducts = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, name = "", category, brandId, minPrice, maxPrice } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    // Xây dựng query filter
    const filter = {};
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (category) filter.categories = category;
    if (brandId) filter.brandId = brandId;
    
    // Filter theo giá
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Thực hiện query
    const products = await Product.find(filter)
      .populate('categories', 'name')
      .populate('brandId', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const totalItems = await Product.countDocuments(filter);
    const totalPage = Math.ceil(totalItems / limit);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        totalPage,
        totalItems,
        pageSize: limit,
        hasMore: skip + limit < totalItems
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi lấy danh sách sản phẩm' 
    });
  }
};

// Lấy chi tiết một sản phẩm
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('categories', 'name slug')
      .populate('brandId', 'name slug');
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy sản phẩm' 
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi lấy chi tiết sản phẩm' 
    });
  }
};

// Tạo sản phẩm mới
export const createProduct = async (req, res) => {
  try {
    const { 
      name, price, currentStock = 0, categories, 
      brandId, mainImageBase64, additionalImagesBase64 = [], description, tags = []
    } = req.body;
    
    if (!name || !price || !brandId || !mainImageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc'
      });
    }

    // Upload hình ảnh chính lên Cloudinary
    let mainImage;
    try {
      mainImage = await uploadImage(mainImageBase64);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Không thể tải lên hình ảnh chính. Vui lòng kiểm tra định dạng hình ảnh.'
      });
    }
    
    // Upload hình ảnh bổ sung nếu có
    const images = [];
    if (additionalImagesBase64 && additionalImagesBase64.length > 0) {
      for (const base64 of additionalImagesBase64) {
        try {
          const uploadedImage = await uploadImage(base64);
          images.push(uploadedImage);
        } catch (error) {
          // Nếu có lỗi khi upload, xóa những hình đã upload để tránh rác
          for (const img of images) {
            await deleteImage(img.public_id);
          }
          await deleteImage(mainImage.public_id);
          
          return res.status(400).json({
            success: false,
            message: 'Không thể tải lên một số hình ảnh. Vui lòng kiểm tra định dạng.'
          });
        }
      }
    }
    
    // Tạo sản phẩm mới
    const newProduct = new Product({
      name,
      price,
      currentStock,
      categories,
      brandId,
      mainImage,
      images,
      description,
      tags
    });
    
    const savedProduct = await newProduct.save();
    
    res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: savedProduct
    });
  } catch (error) {
    console.error('Lỗi khi tạo sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo sản phẩm'
    });
  }
};

// Cập nhật sản phẩm
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, price, categories, brandId, 
      mainImageBase64, additionalImagesBase64, removeImageIds = [],
      description, tags
    } = req.body;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Xử lý hình ảnh chính nếu có thay đổi
    let mainImage = product.mainImage;
    if (mainImageBase64) {
      try {
        // Xóa hình ảnh cũ khỏi Cloudinary
        if (product.mainImage && product.mainImage.public_id) {
          await deleteImage(product.mainImage.public_id);
        }
        // Upload hình ảnh mới
        mainImage = await uploadImage(mainImageBase64);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Không thể tải lên hình ảnh chính mới. Vui lòng kiểm tra định dạng.'
        });
      }
    }
    
    // Xử lý hình ảnh bổ sung
    let images = [...product.images];
    
    // Xóa các hình ảnh đã chọn
    if (removeImageIds && removeImageIds.length > 0) {
      for (const public_id of removeImageIds) {
        await deleteImage(public_id);
      }
      images = images.filter(img => !removeImageIds.includes(img.public_id));
    }
    
    // Thêm hình ảnh mới nếu có
    if (additionalImagesBase64 && additionalImagesBase64.length > 0) {
      for (const base64 of additionalImagesBase64) {
        try {
          const uploadedImage = await uploadImage(base64);
          images.push(uploadedImage);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: 'Không thể tải lên một số hình ảnh bổ sung. Vui lòng kiểm tra định dạng.'
          });
        }
      }
    }
    
    // Cập nhật sản phẩm
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: name || product.name,
        price: price !== undefined ? price : product.price,
        categories: categories || product.categories,
        brandId: brandId || product.brandId,
        mainImage,
        images,
        description: description !== undefined ? description : product.description,
        tags: tags || product.tags
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật sản phẩm'
    });
  }
};

// Xóa mềm sản phẩm
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    if (product.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm đã bị xoá trước đó'
      });
    }

    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    res.json({
      success: true,
      message: 'Xoá sản phẩm thành công (xoá mềm)'
    });
  } catch (error) {
    console.error('Lỗi khi xoá sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xoá sản phẩm'
    });
  }
};

// Khôi phục sản phẩm đã xoá mềm
export const restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    if (!product.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm chưa bị xoá'
      });
    }

    product.isDeleted = false;
    product.deletedAt = null;
    await product.save();

    res.json({
      success: true,
      message: 'Khôi phục sản phẩm thành công'
    });
  } catch (error) {
    console.error('Lỗi khi khôi phục sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi khôi phục sản phẩm'
    });
  }
};
