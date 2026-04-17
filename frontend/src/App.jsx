import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardOverview from './pages/DashboardOverview';
import TutorManagement from './pages/TutorManagement';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="tutors" element={<TutorManagement />} />
          <Route path="students" element={<div className="p-6">Quản lý Học viên (Đang phát triển)</div>} />
          <Route path="classes" element={<div className="p-6">Sắp xếp Lớp học (Đang phát triển)</div>} />
          <Route path="finance" element={<div className="p-6">Tài chính (Đang phát triển)</div>} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
