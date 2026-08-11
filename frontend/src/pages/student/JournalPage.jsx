import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, BookOpen, X } from 'lucide-react';
import { journalApi } from '../../services/journal.api';
import Card from '../../components/shared/Card';
import EmptyState from '../../components/shared/EmptyState';
import Input from '../../components/forms/Input';
import TextArea from '../../components/forms/TextArea';

const JournalPage = () => {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadJournals = () => {
    journalApi.getMy().then((res) => setJournals(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { loadJournals(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await journalApi.create({ title, content });
      toast.success('Entry saved');
      setTitle('');
      setContent('');
      setShowForm(false);
      loadJournals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await journalApi.delete(id);
      setJournals((j) => j.filter((entry) => entry._id !== id));
      toast.success('Entry deleted');
    } catch (err) {
      toast.error('Failed to delete entry');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-teal-900 dark:text-white">Your journal</h1>
        <button onClick={() => setShowForm((s) => !s)} className="btn btn-sm bg-teal-600 hover:bg-teal-700 text-white border-none rounded-full gap-1">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showForm ? 'Cancel' : 'New entry'}
        </button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Title" placeholder="Give it a title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <TextArea label="What's on your mind?" rows={6} value={content} onChange={(e) => setContent(e.target.value)} required />
            <button type="submit" disabled={submitting} className="btn bg-teal-600 hover:bg-teal-700 text-white border-none rounded-xl">
              {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Save entry'}
            </button>
          </form>
        </Card>
      )}

      {loading ? (
        <span className="loading loading-spinner text-teal-600" />
      ) : journals.length === 0 ? (
        <EmptyState icon={BookOpen} title="No entries yet" message="Your private journal is empty. Write your first entry above." />
      ) : (
        <div className="space-y-3">
          {journals.map((j) => (
            <Card key={j._id} className="relative">
              <button onClick={() => handleDelete(j._id)} className="absolute top-4 right-4 text-teal-600/40 hover:text-clay-500">
                <Trash2 className="w-4 h-4" />
              </button>
              <p className="font-display font-semibold text-teal-900 dark:text-white pr-8">{j.title}</p>
              <p className="text-xs text-teal-600/60 mb-2">{new Date(j.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-teal-800/80 dark:text-white/70 whitespace-pre-wrap">{j.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JournalPage;
