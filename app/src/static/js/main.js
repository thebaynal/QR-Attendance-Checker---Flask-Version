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
    const themeIcon = document.getElementById('themeToggleIcon');
    if (!themeToggle || !themeIcon) return;
    
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    themeIcon.className = isDarkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    themeToggle.title = isDarkMode ? 'Switch to light mode' : 'Switch to dark mode';
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
    
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 300);
        }, 5000);
    });
});

// Show success message
function showSuccess(message) {
    const div = document.createElement('div');
    div.className = 'alert alert-success';
    div.textContent = message;
    div.style.animation = 'slideInDown 0.3s ease-out';
    document.querySelector('.container').insertBefore(div, document.querySelector('.container').firstChild);
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateY(-20px)';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

// Show error message
function showError(message) {
    const div = document.createElement('div');
    div.className = 'alert alert-danger';
    div.textContent = message;
    div.style.animation = 'slideInDown 0.3s ease-out';
    document.querySelector('.container').insertBefore(div, document.querySelector('.container').firstChild);
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateY(-20px)';
        setTimeout(() => div.remove(), 5000);
    }, 5000);
}

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
