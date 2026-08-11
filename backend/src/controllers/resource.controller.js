const { StatusCodes } = require('http-status-codes');
const Resource = require('../models/Resource.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { uploadToCloudinary } = require('../services/cloudinary.service');

const uploadResource = asyncHandler(async (req, res) => {
  const { title, description, type, category, tags = [] } = req.body;
  if (!req.file) throw new ApiError(StatusCodes.BAD_REQUEST, 'A file is required');

  const uploadResult = await uploadToCloudinary(req.file.path, 'mindmitra/resources');

  const resource = await Resource.create({
    title, description, type, category,
    tags: Array.isArray(tags) ? tags : String(tags).split(',').map((t) => t.trim()),
    fileUrl: uploadResult.secure_url,
    thumbnailUrl: uploadResult.resource_type === 'image' ? uploadResult.secure_url : '',
    uploadedBy: req.user._id,
  });

  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, resource, 'Resource uploaded'));
});

const getResources = asyncHandler(async (req, res) => {
  const { search, type, category, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const resources = await Resource.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
  const total = await Resource.countDocuments(filter);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, { resources, total }, 'Resources fetched'));
});

const getResourceById = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw new ApiError(StatusCodes.NOT_FOUND, 'Resource not found');
  resource.viewCount += 1;
  await resource.save();
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, resource, 'Resource fetched'));
});

const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findByIdAndDelete(req.params.id);
  if (!resource) throw new ApiError(StatusCodes.NOT_FOUND, 'Resource not found');
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, null, 'Resource deleted'));
});

const trackDownload = asyncHandler(async (req, res) => {
  const resource = await Resource.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } }, { new: true });
  if (!resource) throw new ApiError(StatusCodes.NOT_FOUND, 'Resource not found');
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, { downloadCount: resource.downloadCount }, 'Download tracked'));
});

module.exports = { uploadResource, getResources, getResourceById, deleteResource, trackDownload };
