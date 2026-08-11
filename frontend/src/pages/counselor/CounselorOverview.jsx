import { useEffect, useState } from 'react';
import { CalendarDays, Users, Clock } from 'lucide-react';
import { appointmentApi } from '../../services/appointment.api';
import StatCard from '../../components/shared/StatCard';
import Card from '../../components/shared/Card';
import Spinner from '../../components/shared/Spinner';

const CounselorOverview = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentApi.getForCounselor().then((res) => setAppointments(res.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const pending = appointments.filter((a) => a.status === 'pending').length;
  const approved = appointments.filter((a) => a.status === 'approved').length;
  const uniqueStudents = new Set(appointments.map((a) => a.student?._id)).size;

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="font-display text-2xl font-semibold text-teal-900 dark:text-white">Counselor Overview</h1>
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Pending requests" value={pending} icon={Clock} />
        <StatCard label="Approved appointments" value={approved} icon={CalendarDays} />
        <StatCard label="Students seen" value={uniqueStudents} icon={Users} />
      </div>
      <Card>
        <h2 className="font-display font-semibold text-teal-900 dark:text-white mb-4">Recent requests</h2>
        {appointments.length === 0 ? (
          <p className="text-sm text-teal-600/60">No appointments yet.</p>
        ) : (
          <ul className="space-y-3">
            {appointments.slice(0, 6).map((a) => (
              <li key={a._id} className="flex justify-between text-sm">
                <span className="text-teal-800 dark:text-white/80">{a.student?.name} · {new Date(a.preferredDate).toLocaleDateString()}</span>
                <span className="capitalize text-xs px-2 py-0.5 rounded-full bg-teal-600/10 text-teal-700">{a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default CounselorOverview;
