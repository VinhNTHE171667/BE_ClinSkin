# Order Status Workflow Documentation

## Luồng trạng thái đơn hàng mới

### 1. Các trạng thái và quyền cập nhật

#### Trạng thái đơn hàng:
- `pending` - Đang chờ xử lý
- `confirmed` - Đã xác nhận
- `picked_up` - Đã lấy hàng
- `in_transit` - Đang vận chuyển
- `carrier_confirmed` - Đơn vị vận chuyển đã xác nhận nhận hàng
- `failed_pickup` - Lấy hàng thất bại
- `delivery_pending` - Đang giao hàng
- `carrier_delivered` - Đơn vị vận chuyển đã giao hàng
- `delivery_failed` - Giao hàng thất bại
- `delivered_confirmed` - Khách hàng đã xác nhận nhận hàng
- `return` - Trả hàng
- `return_confirmed` - Đã xác nhận trả hàng
- `cancelled` - Đã hủy

### 2. Quyền cập nhật trạng thái

#### User (Khách hàng):
- Từ `pending` → `cancelled` (có thể hủy đơn khi đang chờ)
- Từ `carrier_delivered` → `delivered_confirmed` (xác nhận đã nhận hàng)
- Từ `carrier_delivered` → `delivery_failed` (báo cáo giao hàng thất bại)

#### Admin:
- Từ `pending` → `confirmed` hoặc `cancelled`
- Từ `confirmed` → `picked_up` hoặc `cancelled`
- Từ `picked_up` → `in_transit` hoặc `cancelled`
- Từ `return` → `return_confirmed`

#### Shipping Service (API bên thứ 3):
- Từ `in_transit` → `carrier_confirmed` hoặc `failed_pickup`
- Từ `carrier_confirmed` → `delivery_pending`
- Từ `delivery_pending` → `carrier_delivered` hoặc `delivery_failed`
- Từ `delivery_failed` → `return`

### 3. API Endpoints

#### Cho Admin:
- `PUT /api/v1/admin/orders/:id/status` - Cập nhật trạng thái bởi admin

#### Cho User:
- `PUT /api/v1/orders/:id/status` - Cập nhật trạng thái bởi user

#### Cho Shipping Service:
- `GET /api/v1/shipping/orders` - Lấy danh sách đơn hàng cần vận chuyển
- `GET /api/v1/shipping/orders/:id` - Lấy chi tiết đơn hàng
- `PUT /api/v1/shipping/orders/:id/status` - Cập nhật trạng thái bởi đơn vị vận chuyển

### 4. Ví dụ luồng hoàn chỉnh:

1. User đặt hàng → `pending`
2. Admin xác nhận → `confirmed`
3. Admin lấy hàng → `picked_up`
4. Admin giao cho vận chuyển → `in_transit`
5. Shipper xác nhận nhận hàng → `carrier_confirmed`
6. Shipper bắt đầu giao → `delivery_pending`
7. Shipper giao thành công → `carrier_delivered`
8. User xác nhận nhận hàng → `delivered_confirmed` (hoàn tất)

### 5. Xử lý lỗi:

- Nếu lấy hàng thất bại: `in_transit` → `failed_pickup`
- Nếu giao hàng thất bại: `delivery_pending` → `delivery_failed` → `return`
- Admin xác nhận trả hàng: `return` → `return_confirmed`

### 6. Hoàn trả hàng hóa:

- Khi hủy đơn ở trạng thái `pending`, `confirmed`, `picked_up`: Hoàn trả `currentStock`
- Khi hủy đơn ở trạng thái sau `in_transit`: Hoàn trả vào `inventory batch`
- Khi `failed_pickup`: Hoàn trả `currentStock`
