/**
 * AUTHENTICATION MANAGER
 * Handles user login, logout, and session management
 * 
 * @author MiniMax Agent
 * @version 1.1.0
 * @date 2025-12-09
 */

// =====================================================
// CONFIGURATION
// =====================================================

// IMPORTANT: Update this URL with your Google Apps Script Web App URL
const API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwcV3HWcsvhacflGBde4MFeTaFkaucdjxzeiIYCjEcmHmVJsW-4kF3v2tklfetpU1f2/exec'; // <-- GANTI DENGAN WEB APP URL ANDA

// Default users for reference
const DEFAULT_USERS = [
    { username: 'admin', password: 'password123', role: 'Admin' },
    { username: 'user1', password: 'password123', role: 'User1' },
    { username: 'user2', password: 'password123', role: 'User2' },
    { username: 'user3', password: 'password123', role: 'User3' }
];

// =====================================================
// AUTHENTICATION CLASS
// =====================================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionToken = null;
        this.isAuthenticated = false;
    }

    /**
     * Initialize authentication manager
     */
    init() {
        this.loadSession();
        this.bindEvents();
        this.checkAuthStatus();
    }

    /**
     * Bind authentication event listeners
     */
    bindEvents() {
        // Login form submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Enter key support for login form
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (usernameInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    passwordInput?.focus();
                }
            });
        }
    }

    /**
     * Check authentication status on page load
     */
    checkAuthStatus() {
        if (this.isAuthenticated && this.currentUser) {
            this.showMainApp();
        } else {
            this.showLogin();
        }
    }

    /**
     * Handle user login
     */
    async handleLogin(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const username = formData.get('username');
        const password = formData.get('password');
        
        if (!username || !password) {
            this.showAlert('Please enter both username and password', 'error');
            return;
        }

        this.showLoading();
        
        try {
            const response = await this.authenticateUser(username, password);
            
            if (response.success) {
                this.currentUser = response.user;
                this.sessionToken = this.generateSessionToken();
                this.isAuthenticated = true;
                
                // Save session
                this.saveSession();
                
                // Show success message
                this.showAlert('Login successful! Welcome ' + response.user.full_name, 'success');
                
                // Redirect to main app
                setTimeout(() => {
                    this.showMainApp();
                }, 1000);
                
            } else {
                this.showAlert(response.message || 'Login failed', 'error');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('Network error. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Authenticate user with server
     */
    async authenticateUser(username, password) {
        try {
            const payload = {
                action: 'authenticate',
                username: username,
                password: password
            };
            
            const response = await this.makeAPICall(payload);
            return response;
            
        } catch (error) {
            console.error('Authentication API error:', error);
            throw error;
        }
    }

    /**
     * Handle user logout
     */
    handleLogout() {
        // Clear session
        this.currentUser = null;
        this.sessionToken = null;
        this.isAuthenticated = false;
        
        // Remove from localStorage
        localStorage.removeItem('lighting_session');
        
        // Show login
        this.showLogin();
        
        // Show logout message
        this.showAlert('You have been logged out successfully', 'info');
    }

    /**
     * Show main application interface
     */
    showMainApp() {
        const loginContainer = document.getElementById('login-container');
        const appContainer = document.getElementById('app-container');
        const userNameSpan = document.getElementById('user-name');
        const userRoleSpan = document.getElementById('user-role');
        
        if (loginContainer) loginContainer.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';
        
        // Update user info in header
        if (userNameSpan && this.currentUser) {
            userNameSpan.textContent = this.currentUser.full_name;
        }
        
        if (userRoleSpan && this.currentUser) {
            userRoleSpan.textContent = this.currentUser.role;
            // Add role-based styling
            userRoleSpan.className = 'user-role role-' + this.currentUser.role.toLowerCase();
        }
    }

    /**
     * Show login interface
     */
    showLogin() {
        const loginContainer = document.getElementById('login-container');
        const appContainer = document.getElementById('app-container');
        
        if (loginContainer) loginContainer.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
        
        // Clear login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.reset();
        }
    }

    /**
     * Save session to localStorage
     */
    saveSession() {
        const sessionData = {
            user: this.currentUser,
            token: this.sessionToken,
            timestamp: Date.now()
        };
        
        localStorage.setItem('lighting_session', JSON.stringify(sessionData));
    }

    /**
     * Load session from localStorage
     */
    loadSession() {
        try {
            const sessionData = localStorage.getItem('lighting_session');
            
            if (sessionData) {
                const session = JSON.parse(sessionData);
                
                // Check if session is still valid (24 hours)
                const sessionAge = Date.now() - session.timestamp;
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                
                if (sessionAge < maxAge && session.user && session.token) {
                    this.currentUser = session.user;
                    this.sessionToken = session.token;
                    this.isAuthenticated = true;
                } else {
                    // Session expired, clear it
                    localStorage.removeItem('lighting_session');
                }
            }
        } catch (error) {
            console.error('Error loading session:', error);
            localStorage.removeItem('lighting_session');
        }
    }

    /**
     * Generate session token
     */
    generateSessionToken() {
        return btoa(Date.now() + '_' + Math.random().toString(36));
    }

    /**
     * Check if current user has specific role
     */
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    /**
     * Check if current user has admin privileges
     */
    isAdmin() {
        return this.hasRole('Admin');
    }

    /**
     * Get current user information
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isUserAuthenticated() {
        return this.isAuthenticated && this.currentUser;
    }

    /**
     * Make API call to server
     */
    async makeAPICall(payload) {
        if (!API_ENDPOINT || API_ENDPOINT === 'https://script.google.com/macros/s/AKfycbwcV3HWcsvhacflGBde4MFeTaFkaucdjxzeiIYCjEcmHmVJsW-4kF3v2tklfetpU1f2/exec') {
            throw new Error('API endpoint not configured. Please update API_ENDPOINT in auth.js');
        }

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    }

    /**
     * Show loading overlay
     */
    showLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    /**
     * Show alert message
     */
    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Create new alert
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;
        
        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        
        // Add icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        alert.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;
        
        alertContainer.appendChild(alert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    /**
     * Get authorization headers for API calls
     */
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.sessionToken}`,
            'X-User-Id': this.currentUser?.username || ''
        };
    }

    /**
     * Validate session before making API calls
     */
    validateSession() {
        if (!this.isUserAuthenticated()) {
            this.showAlert('Session expired. Please login again.', 'warning');
            this.handleLogout();
            return false;
        }
        
        return true;
    }
}

// =====================================================
// INITIALIZATION
// =====================================================

// Initialize authentication manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize auth manager
    window.authManager = new AuthManager();
    window.authManager.init();
    
    // Make auth manager globally available
    window.isAuthenticated = () => window.authManager.isUserAuthenticated();
    window.getCurrentUser = () => window.authManager.getCurrentUser();
    window.hasRole = (role) => window.authManager.hasRole(role);
    window.isAdmin = () => window.authManager.isAdmin();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
