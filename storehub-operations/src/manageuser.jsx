import React, { useState, useEffect } from 'react';
import './manageuser.css';

const ManageUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [selectedUser, setSelectedUser] = useState(null);
  const [filter, setFilter] = useState('All'); // All, Vendor, Rider, Admin
  const[notification, setNotification] = useState('');
  
  const [notifyCheck, setNotifyCheck] = useState(true);

  // --- FETCH USERS FROM BACKEND ---
  useEffect(() => {
    fetchUsers();
  },[]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/users");
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  // Handle Approve, Reject, Ban, Activate via Backend API
  const handleAction = async (actionType) => {
    let dbStatus = '';
    let logMsg = '';

    switch (actionType) {
      case 'Approve':
      case 'Activate':
        dbStatus = 'approved';
        logMsg = 'Account activated successfully';
        break;
      case 'Reject':
        dbStatus = 'rejected';
        logMsg = 'Application rejected';
        break;
      case 'Ban':
        dbStatus = 'blocked';
        logMsg = 'Account suspended/banned';
        break;
      default:
        return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${selectedUser.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Yahan humne "notify: notifyCheck" add kar diya hai
        body: JSON.stringify({ status: dbStatus, notify: notifyCheck }) 
      });

      if (res.ok) {
        // Update local state to reflect changes instantly
        const updatedUsers = users.map(u => 
          u.id === selectedUser.id ? { ...u, status: dbStatus } : u
        );
        setUsers(updatedUsers);

        // Sirf UI par notification show karein
        if (notifyCheck) {
          setNotification(`✅ ${logMsg} and Email sent to ${selectedUser.email}.`);
        } else {
          setNotification(`✅ ${logMsg}. (No email sent)`);
        }
        
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

  // --- Filter Logic Fixed ---
  const filteredUsers = filter === 'All' 
    ? users 
    : users.filter(u => {
        const dbRole = u.role ? u.role.toLowerCase() : '';
        const filterName = filter.toLowerCase();

        // Map 'vendor' button to 'seller' database role
        if (filterName === 'vendor' && dbRole === 'seller') return true;
        // Direct match for rider and admin
        if (filterName === dbRole) return true;

        return false;
    });

  // Helper mapping functions
  const getDisplayStatus = (dbStatus) => {
    switch(dbStatus) {
      case 'approved': return 'Active';
      case 'pending': return 'Pending';
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
        <div style={{color:'#666'}}>Total Users: {users.length}</div>
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
            <th>City</th>
            <th>Joined</th>
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
              <td>{user.city || 'N/A'}</td>
              <td>{user.joined}</td>
              <td>
                <span className={`status-badge status-${getDisplayStatus(user.status).toLowerCase()}`}>
                  {getDisplayStatus(user.status)}
                </span>
              </td>
              <td>
                <button className="btn-secondary" style={{padding:'5px 10px', fontSize:'0.8rem', borderRadius:'4px', border:'none', cursor:'pointer', background: '#e2e8f0'}}>
                  Review
                </button>
              </td>
            </tr>
          ))}
          {filteredUsers.length === 0 && (
            <tr><td colSpan="6" style={{textAlign:'center', padding:'20px'}}>No records found for this category.</td></tr>
          )}
        </tbody>
      </table>

      {/* Modal for User Details & Actions */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto'}}>
            <div className="modal-header">
              <h3>Partner Details Review</h3>
              <button onClick={handleCloseModal} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>&times;</button>
            </div>

            {/* General Info */}
            <div style={{marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
              <h4 style={{marginBottom: '10px', color: '#4f46e5', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px'}}>Personal Details</h4>
              <p><strong>Full Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Phone:</strong> {getPhone(selectedUser)}</p>
              <p><strong>CNIC Number:</strong> {selectedUser.cnic_number || 'N/A'}</p>
              <p><strong>City:</strong> {selectedUser.city || 'N/A'}</p>
            </div>

            {/* Rider Specific Details */}
            {selectedUser.role === 'rider' && (
              <div style={{marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                <h4 style={{marginBottom: '10px', color: '#4f46e5', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px'}}>Vehicle Information</h4>
                <p><strong>Vehicle Type:</strong> {selectedUser.vehicle_type}</p>
                <p><strong>License Number:</strong> {selectedUser.license_number || 'N/A (Bicycle)'}</p>
              </div>
            )}

            {/* Seller Specific Details */}
            {selectedUser.role === 'seller' && (
              <div style={{marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                <h4 style={{marginBottom: '10px', color: '#4f46e5', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px'}}>Business Details</h4>
                <p><strong>Business Name:</strong> {selectedUser.business_name}</p>
                <p><strong>Business Type:</strong> {selectedUser.business_type}</p>
                <p><strong>Store Address:</strong> {selectedUser.store_address}</p>
              </div>
            )}

            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
               <input type="checkbox" checked={notifyCheck} onChange={e => setNotifyCheck(e.target.checked)} id="notify"/>
               <label htmlFor="notify" style={{fontSize:'0.9rem', cursor:'pointer'}}>Notify user about status change via email</label>
            </div>

            {/* Action Bar based on DB Status */}
            <div className="action-bar" style={{display: 'flex', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '15px'}}>
              {/* Logic for Pending Users */}
              {selectedUser.status === 'pending' && (
                <>
                  <button className="btn btn-success" style={{background: '#10b981', color: 'white'}} onClick={() => handleAction('Approve')}>✅ Approve Partner</button>
                  <button className="btn btn-danger" style={{background: '#ef4444', color: 'white'}} onClick={() => handleAction('Reject')}>❌ Reject Partner</button>
                </>
              )}

              {/* Logic for Active Users */}
              {selectedUser.status === 'approved' && (
                <>
                  <button className="btn btn-danger" style={{background: '#ef4444', color: 'white'}} onClick={() => handleAction('Ban')}>⛔ Suspend / Ban Account</button>
                </>
              )}

              {/* Logic for Banned/Rejected Users */}
              {(selectedUser.status === 'blocked' || selectedUser.status === 'rejected') && (
                  <button className="btn btn-success" style={{background: '#3b82f6', color: 'white'}} onClick={() => handleAction('Activate')}>🔄 Reactivate Account</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUser;