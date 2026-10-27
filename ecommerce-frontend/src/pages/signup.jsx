import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSignup } from '../hooks/useSignup';
import { googleLoginUrl } from '../service/Authservice';
import './signup.css';

const Signup = () => {
  const {
    formData,
    handleChange,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    error,
    loading,
    handleSubmit,
  } = useSignup();

  return (
    <div className="signup-page">
      <main className="signup-card">
        <h1 className="signup-title">Sign up</h1>

        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="signup-field">
            <label htmlFor="fullName">Full Name</label>
            <div className="signup-input-wrap">
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Name (letters only, no spaces)"
                value={formData.fullName}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="signup-field">
            <label htmlFor="email">Email</label>
            <div className="signup-input-wrap">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="example@domain.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="signup-field">
            <label htmlFor="mobileNumber">Mobile Number</label>
            <div className="signup-input-wrap">
              <input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit phone number"
                value={formData.mobileNumber}
                onChange={handleChange}
                autoComplete="tel"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="signup-field">
            <label htmlFor="password">Password</label>
            <div className="signup-input-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="signup-eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="signup-field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <div className="signup-input-wrap">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="signup-eye-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          {/* Referral Code */}
          <p className="referral-label">Anyone has referred You? Claim the reward</p>
          <div className="signup-field">
            <div className="signup-input-wrap">
              <input
                id="referralCode"
                name="referralCode"
                type="text"
                placeholder="Referral code (Optional)"
                value={formData.referralCode}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="signup-submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          {/* Error Message Display */}
          {error && <p className="signup-error" role="alert">{error}</p>}

          <div className="signup-divider">
            <span>OR</span>
          </div>

          {/* Google Login */}
          <a href={googleLoginUrl} className="signup-google">
            <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 009 18z"/>
              <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.16.27-1.7V4.97H.98A9 9 0 000 9c0 1.45.35 2.83.98 4.03l2.97-2.33z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
            </svg>
            continue with Google
          </a>

          <p className="signup-footer">
            Already have an account? <Link to="/">Log in</Link>
          </p>
        </form>
      </main>
    </div>
  );
};

export default Signup;