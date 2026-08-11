import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Heart, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const navLinks = [
  { label: 'About', href: '/#about' },
  { label: 'Features', href: '/#features' },
  { label: 'FAQs', href: '/#faqs' },
  { label: 'Contact', href: '/#contact' },
];

const PublicLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const dashboardPath = user ? `/dashboard/${user.role}` : '/login';

  return (
    <div className="min-h-screen flex flex-col bg-sand-100">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-sand-100/80 border-b border-teal-600/10">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold text-teal-600">
            <Heart className="w-6 h-6 fill-amber-500 text-amber-500" strokeWidth={1.5} />
            MindMitra
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-teal-800">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-teal-600 transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <button onClick={() => navigate(dashboardPath)} className="btn btn-sm bg-teal-600 hover:bg-teal-700 text-white border-none rounded-full px-5">
                Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-teal-800 hover:text-teal-600">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-sm bg-teal-600 hover:bg-teal-700 text-white border-none rounded-full px-5">
                  Get started
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {open && (
          <div className="md:hidden px-6 pb-4 flex flex-col gap-3 border-t border-teal-600/10">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="py-1 text-teal-800" onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              {user ? (
                <button onClick={() => navigate(dashboardPath)} className="btn btn-sm bg-teal-600 text-white border-none rounded-full flex-1">
                  Dashboard
                </button>
              ) : (
                <>
                  <Link to="/login" className="btn btn-sm btn-outline flex-1 rounded-full">Log in</Link>
                  <Link to="/register" className="btn btn-sm bg-teal-600 text-white border-none rounded-full flex-1">Sign up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-teal-600/10 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6 text-sm text-teal-700">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-semibold text-teal-600 mb-2">
              <Heart className="w-5 h-5 fill-amber-500 text-amber-500" strokeWidth={1.5} />
              MindMitra
            </div>
            <p className="max-w-xs">AI-powered mental health support built for Indian college campuses.</p>
          </div>
          <div className="flex gap-10">
            <div>
              <p className="font-semibold text-teal-800 mb-2">Platform</p>
              <ul className="space-y-1">
                <li><a href="/#features" className="hover:text-teal-600">Features</a></li>
                <li><a href="/#faqs" className="hover:text-teal-600">FAQs</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-teal-800 mb-2">Emergency</p>
              <ul className="space-y-1">
                <li>iCall: 9152987821</li>
                <li>Vandrevala: 1860-2662-345</li>
              </ul>
            </div>
          </div>
        </div>
        <p className="max-w-6xl mx-auto mt-8 pt-6 border-t border-teal-600/10 text-xs text-teal-700/70">
          © {new Date().getFullYear()} MindMitra. Built for Smart India Hackathon.
        </p>
      </footer>
    </div>
  );
};

export default PublicLayout;
