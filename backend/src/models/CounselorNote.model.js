const mongoose = require('mongoose');
const crypto = require('crypto');

// Simple symmetric encryption at rest for sensitive session notes.
// Key must be 32 bytes; derived from ACCESS_TOKEN_SECRET so no extra env var is required.
const ALGO = 'aes-256-cbc';
const getKey = () => crypto.createHash('sha256').update(String(process.env.ACCESS_TOKEN_SECRET)).digest();

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (payload) => {
  const [ivHex, dataHex] = payload.split(':');
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
};

const counselorNoteSchema = new mongoose.Schema(
  {
    counselor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
    note: { type: String, required: true }, // stored encrypted
  },
  { timestamps: true }
);

counselorNoteSchema.pre('save', function encryptNote(next) {
  if (this.isModified('note')) {
    this.note = encrypt(this.note);
  }
  next();
});

counselorNoteSchema.methods.getDecryptedNote = function getDecryptedNote() {
  return decrypt(this.note);
};

module.exports = mongoose.model('CounselorNote', counselorNoteSchema);
