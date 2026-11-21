import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import AlertBanner from '../components/AlertBanner';

const Customers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    companyName: '',
    address: '',
    city: '',
    state: '',
    status: 'Active'
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Deactivate modal state
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const fetchCustomers = async (currentPage = 1, currentSearch = search, currentStatus = statusFilter) => {
    try {
      setLoading(true);
      const res = await api.get('/customers', {
        params: {
          page: currentPage,
          limit: 10,
          search: currentSearch,
          status: currentStatus || undefined
        }
      });
      if (res.data.success) {
        setCustomers(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
        setPage(res.data.page);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.cleanMessage || 'Failed to fetch customers.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1, search, statusFilter);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers(1, search, statusFilter);
  };

  const handleResetSearch = () => {
    setSearch('');
    fetchCustomers(1, '', statusFilter);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.customerName.trim()) {
      errors.customerName = 'Customer Name is required.';
    } else if (formData.customerName.length > 100) {
      errors.customerName = 'Customer Name cannot exceed 100 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    const phoneRegex = /^\d{10}$/;
    if (!formData.phone.trim() || !phoneRegex.test(formData.phone.trim())) {
      errors.phone = 'Enter a valid phone number.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      customerName: '',
      email: '',
      phone: '',
      companyName: '',
      address: '',
      city: '',
      state: '',
      status: 'Active'
    });
    setFieldErrors({});
    setIsFormModalOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      customerName: cust.customerName || '',
      email: cust.email || '',
      phone: cust.phone || '',
      companyName: cust.companyName || '',
      address: cust.address || '',
      city: cust.city || '',
      state: cust.state || '',
      status: cust.status || 'Active'
    });
    setFieldErrors({});
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        setAlert({ type: 'success', message: `Customer "${formData.customerName}" updated successfully.` });
      } else {
        await api.post('/customers', formData);
        setAlert({ type: 'success', message: `Customer "${formData.customerName}" created successfully.` });
      }
      setIsFormModalOpen(false);
      fetchCustomers(page, search, statusFilter);
    } catch (err) {
      if (err.fieldErrors && err.fieldErrors.length > 0) {
        const errors = {};
        err.fieldErrors.forEach((fe) => {
          errors[fe.field] = fe.message;
        });
        setFieldErrors(errors);
      } else {
        setAlert({ type: 'danger', message: err.cleanMessage || 'Operation failed.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget) return;
    try {
      await api.delete(`/customers/${deactivateTarget.id}`);
      setAlert({ type: 'success', message: `Customer "${deactivateTarget.customerName}" deactivated.` });
      setDeactivateTarget(null);
      fetchCustomers(page, search, statusFilter);
    } catch (err) {
      setAlert({ type: 'danger', message: err.cleanMessage || 'Deactivation failed.' });
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-bold mb-1">Customer Accounts</h3>
          <p className="text-muted small mb-0">
            {user?.role === 'SalesExecutive'
              ? 'Viewing and managing your created customer accounts'
              : 'Enterprise customer repository & directory'}
          </p>
        </div>
        <button className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm" onClick={openCreateModal}>
          <i className="bi bi-plus-circle"></i>
          <span>Add Customer</span>
        </button>
      </div>

      <AlertBanner alert={alert} onClose={() => setAlert(null)} />

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, email, phone, company, or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive (Deactivated)</option>
              </select>
            </div>
            <div className="col-6 col-md-4 d-flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm px-3">
                Filter
              </button>
              {search && (
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleResetSearch}>
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Code</th>
                <th>Customer Name</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Status</th>
                <th>Created By</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No customer accounts found matching your query.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td><span className="badge bg-light text-dark border fw-medium">{c.customerCode}</span></td>
                    <td className="fw-semibold text-dark">{c.customerName}</td>
                    <td>{c.companyName || '-'}</td>
                    <td>
                      <div><small className="text-dark"><i className="bi bi-envelope me-1 text-muted"></i>{c.email}</small></div>
                      <div><small className="text-muted"><i className="bi bi-telephone me-1"></i>{c.phone}</small></div>
                    </td>
                    <td>
                      <small className="text-muted">{[c.city, c.state].filter(Boolean).join(', ') || '-'}</small>
                    </td>
                    <td>
                      <span className={`badge ${c.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td><small className="text-muted">{c.creator?.username || 'System'}</small></td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          title="Edit Customer"
                          onClick={() => openEditModal(c)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        {c.status === 'Active' && (
                          <button
                            className="btn btn-outline-danger"
                            title="Deactivate Customer"
                            onClick={() => setDeactivateTarget(c)}
                          >
                            <i className="bi bi-person-x"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={(p) => fetchCustomers(p, search, statusFilter)}
          />
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isFormModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editingCustomer ? `Edit Customer (${editingCustomer.customerCode})` : 'New Customer Account'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setIsFormModalOpen(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit} noValidate>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Customer Name *</label>
                      <input
                        type="text"
                        className={`form-control ${fieldErrors.customerName ? 'is-invalid' : ''}`}
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        placeholder="John Doe or Acme Inc."
                      />
                      {fieldErrors.customerName && <div className="invalid-feedback">{fieldErrors.customerName}</div>}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Company Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Acme Global Corp"
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Email Address *</label>
                      <input
                        type="email"
                        className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="client@acme.com"
                      />
                      {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Phone Number (10 digits) *</label>
                      <input
                        type="text"
                        maxLength="10"
                        className={`form-control ${fieldErrors.phone ? 'is-invalid' : ''}`}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="9876543210"
                      />
                      {fieldErrors.phone && <div className="invalid-feedback">{fieldErrors.phone}</div>}
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Street Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Corporate Way, Suite 400"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">City</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="New York"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">State</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="NY"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Status</label>
                      <select
                        className="form-select"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsFormModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                    {submitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deactivate Modal */}
      <ConfirmModal
        isOpen={!!deactivateTarget}
        title="Deactivate Customer"
        message={`Are you sure you want to deactivate "${deactivateTarget?.customerName}" (${deactivateTarget?.customerCode})? This will mark the customer as Inactive.`}
        confirmText="Deactivate"
        confirmVariant="danger"
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
};

export default Customers;
