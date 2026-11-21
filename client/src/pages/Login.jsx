import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.cleanMessage || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError('');
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
      <div className="card shadow-lg p-4 p-md-5" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex p-3 rounded-circle bg-primary bg-opacity-10 text-primary mb-2">
            <i className="bi bi-briefcase-fill fs-1"></i>
          </div>
          <h2 className="fw-bold mb-1">AcxiomCRM</h2>
          <p className="text-muted small">Sign in to your CRM workspace</p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="bi bi-envelope"></i></span>
              <input
                type="email"
                className="form-control"
                placeholder="name@acxiomcrm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="bi bi-lock"></i></span>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold d-flex justify-content-center align-items-center gap-2"
            disabled={loading}
          >
            {loading && <span className="spinner-border spinner-border-sm" role="status"></span>}
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-4 pt-3 border-top">
          <p className="text-muted small mb-2 text-center fw-semibold">Quick Demo Login:</p>
          <div className="d-grid gap-2">
            <button
              type="button"
              className="btn btn-outline-danger btn-sm text-start d-flex justify-content-between align-items-center"
              onClick={() => fillCredentials('admin@acxiomcrm.com', 'Admin@12345')}
            >
              <span><i className="bi bi-shield-lock-fill me-1"></i> Admin User</span>
              <span className="badge bg-danger">Full Access</span>
            </button>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm text-start d-flex justify-content-between align-items-center"
              onClick={() => fillCredentials('manager@acxiomcrm.com', 'Manager@12345')}
            >
              <span><i className="bi bi-person-badge-fill me-1"></i> Manager User</span>
              <span className="badge bg-primary">All CRM Data</span>
            </button>
            <button
              type="button"
              className="btn btn-outline-success btn-sm text-start d-flex justify-content-between align-items-center"
              onClick={() => fillCredentials('sales@acxiomcrm.com', 'Sales@12345')}
            >
              <span><i className="bi bi-person-fill me-1"></i> Sales Executive</span>
              <span className="badge bg-success">Assigned Only</span>
            </button>
          </div>
        </div>

        <div className="text-center mt-3 pt-2">
          <small className="text-muted">
            Need an account? <Link to="/register" className="text-primary text-decoration-none fw-semibold">Register here</Link>
          </small>
        </div>
      </div>
    </div>
  );
};

export default Login;
