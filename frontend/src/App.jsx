import React, { useEffect } from 'react';
import { API_URL } from './config';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import SkillAnalysis from './pages/SkillAnalysis';
import Eligibility from './pages/Eligibility';
import CompanyRecords from './pages/CompanyRecords';
import ResumeMatch from './pages/ResumeMatch';
import Help from './pages/Help';
import AboutUs from './pages/AboutUs';
import Experiences from './pages/Experiences';
import AddExperience from './pages/AddExperience';
import Internships from './pages/Internships';
import PlacementDrives from './pages/PlacementDrives';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Signup from './pages/Signup';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import ExperienceTemplate from './pages/ExperienceTemplate';
import ExperienceDetail from './pages/ExperienceDetail';

// -----------------------------------------------------------------
// AuthGuard: Protects a single route. Redirects to /signup if not
// logged in as a student. Dashboard is intentionally NOT wrapped.
// -----------------------------------------------------------------
const AuthGuard = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!isAuthenticated) {
    return <Navigate to="/signup" replace />;
  }
  // Admins should use their own dashboard
  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
};

// Admin-only guard (keeps redirecting to /login for security)
const AdminGuard = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!isAuthenticated || user.role !== 'admin') {
    return <Navigate to="/login/admin" replace />;
  }
  return children;
};

function App() {
  useEffect(() => {
    const wakeBackend = async (retries = 3, delayMs = 5000) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          // mode: 'no-cors' prevents ad blockers from blocking the pre-warm ping
          await fetch(`${API_URL}/health`, { mode: 'no-cors' });
          console.log('🚀 Backend pre-warm ping sent (attempt', attempt, ')');
          return; // success — stop retrying
        } catch {
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }
    };

    wakeBackend();
    const intervalId = setInterval(wakeBackend, 10 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Router>
      <Routes>
        {/* ── Public Routes ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Navigate to="/login/student" replace />} />
        <Route path="/login/student" element={<Login defaultRole="student" />} />
        <Route path="/login/admin" element={<Login defaultRole="admin" />} />
        <Route path="/signup" element={<Signup />} />

        {/* ── Admin Dashboard ── */}
        <Route path="/admin/dashboard" element={
          <AdminGuard><AdminDashboard /></AdminGuard>
        } />

        {/* ── App Routes: Layout is always rendered (no auth on wrapper) ── */}
        {/* /app/dashboard is fully PUBLIC — no AuthGuard                  */}
        {/* Every other route is wrapped in AuthGuard → redirects to /signup */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          
          {/* 🌐 PUBLIC — accessible without login */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* 🔒 PROTECTED — requires student login */}
          <Route path="skills"          element={<AuthGuard><SkillAnalysis /></AuthGuard>} />
          <Route path="eligibility"     element={<AuthGuard><Eligibility /></AuthGuard>} />
          <Route path="records"         element={<AuthGuard><CompanyRecords /></AuthGuard>} />
          <Route path="drives"          element={<AuthGuard><PlacementDrives /></AuthGuard>} />
          <Route path="internships"     element={<AuthGuard><Internships /></AuthGuard>} />
          <Route path="experiences"     element={<AuthGuard><Experiences /></AuthGuard>} />
          <Route path="add-experience"  element={<AuthGuard><AddExperience /></AuthGuard>} />
          <Route path="template"        element={<AuthGuard><ExperienceTemplate /></AuthGuard>} />
          <Route path="experience/:id"  element={<AuthGuard><ExperienceDetail /></AuthGuard>} />
          <Route path="resume"          element={<AuthGuard><ResumeMatch /></AuthGuard>} />
          <Route path="help"            element={<AuthGuard><Help /></AuthGuard>} />
          <Route path="about"           element={<AuthGuard><AboutUs /></AuthGuard>} />
          <Route path="notifications"   element={<AuthGuard><Notifications /></AuthGuard>} />
          <Route path="profile"         element={<AuthGuard><Profile /></AuthGuard>} />
        </Route>

        {/* ── Global Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

