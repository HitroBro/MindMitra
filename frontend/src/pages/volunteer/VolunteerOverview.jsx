import { useEffect, useState } from 'react';
import { Flag, ClipboardList } from 'lucide-react';
import { volunteerActivityApi } from '../../services/volunteerActivity.api';
import StatCard from '../../components/shared/StatCard';
import Card from '../../components/shared/Card';
import Spinner from '../../components/shared/Spinner';

const VolunteerOverview = () => {
  const [reportedPosts, setReportedPosts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([volunteerActivityApi.getReportedPosts(), volunteerActivityApi.getMy()])
      .then(([r, a]) => {
        setReportedPosts(r.data.data);
        setActivity(a.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-teal-900 dark:text-white">Volunteer Overview</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard label="Posts flagged for review" value={reportedPosts.length} icon={Flag} />
        <StatCard label="Actions logged by you" value={activity.length} icon={ClipboardList} />
      </div>
      <Card>
        <h2 className="font-display font-semibold text-teal-900 dark:text-white mb-4">Recent activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-teal-600/60">No moderation activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {activity.slice(0, 8).map((a) => (
              <li key={a._id} className="text-sm text-teal-800 dark:text-white/70 flex justify-between">
                <span className="capitalize">{a.action.replace(/_/g, ' ')}</span>
                <span className="text-xs text-teal-600/60">{new Date(a.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default VolunteerOverview;
