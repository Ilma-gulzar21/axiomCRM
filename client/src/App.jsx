import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Opportunities from './pages/Opportunities';
import FollowUps from './pages/FollowUps';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';

// Wrapper for protected layout
const AppLayout = ({ children, allowedRoles }) => {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Navbar />
      <main className="pb-5">{children}</main>
    </ProtectedRoute>
  );
};

// Redirect logged-in user away from Login/Register
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* General CRM Routes (All Authenticated Roles) */}
      <Route
        path="/dashboard"
        element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        }
      />
      <Route
        path="/customers"
        element={
          <AppLayout>
            <Customers />
          </AppLayout>
        }
      />
      <Route
        path="/opportunities"
        element={
          <AppLayout>
            <Opportunities />
          </AppLayout>
        }
      />
      <Route
        path="/follow-ups"
        element={
          <AppLayout>
            <FollowUps />
          </AppLayout>
        }
      />

      {/* Admin Only Routes */}
      <Route
        path="/users"
        element={
          <AppLayout allowedRoles={['Admin']}>
            <UserManagement />
          </AppLayout>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <AppLayout allowedRoles={['Admin']}>
            <AuditLogs />
          </AppLayout>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
