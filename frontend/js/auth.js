function showAlert(message, type = 'error') {
  const alertContainer = document.getElementById('alertContainer');
  if (!alertContainer) return;

  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'alert-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = () => alert.remove();
  alert.appendChild(closeBtn);
  
  alertContainer.appendChild(alert);

  const timeout = setTimeout(() => alert.remove(), 5000);
  
  // Clear timeout if manually closed
  closeBtn.onclick = () => {
    clearTimeout(timeout);
    alert.remove();
  };
}

// Password strength meter
function checkPasswordStrength(password) {
  let strength = 0;
  const feedback = [];

  if (!password) return { strength: 0, feedback: [] };

  // Length checks
  if (password.length >= 6) strength += 1;
  if (password.length >= 10) strength += 1;
  if (password.length >= 14) strength += 1;

  // Character variety
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[!@#$%^&*]/.test(password)) strength += 1;

  const level = Math.min(Math.ceil(strength / 2), 4);

  if (level === 1) feedback.push('Weak - Add numbers and special characters');
  if (level === 2) feedback.push('Fair - Add uppercase letters');
  if (level === 3) feedback.push('Good - Consider special characters');
  if (level === 4) feedback.push('Strong password!');

  return { strength: level, feedback };
}

// Format field error display
function showFieldError(fieldId, errorId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(errorId);
  if (field && errorEl) {
    field.classList.add('error-field');
    errorEl.textContent = message;
  }
}

function clearFieldError(fieldId, errorId) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(errorId);
  if (field && errorEl) {
    field.classList.remove('error-field');
    errorEl.textContent = '';
  }
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Set button loading state
function setButtonLoading(btnId, isLoading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  
  btn.disabled = isLoading;
  const originalText = btn.dataset.originalText || btn.textContent;
  
  if (isLoading) {
    btn.dataset.originalText = originalText;
    btn.innerHTML = '<span class="spinner"></span> Loading...';
    btn.classList.add('loading');
  } else {
    btn.textContent = originalText;
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// Handle Register Form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  // Real-time password strength check
  const passwordInput = document.getElementById('password');
  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      const password = passwordInput.value;
      const { strength } = checkPasswordStrength(password);
      const strengthFill = document.getElementById('strengthFill');
      const strengthText = document.getElementById('strengthText');

      if (strengthFill && strengthText) {
        const fillWidth = (strength * 25);
        strengthFill.style.width = fillWidth + '%';

        const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
        strengthFill.style.backgroundColor = colors[strength];
        strengthText.textContent = labels[strength];
        strengthText.style.color = colors[strength];
      }

      clearFieldError('password', 'passwordError');
    });
  }

  // Real-time password match check
  const confirmInput = document.getElementById('confirmPassword');
  if (confirmInput) {
    confirmInput.addEventListener('input', () => {
      if (confirmInput.value !== passwordInput.value) {
        showFieldError('confirmPassword', 'confirmError', 'Passwords do not match');
      } else {
        clearFieldError('confirmPassword', 'confirmError');
      }
    });
  }

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Clear previous errors
    clearFieldError('username', 'usernameError');
    clearFieldError('email', 'emailError');
    clearFieldError('password', 'passwordError');
    clearFieldError('confirmPassword', 'confirmError');

    // Validation
    if (!username) {
      showFieldError('username', 'usernameError', 'Please enter your full name');
      return;
    }
    if (username.length < 3) {
      showFieldError('username', 'usernameError', 'Name must be at least 3 characters');
      return;
    }

    if (!email) {
      showFieldError('email', 'emailError', 'Please enter your email');
      return;
    }
    if (!isValidEmail(email)) {
      showFieldError('email', 'emailError', 'Please enter a valid email address');
      return;
    }

    if (!password) {
      showFieldError('password', 'passwordError', 'Please enter a password');
      return;
    }
    if (password.length < 6) {
      showFieldError('password', 'passwordError', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      showFieldError('confirmPassword', 'confirmError', 'Passwords do not match');
      return;
    }

    setButtonLoading('registerBtn', true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, confirmPassword })
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('✓ Registration successful! Please wait for admin approval.', 'success');
        registerForm.reset();
        document.getElementById('strengthFill').style.width = '0%';
        setTimeout(() => window.location.href = 'index.html', 2000);
      } else {
        if (data.error && data.error.includes('email')) {
          showFieldError('email', 'emailError', 'This email is already registered');
        } else {
          showAlert(data.error || 'Registration failed', 'error');
        }
      }
    } catch (error) {
      showAlert('⚠ Network error: ' + error.message, 'error');
    } finally {
      setButtonLoading('registerBtn', false);
    }
  });
}

// Handle Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Clear previous errors
    clearFieldError('email', 'emailError');
    clearFieldError('password', 'passwordError');

    // Validation
    if (!email) {
      showFieldError('email', 'emailError', 'Please enter your email');
      return;
    }
    if (!isValidEmail(email)) {
      showFieldError('email', 'emailError', 'Please enter a valid email address');
      return;
    }

    if (!password) {
      showFieldError('password', 'passwordError', 'Please enter your password');
      return;
    }

    setButtonLoading('loginBtn', true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showAlert('✓ Login successful!', 'success');
        
        // Redirect based on user role - Only Liza can access admin dashboard
        const redirectUrl = (data.user.role === 'admin' && data.user.username === 'Liza') ? 'admin_dashboard.html' : 'dashboard.html';
        setTimeout(() => window.location.href = redirectUrl, 1000);
      } else {
        if (data.error && data.error.includes('pending')) {
          showAlert('⏳ Your account is pending admin approval. Please wait or contact admin.', 'warning');
        } else if (data.error && (data.error.includes('not found') || data.error.includes('invalid'))) {
          showAlert('✗ Invalid email or password', 'error');
        } else {
          showAlert(data.error || 'Login failed', 'error');
        }
      }
    } catch (error) {
      showAlert('⚠ Network error: ' + error.message, 'error');
    } finally {
      setButtonLoading('loginBtn', false);
    }
  });

  // Forgot password link handler
  const forgotLink = document.getElementById('forgotPasswordLink');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      showAlert('⚠ Password reset feature coming soon. Please contact admin@creativestudio.com', 'warning');
    });
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

function getToken() {
  return localStorage.getItem('token');
}

function checkAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function getUserInfo() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Google Sign-In Handler
function initGoogleSignIn() {
  if (window.google && window.google.accounts) {
    window.google.accounts.id.initialize({
      client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your Google Client ID
      callback: handleGoogleResponse
    });

    const googleButton = document.getElementById('googleSignInButton');
    if (googleButton) {
      window.google.accounts.id.renderButton(
        googleButton,
        {
          type: 'standard',
          size: 'large',
          text: 'signup_with',
          theme: 'outline',
          locale: 'en'
        }
      );
    }
  }
}

function handleGoogleResponse(response) {
  const { credential } = response;
  if (!credential) {
    showAlert('Google Sign-In failed', 'error');
    return;
  }

  // Decode JWT from Google (you can use a JWT decoder library)
  const decoded = JSON.parse(atob(credential.split('.')[1]));

  const { sub: googleId, email, name, picture } = decoded;

  fetch(`${API_URL}/auth/google-signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      googleId,
      email,
      name,
      profilePic: picture
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.token) {
       localStorage.setItem('token', data.token);
       localStorage.setItem('user', JSON.stringify(data.user));
       showAlert(data.message, 'success');
       
       // Only Liza can access admin dashboard
       const redirectUrl = (data.user.role === 'admin' && data.user.username === 'Liza') ? 'admin_dashboard.html' : 'dashboard.html';
       setTimeout(() => window.location.href = redirectUrl, 1000);
    } else {
      showAlert(data.message || 'Google Sign-In failed', 'warning');
      if (data.message.includes('approval')) {
        setTimeout(() => window.location.href = 'index.html', 2000);
      }
    }
  })
  .catch(err => showAlert('Error: ' + err.message, 'error'));
}

// Display username on dashboard
document.addEventListener('DOMContentLoaded', () => {
  const usernameEl = document.getElementById('username');
  const adminUsernameEl = document.getElementById('adminUsername');

  if (usernameEl) {
    const user = getUserInfo();
    if (user) {
      usernameEl.textContent = `Welcome, ${user.username}`;
    }
  }

  if (adminUsernameEl) {
    const user = getUserInfo();
    if (user) {
      adminUsernameEl.textContent = `Admin: ${user.username}`;
    }
  }

  // Initialize Google Sign-In if button exists
  initGoogleSignIn();
});
