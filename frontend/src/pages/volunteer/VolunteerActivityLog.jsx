import { useEffect, useState } from 'react';
import { volunteerActivityApi } from '../../services/volunteerActivity.api';
import Card from '../../components/shared/Card';
import EmptyState from '../../components/shared/EmptyState';
import { ClipboardList } from 'lucide-react';

const VolunteerActivityLog = () => {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    volunteerActivityApi.getMy().then((res) => setActivity(res.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <span className="loading loading-spinner text-teal-600" />;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-xl font-semibold text-teal-900 dark:text-white mb-4">My Activity</h1>
      {activity.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No activity yet" message="Actions you take while moderating will appear here." />
      ) : (
        <Card>
          <ul className="divide-y divide-teal-600/10">
            {activity.map((a) => (
              <li key={a._id} className="py-3 flex justify-between text-sm">
                <span className="capitalize text-teal-800 dark:text-white/80">{a.action.replace(/_/g, ' ')} — {a.targetType}</span>
                <span className="text-xs text-teal-600/60">{new Date(a.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default VolunteerActivityLog;
