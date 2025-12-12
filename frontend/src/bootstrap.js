import axios from 'axios';

// Configure Axios globally for SPA authentication
window.axios = axios;

// Set base configuration for all requests
window.axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// CRITICAL: Enable credentials (cookies) with every request
// This allows session cookies to be sent/received even in cross-port requests
window.axios.defaults.withCredentials = true;

// ============================================================
// CRITICAL HEADERS FOR API AUTHENTICATION
// These headers tell Laravel this is a JSON API request,
// not a traditional form submission. This prevents redirects
// to HTML login pages and ensures Sanctum middleware works.
// ============================================================

// Identify requests as AJAX (prevents form redirect behavior)
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Force JSON content type (Laravel checks this to determine response format)
window.axios.defaults.headers.common['Content-Type'] = 'application/json';

// CRITICAL: Accept JSON responses (tells Laravel to return JSON, not HTML redirects)
window.axios.defaults.headers.common['Accept'] = 'application/json';

// Request interceptor: Add Bearer token from localStorage if available
window.axios.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// Response interceptor: Handle 401 errors (redirect to login if unauthorized)
window.axios.interceptors.response.use(
	(response) => response,
	(error) => {
		// If 401 Unauthorized, clear token and redirect to login
		if (error.response?.status === 401) {
			localStorage.removeItem('token');
			// Optional: Redirect to login (uncomment if needed)
			// window.location.href = '/login';
		}
		return Promise.reject(error);
	}
);

export default window.axios;
