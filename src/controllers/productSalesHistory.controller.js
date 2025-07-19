import Order from "../models/order.js";
import Product from "../models/product.js";
import ProductSalesHistory from "../models/ProductSalesHistory.model.js";
import inventoryBatchService from "../services/inventoryBatch.service.js";
import { StatusCodes } from 'http-status-codes';


export const getBatchItemsByOrderId = async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await Order.findById(orderId).populate('userId', 'name email phone');
        if (!order) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "không tìm thấy đơn hàng",
            });
        }
        const batchList = [];
        const insufficientStockItems = [];
        
        for (const item of order.products) {
            const product = await Product.findById(item.pid, 'name mainImage currentStock').populate('brandId').populate('categories', 'name');
            const batchItems = await inventoryBatchService.getNearestExpiryBatch(item.pid, item.quantity);
            
            if (!batchItems.success) {
                insufficientStockItems.push({
                    product,
                    requiredQuantity: item.quantity,
                    availableQuantity: batchItems.total || 0,
                    shortageQuantity: item.quantity - (batchItems.total || 0),
                    price: item.price,
                    message: batchItems.message
                });
            } else {
                batchList.push({
                    product,
                    totalQuantity: item.quantity,
                    price: item.price,
                    batchItems,
                });
            }
        }
        
        // Kiểm tra xem có sản phẩm nào không đủ hàng không
        const hasInsufficientStock = insufficientStockItems.length > 0;
        
        return res.status(StatusCodes.OK).json({
            success: true,
            message: hasInsufficientStock ? 
                "Có sản phẩm không đủ hàng trong đơn hàng" : 
                "Lấy danh sách lô hàng thành công",
            hasInsufficientStock,
            order: {
                id: order._id,
                user: {
                    name: order.userId.name,
                    email: order.userId.email,
                    phone: order.userId.phone,
                },
                totalAmount: order.totalAmount,
                status: order.status,
                note: order.note,
                paymentMethod: order.paymentMethod,
                address: order.address,
            },
            data: {
                availableItems: batchList,
                insufficientStockItems: insufficientStockItems
            },
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách lô hàng:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
}

export const createSalesHistory = async (req, res) => {
    const { orderId, orderData, availableItems } = req.body;
    
    try {
        // Kiểm tra dữ liệu đầu vào
        if (!orderId || !orderData || !availableItems || !Array.isArray(availableItems)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Dữ liệu không hợp lệ. Cần có orderId, orderData và availableItems",
            });
        }

        // Kiểm tra xem đã tạo sales history cho đơn hàng này chưa
        const existingSalesHistory = await ProductSalesHistory.findOne({ orderId });
        if (existingSalesHistory) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Đã tạo lịch sử bán hàng cho đơn hàng này",
            });
        }

        const salesHistoryRecords = [];
        const processedProducts = [];

        // Xử lý từng sản phẩm từ dữ liệu availableItems
        for (const item of availableItems) {
            const { product, totalQuantity, price, batchItems } = item;
            
            if (!batchItems || !batchItems.items || !Array.isArray(batchItems.items)) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: `Dữ liệu batch không hợp lệ cho sản phẩm ${product.name}`,
                });
            }

            // Tính toán chi phí và doanh thu
            let totalCost = 0;
            let remainingQuantityToProcess = totalQuantity;
            const costDetails = [];

            // Xử lý từng batch
            for (const batch of batchItems.items) {
                if (remainingQuantityToProcess <= 0) break;

                const quantityToTake = Math.min(remainingQuantityToProcess, batch.remainingQuantity);
                const costForThisBatch = quantityToTake * batch.costPrice;
                
                totalCost += costForThisBatch;
                
                costDetails.push({
                    batchNumber: batch.batchNumber,
                    quantityTaken: quantityToTake,
                    costPrice: batch.costPrice,
                });

                // Cập nhật số lượng tồn kho trong batch (không cập nhật Product.currentStock)
                await inventoryBatchService.deductQuantityFromBatchOnly(batch.batchNumber, quantityToTake);
                
                remainingQuantityToProcess -= quantityToTake;
            }

            const totalRevenue = totalQuantity * price;

            // Tạo record ProductSalesHistory
            const salesHistoryRecord = {
                orderId: orderId,
                productId: product._id,
                saleDate: new Date(),
                quantity: totalQuantity,
                salePrice: price,
                costDetails: costDetails,
                totalCost: totalCost,
                totalRevenue: totalRevenue,
                isCompleted: false,
            };

            salesHistoryRecords.push(salesHistoryRecord);
            processedProducts.push({
                productId: product._id,
                productName: product.name,
                quantity: totalQuantity,
                revenue: totalRevenue,
                cost: totalCost,
                profit: totalRevenue - totalCost,
            });
        }

        // Lưu tất cả records vào database
        const createdRecords = await ProductSalesHistory.insertMany(salesHistoryRecords);

        // Cập nhật trạng thái đơn hàng thành "shipping"
        await Order.findByIdAndUpdate(orderId, {
            status: "shipping"
        });

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Tạo lịch sử bán hàng thành công",
            data: {
                orderId: orderId,
                orderInfo: {
                    id: orderData.id,
                    user: orderData.user,
                    totalAmount: orderData.totalAmount,
                    status: orderData.status,
                },
                totalRecords: createdRecords.length,
                processedProducts: processedProducts,
                salesHistoryIds: createdRecords.map(record => record._id),
            },
        });

    } catch (error) {
        console.error("Lỗi khi tạo lịch sử bán hàng:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
}