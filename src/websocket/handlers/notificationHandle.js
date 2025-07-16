import { createNotiByOrder } from "../../services/notification.service.js";

export const handleNotificationEvents = (io, socket) => {
    socket.on("createOrder", async (data) => {
        const { recipient, model, order } = JSON.parse(data);
        const noti = await createNotiByOrder({ recipient, model, order });
        socket.emit("resNewNotiFromStore", noti);
    });
};
