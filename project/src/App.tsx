import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AuditorList from './pages/AuditorList';
import AuditCalendar from './pages/AuditCalendar';
import AuditForm from './pages/AuditForm';
import AuditDetails from './pages/AuditDetails';
import ReportForm from './pages/ReportForm';
import AuditorManagement from './pages/AuditorManagement';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, profile } = useAuth();
  
  if (!session || profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid rgba(255, 215, 0, 0.2)',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="auditors" element={<AuditorList />} />
            <Route path="calendar" element={<AuditCalendar />} />
            <Route path="audits/new" element={<AuditForm />} />
            <Route path="audits/:id" element={<AuditDetails />} />
            <Route path="audits/:id/report" element={<ReportForm />} />
            <Route
              path="manage-auditors"
              element={
                <AdminRoute>
                  <AuditorManagement />
                </AdminRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;