import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { moodApi } from '../../services/mood.api';
import Card from '../../components/shared/Card';
import EmptyState from '../../components/shared/EmptyState';
import { Smile } from 'lucide-react';

const MOODS = [
  { value: 1, label: 'very_sad', emoji: '😞', text: 'Very sad' },
  { value: 2, label: 'sad', emoji: '🙁', text: 'Sad' },
  { value: 3, label: 'neutral', emoji: '😐', text: 'Neutral' },
  { value: 4, label: 'happy', emoji: '🙂', text: 'Happy' },
  { value: 5, label: 'very_happy', emoji: '😄', text: 'Very happy' },
];

const MoodPage = () => {
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadHistory = () => {
    moodApi.getMy().then((res) => setHistory(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { loadHistory(); }, []);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await moodApi.log({ moodScore: selected.value, moodLabel: selected.label, note });
      toast.success('Mood logged');
      setSelected(null);
      setNote('');
      loadHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log mood');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <h1 className="font-display text-lg font-semibold text-teal-900 dark:text-white mb-1">How are you feeling right now?</h1>
        <p className="text-xs text-teal-600/70 dark:text-white/50 mb-5">Log it in a few seconds.</p>

        <div className="flex justify-between gap-2 mb-5">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelected(m)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border transition-all ${
                selected?.value === m.value ? 'border-teal-600 bg-teal-600/10 scale-105' : 'border-teal-600/10 hover:border-teal-600/30'
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[11px] text-teal-700 dark:text-white/60">{m.text}</span>
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything you want to add? (optional)"
          rows={2}
          className="focus-ring w-full rounded-xl border border-teal-600/20 bg-white dark:bg-teal-900 px-4 py-2.5 text-sm text-teal-900 dark:text-white mb-4"
        />

        <button onClick={handleSubmit} disabled={!selected || submitting} className="btn bg-teal-600 hover:bg-teal-700 text-white border-none rounded-xl disabled:opacity-40">
          {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Log mood'}
        </button>
      </Card>

      <Card>
        <h2 className="font-display font-semibold text-teal-900 dark:text-white mb-4">History</h2>
        {loading ? (
          <span className="loading loading-spinner text-teal-600" />
        ) : history.length === 0 ? (
          <EmptyState icon={Smile} title="No entries yet" message="Your mood history will show up here." />
        ) : (
          <ul className="space-y-2">
            {history.slice(0, 10).map((h) => (
              <li key={h._id} className="flex items-center gap-3 text-sm border-b border-teal-600/5 pb-2 last:border-0">
                <span className="text-xl">{MOODS.find((m) => m.value === h.moodScore)?.emoji}</span>
                <span className="text-teal-800 dark:text-white/80 flex-1">{h.note || '—'}</span>
                <span className="text-xs text-teal-600/60">{new Date(h.date).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default MoodPage;
