// FinancialManagement.jsx
import React, { useState } from 'react';
import './financialManagement.css';
import './adminDashboard.css'; // Reuse generic admin styles

const FinancialManagement = () => {
  // --- STATE ---
  
  // 3. Current Settings
  const [commissionRate, setCommissionRate] = useState(10); // Percentage
  const [gateways, setGateways] = useState([
    { id: 1, name: 'Stripe', status: 'Active' },
    { id: 2, name: 'PayPal', status: 'Active' },
    { id: 3, name: 'Cash on Delivery', status: 'Active' }
  ]);

  // 3. Transaction Logs
  const [transactions, setTransactions] = useState([
    { id: 'TXN-881', date: '2025-03-01', vendor: 'Burger King', amount: 150.00, commission: 15.00, status: 'Verified' },
    { id: 'TXN-882', date: '2025-03-02', vendor: 'Pizza Hut', amount: 320.00, commission: 32.00, status: 'Pending' },
    { id: 'TXN-883', date: '2025-03-02', vendor: 'Tech Store', amount: 1200.00, commission: 120.00, status: 'Pending' },
  ]);

  // 7. System Logs
  const [logs, setLogs] = useState([
    { time: '10:00 AM', action: 'System initialized financial module.' }
  ]);

  // UI State
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [newRate, setNewRate] = useState(commissionRate);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [newGatewayName, setNewGatewayName] = useState('');

  // --- HANDLERS ---

  const addLog = (action) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, action }, ...prev]);
  };

  // 5. Update Commission
  const handleUpdateCommission = () => {
    if (newRate < 0 || newRate > 100) return alert("Invalid rate");
    setCommissionRate(newRate);
    addLog(`Commission rate updated to ${newRate}% by Admin.`);
    // 8. Notify parties
    alert(`Success: Commission rate updated to ${newRate}%. Vendors notified via email.`);
    setShowCommissionModal(false);
  };

  // 4. Add/Remove Gateways
  const handleAddGateway = () => {
    if (!newGatewayName.trim()) return;
    const newGateway = { id: Date.now(), name: newGatewayName, status: 'Active' };
    setGateways([...gateways, newGateway]);
    addLog(`Payment Gateway '${newGatewayName}' added.`);
    setNewGatewayName('');
    setShowGatewayModal(false);
  };

  const handleRemoveGateway = (id, name) => {
    if (window.confirm(`Remove ${name} from payment options?`)) {
      setGateways(gateways.filter(g => g.id !== id));
      addLog(`Payment Gateway '${name}' removed.`);
    }
  };

  // 6. Review Transactions
  const handleVerifyTransaction = (id) => {
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, status: 'Verified' } : t
    ));
    addLog(`Transaction ${id} verified and processed.`);
  };

  // --- RENDER ---
  return (
    <div className="finance-container">
      <div className="finance-header">
        <h2 className="section-title" style={{margin:0, border:0, padding:0}}>Financial Management</h2>
        <div className="badge badge-blue">System Currency: USD ($)</div>
      </div>

      <div className="finance-grid">
        
        {/* Commission Card */}
        <div className="f-card">
          <div className="f-card-header">
            <span className="f-card-title">Platform Commission</span>
            <button className="btn-sm btn-outline" onClick={() => setShowCommissionModal(true)}>Update</button>
          </div>
          <div className="commission-display">{commissionRate}%</div>
          <p className="commission-sub">Applied to all vendor sales automatically.</p>
        </div>

        {/* Payment Gateways Card */}
        <div className="f-card">
          <div className="f-card-header">
            <span className="f-card-title">Payment Gateways</span>
            <button className="btn-sm btn-primary" onClick={() => setShowGatewayModal(true)}>+ Add</button>
          </div>
          <ul className="gateway-list">
            {gateways.map(g => (
              <li key={g.id} className="gateway-item">
                <div className="gateway-info">
                  <div className="gateway-status"></div>
                  {g.name}
                </div>
                <button className="btn-sm btn-danger" style={{padding:'2px 8px'}} onClick={() => handleRemoveGateway(g.id, g.name)}>✕</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Transaction Logs */}
      <h3 style={{color:'#374151', marginBottom:'15px'}}>Transaction Logs & Verification</h3>
      <div className="finance-table-container">
        <table className="finance-table">
          <thead>
            <tr>
              <th>TXN ID</th>
              <th>Date</th>
              <th>Vendor</th>
              <th>Total Sale</th>
              <th>Platform Cut ({commissionRate}%)</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td><strong>{t.id}</strong></td>
                <td>{t.date}</td>
                <td>{t.vendor}</td>
                <td className="amount-inc">${t.amount.toFixed(2)}</td>
                <td className="amount-out">${t.commission.toFixed(2)}</td>
                <td>
                  <span className={`badge ${t.status === 'Verified' ? 'badge-success' : 'badge-warning'}`}>
                    {t.status}
                  </span>
                </td>
                <td>
                  {t.status === 'Pending' && (
                    <button className="btn-sm btn-outline" onClick={() => handleVerifyTransaction(t.id)}>Verify</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 7. System Logs Display */}
      <div className="system-logs">
        <strong>System Audit Log:</strong>
        <div style={{marginTop:'10px'}}>
          {logs.map((log, idx) => (
            <div key={idx} className="log-entry">
              <span className="log-time">[{log.time}]</span>
              {log.action}
            </div>
          ))}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Edit Commission Modal */}
      {showCommissionModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth:'400px'}}>
            <h3 style={{marginTop:0}}>Update Commission Rate</h3>
            <div className="input-row">
              <input type="number" value={newRate} onChange={e => setNewRate(e.target.value)} />
              <span style={{alignSelf:'center', fontWeight:'bold'}}>%</span>
            </div>
            <div style={{display:'flex', gap:'10px'}}>
              <button className="btn btn-primary" style={{flex:1}} onClick={handleUpdateCommission}>Save & Notify</button>
              <button className="btn btn-outline" style={{flex:1}} onClick={() => setShowCommissionModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Gateway Modal */}
      {showGatewayModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth:'400px'}}>
            <h3 style={{marginTop:0}}>Add Payment Gateway</h3>
            <div className="input-row">
              <input type="text" placeholder="Gateway Name (e.g. Google Pay)" value={newGatewayName} onChange={e => setNewGatewayName(e.target.value)} />
            </div>
            <div style={{display:'flex', gap:'10px'}}>
              <button className="btn btn-primary" style={{flex:1}} onClick={handleAddGateway}>Add Gateway</button>
              <button className="btn btn-outline" style={{flex:1}} onClick={() => setShowGatewayModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinancialManagement;