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
  const [isLogin, setIsLogin] = useState(false)

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState("")

  // NEW → signup step control
  const [signupStep, setSignupStep] = useState(1)
  const [registrationCompleted, setRegistrationCompleted] = useState(false)

  const [authData, setAuthData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    vehicleType: "",
    licenseNumber: "",
    businessName: "",
    storeAddress: "",
    userId: null,
  })

  const handleAuthChange = (e) => {
    const { name, value } = e.target
    setAuthData(prev => ({ ...prev, [name]: value }))
  }

  // --- HANDLERS ---

  const handleSignUpClick = () => {
    setShowRoleSelection(true)
    setSelectedRole(null)
    setIsLogin(false)
    setSignupStep(1)
    setRegistrationCompleted(false)
    setAuthData({
      email: "",
      password: "",
      fullName: "",
      phone: "",
      vehicleType: "",
      licenseNumber: "",
      businessName: "",
      storeAddress: "",
      userId: null,
    })
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
    setAuthData({
      email: "",
      password: "",
      fullName: "",
      phone: "",
      vehicleType: "",
      licenseNumber: "",
      businessName: "",
      storeAddress: "",
      userId: null,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    // --- LOGIN FLOW ---
    if (isLogin) {
      const email = event.target.querySelector("[name='email']")?.value?.trim()
      const password = event.target.querySelector("[name='password']")?.value?.trim()

      if (!email || !password) {
        alert("Please enter email and password")
        return
      }

      try {
        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        })
        const data = await res.json()
        if (!res.ok) {
          alert(data.message || "Login failed")
          return
        }
        setIsLoggedIn(true)
        setUserRole(selectedRole)
        return
      } catch (err) {
        console.error(err)
        alert("Login failed")
        return
      }
    }

    // --- SIGNUP FLOW ---
    if (signupStep === 1) {
      // Register user + send OTP
      const payload = {
        role: selectedRole,
        email: authData.email,
        password: authData.password,
        full_name: authData.fullName,
        phone_number: authData.phone,
        vehicle_type: authData.vehicleType,
        license_number: authData.licenseNumber,
        business_name: authData.businessName,
        store_address: authData.storeAddress
      }

      try {
        const res = await fetch("http://localhost:5000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) {
          alert(data.message || "Registration failed")
          return
        }
        setAuthData(prev => ({ ...prev, userId: data.user_id }))
        setSignupStep(2)
        return
      } catch (err) {
        console.error(err)
        alert("Registration failed")
        return
      }
    }

    if (signupStep === 2) {
      const otp = event.target.querySelector("[name='otp']")?.value?.trim()
      if (!otp) {
        alert("Please enter OTP")
        return
      }

      try {
        const res = await fetch("http://localhost:5000/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: authData.userId, otp })
        })
        const data = await res.json()
        if (!res.ok) {
          alert(data.message || "OTP verification failed")
          return
        }

        setRegistrationCompleted(true)
        return
      } catch (err) {
        console.error(err)
        alert("OTP verification failed")
        return
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

  // --- DASHBOARD VIEWS ---

  if (isLoggedIn && userRole === 'seller') {
    return <SellerDashboard onLogout={handleLogout} />
  }

  if (isLoggedIn && userRole === 'rider') {
    return <RiderDashboard onLogout={handleLogout} />
  }

  if (isLoggedIn && userRole === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />
  }

  // --- FORM TITLE FUNCTIONS ---

  const getFormTitle = (role) => {
    return isLogin
      ? `${role.charAt(0).toUpperCase() + role.slice(1)} Login`
      : `${role.charAt(0).toUpperCase() + role.slice(1)} Registration`
  }

  const renderForm = () => {

    if (registrationCompleted) {
      return (
        <div className="signup-form">
          <button
            type="button"
            className="close-btn"
            onClick={handleBackToRoles}
          >
            ✕
          </button>

          <h2 className="form-title">Registration Submitted</h2>
          <p style={{ marginTop: '1rem', textAlign: 'center' }}>
            Thank you! Your registration has been submitted and is pending admin approval.
            You will be notified once your account is approved.
          </p>

          <button
            className="submit-button"
            type="button"
            onClick={handleBackToRoles}
          >
            Back to start
          </button>
        </div>
      )
    }

    return (
      <form className="signup-form" onSubmit={handleSubmit}>

        <button
          type="button"
          className="close-btn"
          onClick={handleBackToRoles}
        >
          ✕
        </button>

        <h2 className="form-title">{getFormTitle(selectedRole)}</h2>

        {/* LOGIN FORM */}
        {isLogin && (
          <>
            <input className="form-input" type="email" placeholder={`${selectedRole} Email`} required />
            <input className="form-input" type="password" placeholder="Password" required />

            <button className="submit-button" type="submit">
              Login
            </button>
          </>
        )}

        {/* SIGNUP STEP 1 */}
        {!isLogin && signupStep === 1 && (
          <>
            <input
              className="form-input"
              name="email"
              type="email"
              placeholder="Email Address"
              value={authData.email}
              onChange={handleAuthChange}
              required
            />

            <input
              className="form-input"
              name="fullName"
              type="text"
              placeholder="Full Name"
              value={authData.fullName}
              onChange={handleAuthChange}
              required
            />

            <input
              className="form-input"
              name="password"
              type="password"
              placeholder="Password"
              value={authData.password}
              onChange={handleAuthChange}
              required
            />

            <input
              className="form-input"
              name="phone"
              type="tel"
              placeholder="Phone Number"
              value={authData.phone}
              onChange={handleAuthChange}
              required
            />

            {selectedRole === 'rider' && (
              <>
                <input
                  className="form-input"
                  name="vehicleType"
                  type="text"
                  placeholder="Vehicle Type (Bike/Scooter)"
                  value={authData.vehicleType}
                  onChange={handleAuthChange}
                  required
                />

                <input
                  className="form-input"
                  name="licenseNumber"
                  type="text"
                  placeholder="License Number"
                  value={authData.licenseNumber}
                  onChange={handleAuthChange}
                  required
                />
              </>
            )}

            {selectedRole === 'seller' && (
              <>
                <input
                  className="form-input"
                  name="businessName"
                  type="text"
                  placeholder="Business Name"
                  value={authData.businessName}
                  onChange={handleAuthChange}
                  required
                />

                <input
                  className="form-input"
                  name="storeAddress"
                  type="text"
                  placeholder="Store Address"
                  value={authData.storeAddress}
                  onChange={handleAuthChange}
                  required
                />
              </>
            )}

            <button className="submit-button" type="submit">
              Send OTP
            </button>
          </>
        )}

        {/* SIGNUP STEP 2 */}
        {!isLogin && signupStep === 2 && (
          <>
            <input
              className="form-input"
              name="otp"
              type="text"
              placeholder="Enter Email OTP"
              required
            />

            <button className="submit-button" type="submit">
              Verify OTP
            </button>
          </>
        )}



        <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.9rem' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            style={{ color: 'blue', cursor: 'pointer' }}
            onClick={() => {
              setIsLogin(!isLogin)
              setSignupStep(1)
            }}
          >
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
            <button className="btn-secondary" onClick={handleLoginClick}>
              Login
            </button>

            <button className="btn-primary" onClick={handleSignUpClick}>
              Sign Up
            </button>
          </div>

        </div>
      </header>

      {/* ROLE SELECTION */}

      {showRoleSelection && !selectedRole && (
        <main className="main-content">

          <h2>{isLogin ? 'Login as' : 'Sign up as'}</h2>

          <div className="role-selection">

            <button
              className="role-button"
              onClick={() => handleRoleSelect('rider')}
            >
              Rider
            </button>

            <button
              className="role-button"
              onClick={() => handleRoleSelect('seller')}
            >
              Seller
            </button>

            <button
              className="role-button"
              onClick={() => handleRoleSelect('admin')}
            >
              Admin
            </button>

          </div>

        </main>
      )}

      {/* FORM */}

      {selectedRole && (
        <main className="main-content">
          {renderForm()}
        </main>
      )}

    </div>
  )
}

export default Home