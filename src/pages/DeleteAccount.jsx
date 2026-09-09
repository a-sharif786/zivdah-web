import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/authApi'
import '../pages/Auth.css'
import './DeleteAccount.css'

const CONFIRM_WORD = 'DELETE'

export default function DeleteAccount() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [acknowledged, setAcknowledged] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const canSubmit = acknowledged && confirmText.trim().toUpperCase() === CONFIRM_WORD && !submitting

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      await authApi.deactivateAccount(user.id)
      setDone(true)
      // Give the user a moment to see the confirmation before the session is torn
      // down and they're bounced out of a page they can no longer access.
      setTimeout(() => {
        logout()
        navigate('/', { replace: true })
      }, 2000)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card delete-account-card">
        <h1>Delete Account</h1>
        <p className="auth-subtitle">This deactivates your Zivdah account</p>

        {done ? (
          <div className="auth-success">
            Your account has been deactivated. Signing you out...
          </div>
        ) : (
          <>
            <div className="delete-account-warning">
              <strong>Before you continue, please note:</strong>
              <ul>
                <li>Your account will be deactivated and you'll be signed out immediately.</li>
                <li>You won't be able to log back in — reactivation requires contacting support.</li>
                <li>Your orders and order history are kept, they are not deleted.</li>
              </ul>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <label className="delete-account-ack">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                />
                I understand this will deactivate my account and sign me out.
              </label>

              <div className="auth-field">
                <label>
                  Type <strong>{CONFIRM_WORD}</strong> to confirm
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={CONFIRM_WORD}
                />
              </div>

              <button type="submit" className="btn-danger auth-submit" disabled={!canSubmit}>
                {submitting ? 'Deactivating...' : 'Delete My Account'}
              </button>
            </form>

            <p className="auth-footer">
              <Link to="/account">Cancel, take me back</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
