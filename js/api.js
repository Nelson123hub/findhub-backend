/* ============================================
   Futminna FindHub - Backend API Client
   ============================================ */

const API_BASE = (() => {
    const localHosts = ['localhost', '127.0.0.1'];
    const isLocal = localHosts.includes(window.location.hostname);
    const isBackendPort = window.location.port === '3000';

    if (isLocal && !isBackendPort) {
        return 'http://localhost:3000/api';
    }

    return '/api';
})();

const Api = {
    get token() {
        return localStorage.getItem('futminna_token');
    },

    set token(value) {
        if (value) {
            localStorage.setItem('futminna_token', value);
        } else {
            localStorage.removeItem('futminna_token');
        }
    },

    async request(path, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers
        });

        const rawText = await response.text();
        let data = {};
        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch (_) {
            data = { error: rawText ? rawText.slice(0, 180) : '' };
        }

        if (!response.ok) {
            throw new Error(data.error || `Request failed (HTTP ${response.status})`);
        }
        return data;
    },

    login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    logout() {
        return this.request('/auth/logout', { method: 'POST' });
    },

    requestRegistration(payload) {
        return this.request('/auth/register/request', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    verifyRegistration(email, otp) {
        return this.request('/auth/register/verify', {
            method: 'POST',
            body: JSON.stringify({ email, otp })
        });
    },

    getItems() {
        return this.request('/items');
    },

    createItem(payload) {
        return this.request('/items', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    updateItem(id, payload) {
        return this.request(`/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    },

    deleteItem(id) {
        return this.request(`/items/${id}`, { method: 'DELETE' });
    },

    createClaim(id, payload) {
        return this.request(`/items/${id}/claims`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    verifyClaim(id, action) {
        return this.request(`/items/${id}/verify`, {
            method: 'POST',
            body: JSON.stringify({ action })
        });
    },

    getNotifications() {
        return this.request('/notifications');
    },

    markNotificationsRead() {
        return this.request('/notifications/read', { method: 'PATCH' });
    }
};
