import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Register.css';

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  password: string;
  confirmPassword: string;
  newsletter: boolean;
  termsAccepted: boolean;
  ageVerified: boolean;
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    phone: '',
    password: '',
    confirmPassword: '',
    newsletter: false,
    termsAccepted: false,
    ageVerified: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = (): boolean => {
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Check password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    // Check required checkboxes
    if (!formData.termsAccepted) {
      setError('You must accept the Terms and Conditions');
      return false;
    }

    if (!formData.ageVerified) {
      setError('You must be over 18 years old to register');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          password: formData.password,
          role: 'patient', // Default role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      // Success - redirect to login
      alert('Registration successful! Please login.');
      navigate('/signin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // TODO: Implement Google OAuth
    console.log('Google signup clicked');
    alert('Google signup coming soon!');
  };

  const handleFacebookSignup = () => {
    // TODO: Implement Facebook OAuth
    console.log('Facebook signup clicked');
    alert('Facebook signup coming soon!');
  };

  return (
    <div className="signup-container">
      <form className="form_container" onSubmit={handleSubmit}>
        <div className="logo_container"></div>
        
        <div className="title_container">
          <p className="title">Create your Account</p>
          <span className="subtitle">
            Get started with our website, just create an account and enjoy the experience.
          </span>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* First Name and Last Name Row */}
        <div className="row">
          <div className="col-md-6">
            <div className="input_container">
              <label className="input_label" htmlFor="firstName">
                First Name *
              </label>
              <input
                placeholder="Enter First Name"
                name="firstName"
                type="text"
                className="input_field"
                id="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                autoComplete="given-name"
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="input_container">
              <label className="input_label" htmlFor="lastName">
                Last Name *
              </label>
              <input
                placeholder="Enter Last Name"
                name="lastName"
                type="text"
                className="input_field"
                id="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                autoComplete="family-name"
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="input_container">
          <label className="input_label" htmlFor="email">
            Email ID *
          </label>
          <input
            placeholder="name@mail.com"
            name="email"
            type="email"
            className="input_field"
            id="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            autoComplete="email"
          />
        </div>

        {/* Info message about age and gender */}
        <div className="alert alert-info" role="alert">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-info-circle"
            viewBox="0 0 16 16"
            style={{ marginRight: '8px' }}
          >
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
          </svg>
          We ask for your age and gender to keep things safe, accurate, and tailored just for you.
        </div>

        {/* Gender and Date of Birth Row */}
        <div className="row">
          <div className="col-md-6">
            <div className="input_container">
              <label className="input_label" htmlFor="gender">
                Gender *
              </label>
              <select
                className="input_field"
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Select Gender --</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>
          <div className="col-md-6">
            <div className="input_container">
              <label className="input_label" htmlFor="dateOfBirth">
                Date of Birth *
              </label>
              <input
                type="date"
                className="input_field"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Phone Number */}
        <div className="input_container">
          <label className="input_label" htmlFor="phone">
            Phone Number *
          </label>
          <input
            placeholder="+254 Enter your phone number"
            name="phone"
            type="tel"
            className="input_field"
            id="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            autoComplete="tel"
          />
        </div>

        {/* Password */}
        <div className="input_container">
          <label className="input_label" htmlFor="password">
            Password *
          </label>
          <input
            placeholder="Password (min 8 characters)"
            name="password"
            type="password"
            className="input_field"
            id="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <small className="text-muted">Password must be at least 8 characters long</small>
        </div>

        {/* Confirm Password */}
        <div className="input_container">
          <label className="input_label" htmlFor="confirmPassword">
            Confirm Password *
          </label>
          <input
            placeholder="Confirm Password"
            name="confirmPassword"
            type="password"
            className="input_field"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        {/* Checkboxes */}
        <div style={{ marginTop: '20px' }}>
          <div className="form-check" style={{ marginBottom: '10px' }}>
            <input
              className="form-check-input"
              type="checkbox"
              id="newsletter"
              name="newsletter"
              checked={formData.newsletter}
              onChange={handleInputChange}
            />
            <label className="form-check-label" htmlFor="newsletter">
              Get the latest updates on new products and offers from Kiangombe Health
            </label>
          </div>
          <div className="form-check" style={{ marginBottom: '10px' }}>
            <input
              className="form-check-input"
              type="checkbox"
              id="termsAccepted"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleInputChange}
              required
            />
            <label className="form-check-label" htmlFor="termsAccepted">
              I accept the{' '}
              <a href="#" style={{ color: '#FF6B6B' }}>
                Terms and conditions
              </a>{' '}
              and{' '}
              <a href="#" style={{ color: '#FF6B6B' }}>
                Privacy Policy
              </a>{' '}
              *
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="ageVerified"
              name="ageVerified"
              checked={formData.ageVerified}
              onChange={handleInputChange}
              required
            />
            <label className="form-check-label" htmlFor="ageVerified">
              I am over 18 years old *
            </label>
          </div>
        </div>

        <button
          title="Sign Up"
          type="submit"
          className="sign-in_btn"
          disabled={isLoading}
        >
          <span>{isLoading ? 'Creating Account...' : 'Sign Up'}</span>
        </button>

        <div>
          Already have an account?{' '}
          <Link to="/signin" className="sign-in">
            Sign In
          </Link>
        </div>

        <div className="separator">
          <hr className="line" />
          <span>Or</span>
          <hr className="line" />
        </div>

        <button
          title="Sign Up with Google"
          type="button"
          className="sign-in_ggl"
          onClick={handleGoogleSignup}
        >
          <span>
            <img src="/img/google.svg" className="ggl_img" alt="Google" />
          </span>
          <span className="ggl_txt">Sign Up with Google</span>
        </button>

        <button
          title="Sign Up with Facebook"
          type="button"
          className="sign-in_fb"
          onClick={handleFacebookSignup}
        >
          <svg
            style={{ color: 'blue' }}
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-facebook"
            viewBox="0 0 16 16"
          >
            <path
              d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"
              fill="blue"
            />
          </svg>
          <span>Sign Up with Facebook</span>
        </button>
      </form>
    </div>
  );
};

export default Signup;