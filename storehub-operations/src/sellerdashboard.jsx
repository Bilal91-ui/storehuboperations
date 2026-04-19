// SellerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

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
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  useEffect(() => {
    const getSessionData = () => {
      const saved = localStorage.getItem('sellerData') || localStorage.getItem('storehubOperationsSession');
      if (!saved) return null;
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.warn('Invalid seller session data', err);
        return null;
      }
    };

    const session = getSessionData();
    console.log('Seller dashboard session data:', session);
    if (!session) {
      console.log('No seller session found, socket not connecting');
      return;
    }

    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Seller socket connected', socket.id);
      const { user_id, userId, seller_id, sellerId } = session;
      console.log('Sending seller_login with:', { user_id: user_id || userId, seller_id: seller_id || sellerId });
      socket.emit('seller_login', {
        user_id: user_id || userId,
        seller_id: seller_id || sellerId
      });
    });

    socket.on('new_order_notification', (notificationData) => {
      console.log('Seller received new order notification:', notificationData);
      setNewOrderAlert(notificationData);
      setTimeout(() => setNewOrderAlert(null), 8000);
    });

    socket.on('connect_error', (err) => {
      console.error('Seller socket connect error:', err);
    });

    socket.on('disconnect', () => {
      console.log('Seller socket disconnected');
    });

    return () => socket.disconnect();
  }, []);

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
          {newOrderAlert && (
            <div className="order-alert-banner">
              <strong>New Order Alert:</strong> Order #{newOrderAlert.order_number || newOrderAlert.order_id} from {newOrderAlert.customer_name || 'a customer'}.
            </div>
          )}
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default SellerDashboard;