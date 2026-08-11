import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { emergencyApi } from '../../services/emergency.api';
import Card from '../../components/shared/Card';
import EmptyState from '../../components/shared/EmptyState';

const AdminEmergency = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => emergencyApi.getAll().then((res) => setAlerts(res.data.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleResolve = async (id) => {
    try {
      await emergencyApi.resolve(id);
      toast.success('Alert resolved');
      load();
    } catch (err) {
      toast.error('Failed to resolve alert');
    }
  };

  if (loading) return <span className="loading loading-spinner text-teal-600" />;

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="font-display text-xl font-semibold text-teal-900 dark:text-white">Emergency Alerts</h1>
      {alerts.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No alerts" message="No emergency alerts have been raised." />
      ) : (
        alerts.map((a) => (
          <Card key={a._id} className={a.status === 'open' ? 'border-l-4 border-clay-500' : ''}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-teal-900">{a.user?.name} <span className="text-xs text-teal-600/60 capitalize">· {a.triggerSource}</span></p>
                <p className="text-sm text-teal-800/70 mt-1">{a.triggerContext}</p>
                <p className="text-xs text-teal-600/50 mt-2">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
              {a.status === 'open' ? (
                <button onClick={() => handleResolve(a._id)} className="btn btn-sm bg-teal-600 text-white border-none rounded-full gap-1 flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                </button>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full bg-teal-600/10 text-teal-700 capitalize flex-shrink-0">{a.status}</span>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default AdminEmergency;
