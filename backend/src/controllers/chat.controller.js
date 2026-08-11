const { StatusCodes } = require('http-status-codes');
const crypto = require('crypto');
const ChatHistory = require('../models/ChatHistory.model');
const EmergencyAlert = require('../models/EmergencyAlert.model');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getChatReply } = require('../services/chat.service');

const sendMessage = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body;
  const activeSessionId = sessionId || crypto.randomUUID();

  let chat = await ChatHistory.findOne({ user: req.user._id, sessionId: activeSessionId });
  if (!chat) {
    chat = await ChatHistory.create({ user: req.user._id, sessionId: activeSessionId, messages: [] });
  }

  const { reply, emergency } = await getChatReply(message, chat.messages);

  chat.messages.push({ role: 'user', content: message, flagged: emergency });
  chat.messages.push({ role: 'ai', content: reply });
  if (emergency) chat.emergencyTriggered = true;
  await chat.save();

  if (emergency) {
    await EmergencyAlert.create({
      user: req.user._id,
      triggerSource: 'chatbot',
      triggerContext: message.slice(0, 300),
    });
  }

  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, { sessionId: activeSessionId, reply, emergency }, 'Message sent'));
});

const getHistory = asyncHandler(async (req, res) => {
  const chat = await ChatHistory.findOne({ user: req.user._id, sessionId: req.params.sessionId });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, chat || { messages: [] }, 'Chat history fetched'));
});

const getSessions = asyncHandler(async (req, res) => {
  const sessions = await ChatHistory.find({ user: req.user._id })
    .select('sessionId createdAt updatedAt emergencyTriggered messages')
    .sort({ updatedAt: -1 });
  const summarized = sessions.map((s) => ({
    sessionId: s.sessionId,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    emergencyTriggered: s.emergencyTriggered,
    lastMessage: s.messages[s.messages.length - 1]?.content?.slice(0, 80) || '',
  }));
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, summarized, 'Sessions fetched'));
});

module.exports = { sendMessage, getHistory, getSessions };
