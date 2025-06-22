import Order from "../models/order.js";
import Product from "../models/product.js";
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
        const batchList = await Promise.all(
            order.items.map(async (item) => {
                const product = await Product.findById(item.pid, 'name mainImage currentStock').populate('brandId').populate('categories', 'name');
                const batchItems = await inventoryBatchService.getNearestExpiryBatch(item.pid, item.quantity);
                return {
                    product,
                    totalQuantity: item.quantity,
                    price: item.price,
                    batchItems,
                }
            })
        );
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Lấy danh sách lô hàng thành công",
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
            data: batchList,
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
    
}