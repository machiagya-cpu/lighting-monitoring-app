/**
* Authentication and Session Management - CORRECTED VERSION
* Fixed element ID mismatch between HTML and JavaScript
*/

class AuthManager {
constructor() {
this.API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzqqt_N8SEW8isUMgbWoSgz_g1SBVjaSo_vvuJCWb00UE3NXuw3Ga0A9D838ty3nN8Z/exec';
this.SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
this.sessionCheckInterval = null;
this.init();
}

init() {
console.log('AuthManager: Initializing...');
// CRITICAL FIX: Always check session first
this.checkAuthentication();
this.setupEventListeners();
this.startSessionMonitoring();
console.log('AuthManager: Initialization complete');
}

// CRITICAL FIX: Check authentication before showing anything
checkAuthentication() {
console.log('AuthManager: Checking authentication...');
const session = this.getSession();

if (!session || !session.user) {
console.log('AuthManager: No valid session, showing login');
// Force show login, hide main app
this.forceShowLogin();
} else {
console.log('AuthManager: Valid session found, checking expiry...');
// Check if session is expired
if (Date.now() > session.expires) {
console.log('AuthManager: Session expired, clearing and showing login');
this.clearSession();
this.forceShowLogin();
} else {
console.log('AuthManager: Valid session, allowing dashboard access');
// Session is valid, allow dashboard - DO NOT redirect automatically
// Let user decide or wait for manual interaction
}
}
}

forceShowLogin() {
console.log('AuthManager: Force showing login page...');

// CORRECTED: Use the actual elements from HTML
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');

if (loginSection) {
loginSection.style.display = 'flex';
console.log('AuthManager: Login section shown');
} else {
console.error('AuthManager: Login section not found!');
}

if (dashboardSection) {
dashboardSection.style.display = 'none';
console.log('AuthManager: Dashboard section hidden');
} else {
console.error('AuthManager: Dashboard section not found!');
}
}

setupEventListeners() {
const loginForm = document.getElementById('login-form');
const logoutBtn = document.querySelector('button[onclick="logout()"]');

if (loginForm) {
loginForm.addEventListener('submit', (e) => this.handleLogin(e));
console.log('AuthManager: Login form event listener added');
} else {
console.error('AuthManager: Login form not found!');
}

if (logoutBtn) {
logoutBtn.addEventListener('click', () => this.handleLogout());
console.log('AuthManager: Logout button event listener added');
} else {
console.warn('AuthManager: Logout button not found');
}
}

async handleLogin(event) {
event.preventDefault();
console.log('AuthManager: handleLogin called');

const username = document.getElementById('username').value.trim();
const password = document.getElementById('password').value.trim();

if (!username || !password) {
this.showAlert('Please enter username and password', 'error');
return;
}

try {
this.showLoading(true);

console.log('AuthManager: Making API call with username:', username);

const response = await this.makeAPICall('POST', {
action: 'login',
username: username,
password: password
});

console.log('AuthManager: API Response received:', response);

if (response.success === true) {
console.log('AuthManager: Login successful, setting session');
this.setSession(response.user);
this.showAlert('Login successful!', 'success');
console.log('AuthManager: Calling redirectToApp...');
setTimeout(() => {
this.redirectToApp();
}, 500);
} else {
console.error('AuthManager: Login failed:', response.message);
this.showAlert(response.message || 'Login failed', 'error');
}
} catch (error) {
console.error('AuthManager: Login error:', error);
this.showAlert('Login failed: ' + error.message, 'error');
} finally {
this.showLoading(false);
}
}

handleLogout() {
console.log('AuthManager: handleLogout called');
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
console.log('AuthManager: Making API call to:', this.API_ENDPOINT);
console.log('AuthManager: Request options:', options);

const response = await fetch(this.API_ENDPOINT, options);

console.log('AuthManager: Response status:', response.status);
console.log('AuthManager: Response ok:', response.ok);

if (!response.ok) {
throw new Error(`HTTP error! status: ${response.status}`);
}

const result = await response.json();
console.log('AuthManager: Parsed response:', result);
return result;
} catch (error) {
console.error('AuthManager: API call error:', error);
throw new Error('Failed to connect to server: ' + error.message);
}
}

setSession(userData) {
console.log('AuthManager: Setting session with user data:', userData);
const sessionData = {
user: userData,
timestamp: Date.now(),
expires: Date.now() + this.SESSION_TIMEOUT
};

localStorage.setItem('lighting_app_session', JSON.stringify(sessionData));
console.log('AuthManager: Session saved to localStorage');
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
console.error('AuthManager: Session parse error:', error);
this.clearSession();
return null;
}
}

clearSession() {
localStorage.removeItem('lighting_app_session');
}

checkExistingSession() {
console.log('AuthManager: Checking existing session...');
const session = this.getSession();
if (session && session.user) {
console.log('AuthManager: Existing session found, redirecting to app');
this.redirectToApp();
} else {
console.log('AuthManager: No existing session');
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
console.log('AuthManager: Starting session monitoring');
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

// Ensure DOM is ready
if (document.readyState === 'loading') {
console.log('AuthManager: DOM still loading, waiting...');
setTimeout(() => this.redirectToApp(), 100);
return;
}

console.log('AuthManager: Current elements status:');
console.log('  login-section element:', document.getElementById('login-section'));
console.log('  dashboard-section element:', document.getElementById('dashboard-section'));

// Hide login section
const loginSection = document.getElementById('login-section');
if (loginSection) {
loginSection.style.display = 'none';
console.log('AuthManager: login-section hidden');
} else {
console.error('AuthManager: login-section element not found!');
return;
}

// Show dashboard section
const dashboardSection = document.getElementById('dashboard-section');
if (dashboardSection) {
dashboardSection.style.display = 'block';
console.log('AuthManager: dashboard-section shown');
} else {
console.error('AuthManager: dashboard-section element not found!');
return;
}

// Wait for appManager with more aggressive retry
this.waitForAppManager();
}

waitForAppManager() {
console.log('AuthManager: Waiting for appManager...');
let attempts = 0;
const maxAttempts = 20;

const checkAppManager = () => {
attempts++;
console.log(`AuthManager: Attempt ${attempts}/${maxAttempts} - checking appManager`);

if (window.appManager) {
console.log('AuthManager: appManager found! Initializing...');
window.appManager.initializeWithUser(this.getCurrentUser());
console.log('AuthManager: App initialization complete');
return;
}

if (attempts < maxAttempts) {
setTimeout(checkAppManager, 200); // Wait 200ms between attempts
} else {
console.error('AuthManager: Failed to find appManager after maximum attempts');
this.showAlert('Application initialization failed. Please refresh the page.', 'error');
}
};

checkAppManager();
}

redirectToLogin() {
console.log('AuthManager: redirectToLogin called');

// Show login section
const loginSection = document.getElementById('login-section');
if (loginSection) {
loginSection.style.display = 'flex';
console.log('AuthManager: login-section shown');
} else {
console.error('AuthManager: login-section element not found!');
}

// Hide dashboard section
const dashboardSection = document.getElementById('dashboard-section');
if (dashboardSection) {
dashboardSection.style.display = 'none';
console.log('AuthManager: dashboard-section hidden');
} else {
console.error('AuthManager: dashboard-section element not found!');
}

// Clear form
const loginForm = document.getElementById('login-form');
if (loginForm) {
loginForm.reset();
console.log('AuthManager: login form reset');
} else {
console.error('AuthManager: login-form element not found!');
}
}

showLoading(show) {
const loadingOverlay = document.getElementById('loading-overlay');
if (loadingOverlay) {
loadingOverlay.style.display = show ? 'flex' : 'none';
console.log('AuthManager: Loading overlay:', show ? 'shown' : 'hidden');
} else {
console.error('AuthManager: loading-overlay element not found!');
}
}

showAlert(message, type = 'info') {
console.log('AuthManager: Showing alert:', message, type);
const alertContainer = document.getElementById('alert-container');
if (!alertContainer) {
console.error('AuthManager: alert-container element not found!');
return;
}

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

// FIXED: Add global closeModal function for global access
function closeModal(modalId) {
console.log('Global closeModal called for:', modalId);

// If no modalId provided, close all modals
if (!modalId) {
const modals = document.querySelectorAll('.modal');
modals.forEach(modal => {
modal.style.display = 'none';
console.log('Modal closed:', modal.id);
});
return;
}

const modal = document.getElementById(modalId);
if (modal) {
modal.style.display = 'none';
console.log('Modal closed successfully:', modalId);
} else {
console.error('Modal not found:', modalId);
}
}

// FIXED: Add global functions for button onclick handlers
function showAddModal() {
console.log('Global showAddModal called');
if (window.appManager) {
window.appManager.showAddDataModal();
} else {
console.error('AppManager not found for showAddModal');
}
}

function applyFilters() {
console.log('Global applyFilters called');
if (window.appManager) {
window.appManager.applyFilters();
} else {
console.error('AppManager not found for applyFilters');
}
}

function clearFilters() {
console.log('Global clearFilters called');
if (window.appManager) {
window.appManager.clearFilters();
} else {
console.error('AppManager not found for clearFilters');
}
}

function saveData() {
console.log('Global saveData called');
if (window.appManager) {
const form = document.getElementById('data-form');
if (form) {
window.appManager.handleDataSubmit({ preventDefault: () => {} });
} else {
console.error('Data form not found for saveData');
}
} else {
console.error('AppManager not found for saveData');
}
}

function logout() {
console.log('Global logout called');
if (window.authManager) {
window.authManager.handleLogout();
} else {
console.error('AuthManager not found for logout');
}
}

function previousPage() {
console.log('Global previousPage called');
if (window.appManager) {
const newPage = window.appManager.currentPage - 1;
window.appManager.goToPage(newPage);
} else {
console.error('AppManager not found for previousPage');
}
}

function nextPage() {
console.log('Global nextPage called');
if (window.appManager) {
const newPage = window.appManager.currentPage + 1;
window.appManager.goToPage(newPage);
} else {
console.error('AppManager not found for nextPage');
}
}

// Make all functions globally available
window.closeModal = closeModal;
window.showAddModal = showAddModal;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.saveData = saveData;
window.logout = logout;
window.previousPage = previousPage;
window.nextPage = nextPage;

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
console.log('AuthManager: DOM loaded, initializing AuthManager');
window.authManager = new AuthManager();
console.log('AuthManager: AuthManager instance created:', window.authManager);
});
