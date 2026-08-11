import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-sand-100 px-6 text-center">
    <div>
      <Heart className="w-10 h-10 fill-amber-500 text-amber-500 mx-auto mb-4" strokeWidth={1.5} />
      <h1 className="font-display text-5xl font-semibold text-teal-900 mb-3">404</h1>
      <p className="text-teal-700/70 mb-6">This page doesn't exist.</p>
      <Link to="/" className="btn bg-teal-600 text-white border-none rounded-full px-6">Go home</Link>
    </div>
  </div>
);

export default NotFoundPage;
