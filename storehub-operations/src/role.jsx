import React, { useState } from 'react';
import './signup.css';

function Role() {
  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission, e.g., send to backend
    console.log('Form submitted for role:', selectedRole);
    // Reset or navigate
  };

  const renderForm = () => {
    switch (selectedRole) {
      case 'rider':
        return (
          <form className="signup-form" onSubmit={handleSubmit}>
            <h2 className="form-title">Rider Registration</h2>
            <input className="form-input" type="text" placeholder="Rider Name" required />
            <input className="form-input" type="email" placeholder="Rider Email" required />
            <input className="form-input" type="password" placeholder="Rider Password" required />
            <input className="form-input" type="text" placeholder="Vehicle Type" required />
            <input className="form-input" type="text" placeholder="License Number" required />
            <button className="submit-button" type="submit">Register as Rider</button>
          </form>
        );
      case 'seller':
        return (
          <form className="signup-form" onSubmit={handleSubmit}>
            <h2 className="form-title">Seller Registration</h2>
            <input className="form-input" type="text" placeholder="Seller Name" required />
            <input className="form-input" type="email" placeholder="Seller Email" required />
            <input className="form-input" type="password" placeholder="Seller Password" required />
            <input className="form-input" type="text" placeholder="Business Name" required />
            <input className="form-input" type="text" placeholder="Address" required />
            <button className="submit-button" type="submit">Register as Seller</button>
          </form>
        );
      case 'admin':
        return (
          <form className="signup-form" onSubmit={handleSubmit}>
            <h2 className="form-title">Admin Registration</h2>
            <input className="form-input" type="text" placeholder="Admin Name" required />
            <input className="form-input" type="email" placeholder="Admin Email" required />
            <input className="form-input" type="password" placeholder="Admin Password" required />
            <button className="submit-button" type="submit">Register as Admin</button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="signup-container">
      <h1 className="signup-title">Sign Up</h1>
      {!selectedRole ? (
        <div className="role-selection">
          <button className="role-button" onClick={() => handleRoleSelect('rider')}>Rider</button>
          <button className="role-button" onClick={() => handleRoleSelect('seller')}>Seller</button>
          <button className="role-button" onClick={() => handleRoleSelect('admin')}>Admin</button>
        </div>
      ) : (
        <div>
          {renderForm()}
          <button className="back-button" onClick={() => setSelectedRole(null)}>Back to Role Selection</button>
        </div>
      )}
    </div>
  );
}

export default Role;