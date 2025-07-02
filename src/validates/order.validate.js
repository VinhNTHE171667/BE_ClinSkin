import { body } from "express-validator";

export const createOrderValidate = [
    body("products")
        .isArray({ min: 1 })
        .withMessage("Vui lòng thêm sản phẩm vào giỏ hàng"),
    
    body("name").notEmpty().withMessage("Vui lòng nhập họ tên người nhận"),
    
    body("phone")
        .notEmpty()
        .withMessage("Vui lòng nhập số điện thoại người nhận"),
    
    body("totalAmount")
        .isNumeric()
        .withMessage("Tổng tiền không hợp lệ")
        .notEmpty()
        .withMessage("Tổng tiền không được để trống"),
    
    // ✅ Validate address object
    body("address")
        .isObject()
        .withMessage("Thông tin địa chỉ không hợp lệ"),
    
    body("addressDetail")
        .notEmpty()
        .withMessage("Vui lòng cung cấp địa chỉ chi tiết"),
    
    body("paymentMethod")
        .notEmpty()
        .withMessage("Vui lòng chọn phương thức thanh toán")
        .isIn(["cod", "paypal", "stripe"])
        .withMessage("Phương thức thanh toán không hợp lệ"),
    
    body("note").optional().isString().withMessage("Ghi chú không hợp lệ"),
    
    // ✅ Validate address.province
    body("address.province.id")
        .isNumeric()
        .withMessage("ID tỉnh/thành phố phải là số"),
    
    body("address.province.name")
        .notEmpty()
        .withMessage("Tên tỉnh/thành phố không được để trống"),
    
    // ✅ Validate address.district  
    body("address.district.id")
        .isNumeric()
        .withMessage("ID quận/huyện phải là số"),
    
    body("address.district.name")
        .notEmpty()
        .withMessage("Tên quận/huyện không được để trống"),
    
    // ✅ Validate address.ward
    body("address.ward.id")
        .isNumeric()
        .withMessage("ID phường/xã phải là số"),
    
    body("address.ward.name")
        .notEmpty()
        .withMessage("Tên phường/xã không được để trống"),
    
    body().custom((value) => {
        // ✅ Validate address object structure
        if (!value.address || typeof value.address !== 'object') {
            throw new Error("Thông tin địa chỉ không hợp lệ");
        }
        
        if (!value.address.province || !value.address.district || !value.address.ward) {
            throw new Error(
                "Vui lòng cung cấp đầy đủ thông tin địa chỉ (tỉnh/thành phố, quận/huyện, phường/xã)"
            );
        }
        
        // ✅ Validate nested structure
        const { province, district, ward } = value.address;
        
        if (!province.id || !province.name) {
            throw new Error("Thông tin tỉnh/thành phố không đầy đủ");
        }
        
        if (!district.id || !district.name) {
            throw new Error("Thông tin quận/huyện không đầy đủ");
        }
        
        if (!ward.id || !ward.name) {
            throw new Error("Thông tin phường/xã không đầy đủ");
        }
        
        return true;
    }),
];