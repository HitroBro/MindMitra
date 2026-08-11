import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../services/user.api';
import { authApi } from '../../services/auth.api';
import Card from '../../components/shared/Card';
import Input from '../../components/forms/Input';
import TextArea from '../../components/forms/TextArea';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MODES = ['online', 'offline', 'phone'];

const CounselorProfile = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    qualification: '', specialization: '', yearsOfExperience: 0, languages: '', bio: '',
    consultationModes: [], workingDays: [], workingHours: { start: '09:00', end: '17:00' },
    slotDurationMinutes: 30, consultationFee: 0, phone: '', officeLocation: '', meetingLink: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authApi.me().then((res) => {
      const p = res.data.data.counselorProfile || {};
      setForm((f) => ({
        ...f,
        ...p,
        specialization: (p.specialization || []).join(', '),
        languages: (p.languages || []).join(', '),
        workingHours: p.workingHours || { start: '09:00', end: '17:00' },
      }));
    }).finally(() => setLoading(false));
  }, []);

  const toggleArrayField = (field, value) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value) ? f[field].filter((v) => v !== value) : [...f[field], value],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        specialization: form.specialization.split(',').map((s) => s.trim()).filter(Boolean),
        languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
        yearsOfExperience: Number(form.yearsOfExperience),
        slotDurationMinutes: Number(form.slotDurationMinutes),
        consultationFee: Number(form.consultationFee),
      };
      const res = await userApi.updateMyCounselorProfile(payload);
      setUser(res.data.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <span className="loading loading-spinner text-teal-600" />;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-xl font-semibold text-teal-900 dark:text-white">My Profile</h1>
      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Qualification" placeholder="e.g. M.Phil Clinical Psychology" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
          <Input label="Specialization (comma separated)" placeholder="Anxiety, Exam stress, Sleep" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Years of experience" type="number" min="0" value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} />
            <Input label="Languages (comma separated)" placeholder="English, Hindi" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
          </div>
          <TextArea label="Bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-teal-800 dark:text-white/90">Consultation modes offered</label>
            <div className="flex gap-2">
              {MODES.map((m) => (
                <button type="button" key={m} onClick={() => toggleArrayField('consultationModes', m)}
                  className={`text-xs px-3 py-1.5 rounded-full border capitalize ${form.consultationModes.includes(m) ? 'bg-teal-600 text-white border-teal-600' : 'border-teal-600/20 text-teal-700'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-teal-800 dark:text-white/90">Working days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((d) => (
                <button type="button" key={d} onClick={() => toggleArrayField('workingDays', d)}
                  className={`text-xs px-3 py-1.5 rounded-full border ${form.workingDays.includes(d) ? 'bg-teal-600 text-white border-teal-600' : 'border-teal-600/20 text-teal-700'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-teal-800 dark:text-white/90">Start time</label>
              <input type="time" value={form.workingHours.start} onChange={(e) => setForm({ ...form, workingHours: { ...form.workingHours, start: e.target.value } })} className="focus-ring rounded-xl border border-teal-600/20 bg-white px-3 py-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-teal-800 dark:text-white/90">End time</label>
              <input type="time" value={form.workingHours.end} onChange={(e) => setForm({ ...form, workingHours: { ...form.workingHours, end: e.target.value } })} className="focus-ring rounded-xl border border-teal-600/20 bg-white px-3 py-2 text-sm" />
            </div>
            <Input label="Slot length (min)" type="number" min="10" step="5" value={form.slotDurationMinutes} onChange={(e) => setForm({ ...form, slotDurationMinutes: e.target.value })} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Office location" value={form.officeLocation} onChange={(e) => setForm({ ...form, officeLocation: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Online meeting link" value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} />
            <Input label="Consultation fee (₹, optional)" type="number" min="0" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} />
          </div>

          <button type="submit" disabled={saving} className="btn bg-teal-600 hover:bg-teal-700 text-white border-none rounded-xl gap-2">
            {saving ? <span className="loading loading-spinner loading-sm" /> : <><Save className="w-4 h-4" /> Save profile</>}
          </button>
        </form>
      </Card>
    </div>
  );
};

export default CounselorProfile;