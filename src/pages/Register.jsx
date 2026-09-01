import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { getDeviceToken } from '../utils/deviceToken';
import './Auth.css';

export default function Register() {
  const [step, setStep] = useState(1); // 1 = details, 2 = OTP verification
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' });
  const [otp, setOtp] = useState({ mobileOtp: '', emailOtp: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // role is intentionally omitted — self-registration always creates a USER account.
      await authApi.register(form);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.verifyRegistrationOtp({
        mobile: form.mobile,
        email: form.email,
        mobileOtp: otp.mobileOtp,
        emailOtp: otp.emailOtp,
        deviceToken: await getDeviceToken(),
      });
      login(response);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="auth-subtitle">
          {step === 1 ? 'Join Zivdah for fresh groceries delivered fast' : 'Verify your mobile & email'}
        </p>

        {error && <div className="auth-error">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleRegister}>
            <div className="auth-field">
              <label>Full Name</label>
              <input type="text" name="name" required value={form.name} onChange={handleChange} />
            </div>
            <div className="auth-field">
              <label>Email</label>
              <input type="email" name="email" required value={form.email} onChange={handleChange} />
            </div>
            <div className="auth-field">
              <label>Mobile Number</label>
              <input type="tel" name="mobile" required value={form.mobile} onChange={handleChange} />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <button className="btn-primary auth-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="auth-field">
              <label>OTP sent to {form.mobile}</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp.mobileOtp}
                onChange={(e) => setOtp({ ...otp, mobileOtp: e.target.value })}
              />
            </div>
            <div className="auth-field">
              <label>OTP sent to {form.email}</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp.emailOtp}
                onChange={(e) => setOtp({ ...otp, emailOtp: e.target.value })}
              />
            </div>
            <p className="auth-hint">Demo backend — both OTPs are always 123456.</p>
            <button className="btn-primary auth-submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
