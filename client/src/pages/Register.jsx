import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'SalesExecutive'
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errors = {};
    if (!formData.username.trim()) {
      errors.username = 'Username is required.';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Enter a valid email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Enter a valid email address.';
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (!passwordRegex.test(formData.password)) {
      errors.password = 'Min 8 characters, with uppercase, lowercase, digit, and special character.';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    try {
      setLoading(true);
      const res = await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setServerError(err.cleanMessage || 'Registration failed. Please try again.');
      if (err.fieldErrors && err.fieldErrors.length > 0) {
        const errors = {};
        err.fieldErrors.forEach((fe) => {
          errors[fe.field] = fe.message;
        });
        setFieldErrors(errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
      <div className="card shadow-lg p-4 p-md-5" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-1">Create Account</h2>
          <p className="text-muted small">Join AcxiomCRM organization</p>
        </div>

        {serverError && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{serverError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Username *</label>
            <input
              type="text"
              name="username"
              className={`form-control ${fieldErrors.username ? 'is-invalid' : ''}`}
              placeholder="johndoe"
              value={formData.username}
              onChange={handleChange}
            />
            {fieldErrors.username && <div className="invalid-feedback">{fieldErrors.username}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Email Address *</label>
            <input
              type="email"
              name="email"
              className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Role *</label>
            <select
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="SalesExecutive">Sales Executive</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Password *</label>
            <input
              type="password"
              name="password"
              className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
            {fieldErrors.password ? (
              <div className="invalid-feedback">{fieldErrors.password}</div>
            ) : (
              <div className="form-text small">
                Must include 8+ chars, uppercase, lowercase, digit, and special char.
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold">Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              className={`form-control ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {fieldErrors.confirmPassword && (
              <div className="invalid-feedback">{fieldErrors.confirmPassword}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold d-flex justify-content-center align-items-center gap-2"
            disabled={loading}
          >
            {loading && <span className="spinner-border spinner-border-sm" role="status"></span>}
            <span>{loading ? 'Creating Account...' : 'Register'}</span>
          </button>
        </form>

        <div className="text-center mt-3 pt-2">
          <small className="text-muted">
            Already have an account? <Link to="/login" className="text-primary text-decoration-none fw-semibold">Sign in</Link>
          </small>
        </div>
      </div>
    </div>
  );
};

export default Register;
