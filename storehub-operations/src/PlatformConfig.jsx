// PlatformConfig.jsx
import React, { useState } from 'react';
import './platformConfig.css';
import './adminDashboard.css'; // Reuse generic admin styles

const PlatformConfig = () => {
  const [activeTab, setActiveTab] = useState('general'); // general, delivery, rules, content
  const [notification, setNotification] = useState('');

  // --- CONFIGURATION STATE ---
  const [config, setConfig] = useState({
    // General
    platformName: 'StoreHub',
    supportEmail: 'support@storehub.com',
    maintenanceMode: false,
    
    // Delivery (Req 4)
    coverageCities: ['New York', 'Los Angeles', 'Chicago', 'Houston'],
    newCityInput: '',
    
    // Business Rules (Req 5)
    cancelWindow: 15, // minutes
    maxCartSize: 50, // items
    taxRate: 8.5, // %
    
    // Content (Req 6)
    welcomeMessage: 'Welcome to StoreHub! Fast delivery at your doorstep.',
    helpDocUrl: 'https://docs.storehub.com/help',
  });

  // --- AUDIT LOGS (Req 10) ---
  const [logs, setLogs] = useState([
    { id: 1, time: '2025-03-05 09:00', admin: 'SuperAdmin', action: 'System Initialized' },
    { id: 2, time: '2025-03-05 10:30', admin: 'SuperAdmin', action: 'Updated Tax Rate to 8.5%' },
  ]);

  // --- HANDLERS ---

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig({ ...config, [name]: type === 'checkbox' ? checked : value });
  };

  // Delivery Areas Logic
  const addCity = () => {
    if (config.newCityInput.trim() && !config.coverageCities.includes(config.newCityInput)) {
      setConfig({ 
        ...config, 
        coverageCities: [...config.coverageCities, config.newCityInput],
        newCityInput: '' 
      });
    }
  };

  const removeCity = (city) => {
    setConfig({
      ...config,
      coverageCities: config.coverageCities.filter(c => c !== city)
    });
  };

  // Save & Log Logic (Req 8, 9, 10)
  const handleSave = () => {
    // 9. Validation
    if (config.cancelWindow < 0) return alert("Cancellation window cannot be negative.");
    if (config.maxCartSize < 1) return alert("Max cart size must be at least 1.");
    if (!config.platformName) return alert("Platform Name is required.");

    // 10. Log Action
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleString(),
      admin: 'SuperAdmin', // Mock current user
      action: `Updated configuration settings in [${activeTab.toUpperCase()}] section.`
    };
    setLogs([newLog, ...logs]);

    // Confirmation
    setNotification('Configuration updated successfully.');
    setTimeout(() => setNotification(''), 3000);
  };

  // --- RENDER HELPERS ---

  const renderGeneral = () => (
    <div className="config-section">
      <div className="c-group">
        <label>Platform Name</label>
        <input type="text" className="c-input" name="platformName" value={config.platformName} onChange={handleInputChange} />
      </div>
      <div className="c-group">
        <label>Support Contact Email</label>
        <input type="email" className="c-input" name="supportEmail" value={config.supportEmail} onChange={handleInputChange} />
      </div>
      
      {/* Maintenance Mode (Req 7) */}
      <div className="toggle-wrapper">
        <div className="toggle-info">
          <h4>Maintenance Mode</h4>
          <p>If enabled, the app will be inaccessible to customers and riders.</p>
        </div>
        <label className="switch">
          <input type="checkbox" name="maintenanceMode" checked={config.maintenanceMode} onChange={handleInputChange} />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );

  const renderDelivery = () => (
    <div className="config-section">
      <div className="c-group">
        <label>Operational Cities (Coverage Area)</label>
        <div style={{display:'flex', gap:'10px'}}>
          <input 
            type="text" 
            className="c-input" 
            name="newCityInput" 
            placeholder="Add a city..." 
            value={config.newCityInput} 
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && addCity()}
          />
          <button className="btn btn-primary" onClick={addCity}>Add</button>
        </div>
        <div className="area-list">
          {config.coverageCities.map(city => (
            <div key={city} className="area-chip">
              {city} <span className="chip-remove" onClick={() => removeCity(city)}>&times;</span>
            </div>
          ))}
        </div>
        <p className="helper-text">Riders and Vendors can only register within these areas.</p>
      </div>
    </div>
  );

  const renderRules = () => (
    <div className="config-section">
      <div className="form-row">
        <div className="c-group">
          <label>Order Cancellation Window (Minutes)</label>
          <input type="number" className="c-input" name="cancelWindow" value={config.cancelWindow} onChange={handleInputChange} />
          <p className="helper-text">Time allowed for customers to cancel without penalty.</p>
        </div>
        <div className="c-group">
          <label>Maximum Cart Size (Items)</label>
          <input type="number" className="c-input" name="maxCartSize" value={config.maxCartSize} onChange={handleInputChange} />
        </div>
      </div>
      <div className="c-group">
        <label>Default Tax Rate (%)</label>
        <input type="number" className="c-input" name="taxRate" value={config.taxRate} onChange={handleInputChange} step="0.1" />
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="config-section">
      <div className="c-group">
        <label>App Welcome Message</label>
        <textarea className="c-textarea" name="welcomeMessage" value={config.welcomeMessage} onChange={handleInputChange} />
      </div>
      <div className="c-group">
        <label>Help Documentation URL</label>
        <input type="url" className="c-input" name="helpDocUrl" value={config.helpDocUrl} onChange={handleInputChange} />
      </div>
      <div className="c-group">
        <label>Terms of Service (Overview)</label>
        <textarea className="c-textarea" placeholder="Enter terms summary..." disabled />
        <p className="helper-text">To edit full legal documents, please contact legal department.</p>
      </div>
    </div>
  );

  return (
    <div className="config-container">
      <div className="config-header">
        <h2 className="section-title" style={{margin:0, padding:0, border:0}}>Platform Configuration</h2>
      </div>

      {notification && (
        <div style={{padding:'15px', background:'#dcfce7', color:'#166534', borderRadius:'6px', marginBottom:'20px'}}>
          ✅ {notification}
        </div>
      )}

      {/* Tabs */}
      <div className="config-tabs">
        {['general', 'delivery', 'rules', 'content'].map(tab => (
          <button 
            key={tab} 
            className={`c-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'general' && renderGeneral()}
        {activeTab === 'delivery' && renderDelivery()}
        {activeTab === 'rules' && renderRules()}
        {activeTab === 'content' && renderContent()}
      </div>

      {/* Save Action */}
      <div className="save-bar">
        <button className="btn btn-outline" onClick={() => alert("Changes discarded.")}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
      </div>

      {/* Audit Log Section */}
      <div className="audit-log">
        <h3 style={{fontSize:'1.1rem', color:'#334155'}}>Configuration Audit Log</h3>
        <table className="log-table">
          <thead><tr><th>Time</th><th>Admin</th><th>Action</th></tr></thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td className="log-time">{log.time}</td>
                <td><strong>{log.admin}</strong></td>
                <td>{log.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default PlatformConfig;