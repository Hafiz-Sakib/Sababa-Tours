// src/Components/Utilities/apiFetch.js
// Render free tier sleeps. First request can take ~60s or fail, so:
//  - wakeServer() pings /health as soon as the app opens
//  - fetchRetry() waits longer and retries instead of giving up (shows "0 packages")
import { API_BASE_URL } from "../../config";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const wakeServer = () => {
  try {
    fetch(`${API_BASE_URL}/health`, { cache: "no-store" }).catch(() => {});
  } catch {
    /* ignore */
  }
};

export const fetchRetry = async (url, options = {}, { tries = 4, timeout = 70000 } = {}) => {
  let lastError;
  for (let i = 0; i < tries; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, { ...options, signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
    }
    if (i < tries - 1) await sleep(2500 * (i + 1));
  }
  throw lastError;
};
