import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { getDeviceToken } from '../utils/deviceToken';
import './Auth.css';

export default function Login() {
  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [identifierType, setIdentifierType] = useState('mobile'); // 'mobile' | 'email'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpMobile, setOtpMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.login({
        mobile: identifierType === 'mobile' ? identifier : undefined,
        email: identifierType === 'email' ? identifier : undefined,
        password,
      });
      login(response);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.sendOtp(otpMobile);
      setOtpSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.verifyOtp({
        mobile: otpMobile,
        otp,
        deviceToken: await getDeviceToken(),
      });
      login(response);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Log in to your Zivdah account</p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'password' ? 'active' : ''}`}
            onClick={() => {
              setMode('password');
              setError(null);
            }}
          >
            Password
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'otp' ? 'active' : ''}`}
            onClick={() => {
              setMode('otp');
              setError(null);
            }}
          >
            Log in with OTP
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {mode === 'password' ? (
          <form onSubmit={handlePasswordLogin}>
            <div className="auth-field">
              <label>Login with</label>
              <select value={identifierType} onChange={(e) => setIdentifierType(e.target.value)}>
                <option value="mobile">Mobile Number</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div className="auth-field">
              <label>{identifierType === 'mobile' ? 'Mobile Number' : 'Email'}</label>
              <input
                type={identifierType === 'email' ? 'email' : 'tel'}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <p className="auth-footer" style={{ marginTop: 0, marginBottom: 16, textAlign: 'right' }}>
              <Link to="/forgot-password">Forgot password?</Link>
            </p>
            <button className="btn-primary auth-submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        ) : !otpSent ? (
          <form onSubmit={handleSendOtp}>
            <div className="auth-field">
              <label>Mobile Number</label>
              <input type="tel" required value={otpMobile} onChange={(e) => setOtpMobile(e.target.value)} />
            </div>
            <button className="btn-primary auth-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="auth-field">
              <label>OTP sent to {otpMobile}</label>
              <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
            </div>
            <p className="auth-hint">Demo backend — OTP is always 123456.</p>
            <button className="btn-primary auth-submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Log In'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
