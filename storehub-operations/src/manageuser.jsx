// ManageUser.jsx
import React, { useState } from 'react';
import './manageuser.css';

const ManageUser = () => {
  // 1. Mock Database
  const [users, setUsers] = useState([
    { id: 101, name: 'John Doe', email: 'john@gmail.com', role: 'Customer', status: 'Active', joined: '2025-01-10', phone: '123-456-7890' },
    { id: 102, name: 'Pizza Hut', email: 'contact@pizzahut.com', role: 'Vendor', status: 'Pending', joined: '2025-02-12', phone: '987-654-3210' },
    { id: 103, name: 'Mike Ross', email: 'mike@rider.com', role: 'Rider', status: 'Banned', joined: '2025-01-05', phone: '555-000-1111' },
    { id: 104, name: 'Sarah Connor', email: 'sarah@vendor.com', role: 'Vendor', status: 'Active', joined: '2025-02-20', phone: '444-555-6666' },
  ]);

  // UI State
  const [selectedUser, setSelectedUser] = useState(null);
  const [filter, setFilter] = useState('All'); // All, Customer, Vendor, Rider
  const [notification, setNotification] = useState('');
  
  // Edit State
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [notifyCheck, setNotifyCheck] = useState(true);

  // --- HANDLERS ---

  // 4. Admin selects a user account
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setFormData(user);
    setEditMode(false);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setEditMode(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 5. & 6. Perform Actions & Update Status
  const handleAction = (actionType) => {
    let newStatus = selectedUser.status;
    let logMsg = '';

    switch (actionType) {
      case 'Approve':
        newStatus = 'Active';
        logMsg = 'Registration Approved';
        break;
      case 'Reject':
        newStatus = 'Rejected';
        logMsg = 'Registration Rejected';
        break;
      case 'Ban':
        newStatus = 'Banned';
        logMsg = 'Account Suspended/Banned';
        break;
      case 'Activate':
        newStatus = 'Active';
        logMsg = 'Account Reactivated';
        break;
      case 'Update':
        logMsg = 'User Information Updated';
        break;
      default:
        break;
    }

    // Update Database
    const updatedUsers = users.map(u => 
      u.id === selectedUser.id 
      ? { ...formData, status: newStatus } 
      : u
    );
    setUsers(updatedUsers);

    // 7. Notify User Logic
    if (notifyCheck) {
      // In a real app, this triggers an email API
      alert(`System Notification sent to ${formData.email}: "${logMsg}"`);
    }

    setNotification(`${logMsg} successfully.`);
    setTimeout(() => setNotification(''), 3000);
    handleCloseModal();
  };

  // Filter Logic
  const filteredUsers = filter === 'All' 
    ? users 
    : users.filter(u => u.role === filter);

  // --- RENDER HELPERS ---

  return (
    <div className="user-mgmt-container">
      <div className="mgmt-header">
        <h2>User Management</h2>
        <div style={{color:'#666'}}>Total Users: {users.length}</div>
      </div>

      {notification && <div style={{padding:'10px', background:'#dcfce7', color:'#166534', borderRadius:'6px', marginBottom:'15px'}}>✅ {notification}</div>}

      {/* Filters */}
      <div className="filter-tabs">
        {['All', 'Customer', 'Vendor', 'Rider'].map(f => (
          <button 
            key={f} 
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 3. Display User Accounts */}
      <table className="user-table">
        <thead>
          <tr>
            <th>Name / Email</th>
            <th>Role</th>
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
              <td><span className="role-badge">{user.role}</span></td>
              <td>{user.joined}</td>
              <td>
                <span className={`status-badge status-${user.status.toLowerCase()}`}>
                  {user.status}
                </span>
              </td>
              <td>
                <button className="btn-secondary" style={{padding:'5px 10px', fontSize:'0.8rem', borderRadius:'4px', border:'none', cursor:'pointer'}}>Manage</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for User Details & Actions */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editMode ? 'Edit User' : 'User Details'}</h3>
              <button onClick={handleCloseModal} style={{background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer'}}>&times;</button>
            </div>

            {/* User Details Form */}
            <div className="form-field">
              <label>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} disabled={!editMode} />
            </div>
            <div className="form-field">
              <label>Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={!editMode} />
            </div>
            <div className="form-field">
              <label>Phone Number</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} disabled={!editMode} />
            </div>
            <div className="form-field">
              <label>Role</label>
              <select name="role" value={formData.role} onChange={handleInputChange} disabled={!editMode}>
                <option value="Customer">Customer</option>
                <option value="Vendor">Vendor</option>
                <option value="Rider">Rider</option>
              </select>
            </div>

            {/* Action Logs Simulation */}
            {!editMode && (
               <div style={{marginBottom:'15px'}}>
                  <label style={{fontSize:'0.85rem', fontWeight:'bold'}}>System Logs:</label>
                  <div className="log-entry">User joined on {selectedUser.joined}</div>
                  <div className="log-entry">Current Status: {selectedUser.status}</div>
               </div>
            )}

            {/* Notify Checkbox */}
            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
               <input type="checkbox" checked={notifyCheck} onChange={e => setNotifyCheck(e.target.checked)} id="notify"/>
               <label htmlFor="notify" style={{fontSize:'0.9rem', cursor:'pointer'}}>Notify user about changes via email</label>
            </div>

            {/* 5. Admin Actions */}
            <div className="action-bar">
              {editMode ? (
                <>
                  <button className="btn btn-primary" onClick={() => handleAction('Update')}>Save Changes</button>
                  <button className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
                </>
              ) : (
                <>
                  {/* Logic for Pending Users */}
                  {selectedUser.status === 'Pending' && (
                    <>
                      <button className="btn btn-success" onClick={() => handleAction('Approve')}>Approve</button>
                      <button className="btn btn-danger" onClick={() => handleAction('Reject')}>Reject</button>
                    </>
                  )}

                  {/* Logic for Active Users */}
                  {selectedUser.status === 'Active' && (
                    <>
                      <button className="btn btn-secondary" onClick={() => setEditMode(true)}>Edit Info</button>
                      <button className="btn btn-danger" onClick={() => handleAction('Ban')}>Suspend / Ban</button>
                    </>
                  )}

                  {/* Logic for Banned Users */}
                  {(selectedUser.status === 'Banned' || selectedUser.status === 'Rejected') && (
                     <button className="btn btn-success" onClick={() => handleAction('Activate')}>Reactivate Account</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUser;