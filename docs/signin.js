// Configuration
const API_BASE_URL = 'http://localhost:8000';

// Show alert messages
function showAlert(msg, color) {
  const container = document.querySelector('#msg');
  const form = document.querySelector('#msg-e');

  const div = document.createElement('div');
  div.className = `alert alert-${color}`;
  div.appendChild(document.createTextNode(msg));
  container.insertBefore(div, form);
  setTimeout(() => {
    const alert = document.querySelector('.alert');
    if (alert) alert.remove();
  }, 3000);
}

// Handle login form submission
document.querySelector('.sign-in_btn').addEventListener('click', async (e) => {
  e.preventDefault();

  const email = document.querySelector('#email_field').value;
  const password = document.querySelector('#password_field').value;

  if (email === '' || password === '') {
    showAlert('Please fill all the fields', 'danger');
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAlert('Please enter a valid email address', 'danger');
    return;
  }

  try {
    // Show loading state
    document.querySelector('.sign-in_btn').disabled = true;
    document.querySelector('.sign-in_btn').innerHTML = '<span>Logging in...</span>';

    // Send login request to backend
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Store token in localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token_type', data.token_type);
      
      // Optional: Store user info if available
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      showAlert('✓ Login successful! Redirecting...', 'success');
      
      // Clear form
      document.querySelector('form').reset();
      
      // Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } else {
      // Handle specific error messages
      if (response.status === 404) {
        showAlert('✗ User not found. Please check your email or sign up.', 'danger');
      } else if (response.status === 401) {
        showAlert('✗ Invalid email or password', 'danger');
      } else if (data.detail) {
        showAlert(`✗ ${data.detail}`, 'danger');
      } else if (data.message) {
        showAlert(`✗ ${data.message}`, 'danger');
      } else {
        showAlert('✗ Login failed. Please try again.', 'danger');
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    showAlert(`✗ Connection error: ${error.message}. Make sure backend is running at ${API_BASE_URL}`, 'danger');
  } finally {
    // Restore button state
    document.querySelector('.sign-in_btn').disabled = false;
    document.querySelector('.sign-in_btn').innerHTML = '<span>Sign In</span>';
  }
});

// Handle "Forgot Password" link
const forgotPasswordLink = document.querySelector('a[href="#forgot-password"]');
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    showAlert('Password reset feature coming soon', 'info');
  });
}

// Handle "Sign Up" link
const signUpLinks = document.querySelectorAll('a[href="signup.html"]');
signUpLinks.forEach(link => {
  link.addEventListener('click', () => {
    // Navigate to signup
    window.location.href = 'signup.html';
  });
});

// Add enter key support for form submission
const form = document.querySelector('form');
if (form) {
  form.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.querySelector('.sign-in_btn').click();
    }
  });
}

// Check if already logged in
window.addEventListener('load', () => {
  const token = localStorage.getItem('access_token');
  if (token) {
    // User is already logged in, redirect to dashboard
    console.log('User already logged in, redirecting to dashboard...');
    // Uncomment to auto-redirect if already logged in
    // window.location.href = 'dashboard.html';
  }
});

console.log('Login form initialized. Backend URL:', API_BASE_URL);