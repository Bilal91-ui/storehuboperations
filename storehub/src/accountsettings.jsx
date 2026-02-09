"use client"

import { useState } from "react"
import "./accountsettings.css"

function AccountSettings({ onClose, user, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('personal')
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',

    // Password Change
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',

    // Communication Preferences
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    smsNotifications: user?.preferences?.smsNotifications ?? false,
    promotionalEmails: user?.preferences?.promotionalEmails ?? true,
  })

  const [addresses, setAddresses] = useState(user?.addresses || [
    {
      id: 1,
      type: 'home',
      name: 'Home',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      isDefault: true
    }
  ])

  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validatePersonalInfo = () => {
    const newErrors = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePassword = () => {
    const newErrors = {}
    if (!formData.currentPassword) newErrors.currentPassword = 'Current password is required'
    if (!formData.newPassword) newErrors.newPassword = 'New password is required'
    else if (formData.newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters'
    if (formData.newPassword !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSavePersonalInfo = () => {
    if (validatePersonalInfo()) {
      const updatedUser = {
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      }
      onUpdateUser(updatedUser)
      setSuccessMessage('Personal information updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    }
  }

  const handleChangePassword = () => {
    if (validatePassword()) {
      // In a real app, this would make an API call
      setSuccessMessage('Password changed successfully!')
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
      setTimeout(() => setSuccessMessage(''), 3000)
    }
  }

  const handleSavePreferences = () => {
    const updatedUser = {
      ...user,
      preferences: {
        emailNotifications: formData.emailNotifications,
        smsNotifications: formData.smsNotifications,
        promotionalEmails: formData.promotionalEmails
      }
    }
    onUpdateUser(updatedUser)
    setSuccessMessage('Communication preferences updated successfully!')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const addNewAddress = () => {
    const newAddress = {
      id: Date.now(),
      type: 'home',
      name: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      isDefault: false
    }
    setAddresses(prev => [...prev, newAddress])
  }

  const updateAddress = (id, field, value) => {
    setAddresses(prev => prev.map(addr =>
      addr.id === id ? { ...addr, [field]: value } : addr
    ))
  }

  const deleteAddress = (id) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id))
  }

  const setDefaultAddress = (id) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })))
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'password', label: 'Password', icon: '🔒' },
    { id: 'addresses', label: 'Addresses', icon: '📍' },
    { id: 'preferences', label: 'Preferences', icon: '🔔' }
  ]

  return (
    <div className="account-settings-overlay">
      <div className="account-settings-modal">
        <div className="account-settings-header">
          <h2 className="account-settings-title">Account Settings</h2>
          <button className="account-settings-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        <div className="account-settings-content">
          <div className="account-settings-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="account-settings-body">
            {activeTab === 'personal' && (
              <div className="settings-section">
                <h3>Personal Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={errors.firstName ? 'error' : ''}
                    />
                    {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={errors.lastName ? 'error' : ''}
                    />
                    {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={errors.phone ? 'error' : ''}
                    />
                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                  </div>
                </div>

                <button className="btn-primary" onClick={handleSavePersonalInfo}>
                  Save Changes
                </button>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="settings-section">
                <h3>Change Password</h3>
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className={errors.currentPassword ? 'error' : ''}
                  />
                  {errors.currentPassword && <span className="error-text">{errors.currentPassword}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className={errors.newPassword ? 'error' : ''}
                  />
                  {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>

                <button className="btn-primary" onClick={handleChangePassword}>
                  Change Password
                </button>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="settings-section">
                <div className="section-header">
                  <h3>Saved Addresses</h3>
                  <button className="btn-secondary" onClick={addNewAddress}>
                    + Add New Address
                  </button>
                </div>

                <div className="addresses-list">
                  {addresses.map(address => (
                    <div key={address.id} className="address-card">
                      <div className="address-header">
                        <h4>{address.name}</h4>
                        {address.isDefault && <span className="default-badge">Default</span>}
                        <div className="address-actions">
                          {!address.isDefault && (
                            <button
                              className="btn-link"
                              onClick={() => setDefaultAddress(address.id)}
                            >
                              Set as Default
                            </button>
                          )}
                          <button
                            className="btn-link delete"
                            onClick={() => deleteAddress(address.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="address-details">
                        <p>{address.street}</p>
                        <p>{address.city}, {address.state} {address.zipCode}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="settings-section">
                <h3>Communication Preferences</h3>

                <div className="preferences-list">
                  <div className="preference-item">
                    <div className="preference-info">
                      <h4>Email Notifications</h4>
                      <p>Receive order updates and important notifications via email</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={formData.emailNotifications}
                        onChange={handleInputChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="preference-item">
                    <div className="preference-info">
                      <h4>SMS Notifications</h4>
                      <p>Receive order updates via text message</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="smsNotifications"
                        checked={formData.smsNotifications}
                        onChange={handleInputChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="preference-item">
                    <div className="preference-info">
                      <h4>Promotional Emails</h4>
                      <p>Receive newsletters and special offers</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="promotionalEmails"
                        checked={formData.promotionalEmails}
                        onChange={handleInputChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <button className="btn-primary" onClick={handleSavePreferences}>
                  Save Preferences
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountSettings