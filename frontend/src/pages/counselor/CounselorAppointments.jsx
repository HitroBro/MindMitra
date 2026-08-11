import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays } from 'lucide-react';
import { appointmentApi } from '../../services/appointment.api';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/shared/Card';
import EmptyState from '../../components/shared/EmptyState';
import TextArea from '../../components/forms/TextArea';

const statusStyle = {
  pending: 'bg-amber-500/10 text-amber-600',
  approved: 'bg-teal-600/10 text-teal-700',
  completed: 'bg-teal-600/20 text-teal-800',
  cancelled: 'bg-teal-600/5 text-teal-600/50',
  rejected: 'bg-clay-500/10 text-clay-600',
};

const CounselorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteDrafts, setNoteDrafts] = useState({});

  const load = () => appointmentApi.getForCounselor().then((res) => setAppointments(res.data.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleUpdate = async (id, status) => {
    try {
      await appointmentApi.updateStatus(id, { status, counselorNote: noteDrafts[id] || '' });
      toast.success(`Marked ${status}`);
      load();
    } catch (err) {
      toast.error('Failed to update appointment');
    }
  };

  const navigate = useNavigate();

  const handleStart = async (id) => {
    try {
      const res = await appointmentApi.startSession(id);
      const sessionId = res.data.data.sessionId;
      toast.success('Session started');
      navigate(`/session/${sessionId}`);
    } catch (err) {
      toast.error('Failed to start session');
    }
  };

  if (loading) return <span className="loading loading-spinner text-teal-600" />;

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="font-display text-xl font-semibold text-teal-900 dark:text-white">Appointments</h1>
      {appointments.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No appointments" message="Requests from students will appear here." />
      ) : (
        appointments.map((a) => (
          <Card key={a._id}>
            <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
              <div>
                <p className="font-semibold text-teal-900 dark:text-white">{a.student?.name}</p>
                <p className="text-xs text-teal-600/70">{new Date(a.preferredDate).toLocaleDateString()} · {a.timeSlot}</p>
                <p className="text-xs text-teal-600/70 mt-1">Mode: {a.consultationMode || 'N/A'}</p>
                <p className="text-sm text-teal-800/70 dark:text-white/60 mt-1">{a.reason}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${statusStyle[a.status]}`}>{a.status}</span>
            </div>

            {a.status === 'pending' && (
              <div className="space-y-3">
                <TextArea
                  placeholder="Optional note..."
                  rows={2}
                  value={noteDrafts[a._id] || ''}
                  onChange={(e) => setNoteDrafts({ ...noteDrafts, [a._id]: e.target.value })}
                />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(a._id, 'approved')} className="btn btn-sm bg-teal-600 hover:bg-teal-700 text-white border-none rounded-full">Approve</button>
                  <button onClick={() => handleUpdate(a._id, 'rejected')} className="btn btn-sm btn-outline border-clay-500 text-clay-600 rounded-full">Reject</button>
                </div>
              </div>
            )}
            {a.status === 'approved' && (
              <div className="flex gap-2">
                <button onClick={() => handleStart(a._id)} className="btn btn-sm bg-teal-600 text-white border-none rounded-full">Start session</button>
                <button onClick={() => handleUpdate(a._id, 'completed')} className="btn btn-sm bg-teal-600/10 text-teal-700 border-none rounded-full">Mark completed</button>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
};

export default CounselorAppointments;
