import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { getDeviceToken } from '../utils/deviceToken';
import { digitsOnly, useFieldValidation } from '../utils/authValidation';
import './Auth.css';

const RULES = {
  identifier: 'email',
  password: 'currentPassword',
  otpMobile: 'mobile',
  otp: 'otp',
};

export default function Login() {
  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpMobile, setOtpMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { setFieldErrors, revalidate, validate, fieldProps, fieldError } = useFieldValidation(RULES);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  const onField = (setter, transform) => (e) => {
    const value = transform ? transform(e.target.value) : e.target.value;
    setter(value);
    revalidate(e.target.name, value);
  };

  const switchMode = (next) => {
    setMode(next);
    setError(null);
    setFieldErrors({});
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate({ identifier, password })) return;

    setLoading(true);
    try {
      const response = await authApi.login({
        email: identifier.trim(),
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
    if (!validate({ otpMobile })) return;

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
    if (!validate({ otp })) return;

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
            onClick={() => switchMode('password')}
          >
           Log in with Password
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'otp' ? 'active' : ''}`}
            onClick={() => switchMode('otp')}
          >
            Log in with OTP
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {mode === 'password' ? (
          <form onSubmit={handlePasswordLogin} noValidate>
            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                autoComplete="email"
                maxLength={255}
                value={identifier}
                onChange={onField(setIdentifier)}
                {...fieldProps('identifier')}
              />
              {fieldError('identifier')}
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={onField(setPassword)}
                {...fieldProps('password')}
              />
              {fieldError('password')}
            </div>
            <p className="auth-footer" style={{ marginTop: 0, marginBottom: 16, textAlign: 'right' }}>
              <Link to="/forgot-password">Forgot password?</Link>
            </p>
            <button className="btn-primary auth-submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        ) : !otpSent ? (
          <form onSubmit={handleSendOtp} noValidate>
            <div className="auth-field">
              <label>Mobile Number</label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="10-digit mobile number"
                maxLength={10}
                value={otpMobile}
                onChange={onField(setOtpMobile, (v) => digitsOnly(v, 10))}
                {...fieldProps('otpMobile')}
              />
              {fieldError('otpMobile')}
            </div>
            <button className="btn-primary auth-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} noValidate>
            <div className="auth-field">
              <label>OTP sent to {otpMobile}</label>
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
