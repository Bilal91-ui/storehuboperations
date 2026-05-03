"use client"

import { useState } from "react"
import "./signup.css"

function Signup({ onClose, onSwitchToLogin, onSignupSuccess }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    emailOtp: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: signup form, 2: OTP verification
  const [tempId, setTempId] = useState(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError("")
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation with trim
    const fullName = formData.fullName?.trim()
    const email = formData.email?.trim()
    const phone = formData.phone?.trim()
    const password = formData.password?.trim()
    const confirmPassword = formData.confirmPassword?.trim()

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      setError("Please fill in all fields")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/customer/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName,
          email: email,
          phone: phone,
          password: password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Signup failed")
        setLoading(false)
        return
      }

      // Success - move to OTP step
      setTempId(data.temp_id)
      setStep(2)
      setLoading(false)

      // Show success message
      alert(data.message)

    } catch (error) {
      console.error("Signup error:", error)
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.emailOtp) {
      setError("Please enter the OTP")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/customer/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          temp_id: tempId,
          otp: formData.emailOtp,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "OTP verification failed")
        setLoading(false)
        return
      }

      // Success - account created and logged in
      alert(data.message)
      
      // Store JWT token and user data
      localStorage.setItem('customerToken', data.token);
      localStorage.setItem('customerData', JSON.stringify(data.user));
      
      onSignupSuccess(data.user)
      onClose()

    } catch (error) {
      console.error("OTP verification error:", error)
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  const handleBackToSignup = () => {
    setStep(1)
    setError("")
    setTempId(null)
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal signup-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="auth-header">
          <h2 className="auth-title">
            {step === 1 ? "Create Account" : "Verify Email"}
          </h2>
          <p className="auth-subtitle">
            {step === 1 ? "Join StoreHub today" : `We've sent an OTP to ${formData.email}`}
          </p>
        </div>

        <form onSubmit={step === 1 ? handleSignupSubmit : handleOtpSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          {step === 1 ? (
            // SIGNUP FORM
            <>
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="form-input"
                  required
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </>
          ) : (
            // OTP VERIFICATION
            <>
              <div className="form-group">
                <label htmlFor="emailOtp">Email OTP</label>
                <input
                  type="text"
                  id="emailOtp"
                  name="emailOtp"
                  value={formData.emailOtp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit OTP"
                  className="form-input"
                  maxLength="6"
                  required
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Complete Signup"}
              </button>

              <button
                type="button"
                className="auth-link-btn"
                onClick={handleBackToSignup}
                style={{ marginTop: "10px" }}
              >
                Back to Signup
              </button>
            </>
          )}

          <div className="auth-footer">
            <p>
              Already have an account?{" "}
              <button type="button" className="auth-link" onClick={onSwitchToLogin}>
                Login
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Signup
