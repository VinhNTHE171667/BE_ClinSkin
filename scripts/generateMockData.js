import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import User from '../src/models/user.model.js';
import Admin from '../src/models/admin.model.js';
import connectDatabase from '../src/configs/database.js';

dotenv.config();

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
        await clearExistingData();
        const staffCount = 5;
        const userCount =  20;
        await generateStaffAccounts(staffCount);
        await generateUserAccounts(userCount);

        console.log('\noàn thành tạo mock data!');
    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
};

generateMockData();
