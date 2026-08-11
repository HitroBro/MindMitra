import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardList } from 'lucide-react';
import { reportApi, feedbackApi } from '../../services/report.api';
import Card from '../../components/shared/Card';
import EmptyState from '../../components/shared/EmptyState';

const AdminReports = () => {
  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([reportApi.getAll(), feedbackApi.getAll()])
      .then(([r, f]) => { setReports(r.data.data); setFeedback(f.data.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (id, status) => {
    try {
      await reportApi.update(id, { status });
      setReports((rs) => rs.map((r) => (r._id === id ? { ...r, status } : r)));
      toast.success('Report updated');
    } catch (err) {
      toast.error('Failed to update report');
    }
  };

  if (loading) return <span className="loading loading-spinner text-teal-600" />;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-xl font-semibold text-teal-900 dark:text-white">Reports & Feedback</h1>
      <div className="flex gap-2">
        <button onClick={() => setTab('reports')} className={`btn btn-sm rounded-full ${tab === 'reports' ? 'bg-teal-600 text-white border-none' : 'btn-outline border-teal-600/30'}`}>Reports</button>
        <button onClick={() => setTab('feedback')} className={`btn btn-sm rounded-full ${tab === 'feedback' ? 'bg-teal-600 text-white border-none' : 'btn-outline border-teal-600/30'}`}>Feedback</button>
      </div>

      {tab === 'reports' ? (
        reports.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No reports" message="Student-submitted reports will appear here." />
        ) : (
          reports.map((r) => (
            <Card key={r._id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-teal-900 capitalize">{r.type} · {r.subject}</p>
                  <p className="text-sm text-teal-800/70 mt-1">{r.description}</p>
                  <p className="text-xs text-teal-600/50 mt-2">{r.submittedBy?.name} · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <select value={r.status} onChange={(e) => handleUpdate(r._id, e.target.value)} className="select select-sm border-teal-600/20 rounded-lg flex-shrink-0">
                  <option value="open">Open</option>
                  <option value="in_review">In review</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </Card>
          ))
        )
      ) : feedback.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No feedback" message="Feedback submissions will appear here." />
      ) : (
        feedback.map((f) => (
          <Card key={f._id}>
            <p className="font-semibold text-teal-900">{'⭐'.repeat(f.rating)}</p>
            <p className="text-sm text-teal-800/70 mt-1">{f.message}</p>
            <p className="text-xs text-teal-600/50 mt-2">{f.user?.name || 'Anonymous'} · {new Date(f.createdAt).toLocaleDateString()}</p>
          </Card>
        ))
      )}
    </div>
  );
};

export default AdminReports;
