import { API_URL } from './config';

/**
 * api.js
 * Central fetch wrapper for SAARTHI NEXUS.
 * Handles JWT attachment, silent refresh on 401s, and session persistence.
 */

// ─── Token & Session Management ──────────────────────────────────────────────

export const getAccessToken = () => localStorage.getItem('access_token');
export const setAccessToken = (token) => localStorage.setItem('access_token', token);

export const getUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        return null;
    }
};

export const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));

export const isLoggedIn = () => {
    return !!getAccessToken() && !!getUser();
};

export const clearSession = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
};

// ─── Shared Refresh Logic ──────────────────────────────────────────────────

let _refreshPromise = null;

/**
 * Attempts to silently refresh the access token via the httpOnly refresh cookie.
 * Deduplicates concurrent refresh calls.
 */
const refreshAccessToken = async () => {
    if (_refreshPromise) return _refreshPromise;

    _refreshPromise = (async () => {
        try {
            const res = await fetch(`${API_URL}/api/refresh`, {
                method: 'POST',
                // credentials: 'include' is required so the browser sends the httpOnly refresh_token cookie
                credentials: 'include', 
            });
            if (!res.ok) throw new Error('Refresh failed');
            const data = await res.json();
            
            // Store the new access token and user info
            setAccessToken(data.access_token);
            setUser(data.user);
            return data.access_token;
        } catch (error) {
            // If refresh fails (e.g. cookie expired or stolen), force logout
            clearSession();
            window.location.hash = '#/login/student';
            throw error;
        } finally {
            _refreshPromise = null;
        }
    })();

    return _refreshPromise;
};

// ─── Main API Fetch Wrapper ────────────────────────────────────────────────

/**
 * Wraps standard `fetch` to:
 * 1. Attach `Authorization: Bearer <token>`
 * 2. Send cookies (`credentials: 'include'`) for refresh support
 * 3. Intercept 401s, trigger a silent refresh, and retry the request once
 */
export const apiFetch = async (path, options = {}) => {
    const url = path.startsWith('http') ? path : `${API_URL}${path}`;
    
    // Always include credentials to support the refresh cookie
    const config = {
        ...options,
        credentials: 'include',
        headers: { ...options.headers }
    };

    let token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Ensure we don't accidentally overwrite multipart/form-data boundary headers
    if (!(config.body instanceof FormData) && !config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
    }

    let response = await fetch(url, config);

    // If 401 Unauthorized, attempt a silent refresh
    if (response.status === 401) {
        try {
            token = await refreshAccessToken();
            // Retry the original request with the new token
            config.headers.Authorization = `Bearer ${token}`;
            response = await fetch(url, config);
        } catch (refreshError) {
            // Refresh failed (already handled logout redirect in refreshAccessToken)
            return response;
        }
    }

    return response;
};

// ─── Auth Convenience Methods ──────────────────────────────────────────────

export const login = async (email, password, role) => {
    const res = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role })
    });
    const data = await res.json();
    
    if (res.ok) {
        setAccessToken(data.access_token);
        setUser(data.user);
        localStorage.setItem('isAuthenticated', 'true'); // legacy flag support
    }
    return { res, data };
};

export const signup = async (payload) => {
    const res = await apiFetch('/api/signup', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
        setAccessToken(data.access_token);
        setUser(data.user);
        localStorage.setItem('isAuthenticated', 'true');
    }
    return { res, data };
};

export const logout = async () => {
    try {
        // Tell the backend to clear the httpOnly refresh cookie
        await apiFetch('/api/logout', { method: 'POST' });
    } catch (err) {
        console.error('Logout error:', err);
    } finally {
        clearSession();
        window.location.hash = '#/login/student';
    }
};
