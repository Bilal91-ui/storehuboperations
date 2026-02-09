// Verification.jsx
import React, { useState } from 'react';
import './verification.css';
import './adminDashboard.css'; // Reusing general admin styles

const Verification = () => {
  // 3. Mock Data: Pending Accounts
  const [requests, setRequests] = useState([
    { 
      id: 201, 
      name: 'Burger King Downtown', 
      email: 'manager@bk-downtown.com', 
      type: 'Vendor', 
      docType: 'Business License', 
      docUrl: 'license_bk.pdf', 
      date: '2025-02-28' 
    },
    { 
      id: 202, 
      name: 'John Wick', 
      email: 'john.wick@rider.com', 
      type: 'Rider', 
      docType: 'Driving License', 
      docUrl: 'dl_john.jpg', 
      date: '2025-03-01' 
    },
    { 
      id: 203, 
      name: 'Tech Gadgets Store', 
      email: 'support@techgadgets.com', 
      type: 'Vendor', 
      docType: 'Tax Registration', 
      docUrl: 'tax_reg_tech.pdf', 
      date: '2025-03-02' 
    }
  ]);

  const [selectedReq, setSelectedReq] = useState(null); // For Modal
  const [notification, setNotification] = useState('');

  // --- HANDLERS ---

  // 4. Admin reviews documents (Open Modal)
  const handleReview = (req) => {
    setSelectedReq(req);
  };

  const handleCloseModal = () => {
    setSelectedReq(null);
  };

  // 5. Admin approves or rejects
  const processRequest = (status) => {
    // 6. System updates status (Remove from pending list)
    setRequests(requests.filter(r => r.id !== selectedReq.id));
    
    // 7. Notify User
    const action = status === 'Approved' ? 'approved' : 'rejected';
    const msg = `Account for ${selectedReq.name} has been ${action}. Notification sent to ${selectedReq.email}.`;
    
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000); // Clear alert after 4s
    
    handleCloseModal();
  };

  return (
    <div className="verification-container">
      <div className="verify-header">
        <div>
          <h2 className="section-title" style={{marginBottom:0, borderLeft:'none', paddingLeft:0}}>Verification Requests</h2>
          <p style={{color:'#64748b', margin:'5px 0 0 0'}}>Review and approve vendor/rider documents.</p>
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
          <div className="v-stat-val">{requests.filter(r => r.type === 'Vendor').length}</div>
          <div className="v-stat-label">Vendors</div>
        </div>
        <div className="v-stat-card">
          <div className="v-stat-val">{requests.filter(r => r.type === 'Rider').length}</div>
          <div className="v-stat-label">Riders</div>
        </div>
      </div>

      {/* 3. Display Pending Accounts */}
      <div className="admin-table-container">
        <table className="verify-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Type</th>
              <th>Submitted Date</th>
              <th>Document</th>
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
                    <div>{req.name}</div>
                    <span>{req.email}</span>
                  </td>
                  <td>
                    <span className={`badge ${req.type === 'Vendor' ? 'badge-blue' : 'badge-warning'}`}>{req.type}</span>
                  </td>
                  <td>{req.date}</td>
                  <td>
                    <div className="doc-link">
                       📄 {req.docType}
                    </div>
                  </td>
                  <td>
                    <button className="btn-review" onClick={() => handleReview(req)}>Review</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Review Modal */}
      {selectedReq && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth:'500px'}}>
            <div className="modal-header">
              <h3>Review Application</h3>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>

            <div className="info-grid">
               <div className="info-item"><label>Applicant Name</label><p>{selectedReq.name}</p></div>
               <div className="info-item"><label>Account Type</label><p>{selectedReq.type}</p></div>
               <div className="info-item"><label>Email</label><p>{selectedReq.email}</p></div>
               <div className="info-item"><label>Submission Date</label><p>{selectedReq.date}</p></div>
            </div>

            <h4 style={{marginBottom:'10px', color:'#334155'}}>Document Preview</h4>
            <div className="doc-preview-box">
               <div className="doc-icon">📄</div>
               <div style={{fontWeight:'600'}}>{selectedReq.docUrl}</div>
               <div style={{fontSize:'0.8rem', marginTop:'5px'}}>{selectedReq.docType}</div>
               <button className="btn-outline" style={{marginTop:'15px', padding:'5px 10px', fontSize:'0.8rem'}}>Download / View Full</button>
            </div>

            {/* 5. Approve/Reject Buttons */}
            <div className="modal-actions" style={{display:'flex', gap:'15px'}}>
               <button className="btn-reject" onClick={() => processRequest('Rejected')}>Reject</button>
               <button className="btn-approve" onClick={() => processRequest('Approved')}>Approve & Activate</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Verification;