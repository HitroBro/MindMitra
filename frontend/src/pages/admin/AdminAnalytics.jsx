import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, CalendarDays, MessageSquare, Library, AlertTriangle, Activity } from 'lucide-react';
import { analyticsApi } from '../../services/analytics.api';
import StatCard from '../../components/shared/StatCard';
import Card from '../../components/shared/Card';
import Spinner from '../../components/shared/Spinner';

const COLORS = ['#1F4B43', '#E0A458', '#7BB3A1', '#B5654A', '#4F9A82'];

const AdminAnalytics = () => {
  const [overview, setOverview] = useState(null);
  const [assessments, setAssessments] = useState({ phq9: [], gad7: [] });
  const [appointments, setAppointments] = useState([]);
  const [forumActivity, setForumActivity] = useState([]);
  const [resourceUsage, setResourceUsage] = useState([]);
  const [emergencyStats, setEmergencyStats] = useState({ byStatus: [], bySource: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.overview(),
      analyticsApi.assessmentsTrend(),
      analyticsApi.appointmentsTrend(),
      analyticsApi.forumActivity(),
      analyticsApi.resourceUsage(),
      analyticsApi.emergencyAlerts(),
    ]).then(([ov, at, ap, fa, ru, ea]) => {
      setOverview(ov.data.data);
      setAssessments(at.data.data);
      setAppointments(ap.data.data.map((x) => ({ status: x._id, count: x.count })));
      setForumActivity(fa.data.data.map((x) => ({ date: x._id.slice(5), posts: x.count })));
      setResourceUsage(ru.data.data);
      setEmergencyStats({
        byStatus: ea.data.data.byStatus.map((x) => ({ name: x._id, value: x.count })),
        bySource: ea.data.data.bySource.map((x) => ({ name: x._id, value: x.count })),
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading || !overview) return <Spinner />;

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="font-display text-2xl font-semibold text-teal-900 dark:text-white">Admin Analytics</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total users" value={overview.totalUsers} icon={Users} />
        <StatCard label="Appointments" value={overview.totalAppointments} icon={CalendarDays} />
        <StatCard label="Forum posts" value={overview.totalPosts} icon={MessageSquare} />
        <StatCard label="Open emergency alerts" value={overview.openAlerts} icon={AlertTriangle} accent="text-clay-600" />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Students" value={overview.students} icon={Users} />
        <StatCard label="Daily active users" value={overview.dau} icon={Activity} />
        <StatCard label="Monthly active users" value={overview.mau} icon={Activity} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-display font-semibold text-teal-900 dark:text-white mb-4">Depression & Anxiety Trend (avg score)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={assessments.phq9.map((p, i) => ({ date: p._id.slice(5), phq9: p.avgScore, gad7: assessments.gad7[i]?.avgScore }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F4B4310" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="phq9" stroke="#1F4B43" name="PHQ-9" strokeWidth={2} />
              <Line type="monotone" dataKey="gad7" stroke="#E0A458" name="GAD-7" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="font-display font-semibold text-teal-900 dark:text-white mb-4">Appointments by status</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={appointments}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F4B4310" />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#1F4B43" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="font-display font-semibold text-teal-900 dark:text-white mb-4">Forum activity (30 days)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={forumActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F4B4310" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="posts" stroke="#7BB3A1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="font-display font-semibold text-teal-900 dark:text-white mb-4">Emergency alerts by source</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={emergencyStats.bySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {emergencyStats.bySource.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h2 className="font-display font-semibold text-teal-900 dark:text-white mb-4 flex items-center gap-2"><Library className="w-4 h-4" /> Top resources</h2>
        {resourceUsage.length === 0 ? (
          <p className="text-sm text-teal-600/60">No resource usage data yet.</p>
        ) : (
          <ul className="space-y-2">
            {resourceUsage.map((r) => (
              <li key={r._id} className="flex justify-between text-sm">
                <span className="text-teal-800 dark:text-white/80">{r.title}</span>
                <span className="text-xs text-teal-600/60">{r.downloadCount} downloads · {r.viewCount} views</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default AdminAnalytics;
