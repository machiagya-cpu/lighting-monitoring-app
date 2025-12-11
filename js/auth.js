/**
* Authentication and Session Management - FIXED VERSION
*/

class AuthManager {
constructor() {
this.API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzNBcgaG4DaSVLkL4HQup7vmDweO61kZ7qD_y4jUNSTx8E33kpdQOvV4U8D4Y1M1503/exec';
this.SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
this.sessionCheckInterval = null;
this.init();
}

init() {
this.checkExistingSession();
this.setupEventListeners();
this.startSessionMonitoring();
}

setupEventListeners() {
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

if (loginForm) {
loginForm.addEventListener('submit', (e) => this.handleLogin(e));
}

if (logoutBtn) {
logoutBtn.addEventListener('click', () => this.handleLogout());
}
}

async handleLogin(event) {
event.preventDefault();

const username = document.getElementById('username').value.trim();
const password = document.getElementById('password').value.trim();

if (!username || !password) {
this.showAlert('Please enter username and password', 'error');
return;
}

try {
this.showLoading(true);

const response = await this.makeAPICall('POST', {
action: 'login',
username: username,
password: password
});

if (response.status === 'success') {
this.setSession(response.data);
this.showAlert('Login successful!', 'success');
// Use setTimeout to ensure DOM updates are complete
setTimeout(() => {
this.redirectToApp();
}, 100);
} else {
this.showAlert(response.message || 'Login failed', 'error');
}
} catch (error) {
console.error('Login error:', error);
this.showAlert('Login failed: ' + error.message, 'error');
} finally {
this.showLoading(false);
}
}

handleLogout() {
this.clearSession();
this.stopSessionMonitoring();
this.showAlert('Logged out successfully', 'success');
this.redirectToLogin();
}

async makeAPICall(method, data) {
const options = {
method: method,
headers: {
'Content-Type': 'text/plain',
},
};

if (data) {
options.body = JSON.stringify(data);
}

try {
const response = await fetch(this.API_ENDPOINT, options);

if (!response.ok) {
throw new Error(`HTTP error! status: ${response.status}`);
}

const result = await response.json();
return result;
} catch (error) {
console.error('API call error:', error);
throw new Error('Failed to connect to server: ' + error.message);
}
}

setSession(userData) {
const sessionData = {
user: userData,
timestamp: Date.now(),
expires: Date.now() + this.SESSION_TIMEOUT
};

localStorage.setItem('lighting_app_session', JSON.stringify(sessionData));
}

getSession() {
try {
const sessionData = localStorage.getItem('lighting_app_session');
if (!sessionData) return null;

const session = JSON.parse(sessionData);

// Check if session has expired
if (Date.now() > session.expires) {
this.clearSession();
return null;
}

return session;
} catch (error) {
console.error('Session parse error:', error);
this.clearSession();
return null;
}
}

clearSession() {
localStorage.removeItem('lighting_app_session');
}

checkExistingSession() {
const session = this.getSession();
if (session && session.user) {
this.redirectToApp();
}
}

isUserAuthenticated() {
const session = this.getSession();
return session && session.user;
}

getCurrentUser() {
const session = this.getSession();
return session ? session.user : null;
}

startSessionMonitoring() {
// Check session every minute
this.sessionCheckInterval = setInterval(() => {
this.validateSession();
}, 60000);
}

stopSessionMonitoring() {
if (this.sessionCheckInterval) {
clearInterval(this.sessionCheckInterval);
this.sessionCheckInterval = null;
}
}

validateSession() {
if (!this.isUserAuthenticated()) {
this.showAlert('Session expired. Please login again.', 'warning');
this.handleLogout();
return false;
}

// Extend session if user is active
const session = this.getSession();
if (session) {
session.expires = Date.now() + this.SESSION_TIMEOUT;
localStorage.setItem('lighting_app_session', JSON.stringify(session));
}

return true;
}

redirectToApp() {
console.log('AuthManager: redirectToApp called');

// Hide login section
const loginSection = document.getElementById('login-section');
if (loginSection) {
loginSection.style.display = 'none';
} else {
console.error('AuthManager: login-section element not found!');
}

// Show main app
const mainApp = document.getElementById('main-app');
if (mainApp) {
mainApp.style.display = 'block';
} else {
console.error('AuthManager: main-app element not found!');
}

// Initialize app with user data - with retry mechanism
this.initializeAppWithRetry();
}

initializeAppWithRetry() {
const maxRetries = 10;
let retries = 0;

const tryInitialize = () => {
if (window.appManager) {
console.log('AuthManager: appManager found, initializing...');
window.appManager.initializeWithUser(this.getCurrentUser());
return true;
} else if (retries < maxRetries) {
retries++;
console.log(`AuthManager: appManager not ready, retry ${retries}/${maxRetries}`);
setTimeout(tryInitialize, 100);
return false;
} else {
console.error('AuthManager: Failed to initialize appManager after maximum retries');
this.showAlert('App initialization failed. Please refresh the page.', 'error');
return false;
}
};

tryInitialize();
}

redirectToLogin() {
console.log('AuthManager: redirectToLogin called');

// Show login section
const loginSection = document.getElementById('login-section');
if (loginSection) {
loginSection.style.display = 'flex';
}

// Hide main app
const mainApp = document.getElementById('main-app');
if (mainApp) {
mainApp.style.display = 'none';
}

// Clear form
const loginForm = document.getElementById('login-form');
if (loginForm) {
loginForm.reset();
}
}

showLoading(show) {
const loadingOverlay = document.getElementById('loading-overlay');
if (loadingOverlay) {
loadingOverlay.style.display = show ? 'flex' : 'none';
}
}

showAlert(message, type = 'info') {
const alertContainer = document.getElementById('alert-container');
if (!alertContainer) return;

const alert = document.createElement('div');
alert.className = `alert alert-${type}`;
alert.innerHTML = `
<span>${message}</span>
<button class="alert-close" onclick="this.parentElement.remove()">&times;</button>
`;

alertContainer.appendChild(alert);

// Auto remove after 5 seconds
setTimeout(() => {
if (alert.parentElement) {
alert.remove();
}
}, 5000);
}
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
window.authManager = new AuthManager();
});
