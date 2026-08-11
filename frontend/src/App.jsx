import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';

import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

import LandingPage from './pages/public/LandingPage';
import NotFoundPage from './pages/public/NotFoundPage';
import ForbiddenPage from './pages/public/ForbiddenPage';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

import StudentOverview from './pages/student/StudentOverview';
import ChatPage from './pages/student/ChatPage';
import AssessmentsPage from './pages/student/AssessmentsPage';
import MoodPage from './pages/student/MoodPage';
import JournalPage from './pages/student/JournalPage';
import StudentAppointments from './pages/student/StudentAppointments';
import ForumPage from './pages/student/ForumPage';
import ResourcesPage from './pages/student/ResourcesPage';

import VolunteerOverview from './pages/volunteer/VolunteerOverview';
import ModerationQueue from './pages/volunteer/ModerationQueue';
import VolunteerActivityLog from './pages/volunteer/VolunteerActivityLog';

import CounselorOverview from './pages/counselor/CounselorOverview';
import CounselorAppointments from './pages/counselor/CounselorAppointments';
import StudentHistory from './pages/counselor/StudentHistory';
import CounselorProfile from './pages/counselor/CounselorProfile';
import SessionPage from './pages/session/SessionPage';

import AdminAnalytics from './pages/admin/AdminAnalytics';
import ManageUsers from './pages/admin/ManageUsers';
import AdminResources from './pages/admin/AdminResources';
import AdminEmergency from './pages/admin/AdminEmergency';
import AdminReports from './pages/admin/AdminReports';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', fontSize: '14px' } }} />
            <Routes>
              {/* Public */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
              </Route>

              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
              <Route path="/403" element={<ForbiddenPage />} />

              {/* Protected — requires session */}
              <Route element={<ProtectedRoute />}>
                <Route path="/session/:sessionId" element={<SessionPage />} />
                <Route element={<DashboardLayout />}>
                  {/* Student */}
                  <Route element={<RoleRoute allowedRoles={['student']} />}>
                    <Route path="/dashboard/student" element={<StudentOverview />} />
                    <Route path="/dashboard/student/chat" element={<ChatPage />} />
                    <Route path="/dashboard/student/assessments" element={<AssessmentsPage />} />
                    <Route path="/dashboard/student/mood" element={<MoodPage />} />
                    <Route path="/dashboard/student/journal" element={<JournalPage />} />
                    <Route path="/dashboard/student/appointments" element={<StudentAppointments />} />
                    <Route path="/dashboard/student/forum" element={<ForumPage />} />
                    <Route path="/dashboard/student/resources" element={<ResourcesPage />} />
                  </Route>

                  {/* Volunteer */}
                  <Route element={<RoleRoute allowedRoles={['volunteer']} />}>
                    <Route path="/dashboard/volunteer" element={<VolunteerOverview />} />
                    <Route path="/dashboard/volunteer/moderation" element={<ModerationQueue />} />
                    <Route path="/dashboard/volunteer/activity" element={<VolunteerActivityLog />} />
                  </Route>

                  {/* Counselor */}
                  <Route element={<RoleRoute allowedRoles={['counselor']} />}>
                    <Route path="/dashboard/counselor" element={<CounselorOverview />} />
                    <Route path="/dashboard/counselor/appointments" element={<CounselorAppointments />} />
                    <Route path="/dashboard/counselor/students" element={<StudentHistory />} />
                    <Route path="/dashboard/counselor/profile" element={<CounselorProfile />} />
                  </Route>

                  {/* Admin — NEVER accessible by student/volunteer/counselor */}
                  <Route element={<RoleRoute allowedRoles={['admin']} />}>
                    <Route path="/dashboard/admin" element={<AdminAnalytics />} />
                    <Route path="/dashboard/admin/users" element={<ManageUsers />} />
                    <Route path="/dashboard/admin/resources" element={<AdminResources />} />
                    <Route path="/dashboard/admin/emergency" element={<AdminEmergency />} />
                    <Route path="/dashboard/admin/reports" element={<AdminReports />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;