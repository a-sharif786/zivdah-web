import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/authApi'
import { userApi } from '../api/userApi'
import './Account.css'

export default function Account() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState(null)

  const [addresses, setAddresses] = useState(null)
  const [addressForm, setAddressForm] = useState({ addressLine1: '', addressLine2: '', city: '', state: '', pinCode: '', isDefault: false })
  const [addingAddress, setAddingAddress] = useState(false)
  const [addressError, setAddressError] = useState(null)

  const loadAddresses = () => userApi.getAddresses(0, 50).then(setAddresses).catch(() => setAddresses([]))

  useEffect(() => { loadAddresses() }, [])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMessage(null)
    try {
      await authApi.updateProfile(user.id, { name })
      setProfileMessage({ type: 'success', text: 'Profile updated.' })
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAddAddress = async (e) => {
    e.preventDefault()
    setAddressError(null)
    setAddingAddress(true)
    try {
      await userApi.addAddress(addressForm)
      setAddressForm({ addressLine1: '', addressLine2: '', city: '', state: '', pinCode: '', isDefault: false })
      loadAddresses()
    } catch (err) {
      setAddressError(err.message)
    } finally {
      setAddingAddress(false)
    }
  }

  return (
    <div className="container account-page">
      <h1 className="section-title">My Account</h1>

      <div className="account-grid">
        <div className="account-card">
          <h3>Profile</h3>
          {profileMessage && (
            <div className={profileMessage.type === 'success' ? 'auth-success' : 'auth-error'}>{profileMessage.text}</div>
          )}
          <form onSubmit={handleSaveProfile}>
            <div className="auth-field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="auth-field">
              <label>Email</label>
              <input value={user?.email ?? ''} disabled />
            </div>
            <div className="auth-field">
              <label>Mobile</label>
              <input value={user?.mobile ?? ''} disabled />
            </div>
            <div className="auth-field">
              <label>Role</label>
              <input value={user?.role ?? ''} disabled />
            </div>
            <button className="btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="account-card">
          <h3>Saved Addresses</h3>
          {!addresses ? (
            <p>Loading...</p>
          ) : addresses.length === 0 ? (
            <p className="auth-hint">No saved addresses yet.</p>
          ) : (
            <ul className="address-list">
              {addresses.map((a) => (
                <li key={a.id} className="address-item">
                  {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}, {a.city}, {a.state} - {a.pinCode}
                  {a.isDefault && <span className="address-default-tag">Default</span>}
                </li>
              ))}
            </ul>
          )}

          <h4 style={{ marginTop: 20, marginBottom: 10, fontSize: 14 }}>Add New Address</h4>
          {addressError && <div className="auth-error">{addressError}</div>}
          <form onSubmit={handleAddAddress}>
            <div className="auth-field">
              <label>Address Line 1</label>
              <input
                required
                value={addressForm.addressLine1}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
              />
            </div>
            <div className="auth-field">
              <label>Address Line 2</label>
              <input
                value={addressForm.addressLine2}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
              />
            </div>
            <div className="form-row-2">
              <div className="auth-field">
                <label>City</label>
                <input required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
              </div>
              <div className="auth-field">
                <label>State</label>
                <input required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} />
              </div>
            </div>
            <div className="auth-field">
              <label>Pincode</label>
              <input
                required
                pattern="[0-9]{6}"
                value={addressForm.pinCode}
                onChange={(e) => setAddressForm({ ...addressForm, pinCode: e.target.value })}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 16 }}>
              <input
                type="checkbox"
                style={{ width: 'auto' }}
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
              />
              Set as default
            </label>
            <button className="btn-secondary" disabled={addingAddress}>
              {addingAddress ? 'Adding...' : 'Add Address'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
