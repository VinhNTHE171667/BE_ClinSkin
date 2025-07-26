import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import User from '../src/models/user.model.js';
import Admin from '../src/models/admin.model.js';
import Product from '../src/models/product.js';
import Brand from '../src/models/brand.model.js';
import InventoryBatch from '../src/models/inventoryBatch.model.js';
import Order from '../src/models/order.js';
import ProductSalesHistory from '../src/models/ProductSalesHistory.model.js';
import Review from '../src/models/review.js';
import Counter from '../src/models/counter.model.js';
import connectDatabase from '../src/configs/database.js';

dotenv.config();

// Hàm lấy tất cả products chưa bị xóa
const getActiveProducts = async () => {
    try {
        const products = await Product.find({ isDeleted: false }).populate('brandId');
        console.log(`Tìm thấy ${products.length} sản phẩm chưa bị xóa`);
        return products;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', error);
        return [];
    }
};

// Hàm tạo mock data cho inventory batch
const generateInventoryBatches = async () => {
    console.log('Đang tạo mock data cho inventory batches...');
    
    // Lấy tất cả products chưa bị xóa
    const products = await getActiveProducts();
    
    if (products.length === 0) {
        console.log('Không có sản phẩm nào để tạo inventory batch');
        return [];
    }

    // Lấy danh sách admin để làm importer
    const admins = await Admin.find({});
    if (admins.length === 0) {
        console.log('Không có admin nào để làm importer');
        return [];
    }

    const inventoryBatches = [];
    
    for (const product of products) {
        console.log(`Tạo 5 lô hàng cho sản phẩm: ${product.name}`);
        
        // Tạo 5 lô hàng cho mỗi sản phẩm
        for (let i = 0; i < 5; i++) {
            // Ngày nhập từ 1-12 tháng trước
            const receivedDate = faker.date.past({ years: 1 });
            
            // Ngày hết hạn từ 6 tháng đến 3 năm sau ngày nhập
            const expiryDate = new Date(receivedDate);
            expiryDate.setMonth(expiryDate.getMonth() + faker.number.int({ min: 6, max: 36 }));
            
            // Số lượng ban đầu
            const quantity = faker.number.int({ min: 50, max: 500 });
            
            // Số lượng còn lại (từ 0% đến 100% số lượng ban đầu)
            const remainingQuantity = faker.number.int({ min: 0, max: quantity });
            
            // Giá nhập (từ 50% đến 90% giá bán)
            const costPrice = Math.floor(product.price * faker.number.float({ min: 0.5, max: 0.9 }));
            
            // Tạo batch number unique sử dụng Counter model
            const batchNumber = await Counter.generateCompactId('BATCH');
            
            // Chọn ngẫu nhiên một admin làm importer
            const randomImporter = admins[Math.floor(Math.random() * admins.length)];
            
            const batchData = {
                batchNumber: batchNumber,
                importer: randomImporter._id,
                productId: product._id,
                quantity: quantity,
                costPrice: costPrice,
                remainingQuantity: remainingQuantity,
                expiryDate: expiryDate,
                receivedDate: receivedDate
            };
            
            inventoryBatches.push(batchData);
        }
    }
    
    try {
        const createdBatches = await InventoryBatch.insertMany(inventoryBatches);
        console.log(`Tạo thành công ${createdBatches.length} inventory batches`);
        return createdBatches;
    } catch (error) {
        console.error('Lỗi tạo inventory batches:', error);
        return [];
    }
};

const generateStaffAccounts = async (count = 5) => {
    console.log(`Đang tạo ${count} tài khoản Staff...`);
    const staffAccounts = [];
    for (let i = 0; i < count; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;
        
        const staffData = {
            name: fullName,
            username: `staff_${faker.internet.userName().toLowerCase()}_${i + 1}`,
            password: '1234', 
            role: 'STAFF',
            avatar: {
                url: `https://avatar.iran.liara.run/username?username=${firstName}+${lastName}`,
                publicId: ''
            },
            isActive: true
        };
        
        staffAccounts.push(staffData);
    }
    try {
        const createdStaff = await Admin.insertMany(staffAccounts);
        return createdStaff;
    } catch (error) {
        console.error('Lỗi tạo tài khoản Staff:', error);
        return [];
    }
};

const generateUserAccounts = async (count = 20) => {
    console.log(`Đang tạo ${count} tài khoản User...`);
    
    const userAccounts = [];
    for (let i = 0; i < count; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;
        const phoneNumber = '0' + faker.string.numeric(9);
        const userData = {
            name: fullName,
            email: faker.internet.email().toLowerCase(),
            password: '1234',
            avatar: {
                url: `https://avatar.iran.liara.run/username?username=${firstName}+${lastName}`,
                publicId: ''
            },
            phone: phoneNumber,
            address: {
                province: faker.location.state(),
                district: faker.location.city(),
                ward: faker.location.streetAddress(),
                detail: faker.location.streetAddress({ useFullAddress: true })
            },
            isActive: faker.datatype.boolean(0.9) 
        };
        userAccounts.push(userData);
    }
    
    try {
        const createdUsers = await User.insertMany(userAccounts);
        return createdUsers;
    } catch (error) {
        console.error(error);
        return [];
    }
};

// Hàm tạo mock data cho order với trạng thái delivered_confirmed
const generateOrders = async (count = 50) => {
    console.log(`Đang tạo ${count} đơn hàng...`);
    
    // Lấy danh sách users và products
    const users = await User.find({ isActive: true });
    const products = await Product.find({ isDeleted: false });
    
    if (users.length === 0) {
        console.log('Không có user nào để tạo order');
        return [];
    }
    
    if (products.length === 0) {
        console.log('Không có product nào để tạo order');
        return [];
    }
    
    const orders = [];
    
    for (let i = 0; i < count; i++) {
        // Chọn ngẫu nhiên user
        const randomUser = users[Math.floor(Math.random() * users.length)];
        
        // Chọn ngẫu nhiên 1-3 sản phẩm
        const numProducts = faker.number.int({ min: 1, max: 3 });
        const selectedProducts = faker.helpers.arrayElements(products, numProducts);
        
        const orderProducts = [];
        let totalAmount = 0;
        
        for (const product of selectedProducts) {
            const quantity = faker.number.int({ min: 1, max: 5 });
            const price = product.price;
            
            orderProducts.push({
                pid: product._id,
                name: product.name,
                image: product.images[0]?.url || '',
                quantity: quantity,
                price: price,
                isReviewed: faker.datatype.boolean(0.7) // 70% đã review
            });
            
            totalAmount += price * quantity;
        }
        
        // Tạo địa chỉ ngẫu nhiên
        const provinces = [
            { id: 79, name: 'Thành phố Hồ Chí Minh' },
            { id: 1, name: 'Thành phố Hà Nội' },
            { id: 48, name: 'Thành phố Đà Nẵng' },
            { id: 31, name: 'Tỉnh Hải Phòng' },
            { id: 92, name: 'Tỉnh Cần Thơ' }
        ];
        
        const districts = [
            { id: 1, name: 'Quận 1' },
            { id: 2, name: 'Quận 2' },
            { id: 3, name: 'Quận 3' },
            { id: 4, name: 'Quận 4' },
            { id: 5, name: 'Quận 5' }
        ];
        
        const wards = [
            { id: 1, name: 'Phường 1' },
            { id: 2, name: 'Phường 2' },
            { id: 3, name: 'Phường 3' },
            { id: 4, name: 'Phường 4' },
            { id: 5, name: 'Phường 5' }
        ];
        
        const randomProvince = faker.helpers.arrayElement(provinces);
        const randomDistrict = faker.helpers.arrayElement(districts);
        const randomWard = faker.helpers.arrayElement(wards);
        
        // Tạo ngày order từ 1 năm trước đến hiện tại
        const orderDate = faker.date.past({ years: 1 });
        
        const orderData = {
            userId: randomUser._id,
            name: randomUser.name,
            products: orderProducts,
            address: {
                province: randomProvince,
                district: randomDistrict,
                ward: randomWard
            },
            addressDetail: faker.location.streetAddress(),
            phone: randomUser.phone || '0' + faker.string.numeric(9),
            totalAmount: totalAmount,
            status: 'delivered_confirmed',
            note: faker.helpers.arrayElement(['KHÔNG CÓ', 'Giao hàng nhanh', 'Gọi trước khi giao', 'Để ở bảo vệ']),
            paymentMethod: faker.helpers.arrayElement(['cod', 'paypal', 'stripe']),
            cancelReason: '',
            stripeSessionId: '',
            codeShip: 'SHIP' + faker.string.numeric(8),
            ship: faker.helpers.arrayElement(['normal', 'express']),
            statusHistory: [
                {
                    type: 'normal',
                    note: 'Đơn hàng được tạo',
                    prevStatus: '',
                    status: 'pending',
                    updatedBy: randomUser._id,
                    updatedByModel: 'User',
                    date: orderDate
                },
                {
                    type: 'normal',
                    note: 'Đơn hàng đã được xác nhận',
                    prevStatus: 'pending',
                    status: 'confirmed',
                    updatedBy: randomUser._id,
                    updatedByModel: 'User',
                    date: new Date(orderDate.getTime() + 1 * 60 * 60 * 1000) // +1 giờ
                },
                {
                    type: 'shipping',
                    note: 'Đơn hàng đã được giao thành công',
                    prevStatus: 'in_transit',
                    status: 'delivered_confirmed',
                    updatedBy: randomUser._id,
                    updatedByModel: 'User',
                    date: new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000) // +3 ngày
                }
            ],
            createdAt: orderDate,
            updatedAt: new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000)
        };
        
        orders.push(orderData);
    }
    
    try {
        const createdOrders = await Order.insertMany(orders);
        console.log(`Tạo thành công ${createdOrders.length} orders`);
        
        // Tạo ProductSalesHistory cho mỗi order
        await generateProductSalesHistory(createdOrders);
        
        // Tạo Reviews cho các sản phẩm đã được đánh dấu isReviewed = true
        await generateReviews(createdOrders);
        
        return createdOrders;
    } catch (error) {
        console.error('Lỗi tạo orders:', error);
        return [];
    }
};

// Hàm tạo ProductSalesHistory cho orders
const generateProductSalesHistory = async (orders) => {
    console.log('Đang tạo ProductSalesHistory...');
    
    const salesHistories = [];
    
    for (const order of orders) {
        for (const product of order.products) {
            // Lấy thông tin inventory batches cho sản phẩm này
            const batches = await InventoryBatch.find({ 
                productId: product.pid,
                remainingQuantity: { $gt: 0 }
            }).sort({ receivedDate: 1 }); // FIFO
            
            let remainingQuantity = product.quantity;
            const costDetails = [];
            let totalCost = 0;
            
            // Phân bổ số lượng từ các batch (FIFO)
            for (const batch of batches) {
                if (remainingQuantity <= 0) break;
                
                const quantityTaken = Math.min(remainingQuantity, batch.remainingQuantity);
                const costForThisBatch = quantityTaken * batch.costPrice;
                
                costDetails.push({
                    batchNumber: batch.batchNumber,
                    quantityTaken: quantityTaken,
                    costPrice: batch.costPrice
                });
                
                totalCost += costForThisBatch;
                remainingQuantity -= quantityTaken;
            }
            
            // Nếu không đủ batch, tạo cost details giả
            if (remainingQuantity > 0) {
                const estimatedCostPrice = Math.floor(product.price * 0.7); // 70% giá bán
                costDetails.push({
                    batchNumber: 'BATCH' + faker.string.numeric(6),
                    quantityTaken: remainingQuantity,
                    costPrice: estimatedCostPrice
                });
                totalCost += remainingQuantity * estimatedCostPrice;
            }
            
            const totalRevenue = product.quantity * product.price;
            
            const salesHistoryData = {
                orderId: order._id,
                productId: product.pid,
                saleDate: order.createdAt,
                quantity: product.quantity,
                salePrice: product.price,
                costDetails: costDetails,
                totalCost: totalCost,
                totalRevenue: totalRevenue,
                isCompleted: true, // Đặt thành true như yêu cầu
                createdAt: order.createdAt,
                updatedAt: order.updatedAt
            };
            
            salesHistories.push(salesHistoryData);
        }
    }
    
    try {
        const createdSalesHistories = await ProductSalesHistory.insertMany(salesHistories);
        console.log(`Tạo thành công ${createdSalesHistories.length} ProductSalesHistory records`);
        return createdSalesHistories;
    } catch (error) {
        console.error('Lỗi tạo ProductSalesHistory:', error);
        return [];
    }
};

// Hàm tạo Reviews cho các sản phẩm đã được review
const generateReviews = async (orders) => {
    console.log('Đang tạo Reviews...');
    
    const reviews = [];
    const admins = await Admin.find({ role: { $in: ['ADMIN', 'STAFF'] } });
    
    for (const order of orders) {
        for (const product of order.products) {
            // Chỉ tạo review cho những sản phẩm đã được đánh dấu isReviewed = true
            if (product.isReviewed) {
                const rate = faker.number.int({ min: 3, max: 5 }); // Đánh giá từ 3-5 sao
                
                // Tạo comments dựa trên rating
                const positiveComments = [
                    'Sản phẩm rất tốt, tôi rất hài lòng!',
                    'Chất lượng sản phẩm tuyệt vời, sẽ mua lại!',
                    'Giao hàng nhanh, sản phẩm đúng như mô tả',
                    'Rất đáng tiền, recommend cho mọi người',
                    'Sản phẩm chất lượng cao, packaging đẹp',
                    'Hiệu quả tốt, da mình cải thiện rõ rệt',
                    'Shop phục vụ tốt, sản phẩm chính hãng'
                ];
                
                const neutralComments = [
                    'Sản phẩm ổn, đúng như mô tả',
                    'Chất lượng tạm được, giá hợp lý',
                    'Sản phẩm bình thường, không có gì đặc biệt',
                    'Tạm ổn, sẽ thử thêm vài lần nữa'
                ];
                
                let comment;
                if (rate >= 4) {
                    comment = faker.helpers.arrayElement(positiveComments);
                } else {
                    comment = faker.helpers.arrayElement(neutralComments);
                }
                
                // Tạo ngày review sau ngày order 1-7 ngày
                const reviewDate = new Date(order.createdAt.getTime() + faker.number.int({ min: 1, max: 7 }) * 24 * 60 * 60 * 1000);
                
                // Có thể có hình ảnh review (30% có ảnh)
                const hasImages = faker.datatype.boolean(0.3);
                const images = hasImages ? [
                    {
                        url: `https://picsum.photos/400/300?random=${faker.number.int({ min: 1, max: 1000 })}`,
                        publicId: `review_${faker.string.alphanumeric(10)}`
                    }
                ] : [];
                
                // Có thể có reply từ admin (50% có reply)
                const hasReply = faker.datatype.boolean(0.5);
                let reply = '';
                let repliedBy = null;
                let repliedAt = null;
                
                if (hasReply && admins.length > 0) {
                    const replyTexts = [
                        'Cảm ơn bạn đã tin tưởng và sử dụng sản phẩm của chúng tôi!',
                        'Rất vui khi bạn hài lòng với sản phẩm. Chúc bạn có trải nghiệm tốt!',
                        'Cảm ơn feedback của bạn, chúng tôi sẽ tiếp tục cải thiện chất lượng!',
                        'Thank you for your review! Chúng tôi rất trân trọng ý kiến của bạn.',
                        'Cảm ơn bạn đã dành thời gian đánh giá sản phẩm!'
                    ];
                    
                    reply = faker.helpers.arrayElement(replyTexts);
                    repliedBy = faker.helpers.arrayElement(admins)._id;
                    repliedAt = new Date(reviewDate.getTime() + faker.number.int({ min: 1, max: 3 }) * 24 * 60 * 60 * 1000);
                }
                
                const reviewData = {
                    userId: order.userId,
                    productId: product.pid,
                    order: order._id,
                    rate: rate,
                    images: images,
                    comment: comment,
                    display: true,
                    reply: reply,
                    repliedBy: repliedBy,
                    repliedAt: repliedAt,
                    createdAt: reviewDate,
                    updatedAt: repliedAt || reviewDate
                };
                
                reviews.push(reviewData);
            }
        }
    }
    
    try {
        const createdReviews = await Review.insertMany(reviews);
        console.log(`Tạo thành công ${createdReviews.length} reviews`);
        return createdReviews;
    } catch (error) {
        console.error('Lỗi tạo reviews:', error);
        return [];
    }
};


const generateMockData = async () => {
    console.log('Bắt đầu tạo mock data...\n');
    try {
        console.log('Đang kết nối database...');
        await connectDatabase();
        console.log('Kết nối database thành công!');
        
        const staffCount = 5;
        const userCount = 20;
        const orderCount = 200; // Tăng lên 200 orders cho cả năm
        
        //await generateStaffAccounts(staffCount);
        await generateUserAccounts(userCount);
        await generateInventoryBatches();
        console.log('Bắt đầu tạo orders...');
        await generateOrders(orderCount);
        
        console.log('\nHoàn thành tạo mock data!');
    } catch (error) {
        console.error('Lỗi:', error);
    } finally {
        console.log('Đang đóng kết nối...');
        process.exit(0);
    }
};

generateMockData();
