import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-danger';
      case 'Manager':
        return 'bg-primary';
      case 'SalesExecutive':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm py-2">
      <div className="container-fluid px-4">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/dashboard">
          <i className="bi bi-briefcase-fill text-primary"></i>
          <span>AcxiomCRM</span>
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#crmNavbar"
          aria-controls="crmNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="crmNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1">
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link px-3 ${isActive ? 'active fw-bold' : ''}`} to="/dashboard">
                <i className="bi bi-speedometer2 me-1"></i> Dashboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link px-3 ${isActive ? 'active fw-bold' : ''}`} to="/customers">
                <i className="bi bi-people-fill me-1"></i> Customers
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link px-3 ${isActive ? 'active fw-bold' : ''}`} to="/opportunities">
                <i className="bi bi-graph-up-arrow me-1"></i> Opportunities
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link px-3 ${isActive ? 'active fw-bold' : ''}`} to="/follow-ups">
                <i className="bi bi-calendar-check-fill me-1"></i> Follow-Ups
              </NavLink>
            </li>

            {/* Admin-Only Navigation Links */}
            {user?.role === 'Admin' && (
              <>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link px-3 ${isActive ? 'active fw-bold text-warning' : 'text-warning'}`} to="/users">
                    <i className="bi bi-shield-lock-fill me-1"></i> Users
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link px-3 ${isActive ? 'active fw-bold text-info' : 'text-info'}`} to="/audit-logs">
                    <i className="bi bi-journal-text me-1"></i> Audit Log
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2 text-light">
              <i className="bi bi-person-circle fs-5"></i>
              <span className="fw-medium">{user?.username}</span>
              <span className={`badge ${getRoleBadgeClass(user?.role)} rounded-pill px-2 py-1`}>
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
              title="Logout"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
