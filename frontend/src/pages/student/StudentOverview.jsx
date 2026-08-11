import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Smile, BookOpen, CalendarDays, ClipboardList, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { moodApi } from '../../services/mood.api';
import { appointmentApi } from '../../services/appointment.api';
import { recommendationApi } from '../../services/recommendation.api';
import Card from '../../components/shared/Card';
import Spinner from '../../components/shared/Spinner';
import RecommendationCard from '../../components/dashboard/RecommendationCard';
import TrendChart from '../../components/charts/TrendChart';

const quickLinks = [
  { to: '/dashboard/student/chat', label: 'Talk to the AI Assistant', icon: Brain, desc: 'Get first-aid support, any time.' },
  { to: '/dashboard/student/assessments', label: 'Take an assessment', icon: ClipboardList, desc: 'PHQ-9 or GAD-7 self-check.' },
  { to: '/dashboard/student/mood', label: 'Log today\'s mood', icon: Smile, desc: 'Takes less than 10 seconds.' },
  { to: '/dashboard/student/journal', label: 'Write in your journal', icon: BookOpen, desc: 'A private space, just for you.' },
];

const StudentOverview = () => {
  const { user } = useAuth();
  const [trend, setTrend] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([moodApi.getTrend(), appointmentApi.getMy(), recommendationApi.getMy()])
      .then(([moodRes, apptRes, recRes]) => {
        setTrend(moodRes.data.data);
        setAppointments(apptRes.data.data.slice(0, 3));
        setRecommendations(recRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-teal-900 dark:text-white">{greeting}, {user?.name?.split(' ')[0]}</h1>
        <p className="text-teal-700/70 dark:text-white/60 text-sm mt-1">Here's a quick look at where things stand.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((l) => (
          <Link key={l.to} to={l.to} className="group">
            <Card className="h-full hover:shadow-soft transition-shadow">
              <l.icon className="w-6 h-6 text-teal-600 mb-3" />
              <p className="font-semibold text-teal-900 dark:text-white text-sm mb-1">{l.label}</p>
              <p className="text-xs text-teal-600/70 dark:text-white/50">{l.desc}</p>
              <ArrowRight className="w-4 h-4 text-teal-600 mt-3 group-hover:translate-x-1 transition-transform" />
            </Card>
          </Link>
        ))}
      </div>

      {recommendations.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-teal-900 dark:text-white mb-3">Recommended for you</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {recommendations.slice(0, 4).map((r, i) => <RecommendationCard key={i} recommendation={r} />)}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-display font-semibold text-teal-900 dark:text-white mb-4">Recent mood trend</h2>
          {trend.length === 0 ? (
            <p className="text-sm text-teal-600/60">No mood logs yet — start tracking today.</p>
          ) : (
            <TrendChart
              data={trend.slice(-14).map((t) => ({
                date: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                mood: t.moodScore,
              }))}
              dataKey="mood"
              color="#E0A458"
              height={180}
              yDomain={[1, 5]}
            />
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-teal-900 dark:text-white">Upcoming appointments</h2>
            <Link to="/dashboard/student/appointments" className="text-xs text-teal-600 font-semibold hover:underline">View all</Link>
          </div>
          {appointments.length === 0 ? (
            <p className="text-sm text-teal-600/60">No appointments booked yet.</p>
          ) : (
            <ul className="space-y-3">
              {appointments.map((a) => (
                <li key={a._id} className="flex items-center gap-3 text-sm">
                  <CalendarDays className="w-4 h-4 text-teal-600" />
                  <span className="text-teal-800 dark:text-white/80">{new Date(a.preferredDate).toLocaleDateString()} · {a.timeSlot}</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full capitalize ${a.status === 'approved' ? 'bg-teal-600/10 text-teal-700' : 'bg-amber-500/10 text-amber-600'}`}>{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StudentOverview;