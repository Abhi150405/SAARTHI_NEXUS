import React from 'react';
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
import Login from './pages/Login';
import StudentLogin from './pages/StudentLogin';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Signup from './pages/Signup';
import Notifications from './pages/Notifications';
import ThemeToggle from './components/ThemeToggle';

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
  return (
    <Router>
      <ThemeToggle />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Navigate to="/login/student" replace />} />
        <Route path="/login/student" element={<StudentLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin Dashboard - Separate from main layout */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Protected Application Routes (Primary Student Routes) */}
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['student']}>
            <HomeRedirect />
          </ProtectedRoute>
        }>
          <Route index element={<LandingPage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="skills" element={<SkillAnalysis />} />
          <Route path="eligibility" element={<Eligibility />} />
          <Route path="records" element={<CompanyRecords />} />
          <Route path="experiences" element={<Experiences />} />
          <Route path="resume" element={<ResumeMatch />} />
          <Route path="help" element={<Help />} />
          <Route path="about" element={<AboutUs />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Global Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
