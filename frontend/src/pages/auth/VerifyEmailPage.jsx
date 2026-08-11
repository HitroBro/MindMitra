import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Heart } from 'lucide-react';
import { authApi } from '../../services/auth.api';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    authApi.verifyEmail(token).then(() => setStatus('success')).catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-100 px-6 py-12">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="flex items-center justify-center gap-2 font-display text-2xl font-semibold text-teal-600 mb-8">
          <Heart className="w-7 h-7 fill-amber-500 text-amber-500" strokeWidth={1.5} />
          MindMitra
        </Link>
        <div className="bg-sand-50 rounded-3xl shadow-soft p-10">
          {status === 'loading' && <span className="loading loading-spinner loading-lg text-teal-600" />}
          {status === 'success' && (
            <>
              <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <h1 className="font-display text-xl font-semibold text-teal-900 mb-2">Email verified</h1>
              <p className="text-sm text-teal-700/70 mb-6">You're all set. Log in to continue.</p>
              <Link to="/login" className="btn bg-teal-600 text-white border-none rounded-xl px-6">Go to login</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-clay-500 mx-auto mb-4" />
              <h1 className="font-display text-xl font-semibold text-teal-900 mb-2">Verification failed</h1>
              <p className="text-sm text-teal-700/70">This link may have expired. Try logging in and requesting a new one.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
