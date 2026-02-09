// SellerDashboard.jsx
import React, { useState } from 'react';

// --- Import External Modules ---
import ManageProduct from './ManageProduct';
import Pricing from './pricing';
import VendorOrders from './vendororders';
import Delivery from './delivery';
import Analytics from './Analytics';
import Communication from './communication';
import Settings from './settings'; // <--- 1. IMPORT THIS

// --- Import Styles ---
import './sellerDashboard.css';

const SellerDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('analytics');

  // --- Render Logic ---
  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return <ManageProduct />;

      case 'pricing':
        return <Pricing />;

      case 'orders':
        return <VendorOrders />;

      case 'delivery':
        return <Delivery />;

      case 'analytics':
        return <Analytics />;

      case 'communication':
        return <Communication />;

      // 8. External Module: Settings (UPDATED)
      case 'settings':
        // Pass setActiveTab to allow navigation to Products tab from Settings
        return <Settings setActiveTab={setActiveTab} />; // <--- 2. REPLACE THIS LINE

      default:
        return <div>Select a menu item</div>;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>Seller Panel</h3>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => setActiveTab('analytics')} className={activeTab === 'analytics' ? 'active' : ''}>
            📊 Analytics
          </button>
          <button onClick={() => setActiveTab('products')} className={activeTab === 'products' ? 'active' : ''}>
            📦 Products
          </button>
          <button onClick={() => setActiveTab('pricing')} className={activeTab === 'pricing' ? 'active' : ''}>
            🏷️ Pricing & Promos
          </button>
          <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'active' : ''}>
            🛒 Orders
          </button>
          <button onClick={() => setActiveTab('delivery')} className={activeTab === 'delivery' ? 'active' : ''}>
            🚚 Delivery
          </button>
          <button onClick={() => setActiveTab('communication')} className={activeTab === 'communication' ? 'active' : ''}>
            💬 Messages
          </button>
          <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'active' : ''}>
            ⚙️ Settings
          </button>
        </nav>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="main-area">
        <header className="dashboard-header">
          <div>
            <h1>StoreHub Dashboard</h1>
            <span style={{color: '#666', fontSize: '0.9rem'}}>Welcome back, Seller!</span>
          </div>
          <div className="user-profile">
            <span className="status-badge status-delivered" style={{cursor: 'pointer'}}>Online</span>
          </div>
        </header>
        
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default SellerDashboard;