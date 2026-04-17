import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Intake from './pages/Intake';
import Review from './pages/Review';
import Voting from './pages/Voting';
import Waiting from './pages/Waiting';
import Audit from './pages/Audit';
import Cases from './pages/Cases';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import CreateCase from './pages/CreateCase';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col font-sans">
          <Navbar />
          <main className="flex-1 bg-surface-50 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Navigate to="/cases" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/cases" element={<ProtectedRoute><Cases /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/create" element={<ProtectedRoute><CreateCase /></ProtectedRoute>} />
              <Route path="/intake" element={<ProtectedRoute><Intake /></ProtectedRoute>} />
              <Route path="/review" element={<ProtectedRoute><Review /></ProtectedRoute>} />
              <Route path="/vote" element={<ProtectedRoute><Voting /></ProtectedRoute>} />
              <Route path="/waiting" element={<Waiting />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
