// Settings.jsx
import React, { useState } from 'react';
import './settings.css';
import './sellerDashboard.css';

const Settings = ({ setActiveTab }) => {
  // 1. Store Profile State
  const [storeProfile, setStoreProfile] = useState({
    storeName: 'My Awesome Store',
    address: '123 Market Street, New York, NY',
    phone: '+1 (555) 123-4567',
    email: 'support@awesomestore.com',
    description: 'Best electronics and gadgets in town.'
  });

  // 2. Configuration State
  const [config, setConfig] = useState({
    openTime: '09:00',
    closeTime: '21:00',
    shipping: {
      standard: true,
      express: false,
      pickup: true
    },
    payments: {
      cod: true,
      card: true,
      wallet: false
    }
  });

  const [notification, setNotification] = useState('');

  // --- HANDLERS ---

  // Handle Text Inputs
  const handleProfileChange = (e) => {
    setStoreProfile({ ...storeProfile, [e.target.name]: e.target.value });
  };

  const handleConfigChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  // Handle Checkboxes (Nested State)
  const handleCheckboxChange = (category, field) => {
    setConfig(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: !prev[category][field]
      }
    }));
  };

  // Save & Validate
  const handleSave = (e) => {
    e.preventDefault();

    // Validation
    if (!storeProfile.storeName || !storeProfile.email) {
      alert("Store Name and Email are required.");
      return;
    }

    // Success Simulation
    setNotification('Settings saved successfully!');
    
    // Clear notification after 3 seconds
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Store Management & Settings</h2>
        <p style={{color: '#666'}}>Manage your store details, working hours, and operational preferences.</p>
      </div>

      {notification && <div className="alert-success">✅ {notification}</div>}

      <form onSubmit={handleSave}>
        
        {/* Section 1: Store Details */}
        <div className="settings-section">
          <h3>Store Profile</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Store Name *</label>
              <input type="text" name="storeName" value={storeProfile.storeName} onChange={handleProfileChange} />
            </div>
            <div className="form-group">
              <label>Support Email *</label>
              <input type="email" name="email" value={storeProfile.email} onChange={handleProfileChange} />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" name="phone" value={storeProfile.phone} onChange={handleProfileChange} />
            </div>
            <div className="form-group">
              <label>Store Address</label>
              <input type="text" name="address" value={storeProfile.address} onChange={handleProfileChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Store Description</label>
            <textarea 
              name="description" 
              rows="3" 
              value={storeProfile.description} 
              onChange={handleProfileChange}
              style={{padding:'10px', border:'1px solid #ddd', borderRadius:'4px', width:'100%'}}
            />
          </div>
        </div>

        {/* Section 2: Product Catalog Link */}
        <div className="settings-section">
          <h3>Product Catalog</h3>
          <div className="catalog-link-box">
             <div>
                <strong>Manage Listed Products</strong>
                <div style={{fontSize:'0.9rem', color:'#555'}}>Add, update, or remove products from your store catalog.</div>
             </div>
             {/* Note: setActiveTab is passed from Dashboard to allow navigation */}
             <button type="button" className="action-btn" onClick={() => setActiveTab('products')}>Go to Products ➔</button>
          </div>
        </div>

        {/* Section 3: Operational Settings */}
        <div className="settings-section">
          <h3>Operations & Configuration</h3>
          
          <div className="form-grid" style={{marginBottom:'20px'}}>
            <div className="form-group">
               <label>Opening Time</label>
               <input type="time" name="openTime" value={config.openTime} onChange={handleConfigChange} />
            </div>
            <div className="form-group">
               <label>Closing Time</label>
               <input type="time" name="closeTime" value={config.closeTime} onChange={handleConfigChange} />
            </div>
          </div>

          <div style={{marginBottom:'20px'}}>
            <label style={{fontWeight:'bold', display:'block', marginBottom:'10px'}}>Shipping Options</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" checked={config.shipping.standard} onChange={() => handleCheckboxChange('shipping', 'standard')} />
                Standard Delivery
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={config.shipping.express} onChange={() => handleCheckboxChange('shipping', 'express')} />
                Express Shipping
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={config.shipping.pickup} onChange={() => handleCheckboxChange('shipping', 'pickup')} />
                In-Store Pickup
              </label>
            </div>
          </div>

          <div>
            <label style={{fontWeight:'bold', display:'block', marginBottom:'10px'}}>Accepted Payment Methods</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" checked={config.payments.cod} onChange={() => handleCheckboxChange('payments', 'cod')} />
                Cash on Delivery (COD)
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={config.payments.card} onChange={() => handleCheckboxChange('payments', 'card')} />
                Credit/Debit Card
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={config.payments.wallet} onChange={() => handleCheckboxChange('payments', 'wallet')} />
                Digital Wallet
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="settings-actions">
          <button type="button" className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-save">Save Changes</button>
        </div>

      </form>
    </div>
  );
};

export default Settings;