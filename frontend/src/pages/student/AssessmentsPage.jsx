import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import { assessmentApi } from '../../services/assessment.api';
import Card from '../../components/shared/Card';
import EmptyState from '../../components/shared/EmptyState';

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure',
  'Trouble concentrating on things',
  'Moving or speaking noticeably slowly, or being fidgety/restless',
  'Thoughts that you would be better off dead or of hurting yourself',
];

const GAD7_QUESTIONS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid as if something awful might happen',
];

const OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

const severityColor = {
  minimal: 'bg-teal-600/10 text-teal-700',
  mild: 'bg-amber-500/10 text-amber-600',
  moderate: 'bg-amber-500/20 text-amber-700',
  moderately_severe: 'bg-clay-500/10 text-clay-600',
  severe: 'bg-clay-500/20 text-clay-600',
};

const AssessmentBlock = ({ title, subtitle, questions, onSubmit, history, type }) => {
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const allAnswered = answers.every((a) => a !== null);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data } = await onSubmit(answers);
      setResult(data.data);
      setAnswers(Array(questions.length).fill(null));
      toast.success(`${type} submitted`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-teal-900 dark:text-white mb-1">{title}</h2>
      <p className="text-xs text-teal-600/70 dark:text-white/50 mb-5">{subtitle}</p>

      {result && (
        <div className={`rounded-xl p-4 mb-5 flex items-center gap-3 ${severityColor[result.severity]}`}>
          <CheckCircle2 className="w-5 h-5" />
          <div>
            <p className="font-semibold text-sm">Score: {result.totalScore} — {result.severity.replace('_', ' ')}</p>
            <p className="text-xs opacity-80">Saved to your history below.</p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {questions.map((q, i) => (
          <div key={i}>
            <p className="text-sm font-medium text-teal-800 dark:text-white/90 mb-2">{i + 1}. {q}</p>
            <div className="flex flex-wrap gap-2">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnswers((a) => a.map((v, idx) => (idx === i ? opt.value : v)))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    answers[i] === opt.value
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-teal-600/20 text-teal-700 dark:text-white/70 hover:border-teal-600/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className="btn mt-6 bg-teal-600 hover:bg-teal-700 text-white border-none rounded-xl disabled:opacity-40"
      >
        {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Submit assessment'}
      </button>

      {history.length > 0 && (
        <div className="mt-8 pt-6 border-t border-teal-600/10">
          <p className="text-sm font-semibold text-teal-800 dark:text-white/90 mb-3">Previous results</p>
          <ul className="space-y-2">
            {history.slice(0, 5).map((h) => (
              <li key={h._id} className="flex items-center justify-between text-sm">
                <span className="text-teal-700/70 dark:text-white/50">{new Date(h.takenAt).toLocaleDateString()}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${severityColor[h.severity]}`}>{h.totalScore} · {h.severity.replace('_', ' ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};

const AssessmentsPage = () => {
  const [tab, setTab] = useState('phq9');
  const [phq9History, setPhq9History] = useState([]);
  const [gad7History, setGad7History] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshHistory = () => {
    Promise.all([assessmentApi.getMyPHQ9(), assessmentApi.getMyGAD7()])
      .then(([p, g]) => {
        setPhq9History(p.data.data);
        setGad7History(g.data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { refreshHistory(); }, []);

  const handlePHQ9 = async (answers) => {
    const res = await assessmentApi.submitPHQ9(answers);
    refreshHistory();
    return res;
  };
  const handleGAD7 = async (answers) => {
    const res = await assessmentApi.submitGAD7(answers);
    refreshHistory();
    return res;
  };

  if (loading) return <EmptyState icon={ClipboardList} title="Loading" message="Fetching your assessment history..." />;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('phq9')} className={`btn btn-sm rounded-full ${tab === 'phq9' ? 'bg-teal-600 text-white border-none' : 'btn-outline border-teal-600/30'}`}>PHQ-9 (Depression)</button>
        <button onClick={() => setTab('gad7')} className={`btn btn-sm rounded-full ${tab === 'gad7' ? 'bg-teal-600 text-white border-none' : 'btn-outline border-teal-600/30'}`}>GAD-7 (Anxiety)</button>
      </div>

      {tab === 'phq9' ? (
        <AssessmentBlock
          title="PHQ-9 Depression Screening"
          subtitle="Over the last 2 weeks, how often have you been bothered by the following?"
          questions={PHQ9_QUESTIONS}
          onSubmit={handlePHQ9}
          history={phq9History}
          type="PHQ-9"
        />
      ) : (
        <AssessmentBlock
          title="GAD-7 Anxiety Screening"
          subtitle="Over the last 2 weeks, how often have you been bothered by the following?"
          questions={GAD7_QUESTIONS}
          onSubmit={handleGAD7}
          history={gad7History}
          type="GAD-7"
        />
      )}
    </div>
  );
};

export default AssessmentsPage;
