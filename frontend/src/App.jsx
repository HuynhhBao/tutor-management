import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardOverview from './pages/DashboardOverview';
import TutorManagement from './pages/TutorManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="tutors" element={<TutorManagement />} />
          <Route path="students" element={<div className="p-6">Quản lý Học viên (Đang phát triển)</div>} />
          <Route path="classes" element={<div className="p-6">Sắp xếp Lớp học (Đang phát triển)</div>} />
          <Route path="finance" element={<div className="p-6">Tài chính (Đang phát triển)</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
