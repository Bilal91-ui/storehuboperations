"use client"

import { useState } from "react"
import "./login.css"

function Login({ onClose, onSwitchToSignup, onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")

  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Basic validation
    if (!formData.email?.trim() || !formData.password?.trim()) {
      setError("Please fill in all fields")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/customer/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Login failed")
        setLoading(false)
        return
      }

      // Success - store JWT token and user data
      localStorage.setItem('customerToken', data.token);
      localStorage.setItem('customerData', JSON.stringify(data.user));

      alert(data.message)
      onLoginSuccess(data.user)
      onClose()

    } catch (error) {
      console.error("Login error:", error)
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="auth-header">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Login to your StoreHub account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

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
              placeholder="Enter your password"
              className="form-input"
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="auth-footer">
            <p>
              Don't have an account?{" "}
              <button type="button" className="auth-link" onClick={onSwitchToSignup}>
                Sign Up
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
