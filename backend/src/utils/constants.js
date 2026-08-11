const ROLES = {
  STUDENT: 'student',
  VOLUNTEER: 'volunteer',
  COUNSELOR: 'counselor',
  ADMIN: 'admin',
};

const ROLE_VALUES = Object.values(ROLES);

const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  IN_SESSION: 'in_session',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
};

const PHQ9_SEVERITY = {
  MINIMAL: 'minimal',
  MILD: 'mild',
  MODERATE: 'moderate',
  MODERATELY_SEVERE: 'moderately_severe',
  SEVERE: 'severe',
};

const GAD7_SEVERITY = {
  MINIMAL: 'minimal',
  MILD: 'mild',
  MODERATE: 'moderate',
  SEVERE: 'severe',
};

// Server-side emergency detection — checked on every chat message and
// free-text assessment/journal input before it is stored or responded to.
const EMERGENCY_KEYWORDS = [
  'suicide',
  'suicidal',
  'kill myself',
  'want to die',
  'end my life',
  'self harm',
  'self-harm',
  'hurt myself',
  'no reason to live',
  'better off dead',
  "can't go on",
  'cant go on',
  'end it all',
];

const detectEmergency = (text = '') => {
  const lower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));
};

module.exports = {
  ROLES,
  ROLE_VALUES,
  APPOINTMENT_STATUS,
  PHQ9_SEVERITY,
  GAD7_SEVERITY,
  EMERGENCY_KEYWORDS,
  detectEmergency,
};
