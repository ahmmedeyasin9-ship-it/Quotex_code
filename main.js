// ==UserScript==
// @name         DemoToLiveAdmin Licensed Client
// @namespace    https://demotoliveadmin.lovable.app/
// @version      1.0.0
// @description  Verifies a license and loads a published client script from your license server.
// @match        https://YOUR-OWN-APP.example/*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @connect      demotoliveadmin.lovable.app
// ==/UserScript==

(() => {
  'use strict';

  const API = 'https://demotoliveadmin.lovable.app';
  const KEY_STORE = 'dtla_license_key';
  const DEVICE_STORE = 'dtla_device_id';
  const TOKEN_STORE = 'dtla_device_token';
  const GLOBAL_LOCK = '__dtla_licensed_loader_started__';

  if (window[GLOBAL_LOCK]) return;
  window[GLOBAL_LOCK] = true;

  const storage = {
    get(key) { try { return localStorage.getItem(key) || ''; } catch { return ''; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} },
    remove(key) { try { localStorage.removeItem(key); } catch {} },
  };

  function deviceId() {
    let id = storage.get(DEVICE_STORE);
    if (!id) {
      id = (crypto.randomUUID?.() || `${Date.now()}-${Math.random()}-${Math.random()}`)
        .replace(/[^a-zA-Z0-9-]/g, '');
      storage.set(DEVICE_STORE, id);
    }
    return id;
  }

  function request(path, body) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify(body);
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({
          method: 'POST', url: API + path,
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          data: payload, timeout: 15000,
          onload: response => {
            try { resolve(JSON.parse(response.responseText)); }
            catch { reject(new Error('The license server returned an unreadable response.')); }
          },
          onerror: () => reject(new Error('Could not connect to the license server.')),
          ontimeout: () => reject(new Error('The license server request timed out.')),
        });
        return;
      }
      fetch(API + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: payload,
        signal: AbortSignal.timeout(15000),
      }).then(async response => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok && !result.reason) throw new Error(`Request failed (${response.status}).`);
        resolve(result);
      }).catch(reject);
    });
  }

  const overlay = document.createElement('div');
  overlay.id = 'dtla-license-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#08090deF;display:flex;align-items:center;justify-content:center;padding:18px;font:15px/1.45 system-ui,sans-serif;color:#f5f5f7';
  overlay.innerHTML = `
    <section style="width:min(420px,100%);background:#171922;border:1px solid #383b49;border-radius:18px;padding:24px;box-shadow:0 20px 80px #0009">
      <div style="font-size:12px;letter-spacing:.12em;color:#8e91a2;font-weight:700">LICENSED CLIENT</div>
      <h2 style="margin:8px 0 6px;font-size:23px">Verify your license</h2>
      <p style="margin:0 0 18px;color:#aeb1bf">Enter your license key to activate this device and load the published client.</p>
      <input id="dtla-key" autocomplete="off" placeholder="Enter license key" style="box-sizing:border-box;width:100%;padding:13px 14px;background:#0d0f15;border:1px solid #444859;border-radius:10px;color:#fff;font:inherit;outline:none">
      <div id="dtla-status" role="status" style="min-height:22px;margin:12px 0;color:#f4bc56"></div>
      <button id="dtla-verify" style="width:100%;padding:13px;border:0;border-radius:10px;background:#42d6a0;color:#07140f;font:700 15px system-ui;cursor:pointer">Verify &amp; Load</button>
      <button id="dtla-clear" style="display:none;margin:12px auto 0;background:none;border:0;color:#aeb1bf;text-decoration:underline;cursor:pointer">Use another license</button>
    </section>`;
  (document.body || document.documentElement).appendChild(overlay);

  const keyInput = overlay.querySelector('#dtla-key');
  const status = overlay.querySelector('#dtla-status');
  const verifyButton = overlay.querySelector('#dtla-verify');
  const clearButton = overlay.querySelector('#dtla-clear');
  keyInput.value = storage.get(KEY_STORE);

  function message(text, color = '#f4bc56') {
    status.textContent = text;
    status.style.color = color;
  }

  async function verifyAndLoad() {
    const key = keyInput.value.trim();
    if (key.length < 10) return message('Please enter a valid license key.', '#ff7878');
    verifyButton.disabled = true;
    verifyButton.textContent = 'Checking license…';
    message('Verifying this device with the license server…');

    try {
      const id = deviceId();
      let token = storage.get(TOKEN_STORE);
      let verdict;

      if (token) {
        verdict = await request('/api/public/license/verify', {
          license_key: key, device_id: id, device_token: token,
        });
        if (!verdict.valid && verdict.reason === 'device_not_activated') token = '';
      }

      if (!token) {
        verdict = await request('/api/public/license/activate', {
          license_key: key, device_id: id,
          browser: navigator.userAgent.slice(0, 80),
          os: navigator.platform.slice(0, 80),
          device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        });
        if (!verdict.valid || !verdict.device_token) {
          throw new Error(reasonText(verdict.reason));
        }
        token = verdict.device_token;
        storage.set(TOKEN_STORE, token);
      } else if (!verdict?.valid) {
        throw new Error(reasonText(verdict?.reason));
      }

      storage.set(KEY_STORE, key);
      message('License valid. Downloading the published release…', '#42d6a0');

      const payload = await request('/api/public/client/release-code', {
        license_key: key, device_id: id, device_token: token,
      });
      if (!payload.valid) throw new Error(reasonText(payload.reason));
      if (!payload.release || !Array.isArray(payload.release.files) || !payload.release.files.length) {
        throw new Error('No published release or source files were found. Publish a release in the admin panel first.');
      }

      // Integrity-check every received file before any code is executed.
      for (const file of payload.release.files) {
        if (!file || typeof file.path !== 'string' || typeof file.content !== 'string' || typeof file.sha256 !== 'string') {
          throw new Error('The release contains an invalid file.');
        }
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(file.content));
        const actual = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
        if (actual !== file.sha256) throw new Error(`Integrity check failed for ${file.path}.`);
      }

      // Keep the loader generic: execute only your own, trusted application scripts.
      // Place a file named client.js in the release to make it the entrypoint.
      const entry = payload.release.files.find(file => /(^|\/)client\.js$/i.test(file.path));
      if (!entry) throw new Error('Published release is missing client.js. Add that entry file and publish again.');

      const runClient = new Function('API_BASE_URL', 'LICENSE_KEY', 'DEVICE_ID', 'DEVICE_TOKEN',
        `'use strict';\n${entry.content}\n//# sourceURL=${entry.path}`);
      runClient(API, key, id, token);

      clearButton.style.display = 'block';
      message(`License verified · release ${payload.release.version} loaded.`, '#42d6a0');
      setTimeout(() => overlay.remove(), 900);
    } catch (error) {
      message(error?.message || 'Could not verify license or load the published release.', '#ff7878');
      verifyButton.disabled = false;
      verifyButton.textContent = 'Try again';
    }
  }

  function reasonText(reason) {
    const messages = {
      invalid_license: 'This license key is invalid.',
      expired: 'This license has expired.',
      inactive: 'This license is inactive.',
      suspended: 'This license is suspended.',
      banned: 'This license is blocked.',
      device_blocked: 'This device is blocked for this license.',
      device_limit_reached: 'This license has reached its device limit.',
      device_not_activated: 'This device is not activated. Try again to activate it.',
      maintenance: 'The license server is temporarily under maintenance.',
      rate_limited: 'Too many attempts. Please wait and try again.',
      server_unavailable: 'The license server is unavailable. Check your connection and retry.',
      no_published_release: 'No release has been published yet. Publish one in the admin panel.',
    };
    return messages[reason] || `License check failed${reason ? `: ${reason}` : '.'}`;
  }

  verifyButton.addEventListener('click', verifyAndLoad);
  keyInput.addEventListener('keydown', event => { if (event.key === 'Enter') verifyAndLoad(); });
  clearButton.addEventListener('click', () => {
    storage.remove(KEY_STORE);
    storage.remove(TOKEN_STORE);
    keyInput.value = '';
    clearButton.style.display = 'none';
    message('Saved license removed.');
    verifyButton.textContent = 'Verify & Load';
  });
})();
