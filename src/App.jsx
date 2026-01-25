import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import SkillAnalysis from './pages/SkillAnalysis';
import Eligibility from './pages/Eligibility';
import ResumeMatch from './pages/ResumeMatch';
import Help from './pages/Help';
import AboutUs from './pages/AboutUs';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="skills" element={<SkillAnalysis />} />
          <Route path="eligibility" element={<Eligibility />} />
          <Route path="resume" element={<ResumeMatch />} />
          <Route path="help" element={<Help />} />
          <Route path="about" element={<AboutUs />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
