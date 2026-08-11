import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../services/auth.api';
import Input from '../../components/forms/Input';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
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
          {sent ? (
            <div className="text-center py-4">
              <Mail className="w-10 h-10 text-teal-600 mx-auto mb-4" />
              <h1 className="font-display text-xl font-semibold text-teal-900 mb-2">Check your email</h1>
              <p className="text-sm text-teal-700/70">If an account exists for {email}, a reset link is on its way.</p>
              <Link to="/login" className="text-teal-600 text-sm font-semibold hover:underline mt-4 inline-block">Back to login</Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-semibold text-teal-900 mb-1">Reset your password</h1>
              <p className="text-sm text-teal-700/70 mb-6">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={onSubmit} className="space-y-4">
                <Input label="Email" type="email" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <button type="submit" disabled={submitting} className="btn w-full bg-teal-600 hover:bg-teal-700 text-white border-none rounded-xl">
                  {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Send reset link'}
                </button>
              </form>
              <p className="text-center text-sm text-teal-700/70 mt-6">
                <Link to="/login" className="text-teal-600 font-semibold hover:underline">Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
