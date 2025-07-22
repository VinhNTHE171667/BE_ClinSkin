import Notification from "../models/notification.model.js";

export const createNotiByOrder = async ({ recipient, model, order }) => {
  try {
    const payload = {
      title: "🛍️ Đơn hàng mới",
      content: `Đơn hàng OD${order._id} đã được đặt thành công, ClinSkin xin cảm ơn quý khách hàng ❤️`,
      type: "STORE",
      metadata: {
        link: `/order-detail/${order._id}`,
      },
    };
    const noti = await Notification.create({ recipient, model, ...payload });

    return noti;
  } catch (error) {
    console.log("Error create notification order: ", error);
    return null;
  }
};
