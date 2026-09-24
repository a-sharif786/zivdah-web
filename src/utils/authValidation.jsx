import { useState } from 'react';

const NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/;
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const MOBILE_RE = /^[6-9]\d{9}$/; // Indian 10-digit mobile
const OTP_RE = /^\d{6}$/;

export const PASSWORD_HINT = 'At least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol';

/** Returns an error message for `value` under `rule`, or null when valid. */
export function validateField(rule, value = '') {
  const v = value.trim();
  switch (rule) {
    case 'name':
      if (!v) return 'Full name is required';
      if (v.length < 2) return 'Name must be at least 2 characters';
      if (v.length > 100) return 'Name must be at most 100 characters';
      if (!NAME_RE.test(v)) return 'Name can only contain letters, spaces, . \' and -';
      return null;
    case 'email':
      if (!v) return 'Email is required';
      if (v.length > 255 || !EMAIL_RE.test(v)) return 'Enter a valid email address (e.g. name@example.com)';
      return null;
    case 'mobile':
      if (!v) return 'Mobile number is required';
      if (!MOBILE_RE.test(v)) return 'Enter a valid 10-digit mobile number starting with 6-9';
      return null;
    case 'newPassword':
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      if (value.length > 64) return 'Password must be at most 64 characters';
      if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
      if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
      if (!/\d/.test(value)) return 'Password must contain at least one number';
      if (!/[^A-Za-z0-9\s]/.test(value)) return 'Password must contain at least one symbol (e.g. @ # $ !)';
      return null;
    // Login only checks presence: accounts created before the strength rule
    // may have weaker passwords and must still be able to log in.
    case 'currentPassword':
      if (!value) return 'Password is required';
      return null;
    case 'otp':
      if (!OTP_RE.test(v)) return 'Enter the 6-digit code';
      return null;
    default:
      return null;
  }
}

/** Strips non-digits and caps length — for mobile (10) and OTP (6) inputs. */
export const digitsOnly = (value, max) => value.replace(/\D/g, '').slice(0, max);

/**
 * Per-field validation state for a form. `rules` maps input name -> rule name.
 * Fields validate on blur and on submit; once a field shows an error it
 * re-validates on every change so the message clears as soon as it's fixed.
 */
export function useFieldValidation(rules) {
  const [fieldErrors, setFieldErrors] = useState({});

  const check = (name, value) => validateField(rules[name], value);

  const revalidate = (name, value) => {
    if (fieldErrors[name]) setFieldErrors((fe) => ({ ...fe, [name]: check(name, value) }));
  };

  /** Validates the given { name: value } fields; returns true when all are valid. */
  const validate = (values) => {
    const errors = {};
    for (const [name, value] of Object.entries(values)) {
      const msg = check(name, value);
      if (msg) errors[name] = msg;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setFieldErrors((fe) => ({ ...fe, [name]: check(name, value) }));
  };

  const fieldProps = (name) => ({
    name,
    onBlur: handleBlur,
    'aria-invalid': !!fieldErrors[name],
    className: fieldErrors[name] ? 'invalid' : undefined,
  });

  const fieldError = (name) =>
    fieldErrors[name] ? <span className="auth-field-error">{fieldErrors[name]}</span> : null;

  return { fieldErrors, setFieldErrors, revalidate, validate, fieldProps, fieldError };
}
