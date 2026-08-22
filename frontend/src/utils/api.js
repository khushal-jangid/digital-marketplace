/**
 * API Request Utility
 * All requests go to the real backend. No offline/local fallback —
 * failures are surfaced as real errors so bugs never hide silently.
 */

const LIVE_RENDER_API = 'https://digital-marketplace-1ni7.onrender.com/api';

const getNormalizedApiUrl = (endpoint) => {
  let rawBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

  // If environment variable is missing or pointing to stale/dead Render instance, use active Render URL
  if (!rawBase || rawBase.includes('markt-backend-bocp') || rawBase.includes('localhost')) {
    rawBase = LIVE_RENDER_API;
  }

  const baseWithoutApi = rawBase.endsWith('/api') ? rawBase.slice(0, -4) : rawBase;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const pathWithApi = cleanEndpoint.startsWith('/api/') || cleanEndpoint === '/api'
    ? cleanEndpoint
    : `/api${cleanEndpoint}`;

  return `${baseWithoutApi}${pathWithApi}`;
};

/**
 * Universal Request Handler — talks to the real backend only.
 * @param {string} endpoint
 * @param {string} method
 * @param {any} body
 * @param {boolean} isMultipart
 * @returns {Promise<any>}
 */
export const request = async (endpoint, method = 'GET', body = null, isMultipart = false) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = isMultipart ? body : JSON.stringify(body);
  }

  const apiUrl = getNormalizedApiUrl(endpoint);

  let res;
  try {
    res = await fetch(apiUrl, options);
  } catch (err) {
    // Real network failure (server down, no internet, CORS block, etc.)
    // Surface this clearly instead of pretending it worked.
    throw new Error(
      `Could not reach the server at ${apiUrl}. Check that the backend is running and reachable. (${err.message})`
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // Response had no JSON body
  }

  if (!res.ok) {
    // Return the backend's real error shape (it already sends { success:false, message, code })
    // so existing call sites that check `data.success` keep working correctly.
    return (
      data || {
        success: false,
        message: `Request failed with status ${res.status}`,
        code: 'REQUEST_FAILED',
      }
    );
  }

  return data;
};

export default { request };
