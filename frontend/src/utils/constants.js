export const MOOD_OPTIONS = [
  { value: 1, label: 'very_sad', emoji: '😞', text: 'Very sad' },
  { value: 2, label: 'sad', emoji: '🙁', text: 'Sad' },
  { value: 3, label: 'neutral', emoji: '😐', text: 'Neutral' },
  { value: 4, label: 'happy', emoji: '🙂', text: 'Happy' },
  { value: 5, label: 'very_happy', emoji: '😄', text: 'Very happy' },
];

export const moodEmoji = (label) => MOOD_OPTIONS.find((m) => m.label === label)?.emoji || '📝';