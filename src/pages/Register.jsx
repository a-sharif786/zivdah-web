import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { getDeviceToken } from '../utils/deviceToken';
import { PASSWORD_HINT, digitsOnly, useFieldValidation } from '../utils/authValidation';
import './Auth.css';

const RULES = {
  name: 'name',
  email: 'email',
  mobile: 'mobile',
  password: 'newPassword',
  mobileOtp: 'otp',
  emailOtp: 'otp',
};

export default function Register() {
  const [step, setStep] = useState(1); // 1 = details, 2 = OTP verification
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' });
  const [otp, setOtp] = useState({ mobileOtp: '', emailOtp: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { fieldErrors, revalidate, validate, fieldProps, fieldError } = useFieldValidation(RULES);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === 'mobile') value = digitsOnly(value, 10);
    setForm({ ...form, [name]: value });
    revalidate(name, value);
  };

  const handleOtpChange = (e) => {
    const { name } = e.target;
    const value = digitsOnly(e.target.value, 6);
    setOtp({ ...otp, [name]: value });
    revalidate(name, value);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate(form)) return;

    // Keep the trimmed values in state too — the OTP step re-sends email/mobile.
    const payload = { ...form, name: form.name.trim().replace(/\s+/g, ' '), email: form.email.trim() };
    setForm(payload);
    setLoading(true);
    try {
      // role is intentionally omitted — self-registration always creates a USER account.
      await authApi.register(payload);
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
    if (!validate(otp)) return;

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
          <form onSubmit={handleRegister} noValidate>
            <div className="auth-field">
              <label>Full Name</label>
              <input type="text" autoComplete="name" maxLength={100} value={form.name} onChange={handleChange} {...fieldProps('name')} />
              {fieldError('name')}
            </div>
            <div className="auth-field">
              <label>Email</label>
              <input type="email" autoComplete="email" maxLength={255} value={form.email} onChange={handleChange} {...fieldProps('email')} />
              {fieldError('email')}
            </div>
            <div className="auth-field">
              <label>Mobile Number</label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="10-digit mobile number"
                maxLength={10}
                value={form.mobile}
                onChange={handleChange}
                {...fieldProps('mobile')}
              />
              {fieldError('mobile')}
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                autoComplete="new-password"
                maxLength={64}
                value={form.password}
                onChange={handleChange}
                {...fieldProps('password')}
              />
              {fieldError('password')}
              {!fieldErrors.password && <span className="auth-field-help">{PASSWORD_HINT}</span>}
            </div>
            <button className="btn-primary auth-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} noValidate>
            <div className="auth-field">
              <label>OTP sent to {form.mobile}</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp.mobileOtp}
                onChange={handleOtpChange}
                {...fieldProps('mobileOtp')}
              />
              {fieldError('mobileOtp')}
            </div>
            <div className="auth-field">
              <label>OTP sent to {form.email}</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp.emailOtp}
                onChange={handleOtpChange}
                {...fieldProps('emailOtp')}
              />
              {fieldError('emailOtp')}
            </div>
            <p className="auth-hint">Check your email for the verification code. Demo backend — the mobile OTP is always 123456.</p>
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
