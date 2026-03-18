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
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Signup from './pages/Signup';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';


// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!isAuthenticated) {
    return <Navigate to="/login/student" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect admins to their dashboard if they hit a student-only route
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    // Redirect students home if they hit an admin-only route
    return <Navigate to="/" replace />;
  }

  return children;
};

// Role-Based Home Component
const HomeRedirect = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!isAuthenticated) return <Navigate to="/login/student" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;

  return <Layout />;
};

function App() {
  useEffect(() => {
    // Wake up the backend on load and periodic ping to keep it alive
    const wakeBackend = async () => {
      try {
        await fetch(`${API_URL}/health`);
        console.log('🚀 Backend waking process initiated');
      } catch (err) {
        console.error('⚠️ Backend waking failed:', err);
      }
    };

    wakeBackend();

    // Ping every 10 minutes to keep Render alive while user is active
    const intervalId = setInterval(wakeBackend, 10 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Router>

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Navigate to="/login/student" replace />} />
        <Route path="/login/student" element={<Login defaultRole="student" />} />
        <Route path="/login/admin" element={<Login defaultRole="admin" />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin Dashboard - Separate from main layout */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Protected Application Routes (Primary Student Routes) */}
        <Route path="/app" element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="skills" element={<SkillAnalysis />} />
          <Route path="eligibility" element={<Eligibility />} />
          <Route path="records" element={<CompanyRecords />} />
          <Route path="experiences" element={<Experiences />} />
          <Route path="add-experience" element={<AddExperience />} />
          <Route path="resume" element={<ResumeMatch />} />
          <Route path="help" element={<Help />} />
          <Route path="about" element={<AboutUs />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Global Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
