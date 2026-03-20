"use client"

import { useState } from "react"
import "./home.css"
import "./signup.css"
import "./login.css"
import "./sellerDashboard.css"
import "./riderDashboard.css"

import SellerDashboard from "./sellerdashboard"
import RiderDashboard from "./riderDashboard"
import AdminDashboard from "./AdminDashboard"

function Home() {
  const [showRoleSelection, setShowRoleSelection] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const[isLogin, setIsLogin] = useState(false)

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState("")

  const [signupStep, setSignupStep] = useState(1)
  const [registrationCompleted, setRegistrationCompleted] = useState(false)

  const[authData, setAuthData] = useState({
    email: "", password: "", fullName: "", phone: "", city: "", cnicNumber: "",
    // Rider
    vehicleType: "", licenseNumber: "",
    // Seller
    businessName: "", storeAddress: "", businessType: "", bankName: "", accountTitle: "", iban: "",
    userId: null,
  })

  const handleAuthChange = (e) => {
    const { name, value } = e.target
    setAuthData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSignUpClick = () => {
    setShowRoleSelection(true)
    setSelectedRole(null)
    setIsLogin(false)
    setSignupStep(1)
    setRegistrationCompleted(false)
    resetForm()
  }

  const handleLoginClick = () => {
    setShowRoleSelection(true)
    setSelectedRole(null)
    setIsLogin(true)
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setSignupStep(1)
    setRegistrationCompleted(false)
    resetForm()
  }

  const resetForm = () => {
    setAuthData({
      email: "", password: "", fullName: "", phone: "", city: "", cnicNumber: "",
      vehicleType: "", licenseNumber: "",
      businessName: "", storeAddress: "", businessType: "", bankName: "", accountTitle: "", iban: "",
      userId: null,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    // --- LOGIN FLOW ---
    // --- LOGIN FLOW ---
    if (isLogin) {
      const email = event.target.querySelector("[name='email']")?.value?.trim()
      const password = event.target.querySelector("[name='password']")?.value?.trim()

      if (!email || !password) return alert("Please enter your email and password.")

      try {
        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        })
        const data = await res.json()
        if (!res.ok) return alert(data.message || "Login failed.")
        
        // 🔒 STRICT SECURITY CHECK:
        if (data.role !== selectedRole) {
          return alert(`Security Alert 🚨\nYou are registered as a '${data.role.toUpperCase()}', but tried to login as '${selectedRole.toUpperCase()}'. Please select the correct role from the main menu.`);
        }

        setIsLoggedIn(true)
        setUserRole(data.role) // Database verified role set kar rahe hain
        return
      } catch (err) {
        console.error(err)
        return alert("Login failed. Please try again.")
      }
    }

    // --- SIGNUP FLOW (STEP 1) ---
    if (signupStep === 1) {
      // Validate Rider specific
      if (selectedRole === 'rider' && authData.vehicleType === 'Bike' && !authData.licenseNumber) {
        return alert("A Driving License Number is mandatory for motorbike riders.");
      }

      const payload = {
        role: selectedRole,
        email: authData.email,
        password: authData.password,
        full_name: authData.fullName,
        phone_number: authData.phone,
        city: authData.city,
        cnic_number: authData.cnicNumber,
        // Rider
        vehicle_type: authData.vehicleType,
        license_number: authData.licenseNumber,
        // Seller
        business_name: authData.businessName,
        store_address: authData.storeAddress,
        business_type: authData.businessType,
        bank_name: authData.bankName,
        account_title: authData.accountTitle,
        iban: authData.iban
      }

      try {
        const res = await fetch("http://localhost:5000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        
        if (!res.ok) {
          return alert(data.message + (data.error ? `\nError details: ${data.error}` : ""));
        }

        setAuthData(prev => ({ ...prev, userId: data.user_id }))
        alert(`Success: ${data.message} ${data.otp ? `\n(DEV OTP: ${data.otp})` : ""}`)
        setSignupStep(2)
      } catch (err) {
        console.error(err)
        alert("Server error occurred during registration.")
      }
      return;
    }

    // --- SIGNUP FLOW (STEP 2: OTP VERIFICATION) ---
    if (signupStep === 2) {
      const otp = event.target.querySelector("[name='otp']")?.value?.trim()
      if (!otp) return alert("Please enter the OTP.")

      try {
        const res = await fetch("http://localhost:5000/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: authData.userId, otp })
        })
        const data = await res.json()
        if (!res.ok) return alert(data.message || "OTP verification failed.")

        setRegistrationCompleted(true)
      } catch (err) {
        console.error(err)
        alert("OTP verification failed. Please try again.")
      }
    }
  }

  const handleBackToRoles = () => {
    setSelectedRole(null)
    setSignupStep(1)
    setRegistrationCompleted(false)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserRole("")
    setSelectedRole(null)
    setShowRoleSelection(false)
    setSignupStep(1)
  }

  if (isLoggedIn && userRole === 'seller') return <SellerDashboard onLogout={handleLogout} />
  if (isLoggedIn && userRole === 'rider') return <RiderDashboard onLogout={handleLogout} />
  if (isLoggedIn && userRole === 'admin') return <AdminDashboard onLogout={handleLogout} />

  const getFormTitle = (role) => {
    return isLogin
      ? `${role.charAt(0).toUpperCase() + role.slice(1)} Login`
      : `Become a ${role.charAt(0).toUpperCase() + role.slice(1)} Partner`
  }

  const renderForm = () => {
    if (registrationCompleted) {
      return (
        <div className="signup-form">
          <button type="button" className="close-btn" onClick={handleBackToRoles}>✕</button>
          <h2 className="form-title">Application Submitted! 🎉</h2>
          <p style={{ marginTop: '1rem', textAlign: 'center', lineHeight: '1.5' }}>
            Your details have been successfully verified and submitted to the admin for review. 
            You will be notified via email or SMS once your account is approved.
          </p>
          <button className="submit-button" type="button" onClick={handleBackToRoles}>
            Go Back
          </button>
        </div>
      )
    }

    return (
      <form className="signup-form" onSubmit={handleSubmit}>
        <button type="button" className="close-btn" onClick={handleBackToRoles}>✕</button>
        <h2 className="form-title">{getFormTitle(selectedRole)}</h2>

        {/* LOGIN FORM */}
        {isLogin && (
          <>
            <input className="form-input" name="email" type="email" placeholder="Email Address" required />
            <input className="form-input" name="password" type="password" placeholder="Password" required />
            <button className="submit-button" type="submit">Login</button>
          </>
        )}

        {/* SIGNUP STEP 1: PERSONAL & PROFESSIONAL DETAILS */}
        {!isLogin && signupStep === 1 && (
          <div className="form-scrollable-container" style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
            
            <h4 style={{marginBottom: '10px', color: '#666'}}>Personal Details</h4>
            <input className="form-input" name="fullName" type="text" placeholder="Full Name (As per CNIC)" value={authData.fullName} onChange={handleAuthChange} required />
            <input className="form-input" name="email" type="email" placeholder="Email Address" value={authData.email} onChange={handleAuthChange} required />
            <input className="form-input" name="password" type="password" placeholder="Password" value={authData.password} onChange={handleAuthChange} required />
            <input className="form-input" name="phone" type="tel" placeholder="Phone Number (e.g. 03001234567)" value={authData.phone} onChange={handleAuthChange} required />
            <input className="form-input" name="cnicNumber" type="text" placeholder="CNIC Number (13 Digits)" value={authData.cnicNumber} onChange={handleAuthChange} required />
            <input className="form-input" name="city" type="text" placeholder="City" value={authData.city} onChange={handleAuthChange} required />

            {/* RIDER SPECIFIC */}
            {selectedRole === 'rider' && (
              <>
                <h4 style={{margin: '15px 0 10px', color: '#666'}}>Vehicle Information</h4>
                <select className="form-input" name="vehicleType" value={authData.vehicleType} onChange={handleAuthChange} required>
                  <option value="">Select Vehicle Type</option>
                  <option value="Bike">Motorbike</option>
                  <option value="Cycle">Bicycle</option>
                </select>
                
                {authData.vehicleType === 'Bike' && (
                  <input className="form-input" name="licenseNumber" type="text" placeholder="Driving License Number" value={authData.licenseNumber} onChange={handleAuthChange} required />
                )}
              </>
            )}

            {/* SELLER SPECIFIC */}
            {selectedRole === 'seller' && (
              <>
                <h4 style={{margin: '15px 0 10px', color: '#666'}}>Business Details</h4>
                <select className="form-input" name="businessType" value={authData.businessType} onChange={handleAuthChange} required>
                  <option value="">Select Business Type</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Home Chef">Home Chef</option>
                  <option value="Shop/Mart">Shop / Mart</option>
                </select>

                <input className="form-input" name="businessName" type="text" placeholder="Business / Restaurant Name" value={authData.businessName} onChange={handleAuthChange} required />
                <input className="form-input" name="storeAddress" type="text" placeholder="Complete Store Address" value={authData.storeAddress} onChange={handleAuthChange} required />

                <h4 style={{margin: '15px 0 10px', color: '#666'}}>Bank Details (Optional)</h4>
                <input className="form-input" name="bankName" type="text" placeholder="Bank Name (e.g. Standard Chartered)" value={authData.bankName} onChange={handleAuthChange} />
                <input className="form-input" name="accountTitle" type="text" placeholder="Account Title" value={authData.accountTitle} onChange={handleAuthChange} />
                <input className="form-input" name="iban" type="text" placeholder="IBAN (e.g. PK24MEZN0000...)" value={authData.iban} onChange={handleAuthChange} />
              </>
            )}

            <button className="submit-button" type="submit" style={{marginTop: '15px'}}>
              Register & Send OTP
            </button>
          </div>
        )}

        {/* SIGNUP STEP 2: OTP */}
        {!isLogin && signupStep === 2 && (
          <>
            <p style={{fontSize: '14px', marginBottom: '15px', color: '#333'}}>
              A 6-digit OTP has been sent to your email address <b>{authData.email}</b>.
            </p>
            <input className="form-input" name="otp" type="text" placeholder="Enter Email OTP" required />
            <button className="submit-button" type="submit">Verify OTP</button>
          </>
        )}

        <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.9rem' }}>
          {isLogin ? "Create a new account? " : "Already have an account? "}
          <span style={{ color: 'blue', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setIsLogin(!isLogin); setSignupStep(1); resetForm(); }}>
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
            <button className="btn-primary" onClick={handleSignUpClick}>Become a Partner</button>
          </div>
        </div>
      </header>

      {showRoleSelection && !selectedRole && (
        <main className="main-content">
          <h2>{isLogin ? 'Login as' : 'Become a Partner as'}</h2>
          <div className="role-selection">
            <button className="role-button" onClick={() => handleRoleSelect('rider')}>🛵 Rider</button>
            <button className="role-button" onClick={() => handleRoleSelect('seller')}>🏪 Seller</button>
            <button className="role-button" onClick={() => handleRoleSelect('admin')}>🛡️ Admin</button>
          </div>
        </main>
      )}

      {selectedRole && (
        <main className="main-content">
          {renderForm()}
        </main>
      )}
    </div>
  )
}

export default Home