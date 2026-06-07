/**
 * makeAbsoluteDownloadUrl
 *
 * The backend returns relative paths like /api/v1/customer/bills/stream-token/{token}
 * for stream-token download routes (to work regardless of deployment domain).
 * This function turns those into a full URL by prepending the backend's origin.
 *
 * @param {string|null|undefined} url - The URL returned by the backend
 * @returns {string|null} - Absolute URL, or null if input is falsy
 */
export function makeAbsoluteDownloadUrl(url) {
  if (!url) return null;
  if (!url.startsWith('/')) return url; // already absolute (https://...)

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  // Strip the /api/v1 suffix (and any deeper path) to get just the origin
  const origin = apiBase.replace(/\/api\/.*$/, '');
  return origin + url;
}
