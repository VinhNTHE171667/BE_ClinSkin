import Order from "../models/order.js";
import Product from "../models/product.js";
import inventoryBatchService from "../services/inventoryBatch.service.js";
import { StatusCodes } from 'http-status-codes';


export const getBatchItemsByOrderId = async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "không tìm thấy đơn hàng",
            });
        }
        const batchList = await Promise.all(
            order.items.map(async (item) => ({
                product: await Product.findById(item.pid, 'name mainImage currentStock').populate('brandId').populate('categories', 'name'),
                totalQuantity: item.quantity,
                price: item.price,
                batchItems: await inventoryBatchService.getNearestExpiryBatch(item.pid, item.quantity),
            }))
        );
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Lấy danh sách lô hàng thành công",
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
