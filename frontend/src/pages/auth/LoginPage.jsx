import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/forms/Input';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const roleHome = { student: '/dashboard/student', volunteer: '/dashboard/volunteer', counselor: '/dashboard/counselor', admin: '/dashboard/admin' };

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const user = await login(data.email, data.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      const redirectTo = location.state?.from?.pathname || roleHome[user.role] || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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
          <h1 className="font-display text-2xl font-semibold text-teal-900 mb-1">Welcome back</h1>
          <p className="text-sm text-teal-700/70 mb-6">Log in to continue your journey.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email" type="email" placeholder="you@college.edu" error={errors.email?.message} {...register('email')} />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-[38px] text-teal-600/50 hover:text-teal-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-teal-600 hover:underline">Forgot password?</Link>
            </div>

            <button type="submit" disabled={submitting} className="btn w-full bg-teal-600 hover:bg-teal-700 text-white border-none rounded-xl">
              {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Log in'}
            </button>
          </form>

          <p className="text-center text-sm text-teal-700/70 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-teal-600 font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
