import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/forms/Input';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters').regex(/\d/, 'Must contain a number'),
  role: z.enum(['student', 'volunteer', 'counselor']),
});

const roleHome = { student: '/dashboard/student', volunteer: '/dashboard/volunteer', counselor: '/dashboard/counselor', admin: '/dashboard/admin' };

const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'student' },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const user = await registerUser(data);
      toast.success(`Welcome to MindMitra, ${user.name.split(' ')[0]}! We've sent a verification link to your email.`);
      navigate(roleHome[user.role] || '/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
          <h1 className="font-display text-2xl font-semibold text-teal-900 mb-1">Create your account</h1>
          <p className="text-sm text-teal-700/70 mb-6">Takes less than a minute.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full name" placeholder="Ananya Sharma" error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" placeholder="you@college.edu" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" placeholder="At least 8 characters" error={errors.password?.message} {...register('password')} />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-teal-800">I am joining as a</label>
              <select className="focus-ring w-full rounded-xl border border-teal-600/20 bg-white px-4 py-2.5 text-sm text-teal-900" {...register('role')}>
                <option value="student">Student</option>
                <option value="volunteer">Volunteer</option>
                <option value="counselor">Counselor</option>
              </select>
              <p className="text-xs text-teal-600/60">Admin accounts are provisioned separately by the institution.</p>
            </div>

            <button type="submit" disabled={submitting} className="btn w-full bg-teal-600 hover:bg-teal-700 text-white border-none rounded-xl">
              {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-teal-700/70 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
