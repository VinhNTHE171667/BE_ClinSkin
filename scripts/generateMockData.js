import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import User from '../src/models/user.model.js';
import Admin from '../src/models/admin.model.js';
import Product from '../src/models/product.js';
import Brand from '../src/models/brand.model.js';
import InventoryBatch from '../src/models/inventoryBatch.model.js';
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


const generateMockData = async () => {
    console.log('Bắt đầu tạo mock data...\n');
    try {
        await connectDatabase();
        const staffCount = 5;
        const userCount = 20;
        //await generateStaffAccounts(staffCount);
        //await generateUserAccounts(userCount);
        await generateInventoryBatches();
        console.log('\nHoàn thành tạo mock data!');
    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
};

generateMockData();
