/**
 * Modal Management
 * Provides dialogs for confirmation and alerts
 */

let deleteCallback = null;

/**
 * Show the delete confirmation modal
 */
function showDeleteModal(itemName, onConfirm, itemDetails = null) {
    const modal = document.getElementById('deleteConfirmModal');
    const messageElement = document.getElementById('modalMessage');
    const itemInfoElement = document.getElementById('modalItemInfo');

    messageElement.textContent = `Are you sure you want to delete "${itemName}"? This action cannot be undone.`;

    if (itemDetails) {
        itemInfoElement.textContent = itemDetails;
        itemInfoElement.style.display = 'block';
    } else {
        itemInfoElement.style.display = 'none';
    }

    deleteCallback = onConfirm;
    modal.classList.add('active');

    setTimeout(() => {
        const deleteBtn = modal.querySelector('.modal-btn-delete');
        if (deleteBtn) deleteBtn.focus();
    }, 100);

    document.addEventListener('keydown', handleModalKeydown);
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteConfirmModal');
    modal.classList.remove('active');
    deleteCallback = null;
}

function confirmDelete() {
    if (deleteCallback) deleteCallback();
    closeDeleteModal();
}

/**
 * Alert Modal Functions
 */
function showAlertModal(title, message, iconClass = 'fa-solid fa-circle-exclamation') {
    const modal = document.getElementById('alertModal');
    if (!modal) return;

    document.getElementById('alertModalTitle').textContent = title;
    document.getElementById('alertModalMessage').textContent = message;
    document.getElementById('alertModalIcon').innerHTML = `<i class="${iconClass}"></i>`;
    
    modal.classList.add('active');
    document.addEventListener('keydown', handleModalKeydown);
}

function closeAlertModal() {
    const modal = document.getElementById('alertModal');
    if (modal) modal.classList.remove('active');
}

/**
 * PDF Export Logic
 */
async function exportEventPDF(eventId) {
    try {
        const response = await fetch(`/events/${eventId}/export-api`);
        
        if (!response.ok) {
            let errorMsg = 'Export failed';
            let detailMsg = 'Unable to export PDF at this time.';
            
            try {
                const data = await response.json();
                errorMsg = data.error || errorMsg;
                detailMsg = data.message || detailMsg;
            } catch (e) {
                // Fallback if not JSON
            }
            
            showAlertModal(errorMsg, detailMsg, 'fa-solid fa-circle-xmark');
            return;
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_event_${eventId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        
    } catch (error) {
        showAlertModal('Network Error', 'Failed to connect to the server. Please try again.', 'fa-solid fa-tower-broadcast');
    }
}

function handleModalKeydown(event) {
    if (event.key === 'Escape') {
        closeDeleteModal();
        closeAlertModal();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Backdrop clicks to close
    ['deleteConfirmModal', 'alertModal'].forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (id === 'deleteConfirmModal') closeDeleteModal();
                    else closeAlertModal();
                }
            });
        }
    });
});
