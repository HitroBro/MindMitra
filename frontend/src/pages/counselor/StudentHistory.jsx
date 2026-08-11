import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, Plus } from 'lucide-react';
import { appointmentApi } from '../../services/appointment.api';
import { counselorNoteApi } from '../../services/counselorNote.api';
import Card from '../../components/shared/Card';
import EmptyState from '../../components/shared/EmptyState';
import TextArea from '../../components/forms/TextArea';

const StudentHistory = () => {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentApi.getForCounselor().then((res) => {
      const appts = res.data.data;
      const uniqueStudents = Array.from(new Map(appts.map((a) => [a.student?._id, a.student])).values()).filter(Boolean);
      setStudents(uniqueStudents);
    }).finally(() => setLoading(false));
  }, []);

  const loadNotes = (studentId) => {
    setSelected(studentId);
    counselorNoteApi.getForStudent(studentId).then((res) => setNotes(res.data.data));
  };

  const handleAddNote = async () => {
    if (!draft.trim()) return;
    try {
      await counselorNoteApi.create({ student: selected, note: draft });
      toast.success('Note saved');
      setDraft('');
      loadNotes(selected);
    } catch (err) {
      toast.error('Failed to save note');
    }
  };

  if (loading) return <span className="loading loading-spinner text-teal-600" />;

  return (
    <div className="max-w-4xl grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-2">
        <h1 className="font-display text-xl font-semibold text-teal-900 dark:text-white mb-3">Students</h1>
        {students.length === 0 ? (
          <EmptyState icon={Users} title="No students yet" message="Students you've had appointments with will show here." />
        ) : (
          students.map((s) => (
            <button
              key={s._id}
              onClick={() => loadNotes(s._id)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${selected === s._id ? 'bg-teal-600 text-white' : 'bg-sand-50 hover:bg-teal-600/10 text-teal-800'}`}
            >
              {s.name}
            </button>
          ))
        )}
      </div>

      <div className="md:col-span-2">
        {!selected ? (
          <EmptyState icon={Users} title="Select a student" message="Choose a student on the left to view session notes." />
        ) : (
          <Card>
            <h2 className="font-display font-semibold text-teal-900 dark:text-white mb-4">Session Notes</h2>
            <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-sm text-teal-600/60">No notes yet.</p>
              ) : (
                notes.map((n) => (
                  <div key={n._id} className="bg-teal-600/5 rounded-xl p-3 text-sm">
                    <p className="text-teal-800 dark:text-white/80">{n.note}</p>
                    <p className="text-xs text-teal-600/50 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
            <TextArea placeholder="Add a confidential session note..." rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} />
            <button onClick={handleAddNote} className="btn btn-sm mt-3 bg-teal-600 hover:bg-teal-700 text-white border-none rounded-full gap-1">
              <Plus className="w-3.5 h-3.5" /> Add note
            </button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentHistory;
