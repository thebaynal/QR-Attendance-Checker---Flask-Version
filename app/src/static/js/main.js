/* Main JavaScript Utilities */

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const html = document.documentElement;
    
    if (savedTheme === 'dark') {
        html.classList.add('dark-mode');
        updateThemeIcon();
    }
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const isDarkMode = html.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    themeToggle.innerHTML = isDarkMode
        ? '<i class="fa-regular fa-sun" aria-hidden="true"></i>'
        : '<i class="fa-regular fa-moon" aria-hidden="true"></i>';
    themeToggle.style.animation = 'spin 0.4s ease-out';
    setTimeout(() => {
        themeToggle.style.animation = '';
    }, 400);
}

// Hamburger Menu Management
function initHamburgerMenu() {
    const hamburger = document.getElementById('hamburgerMenu');
    const navbarMenu = document.getElementById('navbarMenu');
    const navbarRight = document.getElementById('navbarRight');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!hamburger) return;

    // Toggle menu on hamburger click
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navbarMenu.classList.toggle('active');
        navbarRight.classList.toggle('active');
    });

    // Close menu when clicking on a nav link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navbarMenu.classList.remove('active');
            navbarRight.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar-container')) {
            hamburger.classList.remove('active');
            navbarMenu.classList.remove('active');
            navbarRight.classList.remove('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initTheme();
    
    // Initialize hamburger menu
    initHamburgerMenu();
});

// Toast notification system
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'fa-circle-check',
        danger: 'fa-circle-xmark',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info',
        error: 'fa-circle-xmark'
    };
    const iconClass = icons[type] || icons.info;
    // Map 'error' to 'danger' for styling
    if (type === 'error') toast.className = 'toast toast-danger';
    
    toast.innerHTML = `
        <div class="toast-icon"><i class="fa-solid ${iconClass}"></i></div>
        <div class="toast-body">
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close" aria-label="Close">&times;</button>
        <div class="toast-progress"><div class="toast-progress-bar"></div></div>
    `;
    
    container.appendChild(toast);
    
    // Trigger entrance animation
    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
        toast.querySelector('.toast-progress-bar').style.animationDuration = duration + 'ms';
    });
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));
    
    // Auto-dismiss
    setTimeout(() => dismissToast(toast), duration);
}

function dismissToast(toast) {
    if (toast.classList.contains('toast-dismissing')) return;
    toast.classList.add('toast-dismissing');
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 350);
}

function showSuccess(message) { showToast(message, 'success'); }
function showError(message) { showToast(message, 'danger', 6000); }

// Fetch API helper
function apiCall(url, method = 'GET', data = null, headers = {}) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('API Error:', error);
            throw error;
        });
}

// Format datetime
function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString();
}

// Show loading spinner
function showLoading(element) {
    element.innerHTML = '<div class="spinner"></div>';
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showSuccess('Copied to clipboard!');
    });
}
