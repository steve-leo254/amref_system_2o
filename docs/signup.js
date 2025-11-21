// Configuration
const API_BASE_URL = 'http://localhost:8000';

// Show alert messages
function showAlert(msg, color) {
    const container = document.querySelector('#msg');
    if (!container) {
        alert(msg);
        return;
    }
    
    const form = document.querySelector('#msg-e');
    const div = document.createElement('div');
    div.className = `alert alert-${color}`;
    div.appendChild(document.createTextNode(msg));
    
    container.insertBefore(div, form);
    setTimeout(() => {
        const alertElement = container.querySelector('.alert');
        if (alertElement) alertElement.remove();
    }, 3000);
}

// Initialize form when DOM is ready
function initializeSignupForm() {
    const signupForm = document.querySelector('#signupForm');
    if (!signupForm) {
        console.error('Signup form not found');
        return;
    }

    // Handle form submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.querySelector('#first_name_field');
        const lastName = document.querySelector('#last_name_field');
        const email = document.querySelector('#email_field');
        const phone = document.querySelector('#phno');
        const dateOfBirth = document.querySelector('#dob_field');
        const gender = document.querySelector('#gender_field');
        const password = document.querySelector('#password_field');
        const confirmPassword = document.querySelector('#password_fieldc');
        const termsAccepted = document.querySelector('#terms_check');
        const ageVerified = document.querySelector('#age_check');
        
        // Check if all elements exist
        if (!firstName || !lastName || !email || !phone || !dateOfBirth || !gender || !password || !confirmPassword || !termsAccepted || !ageVerified) {
            console.error('One or more form elements not found');
            showAlert('Form elements missing. Please refresh the page.', 'danger');
            return;
        }
        
        const firstNameValue = firstName.value.trim();
        const lastNameValue = lastName.value.trim();
        const emailValue = email.value.trim();
        const phoneValue = phone.value.trim();
        const dateOfBirthValue = dateOfBirth.value;
        const genderValue = gender.value;
        const passwordValue = password.value;
        const confirmPasswordValue = confirmPassword.value;
        
        // Validation
        if (!firstNameValue || !lastNameValue || !emailValue || !phoneValue || !dateOfBirthValue || !genderValue || !passwordValue || !confirmPasswordValue) {
            showAlert('Please fill all required fields', 'danger');
            return;
        }
        
        if (!termsAccepted.checked) {
            showAlert('You must accept Terms and Conditions', 'danger');
            return;
        }
        
        if (!ageVerified.checked) {
            showAlert('You must confirm you are 18 years or older', 'danger');
            return;
        }
        
        if (passwordValue.length < 8) {
            showAlert('Password must be at least 8 characters', 'danger');
            return;
        }
        
        if (passwordValue.length > 72) {
            showAlert('Password must be 72 characters or less', 'danger');
            return;
        }
        
        if (passwordValue !== confirmPasswordValue) {
            showAlert('Passwords do not match', 'danger');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailValue)) {
            showAlert('Please enter a valid email address', 'danger');
            return;
        }
        
        // Validate age (must be 18+)
        const birthDate = new Date(dateOfBirthValue);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        if (age < 18) {
            showAlert('You must be at least 18 years old to register', 'danger');
            return;
        }
        
        // Combine first and last name for backend
        const fullName = `${firstNameValue} ${lastNameValue}`;
        
        // Prepare data for backend
        const signupData = {
            full_name: fullName,
            email: emailValue,
            phone: phoneValue,
            password: passwordValue,
            gender: genderValue,
            date_of_birth: dateOfBirthValue
        };
        
        try {
            // Show loading state
            const submitButton = signupForm.querySelector('.sign-in_btn');
            submitButton.disabled = true;
            submitButton.innerHTML = '<span>Creating account...</span>';
            
            // Send registration request to backend
            const response = await fetch(`${API_BASE_URL}/auth/register/customer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signupData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showAlert('✓ Account created successfully! Redirecting to login...', 'success');
                // Clear form
                signupForm.reset();
                // Redirect to signin page after 2 seconds
                setTimeout(() => {
                    window.location.href = 'signin.html';
                }, 2000);
            } else {
                // Handle specific error messages
                if (response.status === 400 && data.detail) {
                    showAlert(`✗ ${data.detail}`, 'danger');
                } else if (data.detail) {
                    showAlert(`✗ ${data.detail}`, 'danger');
                } else if (data.message) {
                    showAlert(`✗ ${data.message}`, 'danger');
                } else {
                    showAlert('✗ Registration failed. Please try again.', 'danger');
                }
                
                // Restore button state
                submitButton.disabled = false;
                submitButton.innerHTML = '<span>Sign Up</span>';
            }
        } catch (error) {
            console.error('Signup error:', error);
            showAlert(`✗ Connection error: ${error.message}. Make sure backend is running at ${API_BASE_URL}`, 'danger');
            
            // Restore button state
            const submitButton = signupForm.querySelector('.sign-in_btn');
            submitButton.disabled = false;
            submitButton.innerHTML = '<span>Sign Up</span>';
        }
    });
}

// Handle Google signup (placeholder)
function initializeGoogleSignup() {
    const googleBtn = document.querySelector('#googleSignup');
    if (googleBtn) {
        googleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showAlert('Google signup coming soon', 'info');
        });
    }
}

// Handle Facebook signup (placeholder)
function initializeFacebookSignup() {
    const facebookBtn = document.querySelector('#facebookSignup');
    if (facebookBtn) {
        facebookBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showAlert('Facebook signup coming soon', 'info');
        });
    }
}

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeSignupForm();
        initializeGoogleSignup();
        initializeFacebookSignup();
        console.log('Signup form initialized. Backend URL:', API_BASE_URL);
    });
} else {
    initializeSignupForm();
    initializeGoogleSignup();
    initializeFacebookSignup();
    console.log('Signup form initialized. Backend URL:', API_BASE_URL);
}