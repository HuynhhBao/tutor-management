import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardOverview from './pages/Admin/DashboardOverview';
import TutorManagement from './pages/Admin/TutorManagement';
import AdminBookingManagement from './pages/Admin/AdminBookingManagement';
import AdminLayout from './components/layout/AdminLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import AdminLoginPage from './pages/Auth/AdminLoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ProfilePage from './pages/User/ProfilePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import TutorLayout from './components/layout/TutorLayout';
import TutorDashboard from './pages/Tutor/TutorDashboard';
import StudentLayout from './components/layout/StudentLayout';
import StudentDashboard from './pages/User/StudentDashboard';
import TutorSearchPage from './pages/User/TutorSearchPage';
import HiringHistoryPage from './pages/User/HiringHistoryPage';
import WalletPage from './pages/User/WalletPage';
import BookingPage from './pages/User/BookingPage';
import BookingHistoryPage from './pages/User/BookingHistoryPage';
import ChatPage from './pages/Common/ChatPage';
import CvViewerPage from './pages/Admin/CvViewerPage';

// Component to handle root path redirection based on auth state
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'tutor') return <Navigate to="/tutor-dashboard" replace />;
    return <Navigate to="/student-dashboard" replace />;
  }
  
  return <LandingPage />;
};

function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomeRedirect />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute allowedRoles={['user', 'admin', 'tutor']} redirectPath="/">
                <div className="min-h-screen bg-slate-100">
                  <ProfilePage />
                </div>
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes - Protected */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']} redirectPath="/admin/login">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="tutors" element={<TutorManagement />} />
            <Route path="bookings" element={<AdminBookingManagement />} />
            <Route path="students" element={<div className="p-6">Quản lý Học viên (Đang phát triển)</div>} />
            <Route path="classes" element={<div className="p-6">Sắp xếp Lớp học (Đang phát triển)</div>} />
            <Route path="finance" element={<div className="p-6">Tài chính (Đang phát triển)</div>} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>

          <Route 
            path="/cv-viewer" 
            element={
              <ProtectedRoute allowedRoles={['admin']} redirectPath="/admin/login">
                <CvViewerPage />
              </ProtectedRoute>
            } 
          />

          {/* Tutor Routes - Protected */}
          <Route 
            path="/tutor-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['tutor']} redirectPath="/">
                <TutorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TutorDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="my-classes" element={<div className="p-6">Lớp của tôi (Đang phát triển)</div>} />
            <Route path="*" element={<Navigate to="/tutor-dashboard" replace />} />
          </Route>

          {/* Student Routes - Protected */}
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['user']} redirectPath="/">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="search" element={<TutorSearchPage />} />
            <Route path="booking" element={<BookingPage />} />
            <Route path="booking-history" element={<BookingHistoryPage />} />
            <Route path="history" element={<HiringHistoryPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/student-dashboard" replace />} />
          </Route>


          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
