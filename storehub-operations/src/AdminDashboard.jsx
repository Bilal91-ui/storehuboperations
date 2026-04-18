// AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import './adminDashboard.css';

// --- External Modules ---
import ManageUser from './manageuser';
import OrderOversight from './OrderOversight';
import Verification from './verification';
import ProductManagement from './adminproduct';
import FinancialManagement from './FinancialManagement';
import ReportsAnalytics from './ReportsAnalytics';
import SystemMonitoring from './SystemMonitoring';
import PlatformConfig from './PlatformConfig';

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // 7. System Stats (Mock Data for Dashboard)
  const [systemStats, setSystemStats] = useState({
    cpu: 0, memory: 0, server: 'Loading...',
    latency: 0, uptime: '-', disk: 0, db: 'Checking...'
  });

  // --- HANDLERS ---

  // Simulate System Monitoring updates
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/system-stats');
        const data = await res.json();
        setSystemStats(data);
      } catch (err) {
        setSystemStats(prev => ({ ...prev, server: 'Offline', db: 'Disconnected' }));
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- RENDER FUNCTIONS FOR INTERNAL MODULES ---

  // Order Oversight Summary (SIRF BOXES, NO TABLE)
  const renderOrderStats = () => (
    <div style={{ marginTop: '20px' }}>
      <h3 className="section-title">Order Oversight</h3>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-title">Today's Orders</div><div className="stat-value">142</div></div>
        <div className="stat-card"><div className="stat-title">Active Deliveries</div><div className="stat-value" style={{ color: '#3b82f6' }}>35</div></div>
        <div className="stat-card"><div className="stat-title">Cancelled</div><div className="stat-value" style={{ color: '#ef4444' }}>4</div></div>
      </div>
    </div>
  );

  // 5. Financial Management
  const renderFinancials = () => (
    <div>
      <h3 className="section-title">Financial Management</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Platform Revenue</div>
          <div className="stat-value">PKR 1,254,000</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '5px' }}>+12% this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Commission Earned (10%)</div>
          <div className="stat-value" style={{ color: '#10b981' }}>PKR 125,400</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Pending Vendor Payouts</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>PKR 45,200</div>
        </div>
      </div>

      <div className="stat-card">
        <h4 style={{ marginBottom: '20px' }}>Payout Actions</h4>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn btn-primary">Process All Vendor Payouts</button>
          <button className="btn btn-outline">Download Financial Report</button>
        </div>
      </div>
    </div>
  );

  // 6. Reports & Analytics
  const renderAnalytics = () => (
    <div>
      <h3 className="section-title">Reports & Analytics</h3>
      <div className="stat-card" style={{ height: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#fff' }}>
        {/* Simple CSS Chart Visualization */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '200px', width: '80%', borderBottom: '2px solid #eee' }}>
          {[40, 60, 35, 80, 55, 90, 75, 60, 85, 95].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, background: '#3b82f6', borderRadius: '4px 4px 0 0', position: 'relative', transition: 'height 0.5s' }}>
              <div style={{ position: 'absolute', top: '-25px', width: '100%', textAlign: 'center', fontSize: '0.7rem', color: '#666' }}>{h}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: '20px', color: '#666', fontWeight: '600' }}>Platform Traffic (Last 10 Days)</p>
      </div>
      <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
        <button className="btn btn-outline">📥 User Growth Report</button>
        <button className="btn btn-outline">📥 Sales Performance Report</button>
      </div>
    </div>
  );

  // 7. System Monitoring
  const renderSystem = () => (

    <div>
      <div className="stat-card">
        <div className="monitor-label">
          <span>Database (MySQL)</span>
          <span className={`badge ${systemStats.db === 'Connected' ? 'badge-success' : 'badge-danger'}`}>
            {systemStats.db}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
          Server Uptime: {systemStats.uptime}
        </div>
      </div>
      <h3 className="section-title">System Monitoring</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="monitor-label"><span>Server Status</span><span className="badge badge-success">{systemStats.server}</span></div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>Uptime: 99.98%</div>
        </div>
        <div className="stat-card">
          <div className="monitor-label"><span>API Latency</span><span>{systemStats.latency}ms</span></div>
          <div className="progress-bg"><div className="progress-fill" style={{ width: `${(systemStats.latency / 100) * 100}%`, background: systemStats.latency > 50 ? '#ef4444' : '#10b981' }}></div></div>
        </div>
      </div>

      <div className="stat-card" style={{ maxWidth: '600px' }}>
        <h4 style={{ marginBottom: '20px' }}>Resource Usage</h4>
        <div className="monitor-row">
          <div className="monitor-label"><span>CPU Usage</span><span>{systemStats.cpu}%</span></div>
          <div className="progress-bg"><div className={`progress-fill ${systemStats.cpu > 80 ? 'high' : ''}`} style={{ width: `${systemStats.cpu}%` }}></div></div>
        </div>
        <div className="monitor-row">
          <div className="monitor-label"><span>Memory Usage</span><span>{systemStats.memory}%</span></div>
          <div className="progress-bg"><div className="progress-fill" style={{ width: `${systemStats.memory}%` }}></div></div>
        </div>
        <div className="monitor-row">
          <div className="monitor-label"><span>Disk Space</span><span>45%</span></div>
          <div className="progress-bg"><div className="progress-fill" style={{ width: '45%' }}></div></div>
        </div>
      </div>
    </div>
  );

  // 8. Platform Configuration
  const renderConfig = () => (
    <div>
      <h3 className="section-title">Platform Configuration</h3>
      <form className="config-form" onSubmit={(e) => { e.preventDefault(); alert('Settings Saved!'); }}>
        <div className="form-group">
          <label>Platform Name</label>
          <input type="text" defaultValue="StoreHub" />
        </div>
        <div className="form-group">
          <label>Default Commission Rate (%)</label>
          <input type="number" defaultValue="10" />
        </div>
        <div className="form-group">
          <label>Support Email</label>
          <input type="email" defaultValue="admin@storehub.com" />
        </div>
        <div className="form-group">
          <label>Maintenance Mode</label>
          <select><option>Disabled</option><option>Enabled</option></select>
        </div>
        <div className="form-group">
          <label>Allow New Registrations</label>
          <select><option>Yes</option><option>No</option></select>
        </div>
        <button className="btn btn-primary">Save Configuration</button>
      </form>
    </div>
  );

  // --- MAIN SWITCH ---
  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return (
        <div>
          <h2 style={{ marginBottom: '20px' }}>Dashboard Overview</h2>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-title">Total Users</div><div className="stat-value">1,204</div></div>
            <div className="stat-card"><div className="stat-title">Today's Revenue</div><div className="stat-value" style={{ color: '#10b981' }}>PKR 12,500</div></div>
            <div className="stat-card"><div className="stat-title">Pending Verifications</div><div className="stat-value" style={{ color: '#f59e0b' }}>3</div></div>
            <div className="stat-card"><div className="stat-title">System Health</div><div className="stat-value" style={{ color: '#3b82f6' }}>Good</div></div>
          </div>

          {/* Sirf Order Stats wale boxes show honge yahan */}
          {renderOrderStats()}
        </div>
      );

      // External Modules (Ab 'orders' sahi tarike se external file ko call karega)
      case 'users': return <ManageUser />;
      case 'verify': return <Verification />;
      case 'products': return <ProductManagement />;
      case 'orders': return <OrderOversight />;   // <-- FIXED HERE

      // Internal Modules
      case 'finance': return renderFinancials();
      case 'reports': return renderAnalytics();
      case 'system': return renderSystem();
      case 'config': return renderConfig();
      default: return <div>Select a tab</div>;
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand"><h2>Admin Panel</h2></div>
        <nav className="sidebar-menu">
          <button className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>🏠 Dashboard</button>
          <button className={`menu-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>👥 User Mgmt</button>
          <button className={`menu-item ${activeTab === 'verify' ? 'active' : ''}`} onClick={() => setActiveTab('verify')}>🛡️ Verification</button>
          <button className={`menu-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>📦 Categories</button>
          <button className={`menu-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>🛒 Orders</button>
          <button className={`menu-item ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>💰 Financials</button>
          <button className={`menu-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>📊 Analytics</button>
          <button className={`menu-item ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>🖥️ System</button>
          <button className={`menu-item ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>⚙️ Config</button>
        </nav>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1f2937' }}>Admin Dashboard</h2>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Welcome back, Super Admin</span>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span className="badge badge-success">System Online</span>
            <div style={{ width: '35px', height: '35px', background: '#e5e7eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
          </div>
        </header>
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;