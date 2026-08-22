/* ============================================
   Futminna FindHub - Utilities Module
   Helper functions and UI utilities
   ============================================ */

// ============================================
// DOM SELECTORS
// ============================================
function $(selector) { return document.querySelector(selector); }
function $$(selector) { return document.querySelectorAll(selector); }

// ============================================
// ID GENERATOR
// ============================================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ============================================
// DATE FORMATTING
// ============================================
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// STATUS FORMATTING
// ============================================
function formatStatus(status) {
    const config = STATUS_CONFIG[status];
    return config ? config.label : status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getStatusColor(status) {
    const config = STATUS_CONFIG[status];
    return config ? config.color : 'var(--text-gray)';
}

function getStatusClass(status) {
    return 'status-' + status.replace(/_/g, '-');
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info', title = '') {
    const container = $('.toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-times-circle"></i>',
        warning: '<i class="fas fa-exclamation-triangle"></i>',
        info: '<i class="fas fa-info-circle"></i>'
    };

    const titles = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Information'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <div class="toast-content">
            <h4>${title || titles[type]}</h4>
            <p>${message}</p>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'toastSlideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// ============================================
// MODAL MANAGEMENT
// ============================================
function syncBodyScrollLock() {
    const hasOpenModal = Array.from($('.modal-overlay')).some(modal => modal.classList.contains('active'));
    document.body.style.overflow = hasOpenModal ? 'hidden' : '';
}

function toggleModal(modalId, show = true) {
    const modal = $(`#${modalId}`);
    if (!modal) return;

    modal.classList.toggle('active', Boolean(show));
    syncBodyScrollLock();
}

function closeAllModals() {
    $('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
    });
    syncBodyScrollLock();
}

document.addEventListener('click', () => {
    if (!Array.from($('.modal-overlay')).some(modal => modal.classList.contains('active'))) {
        document.body.style.overflow = '';
    }
});

// ============================================
// DEBOUNCE
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// FORM VALIDATION
// ============================================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateMatric(matric) {
    // Format: YYYY/N/NNNNNXX
    const re = /^\d{4}\/\d{1,2}\/\d{5}[A-Z]{2}$/;
    return re.test(matric);
}

function validateFUTMINNAEmail(email) {
    // Format: firstname.mNNNNNN@st.futminna.edu.ng
    const re = /^[a-z]+\.m\d{7}@st\.futminna\.edu\.ng$/i;
    return re.test(email);
}

function showFieldError(fieldId, message) {
    const field = $(`#${fieldId}`);
    if (!field) return;

    field.style.borderColor = 'var(--danger)';

    // Find or create error element
    let errorEl = field.parentElement.querySelector('.form-error');
    if (!errorEl) {
        errorEl = document.createElement('p');
        errorEl.className = 'form-error';
        field.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = message;
    errorEl.classList.add('show');
}

function clearFieldError(fieldId) {
    const field = $(`#${fieldId}`);
    if (!field) return;

    field.style.borderColor = '';
    const errorEl = field.parentElement.querySelector('.form-error');
    if (errorEl) {
        errorEl.classList.remove('show');
    }
}

// ============================================
// LOADING STATE
// ============================================
function setButtonLoading(button, loading = true) {
    if (loading) {
        button.classList.add('btn-loading');
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
    } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
    }
}

// ============================================
// IMAGE HANDLING
// ============================================
function handleImagePreview(input, previewContainerId, maxFiles = 5) {
    const files = input.files;
    const previewContainer = $(`#${previewContainerId}`);
    if (!previewContainer) return;

    const currentCount = previewContainer.children.length;
    const remainingSlots = maxFiles - currentCount;

    if (files.length > remainingSlots) {
        showToast(`You can only upload up to ${maxFiles} images.`, 'warning', 'Too Many Images');
        return;
    }

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
            appState.uploadedImages.push(event.target.result);

            const div = document.createElement('div');
            div.className = 'image-preview-item';
            div.innerHTML = `
                <img src="${event.target.result}" alt="Preview">
                <button type="button" class="remove-img" onclick="removeUploadedImage(this)">&times;</button>
            `;
            previewContainer.appendChild(div);
        };
        reader.readAsDataURL(file);
    }
}

function removeUploadedImage(button) {
    const item = button.closest('.image-preview-item');
    const container = item.parentElement;
    const index = Array.from(container.children).indexOf(item);

    appState.uploadedImages.splice(index, 1);
    item.remove();
}

function clearImageUploads() {
    appState.uploadedImages = [];
    const containers = ['imagePreviewGrid', 'reportImagePreview', 'claimImagePreview'];
    containers.forEach(id => {
        const container = $(`#${id}`);
        if (container) container.innerHTML = '';
    });
}

// ============================================
// CONFIRM DIALOG
// ============================================
function confirmAction(message, onConfirm, onCancel = null) {
    if (confirm(message)) {
        onConfirm();
    } else if (onCancel) {
        onCancel();
    }
}

// ============================================
// COPY TO CLIPBOARD
// ============================================
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success', 'Copied');
    }).catch(() => {
        showToast('Failed to copy.', 'error', 'Error');
    });
}

// ============================================
// SCROLL TO ELEMENT
// ============================================
function scrollToElement(selector) {
    const element = $(selector);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ============================================
// MOBILE DETECTION
// ============================================
function isMobile() {
    return window.innerWidth <= 768;
}

function isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}
