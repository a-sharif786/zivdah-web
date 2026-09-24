import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { PASSWORD_HINT, digitsOnly, useFieldValidation } from '../utils/authValidation';
import './Auth.css';

const RULES = {
  email: 'email',
  otp: 'otp',
  newPassword: 'newPassword',
};

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const { fieldErrors, revalidate, validate, fieldProps, fieldError } = useFieldValidation(RULES);
  const navigate = useNavigate();

  const onField = (setter, transform) => (e) => {
    const value = transform ? transform(e.target.value) : e.target.value;
    setter(value);
    revalidate(e.target.name, value);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate({ email })) return;

    // Keep the trimmed email in state — the reset step re-sends it.
    const trimmedEmail = email.trim();
    setEmail(trimmedEmail);
    setLoading(true);
    try {
      const response = await authApi.forgetPassword(trimmedEmail);
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
    if (!validate({ otp, newPassword })) return;

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
          <form onSubmit={handleSendOtp} noValidate>
            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                autoComplete="email"
                maxLength={255}
                value={email}
                onChange={onField(setEmail)}
                {...fieldProps('email')}
              />
              {fieldError('email')}
            </div>
            <button className="btn-primary auth-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} noValidate>
            <div className="auth-field">
              <label>One-Time Code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={onField(setOtp, (v) => digitsOnly(v, 6))}
                {...fieldProps('otp')}
              />
              {fieldError('otp')}
            </div>
            <div className="auth-field">
              <label>New Password</label>
              <input
                type="password"
                autoComplete="new-password"
                maxLength={64}
                value={newPassword}
                onChange={onField(setNewPassword)}
                {...fieldProps('newPassword')}
              />
              {fieldError('newPassword')}
              {!fieldErrors.newPassword && <span className="auth-field-help">{PASSWORD_HINT}</span>}
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
