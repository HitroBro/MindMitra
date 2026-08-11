const { StatusCodes } = require('http-status-codes');
const CounselorNote = require('../models/CounselorNote.model');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createNote = asyncHandler(async (req, res) => {
  const { student, appointment, note } = req.body;
  const created = await CounselorNote.create({ counselor: req.user._id, student, appointment, note });
  const obj = created.toObject();
  obj.note = note; // return plaintext to the author who just submitted it
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, obj, 'Note saved'));
});

const getNotesForStudent = asyncHandler(async (req, res) => {
  const notes = await CounselorNote.find({ counselor: req.user._id, student: req.params.studentId }).sort({ createdAt: -1 });
  const decrypted = notes.map((n) => ({ ...n.toObject(), note: n.getDecryptedNote() }));
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, decrypted, 'Notes fetched'));
});

module.exports = { createNote, getNotesForStudent };
