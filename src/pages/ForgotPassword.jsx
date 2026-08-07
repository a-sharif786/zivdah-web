import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import './Auth.css';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.forgetPassword(email);
      if (response.status !== 'success') {
        setError(response.message);
        return;
      }
      setInfo(response.message);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.resetPassword({ email, otp, newPassword });
      if (response.status !== 'success') {
        setError(response.message);
        return;
      }
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset Password</h1>
        <p className="auth-subtitle">
          {step === 1 ? "We'll email you a one-time code" : 'Enter the code and your new password'}
        </p>

        {error && <div className="auth-error">{error}</div>}
        {info && step === 2 && <div className="auth-success">{info}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="auth-field">
              <label>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn-primary auth-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <div className="auth-field">
              <label>One-Time Code</label>
              <input type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
            </div>
            <div className="auth-field">
              <label>New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button className="btn-primary auth-submit" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          <Link to="/login">Back to Log In</Link>
        </p>
      </div>
    </div>
  );
}
