import React, { useState } from 'react';
import { Alert } from '../components';
import { useAuth } from '../context/AuthContext';
import type { LoginCredentials } from '../types';
import '../styles/LoginPage.css';





export const LoginPage: React.FC = () => {
  const { login, error: authError, clearError, loading } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!credentials.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!credentials.password.trim()) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await login(credentials);
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  return (
    <div className="login-container">
      <div className="login-form_container">
        {/* Logo */}
        <div className="login-logo_container"></div>

        {/* Title Section */}
        <div className="login-title_container">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        {/* Alert Messages */}
        {authError && (
          <Alert
            type="error"
            message={authError}
            onClose={clearError}
          />
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="login-input_container">
            <label className="login-input_label">Email Address</label>
            <input
              className="login-input_field"
              type="email"
              name="email"
              placeholder="your@email.com"
              value={credentials.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              autoComplete="email"
            />
            {formErrors.email && <p className="login-text-muted" style={{ color: '#DC2626' }}>{formErrors.email}</p>}
          </div>

          {/* Password */}
          <div className="login-input_container">
            <label className="login-input_label">Password</label>
            <input
              className="login-input_field"
              type="password"
              name="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              autoComplete="current-password"
            />
            {formErrors.password && <p className="login-text-muted" style={{ color: '#DC2626' }}>{formErrors.password}</p>}
          </div>

          {/* Forgot Password Link */}
          <div className="login-forgot-password">
            <a href="/forgot-password">Forgot Password?</a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          {/* Separator */}
          <div className="login-separator">
            <div className="line"></div>
            <span>Or continue with</span>
            <div className="line"></div>
          </div>

          {/* Social Buttons */}
          <div className="login-social-buttons-container">
            <button
              type="button"
              className="login-social-btn"
              onClick={() => alert('Google login not yet implemented')}
            >
              <span>🔍</span>
              Google
            </button>
            <button
              type="button"
              className="login-social-btn"
              onClick={() => alert('Facebook login not yet implemented')}
            >
              <span>f</span>
              Facebook
            </button>
          </div>

          {/* Signup Link */}
          <div className="login-signup-link-container">
            Don't have an account?
            <a href="/signup" className="login-signup-link">Sign Up</a>
          </div>

          {/* Backend Info */}
          <div className="login-backend-info">
            Backend running at <code>localhost:8000</code>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
