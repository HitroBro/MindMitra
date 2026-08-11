const fs = require('fs');
const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');

/**
 * Uploads a local file (from multer disk storage) to Cloudinary,
 * then removes the local temp copy regardless of outcome.
 */
const uploadToCloudinary = async (localPath, folder = 'mindmitra') => {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder,
      resource_type: 'auto',
    });
    return result;
  } finally {
    fs.unlink(localPath, (err) => {
      if (err) logger.warn(`Failed to remove temp file ${localPath}: ${err.message}`);
    });
  }
};

const deleteFromCloudinary = async (publicId, resourceType = 'auto') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
