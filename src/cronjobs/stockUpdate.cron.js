import cron from 'node-cron';
import { updateAllProductsStock } from '../services/stockUpdate.service.js';

export const initCronJobs = () => {
  // Chạy mỗi ngày lúc 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Cronjob: updating currentStock - ', new Date().toLocaleString('vi-VN'));
    
    try {
      await updateAllProductsStock();
      console.log('Cronjob: currentStock updated successfully - ', new Date().toLocaleString('vi-VN'));
    } catch (error) {
      console.error('Cronjob: Error updating currentStock - ', new Date().toLocaleString('vi-VN'), error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
  });

  console.log('Cronjobs is running:');
};

export const runStockUpdateNow = async () => {
  console.log('Running stock update immediately...');
  try {
    await updateAllProductsStock();
    console.log('Stock update completed successfully.');
  } catch (error) {
    console.error('Error running stock update immediately:', error);
  }
};
