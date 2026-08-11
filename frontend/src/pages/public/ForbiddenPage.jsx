import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const ForbiddenPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-sand-100 px-6 text-center">
    <div>
      <ShieldAlert className="w-12 h-12 text-clay-500 mx-auto mb-4" />
      <h1 className="font-display text-3xl font-semibold text-teal-900 mb-3">403 — Access denied</h1>
      <p className="text-teal-700/70 mb-6 max-w-sm mx-auto">You don't have permission to view this page. This area is restricted by role.</p>
      <Link to="/" className="btn bg-teal-600 text-white border-none rounded-full px-6">Go home</Link>
    </div>
  </div>
);

export default ForbiddenPage;
