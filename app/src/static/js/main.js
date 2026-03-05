/* Main JavaScript Utilities */

document.addEventListener('DOMContentLoaded', function() {
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    });
});

// Show success message
function showSuccess(message) {
    const div = document.createElement('div');
    div.className = 'alert alert-success';
    div.textContent = message;
    document.querySelector('.container').insertBefore(div, document.querySelector('.container').firstChild);
    setTimeout(() => div.remove(), 3000);
}

// Show error message
function showError(message) {
    const div = document.createElement('div');
    div.className = 'alert alert-danger';
    div.textContent = message;
    document.querySelector('.container').insertBefore(div, document.querySelector('.container').firstChild);
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
