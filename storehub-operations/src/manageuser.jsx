// ManageUser.jsx
import React, { useState, useEffect } from 'react';
import './manageuser.css';

const ManageUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const[selectedUser, setSelectedUser] = useState(null);
  const [filter, setFilter] = useState('All'); 
  const [notification, setNotification] = useState('');
  
  const[notifyCheck, setNotifyCheck] = useState(true);

  // --- FETCH MANAGED USERS FROM BACKEND ---
  useEffect(() => {
    fetchManagedUsers();
  },[]);

  const fetchManagedUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/users");
      const data = await res.json();
      // Only show users that are NOT pending (Approved, Blocked, Rejected)
      const managedUsers = data.filter(u => u.status !== 'pending');
      setUsers(managedUsers);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  // Handle Ban and Reactivate
  const handleAction = async (actionType) => {
    let dbStatus = actionType === 'Ban' ? 'blocked' : 'approved';
    let logMsg = actionType === 'Ban' ? 'Account suspended/banned' : 'Account reactivated successfully';

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${selectedUser.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: dbStatus, notify: notifyCheck })
      });

      if (res.ok) {
        const updatedUsers = users.map(u => 
          u.id === selectedUser.id ? { ...u, status: dbStatus } : u
        );
        setUsers(updatedUsers);

        setNotification(`✅ ${logMsg}. ${notifyCheck ? 'Email sent.' : ''}`);
        setTimeout(() => setNotification(''), 4000);
        handleCloseModal();
      } else {
        alert("Failed to update status. Server error.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  };

  // Filter Logic
  const filteredUsers = filter === 'All' 
    ? users 
    : users.filter(u => {
        const dbRole = u.role ? u.role.toLowerCase() : '';
        const filterName = filter.toLowerCase();
        if (filterName === 'vendor' && dbRole === 'seller') return true;
        if (filterName === dbRole) return true;
        return false;
    });

  // Helper mapping functions
  const getDisplayStatus = (dbStatus) => {
    switch(dbStatus) {
      case 'approved': return 'Active';
      case 'blocked': return 'Banned';
      case 'rejected': return 'Rejected';
      default: return dbStatus;
    }
  };

  const getDisplayRole = (dbRole) => {
    if (!dbRole) return 'Unknown';
    return dbRole.toLowerCase() === 'seller' ? 'Vendor' : dbRole.toLowerCase() === 'rider' ? 'Rider' : 'Admin';
  };

  const getPhone = (user) => {
    return user.role === 'rider' ? user.rider_phone : user.role === 'seller' ? user.seller_phone : 'N/A';
  };

  if (loading) return <div>Loading user data...</div>;

  return (
    <div className="user-mgmt-container">
      <div className="mgmt-header">
        <h2>User Management</h2>
        <div style={{color:'#666'}}>Manage active accounts and restrictions</div>
      </div>

      {notification && <div style={{padding:'10px', background:'#dcfce7', color:'#166534', borderRadius:'6px', marginBottom:'15px'}}>{notification}</div>}

      {/* Filters */}
      <div className="filter-tabs">
        {['All', 'Vendor', 'Rider', 'Admin'].map(f => (
          <button 
            key={f} 
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <table className="user-table">
        <thead>
          <tr>
            <th>Name / Email</th>
            <th>Role</th>
            <th>Joined Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.id} className="user-row" onClick={() => handleSelectUser(user)}>
              <td>
                <div style={{fontWeight:'bold'}}>{user.name}</div>
                <div style={{fontSize:'0.8rem', color:'#666'}}>{user.email}</div>
              </td>
              <td><span className="role-badge">{getDisplayRole(user.role)}</span></td>
              <td>{user.joined}</td>
              <td>
                <span className={`status-badge status-${getDisplayStatus(user.status).toLowerCase()}`}>
                  {getDisplayStatus(user.status)}
                </span>
              </td>
              <td>
                <button className="btn-secondary" style={{padding:'5px 10px', fontSize:'0.8rem', borderRadius:'4px', border:'none', cursor:'pointer', background: '#e2e8f0'}}>
                  Manage
                </button>
              </td>
            </tr>
          ))}
          {filteredUsers.length === 0 && (
            <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>No records found for this category.</td></tr>
          )}
        </tbody>
      </table>

      {/* Modal for User Details & Actions */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '500px'}}>
            <div className="modal-header">
              <h3>Manage User Account</h3>
              <button onClick={handleCloseModal} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>&times;</button>
            </div>

            <div style={{marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Phone:</strong> {getPhone(selectedUser)}</p>
              <p><strong>Current Status:</strong> <span style={{fontWeight: 'bold', color: selectedUser.status === 'approved' ? '#10b981' : '#ef4444'}}>{getDisplayStatus(selectedUser.status)}</span></p>
            </div>

            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
               <input type="checkbox" checked={notifyCheck} onChange={e => setNotifyCheck(e.target.checked)} id="notify"/>
               <label htmlFor="notify" style={{fontSize:'0.9rem', cursor:'pointer'}}>Notify user about status change via email</label>
            </div>

            {/* Action Bar based on DB Status */}
            <div className="action-bar" style={{display: 'flex', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '15px'}}>
              
              {selectedUser.status === 'approved' && (
                <button style={{width: '100%', padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => handleAction('Ban')}>
                  ⛔ Suspend / Ban Account
                </button>
              )}

              {(selectedUser.status === 'blocked' || selectedUser.status === 'rejected') && (
                  <button style={{width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => handleAction('Reactivate')}>
                    🔄 Reactivate Account
                  </button>
              )}
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUser;