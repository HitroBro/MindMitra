const { StatusCodes } = require('http-status-codes');
const Bookmark = require('../models/Bookmark.model');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createBookmark = asyncHandler(async (req, res) => {
  const { resourceType, resourceId } = req.body;
  const bookmark = await Bookmark.findOneAndUpdate(
    { user: req.user._id, resourceType, resourceId },
    { user: req.user._id, resourceType, resourceId },
    { upsert: true, new: true }
  );
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, bookmark, 'Bookmarked'));
});

const getMyBookmarks = asyncHandler(async (req, res) => {
  const { resourceType } = req.query;
  const filter = { user: req.user._id, ...(resourceType && { resourceType }) };
  const bookmarks = await Bookmark.find(filter).sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, bookmarks, 'Bookmarks fetched'));
});

const deleteBookmark = asyncHandler(async (req, res) => {
  await Bookmark.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, null, 'Bookmark removed'));
});

module.exports = { createBookmark, getMyBookmarks, deleteBookmark };
