// Verification.jsx
import React, { useState, useEffect } from 'react';
import './verification.css';
import './adminDashboard.css';

const Verification = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [notification, setNotification] = useState('');
  const[notifyCheck, setNotifyCheck] = useState(true);

  // Fetch only "pending" users from backend
  useEffect(() => {
    fetchPendingRequests();
  },[]);

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/users");
      const data = await res.json();
      // Filter strictly for pending status
      const pendingUsers = data.filter(u => u.status === 'pending');
      setRequests(pendingUsers);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching pending requests:", err);
      setLoading(false);
    }
  };

  const handleReview = (req) => {
    setSelectedReq(req);
  };

  const handleCloseModal = () => {
    setSelectedReq(null);
  };

  const getPhone = (user) => {
    return user.role === 'rider' ? user.rider_phone : user.role === 'seller' ? user.seller_phone : 'N/A';
  };

  // Process Approval or Rejection via Backend
  const processRequest = async (actionStatus) => {
    const dbStatus = actionStatus === 'Approved' ? 'approved' : 'rejected';

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${selectedReq.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: dbStatus, notify: notifyCheck })
      });

      if (res.ok) {
        // Remove processed request from the list
        setRequests(requests.filter(r => r.id !== selectedReq.id));
        
        const msg = `Account for ${selectedReq.name} has been ${actionStatus.toLowerCase()}. ${notifyCheck ? 'Notification email sent.' : ''}`;
        setNotification(msg);
        setTimeout(() => setNotification(''), 4000);
        
        handleCloseModal();
      } else {
        alert("Failed to process request. Server error.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  };

  if (loading) return <div>Loading pending verifications...</div>;

  return (
    <div className="verification-container">
      <div className="verify-header">
        <div>
          <h2 className="section-title" style={{marginBottom:0, borderLeft:'none', paddingLeft:0}}>Verification Requests</h2>
          <p style={{color:'#64748b', margin:'5px 0 0 0'}}>Review and approve new partner applications.</p>
        </div>
      </div>

      {notification && (
        <div style={{padding:'15px', background:'#f0fdf4', color:'#166534', border:'1px solid #bbf7d0', borderRadius:'6px', marginBottom:'20px'}}>
          ✅ {notification}
        </div>
      )}

      {/* Stats Summary */}
      <div className="verify-stats">
        <div className="v-stat-card">
          <div className="v-stat-val">{requests.length}</div>
          <div className="v-stat-label">Total Pending</div>
        </div>
        <div className="v-stat-card">
          <div className="v-stat-val">{requests.filter(r => r.role === 'seller').length}</div>
          <div className="v-stat-label">Vendors</div>
        </div>
        <div className="v-stat-card">
          <div className="v-stat-val">{requests.filter(r => r.role === 'rider').length}</div>
          <div className="v-stat-label">Riders</div>
        </div>
      </div>

      {/* Display Pending Accounts */}
      <div className="admin-table-container">
        <table className="verify-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Type</th>
              <th>City</th>
              <th>Submitted Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>No pending verifications. Good job!</td></tr>
            ) : (
              requests.map(req => (
                <tr key={req.id}>
                  <td className="user-info">
                    <div style={{fontWeight: 'bold'}}>{req.name}</div>
                    <span style={{fontSize: '0.85rem', color: '#64748b'}}>{req.email}</span>
                  </td>
                  <td>
                    <span className={`badge ${req.role === 'seller' ? 'badge-blue' : 'badge-warning'}`}>
                      {req.role === 'seller' ? 'Vendor' : 'Rider'}
                    </span>
                  </td>
                  <td>{req.city || 'N/A'}</td>
                  <td>{req.joined}</td>
                  <td>
                    <button className="btn-review" onClick={() => handleReview(req)} style={{padding: '6px 12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
                      Review Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selectedReq && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth:'600px', maxHeight: '85vh', overflowY: 'auto'}}>
            <div className="modal-header">
              <h3>Review Application</h3>
              <button className="close-btn" onClick={handleCloseModal} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>&times;</button>
            </div>

            <div style={{marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
              <h4 style={{marginBottom: '10px', color: '#4f46e5'}}>Personal Details</h4>
              <p><strong>Name:</strong> {selectedReq.name}</p>
              <p><strong>Email:</strong> {selectedReq.email}</p>
              <p><strong>Phone:</strong> {getPhone(selectedReq)}</p>
              <p><strong>CNIC:</strong> {selectedReq.cnic_number || 'N/A'}</p>
              <p><strong>City:</strong> {selectedReq.city || 'N/A'}</p>
            </div>

            {selectedReq.role === 'rider' && (
              <div style={{marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                <h4 style={{marginBottom: '10px', color: '#4f46e5'}}>Vehicle Information</h4>
                <p><strong>Vehicle Type:</strong> {selectedReq.vehicle_type}</p>
                <p><strong>License Number:</strong> {selectedReq.license_number || 'N/A'}</p>
              </div>
            )}

            {selectedReq.role === 'seller' && (
              <div style={{marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                <h4 style={{marginBottom: '10px', color: '#4f46e5'}}>Business Details</h4>
                <p><strong>Business Name:</strong> {selectedReq.business_name}</p>
                <p><strong>Business Type:</strong> {selectedReq.business_type}</p>
                <p><strong>Store Address:</strong> {selectedReq.store_address}</p>
              </div>
            )}

            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
               <input type="checkbox" checked={notifyCheck} onChange={e => setNotifyCheck(e.target.checked)} id="notify"/>
               <label htmlFor="notify" style={{fontSize:'0.9rem', cursor:'pointer'}}>Send email notification regarding the decision</label>
            </div>

            {/* Approve/Reject Buttons */}
            <div className="modal-actions" style={{display:'flex', gap:'15px', borderTop: '1px solid #e2e8f0', paddingTop: '15px'}}>
               <button onClick={() => processRequest('Rejected')} style={{flex: 1, padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>
                 ❌ Reject Application
               </button>
               <button onClick={() => processRequest('Approved')} style={{flex: 1, padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>
                 ✅ Approve & Activate
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Verification;