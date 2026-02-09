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

  // --- MOCK DATA FOR INTERNAL SECTIONS ---
  
  // 4. Order Data
  const orders = [
    { id: '#ORD-9921', vendor: 'Pizza Hut', customer: 'Alice Doe', amount: '$45.00', status: 'Processing' },
    { id: '#ORD-9922', vendor: 'Burger King', customer: 'Bob Smith', amount: '$12.50', status: 'Delivered' },
    { id: '#ORD-9923', vendor: 'Tech Store', customer: 'Charlie', amount: '$120.00', status: 'Cancelled' },
  ];

  // 7. System Stats
  const [systemStats, setSystemStats] = useState({ cpu: 45, memory: 60, server: 'Online', latency: 24 });

  // --- HANDLERS ---

  // Simulate System Monitoring updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats({
        cpu: Math.floor(Math.random() * 30) + 20,
        memory: Math.floor(Math.random() * 20) + 40,
        server: 'Online',
        latency: Math.floor(Math.random() * 50) + 10
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- RENDER FUNCTIONS FOR INTERNAL MODULES ---

  // 4. Order Oversight
  const renderOrders = () => (
    <div>
      <h3 className="section-title">Order Oversight</h3>
      <div className="stats-grid">
         <div className="stat-card"><div className="stat-title">Today's Orders</div><div className="stat-value">142</div></div>
         <div className="stat-card"><div className="stat-title">Active Deliveries</div><div className="stat-value" style={{color:'#3b82f6'}}>35</div></div>
         <div className="stat-card"><div className="stat-title">Cancelled</div><div className="stat-value" style={{color:'#ef4444'}}>4</div></div>
      </div>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead><tr><th>Order ID</th><th>Vendor</th><th>Customer</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td><strong>{order.id}</strong></td>
                <td>{order.vendor}</td>
                <td>{order.customer}</td>
                <td>{order.amount}</td>
                <td>
                  <span className={`badge ${order.status === 'Delivered' ? 'badge-success' : order.status === 'Processing' ? 'badge-warning' : 'badge-danger'}`}>
                    {order.status}
                  </span>
                </td>
                <td><button className="btn-sm btn-outline">View Details</button></td>
              </tr>
            ))}
          </tbody>
        </table>
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
           <div className="stat-value">$1,254,000</div>
           <div style={{fontSize:'0.8rem', color:'#10b981', marginTop:'5px'}}>+12% this month</div>
        </div>
        <div className="stat-card">
           <div className="stat-title">Commission Earned (10%)</div>
           <div className="stat-value" style={{color:'#10b981'}}>$125,400</div>
        </div>
        <div className="stat-card">
           <div className="stat-title">Pending Vendor Payouts</div>
           <div className="stat-value" style={{color:'#f59e0b'}}>$45,200</div>
        </div>
      </div>
      
      <div className="stat-card">
         <h4 style={{marginBottom:'20px'}}>Payout Actions</h4>
         <div style={{display:'flex', gap:'15px'}}>
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
      <div className="stat-card" style={{height:'350px', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', background:'#fff'}}>
         {/* Simple CSS Chart Visualization */}
         <div style={{display:'flex', alignItems:'flex-end', gap:'20px', height:'200px', width:'80%', borderBottom:'2px solid #eee'}}>
            {[40, 60, 35, 80, 55, 90, 75, 60, 85, 95].map((h, i) => (
              <div key={i} style={{flex:1, height:`${h}%`, background:'#3b82f6', borderRadius:'4px 4px 0 0', position:'relative', transition:'height 0.5s'}}>
                 <div style={{position:'absolute', top:'-25px', width:'100%', textAlign:'center', fontSize:'0.7rem', color:'#666'}}>{h}</div>
              </div>
            ))}
         </div>
         <p style={{marginTop:'20px', color:'#666', fontWeight:'600'}}>Platform Traffic (Last 10 Days)</p>
      </div>
      <div style={{marginTop:'20px', display:'flex', gap:'15px'}}>
        <button className="btn btn-outline">📥 User Growth Report</button>
        <button className="btn btn-outline">📥 Sales Performance Report</button>
      </div>
    </div>
  );

  // 7. System Monitoring
  const renderSystem = () => (
    <div>
      <h3 className="section-title">System Monitoring</h3>
      <div className="stats-grid">
         <div className="stat-card">
            <div className="monitor-label"><span>Server Status</span><span className="badge badge-success">{systemStats.server}</span></div>
            <div style={{fontSize:'0.8rem', color:'#666', marginTop:'5px'}}>Uptime: 99.98%</div>
         </div>
         <div className="stat-card">
            <div className="monitor-label"><span>API Latency</span><span>{systemStats.latency}ms</span></div>
            <div className="progress-bg"><div className="progress-fill" style={{width: `${(systemStats.latency/100)*100}%`, background: systemStats.latency > 50 ? '#ef4444' : '#10b981'}}></div></div>
         </div>
      </div>

      <div className="stat-card" style={{maxWidth:'600px'}}>
        <h4 style={{marginBottom:'20px'}}>Resource Usage</h4>
        <div className="monitor-row">
          <div className="monitor-label"><span>CPU Usage</span><span>{systemStats.cpu}%</span></div>
          <div className="progress-bg"><div className={`progress-fill ${systemStats.cpu > 80 ? 'high' : ''}`} style={{width: `${systemStats.cpu}%`}}></div></div>
        </div>
        <div className="monitor-row">
          <div className="monitor-label"><span>Memory Usage</span><span>{systemStats.memory}%</span></div>
          <div className="progress-bg"><div className="progress-fill" style={{width: `${systemStats.memory}%`}}></div></div>
        </div>
        <div className="monitor-row">
          <div className="monitor-label"><span>Disk Space</span><span>45%</span></div>
          <div className="progress-bg"><div className="progress-fill" style={{width: '45%'}}></div></div>
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
           <h2 style={{marginBottom:'20px'}}>Dashboard Overview</h2>
           <div className="stats-grid">
             <div className="stat-card"><div className="stat-title">Total Users</div><div className="stat-value">1,204</div></div>
             <div className="stat-card"><div className="stat-title">Today's Revenue</div><div className="stat-value" style={{color:'#10b981'}}>$12,500</div></div>
             <div className="stat-card"><div className="stat-title">Pending Verifications</div><div className="stat-value" style={{color:'#f59e0b'}}>3</div></div>
             <div className="stat-card"><div className="stat-title">System Health</div><div className="stat-value" style={{color:'#3b82f6'}}>Good</div></div>
           </div>
           {renderOrders()}
        </div>
      );
      
      // External Modules
      case 'users': return <ManageUser />;
      case 'verify': return <Verification />;
      case 'products': return <ProductManagement />;
      
      // Internal Modules
      case 'orders': return <OrderOversight />;
      case 'finance': return <FinancialManagement />
      case 'reports': return <ReportsAnalytics />;
      case 'system': return <SystemMonitoring />;
      case 'config': return <PlatformConfig />;
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
          <button className={`menu-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>📦 Products</button>
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
          <div style={{display:'flex', flexDirection:'column'}}>
             <h2 style={{margin:0, fontSize:'1.2rem', color:'#1f2937'}}>Admin Dashboard</h2>
             <span style={{fontSize:'0.85rem', color:'#6b7280'}}>Welcome back, Super Admin</span>
          </div>
          <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
            <span className="badge badge-success">System Online</span>
            <div style={{width:'35px', height:'35px', background:'#e5e7eb', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'}}>👤</div>
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