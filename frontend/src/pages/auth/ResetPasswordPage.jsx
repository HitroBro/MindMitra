import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../services/auth.api';
import Input from '../../components/forms/Input';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password reset! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset link is invalid or expired');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-100 px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 font-display text-2xl font-semibold text-teal-600 mb-8">
          <Heart className="w-7 h-7 fill-amber-500 text-amber-500" strokeWidth={1.5} />
          MindMitra
        </Link>
        <div className="bg-sand-50 rounded-3xl shadow-soft p-8">
          <h1 className="font-display text-2xl font-semibold text-teal-900 mb-1">Set a new password</h1>
          <p className="text-sm text-teal-700/70 mb-6">Choose something you haven't used before.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input label="New password" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" disabled={submitting} className="btn w-full bg-teal-600 hover:bg-teal-700 text-white border-none rounded-xl">
              {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Reset password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
