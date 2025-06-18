# Inventory Batch API Documentation

## Base URL

All endpoints are relative to `/api/admin/inventory-batches`.

## Authentication

All endpoints require authentication as an admin user.

## Endpoints

### 1. Create a new batch

Create a new inventory batch record.

- **Method**: POST
- **URL**: `/`
- **Validation**: Requires valid productId, importer, quantity, costPrice, and expiryDate

#### Request Body

```json
{
  "productId": "64f5c1e7890abcdef1234567",
  "importer": "64f5c1e7890abcdef1234568",
  "quantity": 100,
  "costPrice": 50000,
  "expiryDate": "2025-12-31T00:00:00.000Z",
  "receivedDate": "2023-09-15T00:00:00.000Z"
}
```

#### Success Response

- **Code**: 201 CREATED
- **Content**:

```json
{
  "success": true,
  "message": "Inventory batch created successfully",
  "data": {
    "_id": "64f5c1e7890abcdef1234569",
    "batchNumber": "BTH-20230915-001",
    "productId": "64f5c1e7890abcdef1234567",
    "importer": "64f5c1e7890abcdef1234568",
    "quantity": 100,
    "costPrice": 50000,
    "remainingQuantity": 100,
    "expiryDate": "2025-12-31T00:00:00.000Z",
    "receivedDate": "2023-09-15T00:00:00.000Z",
    "createdAt": "2023-09-15T08:30:00.000Z",
    "updatedAt": "2023-09-15T08:30:00.000Z"
  }
}
```

#### Error Response

- **Code**: 400 BAD REQUEST
- **Content**:

```json
{
  "success": false,
  "message": "Validation error: Ngày hết hạn phải sau ngày hiện tại"
}
```

### 2. Get all batches

Retrieve all inventory batches with pagination and filtering options.

- **Method**: GET
- **URL**: `/`

#### Query Parameters

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10)
- `batchNumber` (optional): Filter by batch number (partial match)
- `productId` (optional): Filter by product ID
- `importer` (optional): Filter by importer ID
- `sortBy` (optional): Field to sort by (default: createdAt)
- `sortOrder` (optional): Sort order ('asc' or 'desc', default: 'desc')

#### Example Request

```
GET /api/admin/inventory-batches?page=1&limit=10&productId=64f5c1e7890abcdef1234567
```

#### Success Response

- **Code**: 200 OK
- **Content**:

```json
{
  "success": true,
  "message": "Inventory batches retrieved successfully",
  "data": [
    {
      "_id": "64f5c1e7890abcdef1234569",
      "batchNumber": "BN-001",
      "productId": {
        "_id": "64f5c1e7890abcdef1234567",
        "name": "Retinol Serum",
        ...
      },
      "importer": {
        "_id": "64f5c1e7890abcdef1234568",
        "name": "Admin User"
      },
      "quantity": 100,
      "costPrice": 50000,
      "remainingQuantity": 95,
      "expiryDate": "2025-12-31T00:00:00.000Z",
      "receivedDate": "2023-09-15T00:00:00.000Z",
      "createdAt": "2023-09-15T08:30:00.000Z",
      "updatedAt": "2023-09-15T10:45:00.000Z"
    },
    // ... additional batches
  ],
  "pagination": {
    "totalItems": 25,
    "totalPages": 3,
    "currentPage": 1,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 3. Get batch by batch number

Retrieve a specific inventory batch by its batch number.

- **Method**: GET
- **URL**: `/:batchNumber`

#### URL Parameters

- `batchNumber`: The unique batch number identifier

#### Example Request

```
GET /api/admin/inventory-batches/BTH-20230915-001
```

#### Success Response

- **Code**: 200 OK
- **Content**:

```json
{
  "success": true,
  "message": "Inventory batch retrieved successfully",
  "data": {
    "_id": "64f5c1e7890abcdef1234569",
    "batchNumber": "BN-001",
    "productId": {
      "_id": "64f5c1e7890abcdef1234567",
      "name": "Retinol Serum",
      ...
    },
    "importer": {
      "_id": "64f5c1e7890abcdef1234568",
      "name": "Admin User"
    },
    "quantity": 100,
    "costPrice": 50000,
    "remainingQuantity": 95,
    "expiryDate": "2025-12-31T00:00:00.000Z",
    "receivedDate": "2023-09-15T00:00:00.000Z",
    "createdAt": "2023-09-15T08:30:00.000Z",
    "updatedAt": "2023-09-15T10:45:00.000Z"
  }
}
```

#### Error Response

- **Code**: 404 NOT FOUND
- **Content**:

```json
{
  "success": false,
  "message": "Inventory batch not found"
}
```

### 4. Get batches by product ID

Retrieve all inventory batches for a specific product.

- **Method**: GET
- **URL**: `/product/:productId`

#### URL Parameters

- `productId`: MongoDB ID of the product

#### Example Request

```
GET /api/admin/inventory-batches/product/64f5c1e7890abcdef1234567
```

#### Success Response

- **Code**: 200 OK
- **Content**:

```json
{
  "success": true,
  "message": "Product inventory batches retrieved successfully",
  "data": [
    {
      "_id": "64f5c1e7890abcdef1234569",
      "batchNumber": "BTH-20230915-001",
      "productId": "64f5c1e7890abcdef1234567",
      "importer": "64f5c1e7890abcdef1234568",
      "quantity": 100,
      "costPrice": 50000,
      "remainingQuantity": 95,
      "expiryDate": "2025-12-31T00:00:00.000Z",
      "receivedDate": "2023-09-15T00:00:00.000Z",
      "createdAt": "2023-09-15T08:30:00.000Z",
      "updatedAt": "2023-09-15T10:45:00.000Z"
    },
    {
      "_id": "64f5c1e7890abcdef1234570",
      "batchNumber": "BTH-20231001-002",
      "productId": "64f5c1e7890abcdef1234567",
      "importer": "64f5c1e7890abcdef1234568",
      "quantity": 150,
      "costPrice": 48000,
      "remainingQuantity": 150,
      "expiryDate": "2026-01-31T00:00:00.000Z",
      "receivedDate": "2023-10-01T00:00:00.000Z",
      "createdAt": "2023-10-01T09:15:00.000Z",
      "updatedAt": "2023-10-01T09:15:00.000Z"
    }
  ]
}
```

### 5. Update batch

Update the quantity and/or expiry date of a specific inventory batch.

- **Method**: PUT
- **URL**: `/:batchNumber`

#### URL Parameters

- `batchNumber`: The unique batch number identifier

#### Request Body

```json
{
  "newQuantity": 120,
  "expiryDate": "2026-02-28T00:00:00.000Z"
}
```

Both fields are optional. You can update either quantity, expiry date, or both.

#### Success Response

- **Code**: 200 OK
- **Content**:

```json
{
  "success": true,
  "message": "Batch updated successfully",
  "data": {
    "_id": "64f5c1e7890abcdef1234569",
    "batchNumber": "BTH-20230915-001",
    "productId": "64f5c1e7890abcdef1234567",
    "importer": "64f5c1e7890abcdef1234568",
    "quantity": 120,
    "costPrice": 50000,
    "remainingQuantity": 115,
    "expiryDate": "2026-02-28T00:00:00.000Z",
    "receivedDate": "2023-09-15T00:00:00.000Z",
    "createdAt": "2023-09-15T08:30:00.000Z",
    "updatedAt": "2023-09-16T14:25:00.000Z"
  }
}
```

#### Error Response

- **Code**: 400 BAD REQUEST
- **Content**:

```json
{
  "success": false,
  "message": "Batch not found or invalid update parameters"
}
```

### 7. Delete batch

Delete an inventory batch by its batch number.

- **Method**: DELETE
- **URL**: `/:batchNumber`

#### URL Parameters

- `batchNumber`: The unique batch number identifier

#### Example Request

```
DELETE /api/admin/inventory-batches/BTH-20230915-001
```

#### Success Response

- **Code**: 200 OK
- **Content**:

```json
{
  "success": true,
  "message": "Inventory batch deleted successfully"
}
```

#### Error Response

- **Code**: 400 BAD REQUEST
- **Content**:

```json
{
  "success": false,
  "message": "Batch not found or cannot be deleted"
}
```
