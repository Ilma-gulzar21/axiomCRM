import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      setError(err.cleanMessage || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading metrics...</span>
        </div>
      </div>
    );
  }

  const cards = metrics?.cards || {
    totalCustomers: 0,
    openOpportunities: 0,
    wonOpportunities: 0,
    lostOpportunities: 0,
    totalPipelineValue: 0,
    pendingFollowUps: 0
  };

  const stageData = {
    labels: metrics?.charts?.stageDistribution?.labels || [],
    datasets: [
      {
        label: 'Opportunities',
        data: metrics?.charts?.stageDistribution?.data || [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.75)',
          'rgba(255, 206, 86, 0.75)',
          'rgba(153, 102, 255, 0.75)',
          'rgba(75, 192, 192, 0.75)',
          'rgba(255, 99, 132, 0.75)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const wonVsLostData = {
    labels: ['Won', 'Lost'],
    datasets: [
      {
        data: metrics?.charts?.wonVsLost?.data || [0, 0],
        backgroundColor: ['rgba(25, 135, 84, 0.8)', 'rgba(220, 53, 69, 0.8)'],
        borderColor: ['#198754', '#dc3545'],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header & Role Scope Banner */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">CRM Analytics & Pipeline Dashboard</h3>
          <p className="text-muted small mb-0">
            Welcome back, <strong className="text-dark">{user?.username}</strong>. Role:{' '}
            <span className="badge bg-secondary">{user?.role}</span>
          </p>
        </div>
        <div className="mt-2 mt-sm-0">
          <span className="badge bg-light text-dark border p-2">
            <i className="bi bi-shield-check text-primary me-1"></i>
            {user?.role === 'SalesExecutive'
              ? 'Scoped: Showing your assigned & created records'
              : 'Scoped: Organization-wide metrics (All accounts)'}
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card metric-card border-0 shadow-sm h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-semibold">Total Customers</span>
                <div className="p-2 rounded bg-primary bg-opacity-10 text-primary">
                  <i className="bi bi-people-fill fs-5"></i>
                </div>
              </div>
              <h3 className="fw-bold mb-0 text-dark">{cards.totalCustomers}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card metric-card border-0 shadow-sm h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-semibold">Open Deals</span>
                <div className="p-2 rounded bg-info bg-opacity-10 text-info">
                  <i className="bi bi-lightning-charge-fill fs-5"></i>
                </div>
              </div>
              <h3 className="fw-bold mb-0 text-dark">{cards.openOpportunities}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card metric-card border-0 shadow-sm h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-semibold">Won Deals</span>
                <div className="p-2 rounded bg-success bg-opacity-10 text-success">
                  <i className="bi bi-trophy-fill fs-5"></i>
                </div>
              </div>
              <h3 className="fw-bold mb-0 text-success">{cards.wonOpportunities}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card metric-card border-0 shadow-sm h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-semibold">Lost Deals</span>
                <div className="p-2 rounded bg-danger bg-opacity-10 text-danger">
                  <i className="bi bi-x-circle-fill fs-5"></i>
                </div>
              </div>
              <h3 className="fw-bold mb-0 text-danger">{cards.lostOpportunities}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card metric-card border-0 shadow-sm h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-semibold">Pipeline Value</span>
                <div className="p-2 rounded bg-warning bg-opacity-10 text-warning">
                  <i className="bi bi-cash-stack fs-5"></i>
                </div>
              </div>
              <h4 className="fw-bold mb-0 text-dark">{formatCurrency(cards.totalPipelineValue)}</h4>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card metric-card border-0 shadow-sm h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-semibold">Pending Follow-Ups</span>
                <div className="p-2 rounded bg-secondary bg-opacity-10 text-secondary">
                  <i className="bi bi-calendar-event-fill fs-5"></i>
                </div>
              </div>
              <h3 className="fw-bold mb-0 text-dark">{cards.pendingFollowUps}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Chart.js Charts Row */}
      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-bar-chart-fill text-primary me-2"></i>
                Opportunities by Stage
              </h6>
              <span className="badge bg-light text-muted border">Bar Chart</span>
            </div>
            <div className="card-body p-4" style={{ minHeight: '340px' }}>
              <Bar
                data={stageData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-pie-chart-fill text-success me-2"></i>
                Won vs Lost Ratio
              </h6>
              <span className="badge bg-light text-muted border">Doughnut Chart</span>
            </div>
            <div className="card-body p-4 d-flex align-items-center justify-content-center" style={{ minHeight: '340px' }}>
              {cards.wonOpportunities === 0 && cards.lostOpportunities === 0 ? (
                <div className="text-muted text-center">No closed deals yet to display ratio.</div>
              ) : (
                <div style={{ width: '240px', height: '240px' }}>
                  <Doughnut
                    data={wonVsLostData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' }
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
