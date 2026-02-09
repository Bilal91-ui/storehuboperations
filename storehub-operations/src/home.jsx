"use client"

import { useState } from "react"
import "./home.css"
import "./signup.css"
import "./login.css"
import "./sellerDashboard.css"
import "./riderDashboard.css" // Ensure you have this css file from previous steps

// --- Component Imports ---
import SellerDashboard from "./sellerdashboard"
import RiderDashboard from "./riderDashboard"
import AdminDashboard from "./AdminDashboard"; // <--- IMPORT RIDER DASHBOARD

function Home() {
  const [showRoleSelection, setShowRoleSelection] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [isLogin, setIsLogin] = useState(false)

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState("")

  // --- HANDLERS ---
  const handleSignUpClick = () => {
    setShowRoleSelection(true)
    setSelectedRole(null)
    setIsLogin(false)
  }

  const handleLoginClick = () => {
    setShowRoleSelection(true)
    setSelectedRole(null)
    setIsLogin(true)
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    
    // Simulate successful login/registration
    console.log(`Action: ${isLogin ? 'Login' : 'Register'} as ${selectedRole}`)
    
    // Set Login State
    setIsLoggedIn(true)
    setUserRole(selectedRole)
  }

  const handleBackToRoles = () => {
    setSelectedRole(null)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserRole("")
    setSelectedRole(null)
    setShowRoleSelection(false)
  }

  // --- 1. RENDER LOGGED IN VIEWS ---

  // A. Seller Dashboard
  if (isLoggedIn && userRole === 'seller') {
    return <SellerDashboard onLogout={handleLogout} />
  }

  // B. Rider Dashboard (NEW)
  if (isLoggedIn && userRole === 'rider') {
    return <RiderDashboard onLogout={handleLogout} />
  }

  // C. Admin/Other Placeholder
  if (isLoggedIn && userRole === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />
  }

  // --- 2. RENDER FORMS (Logged Out) ---

  const getFormTitle = (role) => {
    return isLogin ? `${role.charAt(0).toUpperCase() + role.slice(1)} Login` : `${role.charAt(0).toUpperCase() + role.slice(1)} Registration`
  }
  
  const getSubmitText = (role) => {
    return isLogin ? "Login" : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`
  }

  const renderForm = () => {
    // Shared Wrapper for all forms
    return (
      <form className="signup-form" onSubmit={handleSubmit}>
        <button type="button" className="close-btn" onClick={handleBackToRoles}>✕</button>
        <h2 className="form-title">{getFormTitle(selectedRole)}</h2>

        {/* --- LOGIN VIEW (Same for all) --- */}
        {isLogin ? (
          <>
            <input className="form-input" type="email" placeholder={`${selectedRole} Email`} required />
            <input className="form-input" type="password" placeholder="Password" required />
          </>
        ) : (
          /* --- REGISTRATION VIEW (Role Specific) --- */
          <>
            {/* Common Name/Email/Pass */}
            <input className="form-input" type="text" placeholder="Full Name" required />
            <input className="form-input" type="email" placeholder="Email Address" required />
            <input className="form-input" type="password" placeholder="Password" required />

            {/* RIDER SPECIFIC FIELDS */}
            {selectedRole === 'rider' && (
              <>
                <input className="form-input" type="text" placeholder="Vehicle Type (Bike/Scooter)" required />
                <input className="form-input" type="text" placeholder="License Number" required />
              </>
            )}

            {/* SELLER SPECIFIC FIELDS */}
            {selectedRole === 'seller' && (
              <>
                <input className="form-input" type="text" placeholder="Business Name" required />
                <input className="form-input" type="text" placeholder="Store Address" required />
              </>
            )}
          </>
        )}

        <button className="submit-button" type="submit">{getSubmitText(selectedRole)}</button>
        
        <p style={{marginTop: '15px', textAlign: 'center', fontSize: '0.9rem'}}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span style={{color: 'blue', cursor: 'pointer'}} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign Up" : "Login"}
          </span>
        </p>
      </form>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">StoreHub</h1>
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleLoginClick}>Login</button>
            <button className="btn-primary" onClick={handleSignUpClick}>Sign Up</button>
          </div>
        </div>
      </header>

      {/* Role Selection Screen */}
      {showRoleSelection && !selectedRole && (
        <main className="main-content">
          <h2>{isLogin ? 'Login as' : 'Sign up as'}</h2>
          <div className="role-selection">
            <button className="role-button" onClick={() => handleRoleSelect('rider')}>Rider</button>
            <button className="role-button" onClick={() => handleRoleSelect('seller')}>Seller</button>
            <button className="role-button" onClick={() => handleRoleSelect('admin')}>Admin</button>
          </div>
        </main>
      )}

      {/* Input Form Screen */}
      {selectedRole && (
        <main className="main-content">
           {renderForm()}
        </main>
      )}
    </div>
  )
}

export default Home