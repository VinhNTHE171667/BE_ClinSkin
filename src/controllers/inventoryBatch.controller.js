import inventoryBatchService from '../services/inventoryBatch.service.js';
import { StatusCodes } from 'http-status-codes';

export const createBatch = async (req, res) => {
  try {
    const batchData = req.body;
    batchData.importer = req.admin._id;
        
    const newBatch = await inventoryBatchService.createBatch(batchData);
    
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Inventory batch created successfully',
      data: newBatch
    });
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllBatches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    if (req.query.batchNumber) {
      filter.batchNumber = { $regex: req.query.batchNumber, $options: 'i' };
    }
    
    if (req.query.productId) {
      filter.productId = req.query.productId;
    }
    
    if (req.query.importer) {
      filter.importer = req.query.importer;
    }

    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'ascend' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const totalItems = await inventoryBatchService.countBatches(filter);
    const totalPages = Math.ceil(totalItems / limit);
    
    const batches = await inventoryBatchService.getPaginatedBatches(filter, skip, limit, sort);
    
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Inventory batches retrieved successfully',
      data: batches,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

export const getBatchByNumber = async (req, res) => {
  try {
    const batchNumber = req.params.batchNumber;
    const batch = await inventoryBatchService.getBatchByNumber(batchNumber);
    
    if (!batch) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Inventory batch not found'
      });
    }
    
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Inventory batch retrieved successfully',
      data: batch
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

export const getBatchesByProductId = async (req, res) => {
  try {
    const productId = req.params.productId;
    const batches = await inventoryBatchService.getBatchesByProductId(productId);
    
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Product inventory batches retrieved successfully',
      data: batches
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

export const updateBatch = async (req, res) => {
  try {
    const { batchNumber } = req.params;
    const { newQuantity, expiryDate } = req.body;
    
    const updatedBatch = await inventoryBatchService.updateBatch(batchNumber, newQuantity, expiryDate);
    
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Batch updated successfully',
      data: updatedBatch
    });
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};


export const deleteBatch = async (req, res) => {
  try {
    const { batchNumber } = req.params;
    
    const result = await inventoryBatchService.deleteBatch(batchNumber);
    
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Inventory batch deleted successfully'
    });
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};
