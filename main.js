// ==UserScript==
// @name         Quotex Demo to Live Pro + Remote Server Client
// @namespace    https://demotoliveadmin.lovable.app
// @version      3.4.0
// @description  Quotex Demo to Live Pro with Demotoliveadmin Remote Server Sync & Original Popup UI
// @author       TRADER EYASIN
// @match        *://qxbroker.com/*
// @match        *://quotex.io/*
// @match        *://quotex-market.com/*
// @match        *://market-qx.*/*
// @match        *://*.quotex.*/*
// @match        *://*.qxbroker.*/*
// @match        *://*.market-qx.*/*
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        unsafeWindow
// @connect      demotoliveadmin.lovable.app
// @connect      *.lovable.app
// @run-at       document-start
// ==/UserScript==

(function () {
  const PRIMARY_SERVER_BASE = "https://demotoliveadmin.lovable.app";
  const pageWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

  function purgeLegacyAdminStorage() {
    try {
      if (localStorage.getItem("qx_lovable_clean_v31") === "1") return;
      [
        "appActivation",
        "appDeviceToken",
        "customDeviceId",
        "active_license_key",
        "active_device_token",
        "lastVerified",
        "qxCustomProxyUrl"
      ].forEach((k) => localStorage.removeItem(k));
      localStorage.setItem("qx_lovable_clean_v31", "1");
    } catch (e) {}
  }

  purgeLegacyAdminStorage();

  function getDeviceId() {
    let id = localStorage.getItem("app_device_id") || localStorage.getItem("dtla_device_id");
    if (!id) {
      const rawId = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
        ? crypto.randomUUID()
        : (Date.now() + "-" + Math.random() + "-" + Math.random());
      id = rawId.replace(/[^a-zA-Z0-9-]/g, "");
    }
    try {
      localStorage.setItem("app_device_id", id);
      localStorage.setItem("dtla_device_id", id);
    } catch (e) {}
    return id;
  }

  function getStoredAuth() {
    return {
      key: (localStorage.getItem("app_license_key") || localStorage.getItem("dtla_license_key") || "").trim(),
      token: (localStorage.getItem("app_device_token") || localStorage.getItem("dtla_device_token") || "").trim(),
      deviceId: getDeviceId()
    };
  }

  function saveAuth(key, token) {
    const cleanKey = String(key || "").trim();
    const cleanToken = String(token || "").trim();
    if (cleanKey) {
      localStorage.setItem("app_license_key", cleanKey);
      localStorage.setItem("dtla_license_key", cleanKey);
    }
    if (cleanToken) {
      localStorage.setItem("app_device_token", cleanToken);
      localStorage.setItem("dtla_device_token", cleanToken);
    }
  }

  function parseJsonSafe(text) {
    if (!text || typeof text !== "string") return null;
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function fetchJson(url, bodyStr) {
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: bodyStr
    })
      .then(async (res) => {
        const text = await res.text();
        const parsed = parseJsonSafe(text);
        if (!parsed) {
          return {
            ok: false,
            status: res.status,
            data: { valid: false, reason: "invalid_response", detail: "HTTP " + res.status + " non-JSON response" }
          };
        }
        return { ok: res.ok && parsed.valid !== false, status: res.status, data: parsed };
      })
      .catch((err) => ({
        ok: false,
        status: 0,
        data: { valid: false, reason: "network", detail: (err && err.message) || "CORS or network error" }
      }));
  }

  function getGmRequestFn() {
    if (typeof GM_xmlhttpRequest === "function") return GM_xmlhttpRequest;
    if (typeof GM !== "undefined" && typeof GM.xmlHttpRequest === "function") return GM.xmlHttpRequest;
    return null;
  }

  function gmRequest(method, url, bodyStr) {
    const gmReq = getGmRequestFn();
    if (!gmReq) {
      return Promise.resolve({
        ok: false,
        status: 0,
        text: "",
        data: { valid: false, reason: "no_gm", detail: "GM_xmlhttpRequest not available" }
      });
    }

    return new Promise((resolve) => {
      let settled = false;
      const done = (result) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      const timer = setTimeout(() => {
        done({ ok: false, status: 0, text: "", data: { valid: false, reason: "timeout", detail: "GM_xmlhttpRequest timed out" } });
      }, 15000);

      const handleResponse = (res) => {
        clearTimeout(timer);
        if (!res || res.status === 0) {
          done({ ok: false, status: 0, text: "", data: { valid: false, reason: "gm_blocked", detail: "Cross-origin request blocked" } });
          return;
        }
        const parsed = parseJsonSafe(res.responseText);
        done({
          ok: res.status >= 200 && res.status < 300 && (!parsed || parsed.valid !== false),
          status: res.status,
          text: res.responseText || "",
          data: parsed || { valid: false, reason: "invalid_response", detail: "HTTP " + res.status }
        });
      };

      try {
        const maybePromise = gmReq({
          method: method,
          url: url,
          headers: method === "POST"
            ? { "Content-Type": "application/json", "Accept": "application/json" }
            : { "Accept": "*/*" },
          data: method === "POST" ? bodyStr : undefined,
          anonymous: true,
          timeout: 14000,
          onload: handleResponse,
          onerror: () => {
            clearTimeout(timer);
            done({ ok: false, status: 0, text: "", data: { valid: false, reason: "gm_error", detail: "GM_xmlhttpRequest error" } });
          },
          ontimeout: () => {
            clearTimeout(timer);
            done({ ok: false, status: 0, text: "", data: { valid: false, reason: "timeout", detail: "GM_xmlhttpRequest timed out" } });
          }
        });

        if (maybePromise && typeof maybePromise.then === "function") {
          maybePromise.then(handleResponse).catch(() => {
            clearTimeout(timer);
            done({ ok: false, status: 0, text: "", data: { valid: false, reason: "gm_error", detail: "GM.xmlHttpRequest rejected" } });
          });
        }
      } catch (err) {
        clearTimeout(timer);
        done({ ok: false, status: 0, text: "", data: { valid: false, reason: "gm_error", detail: "GM_xmlhttpRequest threw exception" } });
      }
    });
  }

  function hasExtensionBridge() {
    try {
      return !!(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.qxExtBridge === "1");
    } catch (e) {
      return false;
    }
  }

  function extBridgePost(path, bodyStr) {
    if (!hasExtensionBridge()) return Promise.resolve(null);
    return new Promise((resolve) => {
      const reqId = "qx_ext_" + Math.random().toString(36).slice(2) + "_" + Date.now();
      let settled = false;
      const done = (res) => {
        if (settled) return;
        settled = true;
        window.removeEventListener("message", onMsg);
        clearTimeout(timer);
        resolve(res);
      };
      const onMsg = (ev) => {
        if (ev.source !== window || !ev.data || ev.data.__qxExtRes !== true || ev.data.id !== reqId) return;
        done(ev.data.result || { ok: false, status: 0, data: { valid: false, reason: "network" } });
      };
      const timer = setTimeout(() => {
        done({ ok: false, status: 0, data: { valid: false, reason: "timeout" } });
      }, 15000);
      window.addEventListener("message", onMsg);
      window.postMessage({ __qxExtReq: true, id: reqId, path: path, body: bodyStr }, "*");
    });
  }

  async function apiPost(path, payload) {
    const bodyStr = JSON.stringify(payload || {});
    const primaryUrl = PRIMARY_SERVER_BASE + path;
    const hasGm = !!getGmRequestFn();

    if (hasExtensionBridge()) {
      const extRes = await extBridgePost(path, bodyStr);
      if (extRes && extRes.data && extRes.data.reason !== "ext_unavailable") {
        return extRes;
      }
    }

    const directRes = await fetchJson(primaryUrl, bodyStr);
    if (directRes && directRes.data && directRes.data.reason !== "network" && directRes.data.reason !== "invalid_response") {
      return directRes;
    }

    let gmRes = null;
    if (hasGm) {
      gmRes = await gmRequest("POST", primaryUrl, bodyStr);
      const gmReason = gmRes && gmRes.data && gmRes.data.reason;
      if (gmRes && gmRes.data && gmReason !== "no_gm" && gmReason !== "gm_blocked" && gmReason !== "gm_error" && gmReason !== "timeout" && gmReason !== "invalid_response") {
        return gmRes;
      }
    }

    return directRes;
  }

  function extBridgeGet(url) {
    if (!hasExtensionBridge()) return Promise.resolve(null);
    return new Promise((resolve) => {
      const reqId = "qx_extg_" + Math.random().toString(36).slice(2) + "_" + Date.now();
      let settled = false;
      const done = (res) => {
        if (settled) return;
        settled = true;
        window.removeEventListener("message", onMsg);
        clearTimeout(timer);
        resolve(res);
      };
      const onMsg = (ev) => {
        if (ev.source !== window || !ev.data || ev.data.__qxExtRes !== true || ev.data.id !== reqId) return;
        done(ev.data.result || { ok: false, text: "" });
      };
      const timer = setTimeout(() => done({ ok: false, text: "" }), 15000);
      window.addEventListener("message", onMsg);
      window.postMessage({ __qxExtGet: true, id: reqId, url: url }, "*");
    });
  }

  async function fetchTextRemote(url) {
    const resolvedUrl = /^https?:\/\//i.test(url) ? url : PRIMARY_SERVER_BASE + (url.startsWith("/") ? url : "/" + url);
    if (hasExtensionBridge()) {
      const extRes = await extBridgeGet(resolvedUrl);
      if (extRes && extRes.ok && extRes.text) return extRes.text;
    }
    try {
      const r = await fetch(resolvedUrl);
      if (r.ok) return await r.text();
    } catch (e) {}
    if (getGmRequestFn()) {
      const g = await gmRequest("GET", resolvedUrl);
      if (g && g.ok && g.text) return g.text;
    }
    return "";
  }

  function getActivateMeta() {
    const ua = (typeof navigator !== "undefined" && navigator.userAgent) ? navigator.userAgent : "";
    const plat = (typeof navigator !== "undefined" && navigator.platform) ? navigator.platform : "";
    return {
      browser: ua.slice(0, 80),
      os: plat.slice(0, 80),
      device_type: /Mobi|Android/i.test(ua) ? "mobile" : "desktop"
    };
  }

  async function activateLicense(licenseKey) {
    const cleanKey = String(licenseKey || "").trim();
    const deviceId = getDeviceId();
    const meta = getActivateMeta();
    const res = await apiPost("/api/public/license/activate", {
      license_key: cleanKey,
      device_id: deviceId,
      browser: meta.browser,
      os: meta.os,
      device_type: meta.device_type
    });
    if (res.ok && res.data && res.data.valid) {
      saveAuth(cleanKey, res.data.device_token || "");
      return { success: true, expires_at: res.data.expires_at, device_token: res.data.device_token || "" };
    }
    return { success: false, reason: (res.data && res.data.reason) || "Activation failed" };
  }

  async function verifyLicense() {
    const auth = getStoredAuth();
    if (!auth.key) return { valid: false, reason: "no_license" };
    const res = await apiPost("/api/public/license/verify", {
      license_key: auth.key,
      device_id: auth.deviceId,
      device_token: auth.token
    });
    if (res.ok && res.data && res.data.valid) {
      return { valid: true, expires_at: res.data.expires_at };
    }
    return { valid: false, reason: (res.data && res.data.reason) || "network" };
  }

  async function fetchBootstrapPayload(licenseKey, deviceToken) {
    const auth = getStoredAuth();
    const res = await apiPost("/api/public/client/bootstrap", {
      license_key: licenseKey || auth.key,
      device_id: auth.deviceId,
      device_token: deviceToken || auth.token
    });
    return (res && res.data) || { valid: false, reason: "network" };
  }

  const licenseBridge = {
    activate: activateLicense,
    verify: verifyLicense,
    bootstrap: fetchBootstrapPayload,
    apiPost: apiPost,
    fetchTextRemote: fetchTextRemote,
    getDeviceId: getDeviceId,
    getStoredAuth: getStoredAuth,
    saveAuth: saveAuth
  };
  window.AppLicense = licenseBridge;
  try {
    pageWin.AppLicense = licenseBridge;
  } catch (e) {}
})();

(function initShadowDomHook() {
  const pageWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
  if (pageWin.__qxShadowPatched) return;
  pageWin.__qxShadowPatched = true;
  const shadowRootWeakMap = new WeakMap();
  const originalAttachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (shadowOptions) {
    const createdShadowRoot = originalAttachShadow.call(this, Object.assign({}, shadowOptions || {}, { mode: "open" }));
    shadowRootWeakMap.set(this, createdShadowRoot);
    if (this.localName === "qx-usermenu-trigger") {
      pageWin.__qxUsermenuShadow = createdShadowRoot;
      window.__qxUsermenuShadow = createdShadowRoot;
    }
    return createdShadowRoot;
  };
  const getShadow = function (targetElement) {
    if (!targetElement) return null;
    return targetElement.shadowRoot || shadowRootWeakMap.get(targetElement) || null;
  };
  const ensureShadow = function () {
    const triggerElement = document.querySelector("qx-usermenu-trigger");
    if (!triggerElement) return null;
    const existingShadowRoot = triggerElement.shadowRoot || shadowRootWeakMap.get(triggerElement) || pageWin.__qxUsermenuShadow || window.__qxUsermenuShadow || null;
    if (existingShadowRoot) return existingShadowRoot;
    if (!pageWin.__qxUsermenuShadowKicked) {
      pageWin.__qxUsermenuShadowKicked = true;
      try { triggerElement.remove(); } catch (e) {}
    }
    return null;
  };
  window.__qxGetShadowRoot = getShadow;
  window.__qxEnsureUsermenuShadow = ensureShadow;
  try {
    pageWin.__qxGetShadowRoot = getShadow;
    pageWin.__qxEnsureUsermenuShadow = ensureShadow;
  } catch (e) {}
})();

(async function () {
  const PRIMARY_SERVER_BASE = "https://demotoliveadmin.lovable.app";
  const pageWinMain = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

  if (pageWinMain.__qxProLoaded && typeof pageWinMain.__qxProOpenPopup === "function") {
    pageWinMain.__qxProOpenPopup();
    return;
  }

  function getDeviceId() {
    if (window.AppLicense && typeof window.AppLicense.getDeviceId === "function") {
      return window.AppLicense.getDeviceId();
    }
    let id = localStorage.getItem("app_device_id") || localStorage.getItem("dtla_device_id");
    if (!id) {
      const rawId = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
        ? crypto.randomUUID()
        : (Date.now() + "-" + Math.random() + "-" + Math.random());
      id = rawId.replace(/[^a-zA-Z0-9-]/g, "");
    }
    try {
      localStorage.setItem("app_device_id", id);
      localStorage.setItem("dtla_device_id", id);
    } catch (e) {}
    return id;
  }

  function getStoredAuth() {
    if (window.AppLicense && typeof window.AppLicense.getStoredAuth === "function") {
      return window.AppLicense.getStoredAuth();
    }
    return {
      key: (localStorage.getItem("app_license_key") || localStorage.getItem("dtla_license_key") || "").trim(),
      token: (localStorage.getItem("app_device_token") || localStorage.getItem("dtla_device_token") || "").trim(),
      deviceId: getDeviceId()
    };
  }

  function saveAuth(key, token) {
    if (window.AppLicense && typeof window.AppLicense.saveAuth === "function") {
      window.AppLicense.saveAuth(key, token);
      return;
    }
    const cleanKey = String(key || "").trim();
    const cleanToken = String(token || "").trim();
    if (cleanKey) {
      localStorage.setItem("app_license_key", cleanKey);
      localStorage.setItem("dtla_license_key", cleanKey);
    }
    if (cleanToken) {
      localStorage.setItem("app_device_token", cleanToken);
      localStorage.setItem("dtla_device_token", cleanToken);
    }
  }

  function clearLicenseStorage() {
    try {
      localStorage.removeItem("app_license_key");
      localStorage.removeItem("app_device_token");
      localStorage.removeItem("dtla_license_key");
      localStorage.removeItem("dtla_device_token");
      localStorage.removeItem("appActivation");
      localStorage.removeItem("active_license_key");
      localStorage.removeItem("lastVerified");
      localStorage.removeItem("appDeviceToken");
      localStorage.removeItem("active_device_token");
    } catch (e) {}
    isActivated = false;
  }

  function decodeBase64Utf8(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(bytes);
  }

  async function fetchText(url) {
    if (window.AppLicense && typeof window.AppLicense.fetchTextRemote === "function") {
      const txt = await window.AppLicense.fetchTextRemote(url);
      if (txt) return txt;
    }
    const resolvedUrl = /^https?:\/\//i.test(url) ? url : PRIMARY_SERVER_BASE + (url.startsWith("/") ? url : "/" + url);
    try {
      const r = await fetch(resolvedUrl);
      if (r.ok) return await r.text();
    } catch (e) {}
    return "";
  }

  function injectRemoteCss(cssText) {
    try {
      if (!cssText || typeof cssText !== "string") return;
      const st = document.createElement("style");
      st.textContent = cssText;
      (document.head || document.body || document.documentElement).appendChild(st);
    } catch (e) {}
  }

  async function extractScriptsRecursive(node, visited, outScripts) {
    if (!node || typeof node !== "object" || visited.has(node)) return;
    visited.add(node);

    const filePath = String(node.path || node.name || node.filename || "").toLowerCase();
    const isCssFile = /\.css(\?.*)?$/i.test(filePath);
    const isNonJsAsset = /\.(md|txt|json|html|htm|svg|png|jpg|jpeg|webp|map)(\?.*)?$/i.test(filePath);

    const codeKeys = [
      "script", "code", "source", "source_code", "sourceCode", "js", "javascript",
      "bundle", "client_code", "entry_code", "app_code", "runtime_code", "payload_js",
      "content", "scriptContent", "body", "text", "raw"
    ];
    for (let i = 0; i < codeKeys.length; i++) {
      const val = node[codeKeys[i]];
      if (typeof val === "string" && val.trim().length > 10) {
        let decoded = val;
        if (node.encoding === "base64") {
          try {
            decoded = decodeBase64Utf8(val.trim());
          } catch (e) {}
        }
        if (isCssFile) {
          injectRemoteCss(decoded);
        } else if (!isNonJsAsset) {
          outScripts.push(decoded);
        }
      }
    }

    const b64Keys = ["script_base64", "code_base64", "source_base64", "content_base64", "bundle_base64"];
    for (let i = 0; i < b64Keys.length; i++) {
      const val = node[b64Keys[i]];
      if (typeof val === "string" && val.trim()) {
        try {
          const decoded = decodeBase64Utf8(val.trim());
          if (isCssFile) injectRemoteCss(decoded);
          else if (!isNonJsAsset) outScripts.push(decoded);
        } catch (e) {}
      }
    }

    const urlKeys = [
      "script_url", "bundle_url", "release_url", "entry_url", "download_url",
      "file_url", "signed_url", "public_url", "artifact_url",
      "downloadUrl", "fileUrl", "scriptUrl", "bundleUrl", "url"
    ];
    for (let i = 0; i < urlKeys.length; i++) {
      const u = node[urlKeys[i]];
      if (typeof u === "string" && u.trim() && (/^https?:\/\//i.test(u) || u.startsWith("/"))) {
        const fetched = await fetchText(u.trim());
        if (fetched && fetched.trim() && !/^\s*</.test(fetched)) {
          if (isCssFile || /\.css(\?.*)?$/i.test(u)) injectRemoteCss(fetched);
          else if (!isNonJsAsset) outScripts.push(fetched);
        }
      }
    }

    const values = Array.isArray(node) ? node : Object.values(node);
    for (let i = 0; i < values.length; i++) {
      if (values[i] && typeof values[i] === "object") {
        await extractScriptsRecursive(values[i], visited, outScripts);
      }
    }
  }

  function hashScriptText(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return str.length + ":" + h;
  }

  const executedRemoteHashes = new Set();

  async function verifyFilesSha256(files) {
    if (!Array.isArray(files) || files.length === 0) return { ok: true };
    const hasSubtle = typeof crypto !== "undefined" && crypto.subtle && typeof crypto.subtle.digest === "function" && typeof TextEncoder !== "undefined";
    if (!hasSubtle) return { ok: true };
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file || typeof file.content !== "string" || !file.sha256) continue;
      try {
        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(file.content));
        const actual = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
        if (actual.toLowerCase() !== String(file.sha256).trim().toLowerCase()) {
          return { ok: false, failedFile: file.path || ("file#" + i) };
        }
      } catch (e) {}
    }
    return { ok: true };
  }

  function executeServerCode(codeText, ctx) {
    if (!codeText || typeof codeText !== "string") return false;
    const cleanCode = codeText.replace(/^\uFEFF/, "").trim();
    if (!cleanCode) return false;
    const sig = hashScriptText(cleanCode);
    if (executedRemoteHashes.has(sig)) return true;

    const apiBase = (ctx && ctx.apiBase) || PRIMARY_SERVER_BASE;
    const licKey = (ctx && ctx.key) || "";
    const devId = (ctx && ctx.deviceId) || "";
    const devToken = (ctx && ctx.token) || "";
    const entryPath = (ctx && ctx.entryPath) || "client.js";

    try {
      pageWinMain.API_BASE_URL = apiBase;
      pageWinMain.LICENSE_KEY = licKey;
      pageWinMain.DEVICE_ID = devId;
      pageWinMain.DEVICE_TOKEN = devToken;
      window.API_BASE_URL = apiBase;
      window.LICENSE_KEY = licKey;
      window.DEVICE_ID = devId;
      window.DEVICE_TOKEN = devToken;
    } catch (e) {}

    // Primary runner matching Lovable DemoToLiveAdmin Dynamic Loader v1.1.0 (injects 4 scope arguments)
    try {
      const runClient = new Function(
        "API_BASE_URL",
        "LICENSE_KEY",
        "DEVICE_ID",
        "DEVICE_TOKEN",
        "'use strict';\n" + cleanCode + "\n//# sourceURL=" + entryPath
      );
      runClient.call(pageWinMain, apiBase, licKey, devId, devToken);
      executedRemoteHashes.add(sig);
      return true;
    } catch (fnErr) {
      try {
        pageWinMain.__QX_LAST_EXEC_ERROR__ = (fnErr && fnErr.message) || String(fnErr);
      } catch (e) {}
    }

    // Fallback <script> tag execution if page CSP restricts new Function()
    try {
      const flag = "__qxServerExecOk_" + Date.now();
      const s = document.createElement("script");
      s.textContent =
        "window.API_BASE_URL=" + JSON.stringify(apiBase) + ";" +
        "window.LICENSE_KEY=" + JSON.stringify(licKey) + ";" +
        "window.DEVICE_ID=" + JSON.stringify(devId) + ";" +
        "window.DEVICE_TOKEN=" + JSON.stringify(devToken) + ";" +
        cleanCode + "\n;window[" + JSON.stringify(flag) + "]=1;";
      (document.head || document.body || document.documentElement).appendChild(s);
      s.remove();
      if (window[flag]) {
        try { delete window[flag]; } catch (e) {}
        executedRemoteHashes.add(sig);
        return true;
      }
    } catch (e) {}

    return false;
  }

  let serverPayloadLoaded = false;

  async function tryRunRemoteBootstrap(key, deviceId, token) {
    if (serverPayloadLoaded) return true;
    try {
      const payload = {
        license_key: key,
        device_id: deviceId,
        device_token: token
      };

      const releaseRes = await callLicenseApi("release-code", payload);
      if (releaseRes && releaseRes.valid && releaseRes.release && Array.isArray(releaseRes.release.files) && releaseRes.release.files.length > 0) {
        pageWinMain.__QX_RELEASE_CODE__ = releaseRes;
        window.__QX_RELEASE_CODE__ = releaseRes;

        const shaCheck = await verifyFilesSha256(releaseRes.release.files);
        if (!shaCheck.ok) {
          pageWinMain.__QX_SERVER_CODE_ERROR__ = "Integrity check failed for " + shaCheck.failedFile;
          pageWinMain.__QX_SERVER_CODE_LOADED__ = false;
          return false;
        }

        const cssFiles = releaseRes.release.files.filter((f) => f && typeof f.content === "string" && /\.css$/i.test(String(f.path || "")));
        for (let i = 0; i < cssFiles.length; i++) {
          injectRemoteCss(cssFiles[i].content);
        }

        const jsFiles = releaseRes.release.files.filter((f) => f && typeof f.content === "string" && /\.js$/i.test(String(f.path || "")));
        if (jsFiles.length > 0) {
          const entry = jsFiles.find((f) => /(^|\/)client\.js$/i.test(String(f.path || ""))) || jsFiles[0];
          const execOk = executeServerCode(entry.content, {
            apiBase: PRIMARY_SERVER_BASE,
            key: key,
            deviceId: deviceId,
            token: token,
            entryPath: entry.path || "client.js"
          });
          if (execOk) {
            serverPayloadLoaded = true;
            pageWinMain.__QX_SERVER_ENTRY__ = entry.path || "client.js";
            pageWinMain.__QX_SERVER_VERSION__ = releaseRes.release.version || "";
            pageWinMain.__QX_SERVER_CODE_LOADED__ = true;
            return true;
          }
        }
      } else if (releaseRes && releaseRes.reason) {
        pageWinMain.__QX_SERVER_CODE_ERROR__ = releaseRes.reason;
      }

      // Secondary fallback for alternative/legacy payload shapes
      const scripts = [];
      if (releaseRes && releaseRes.valid !== false) {
        await extractScriptsRecursive(releaseRes, new Set(), scripts);
      }
      if (scripts.length === 0) {
        const bootRes = await callLicenseApi("bootstrap", payload);
        if (bootRes && bootRes.valid !== false) {
          pageWinMain.__QX_BOOTSTRAP__ = bootRes;
          window.__QX_BOOTSTRAP__ = bootRes;
          await extractScriptsRecursive(bootRes, new Set(), scripts);
        }
      }

      if (scripts.length > 0) {
        for (let i = 0; i < scripts.length; i++) {
          if (executeServerCode(scripts[i], { apiBase: PRIMARY_SERVER_BASE, key: key, deviceId: deviceId, token: token, entryPath: "bootstrap-" + i + ".js" })) {
            serverPayloadLoaded = true;
          }
        }
      }
      pageWinMain.__QX_SERVER_CODE_LOADED__ = serverPayloadLoaded;
      return serverPayloadLoaded;
    } catch (e) {
      return false;
    }
  }

  function getUsermenuShadowRoot() {
    if (typeof window.__qxEnsureUsermenuShadow === "function") {
      return window.__qxEnsureUsermenuShadow();
    }
    const trigger = document.querySelector("qx-usermenu-trigger");
    return trigger ? trigger.shadowRoot || window.__qxUsermenuShadow || null : null;
  }

  function isDemoAccount() {
    const pathname = location.pathname || "";
    const href = location.href || "";
    if (/\/demo-trade(?:\/|$|\?)/i.test(pathname) || /\/demo-trade(?:\/|$|\?)/i.test(href)) {
      return true;
    }
    const shadow = getUsermenuShadowRoot();
    const nameEl = shadow && shadow.querySelector(".name");
    if (nameEl) {
      if (nameEl.classList.contains("demo") || /demo/i.test(nameEl.textContent || "")) return true;
      if (nameEl.classList.contains("live") || /^live(\s+account)?$/i.test((nameEl.textContent || "").trim())) return false;
    }
    const demoRadio = document.querySelector('.grOBD input.r29tN[value="demo"]');
    if (demoRadio && demoRadio.checked) return true;
    if (document.querySelector('.grOBD li.RDtBn.Qx5RW a.yBslY[href*="demo-trade"]')) return true;
    if (document.querySelector('.grOBD a.yBslY.active[href*="demo-trade"]')) return true;
    const liveRadio = document.querySelector('.grOBD input.r29tN[value="live"]');
    if (liveRadio && liveRadio.checked) return false;
    return false;
  }

  function isMenuPresent() {
    return !!(
      document.querySelector(".p0Ijl.Qx5RW") ||
      document.querySelector(".QE4Zb .p0Ijl") ||
      document.querySelector(".RyAkb .grOBD") ||
      document.querySelector(".grOBD li.RDtBn")
    );
  }

  function dispatchFullClick(el) {
    if (!el) return false;
    try {
      el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, view: window }));
      el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
      el.click();
      el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
      el.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true, view: window }));
    } catch (e) {
      try { el.click(); } catch (err) {}
    }
    return true;
  }

  function clickMenuTrigger() {
    const trigger =
      document.querySelector(".RyAkb .uoy2n") ||
      document.querySelector(".uoy2n qx-usermenu-trigger") ||
      document.querySelector("qx-usermenu-trigger") ||
      document.querySelector(".RyAkb .QE4Zb") ||
      document.querySelector(".QE4Zb");
    return dispatchFullClick(trigger);
  }

  function ensureMenuOpen() {
    if (!isMenuPresent()) return false;
    return clickMenuTrigger();
  }

  function getDemoAccountElement() {
    const demoInput = document.querySelector('.grOBD input.r29tN[value="demo"]');
    if (demoInput) {
      const li = demoInput.closest("li.RDtBn");
      return (li && li.querySelector("a.yBslY")) || demoInput.closest("label") || demoInput.closest("a.yBslY") || li || demoInput;
    }
    return (
      document.querySelector('.grOBD a.yBslY[href*="demo-trade"]') ||
      document.querySelector('.grOBD a[href*="/demo-trade"]') ||
      document.querySelector('.p0Ijl a.yBslY[href*="demo-trade"]') ||
      document.querySelector('a.yBslY[href*="/en/demo-trade"]')
    );
  }

  function confirmAccountSwitch() {
    const btn =
      document.querySelector(".modal-account-type-changed button.PUCjQ") ||
      document.querySelector(".modal.modal-account-type-changed button.PUCjQ") ||
      document.querySelector(".modal.active.center .modal-account-type-changed button.PUCjQ") ||
      document.querySelector(".modal-account-type-changed .modal__close") ||
      document.querySelector(".modal.active.center button.PUCjQ") ||
      document.querySelector("button.PUCjQ") ||
      document.querySelector(".modal-account-type-changed__body-button") ||
      document.querySelector(".modal.active .modal__close");
    return dispatchFullClick(btn);
  }

  async function switchToDemo(attempt) {
    const count = attempt || 1;
    try {
      if (!document.querySelector("qx-usermenu-trigger, .RyAkb .uoy2n, .QE4Zb")) {
        if (count < 25) setTimeout(() => switchToDemo(count + 1), 200);
        return;
      }
      if (isDemoAccount()) {
        ensureMenuOpen();
        confirmAccountSwitch();
        return;
      }
      if (!isMenuPresent()) {
        if (!clickMenuTrigger()) {
          if (count < 25) setTimeout(() => switchToDemo(count + 1), 250);
          return;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      if (isDemoAccount()) {
        ensureMenuOpen();
        confirmAccountSwitch();
        return;
      }
      const demoEl = getDemoAccountElement();
      if (!demoEl) {
        if (count < 25) setTimeout(() => switchToDemo(count + 1), 250);
        return;
      }
      dispatchFullClick(demoEl);
      await new Promise((r) => setTimeout(r, 250));
      confirmAccountSwitch();
      setTimeout(confirmAccountSwitch, 400);
      setTimeout(confirmAccountSwitch, 900);
      await new Promise((r) => setTimeout(r, 300));
      if (!isDemoAccount() && count < 12) {
        setTimeout(() => switchToDemo(count + 1), 400);
      }
    } catch (e) {
      if (count < 15) setTimeout(() => switchToDemo(count + 1), 400);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => switchToDemo(1), 200);
    });
  } else {
    setTimeout(() => switchToDemo(1), 200);
  }

  if (typeof Swal === "undefined" && !document.getElementById("qxSwalCdnScript")) {
    try {
      const script = document.createElement("script");
      script.id = "qxSwalCdnScript";
      script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      script.async = true;
      (document.head || document.documentElement).appendChild(script);
    } catch (e) {}
  }

  const PROJECT_TYPE = "Quotex";
  let isActivated = false;
  let settingsPopupContainer = null;
  let demoBalanceValue = (() => {
    if (localStorage.getItem("demoBalanceReset") === "1") return null;
    const raw = localStorage.getItem("demoBalance");
    const parsed = raw !== null && raw !== "" ? parseFloat(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  })();
  let liveEngineObserver = null;
  let liveEngineStarted = false;

  function safeAlert(opts) {
    if (typeof Swal !== "undefined" && typeof Swal.fire === "function") {
      return Swal.fire(opts);
    }
    showToast(opts.title || opts.text || "Notice", 4000);
    return Promise.resolve({ isConfirmed: false });
  }

  async function callLicenseApi(endpoint, payload) {
    if (window.AppLicense && typeof window.AppLicense.apiPost === "function") {
      const targetPath =
        endpoint === "bootstrap"
          ? "/api/public/client/bootstrap"
          : endpoint === "release-code"
          ? "/api/public/client/release-code"
          : "/api/public/license/" + endpoint;
      const res = await window.AppLicense.apiPost(targetPath, payload);
      return res && res.data ? res.data : { valid: false, reason: "network" };
    }
    return { valid: false, reason: "network", detail: "AppLicense bridge missing" };
  }

  async function verifyLicenseKey(rawKey, options) {
    const key = String(rawKey || "").trim();
    if (!key) return { valid: false, reason: "invalid" };

    const auth = getStoredAuth();
    const deviceId = auth.deviceId;
    const storedKey = auth.key;
    const storedToken = auth.token;
    const forceActivate = !!(options && options.forceActivate);

    try {
      let result = null;
      const shouldTryVerifyFirst = !forceActivate && storedToken && storedKey === key;

      if (shouldTryVerifyFirst) {
        result = await callLicenseApi("verify", {
          license_key: key,
          device_id: deviceId,
          device_token: storedToken
        });
      }

      const verifyReason = (result && result.reason) || "";
      const needsActivation =
        !result ||
        (!result.valid && (
          !shouldTryVerifyFirst ||
          verifyReason === "device_not_activated" ||
          verifyReason === "invalid_token" ||
          verifyReason === "invalid_request" ||
          verifyReason === "device_not_found" ||
          verifyReason === "unauthorized" ||
          verifyReason === "token_expired"
        ));

      if (needsActivation) {
        const ua = (typeof navigator !== "undefined" && navigator.userAgent) ? navigator.userAgent : "";
        const plat = (typeof navigator !== "undefined" && navigator.platform) ? navigator.platform : "";
        result = await callLicenseApi("activate", {
          license_key: key,
          device_id: deviceId,
          browser: ua.slice(0, 80),
          os: plat.slice(0, 80),
          device_type: /Mobi|Android/i.test(ua) ? "mobile" : "desktop"
        });
      }

      if (result && result.valid) {
        const finalToken = result.device_token || storedToken;
        saveAuth(key, finalToken);
        isActivated = true;
        return {
          valid: true,
          key: key,
          device_token: finalToken,
          expires_at: result.expires_at || null,
          project_type: PROJECT_TYPE
        };
      }

      const reason = String((result && result.reason) || "").toLowerCase();

      if (reason === "network" || reason === "network_error" || reason === "timeout" || reason === "invalid_response" || reason === "server_unavailable") {
        if (storedKey === key && storedToken) {
          isActivated = true;
          return { valid: true, key: key, offline: true };
        }
        return {
          valid: false,
          reason: "network",
          transportError: result && result.transport_error,
          detail: result && result.detail,
          keepLicense: storedKey === key
        };
      }

      if (reason === "device_blocked" || reason === "banned" || reason === "license_banned" || reason === "blocked" || reason === "revoked") {
        clearLicenseStorage();
        return { valid: false, reason: "banned" };
      }

      if (reason === "inactive" || reason === "suspended") {
        clearLicenseStorage();
        return { valid: false, reason: reason };
      }

      if (reason === "maintenance" || reason === "rate_limited") {
        return {
          valid: false,
          reason: reason,
          keepLicense: storedKey === key,
          message: reason === "maintenance" ? "Server is under maintenance. Try again later." : "Too many requests. Please wait a moment."
        };
      }

      if (reason === "device_limit_reached" || reason === "limit" || reason === "max_devices_reached") {
        return {
          valid: false,
          reason: "limit",
          allowed: (result && result.max_devices) || "1",
          used: (result && result.used_devices) || "1"
        };
      }

      if (reason === "expired" || reason === "license_expired") {
        clearLicenseStorage();
        return { valid: false, reason: "expired" };
      }

      if (reason === "wrong_project") {
        clearLicenseStorage();
        return { valid: false, reason: "wrong_project", message: result && result.message, wrongProject: result && result.project_type };
      }

      if (reason === "invalid_request") {
        return { valid: false, reason: "invalid_request", message: (result && result.message) || "Invalid license payload" };
      }

      if (storedKey === key) {
        clearLicenseStorage();
      }
      return { valid: false, reason: "invalid" };
    } catch (err) {
      if (storedKey === key && storedToken) {
        isActivated = true;
        return { valid: true, key: key, offline: true };
      }
      return { valid: false, reason: "network", keepLicense: storedKey === key };
    }
  }

  async function checkStoredActivation() {
    const auth = getStoredAuth();
    if (!auth.key) {
      isActivated = false;
      return { valid: false };
    }
    const res = await verifyLicenseKey(auth.key, { forceActivate: !auth.token });
    if (res.valid) {
      isActivated = true;
      return res;
    }
    if (res.reason === "banned" || res.reason === "wrong_project" || res.reason === "limit" || res.reason === "invalid" || res.reason === "expired") {
      if (res.reason !== "limit") clearLicenseStorage();
      return res;
    }
    if (res.keepLicense || res.reason === "network" || res.offline) {
      isActivated = true;
      return { ...res, offline: true };
    }
    return { valid: false, reason: res.reason || "invalid" };
  }

  function showDeviceMismatchAlert(allowed, used) {
    safeAlert({
      title: "",
      html: `
        <div style="font-family: 'Roboto', sans-serif; text-align: center; background: linear-gradient(135deg, rgba(30, 11, 54, 0.98), rgba(45, 20, 70, 0.98)); padding: 20px; border-radius: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.5);">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); padding: 2px; border-radius: 12px; margin-bottom: 15px;">
            <div style="background: rgba(30, 11, 54, 0.95); padding: 15px; border-radius: 10px;">
              <h2 style="color: #fff; margin: 0; font-size: 16px; font-weight: 700;">Device Limit Reached</h2>
            </div>
          </div>
          <div style="background: rgba(255, 107, 107, 0.15); padding: 15px; margin: 15px 0; border-radius: 10px; text-align: left;">
            <p style="margin: 0; font-size: 15px; color: #ff6b6b; font-weight: 700;">Maximum Devices Used (${used} / ${allowed})</p>
            <p style="margin: 10px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.5;">
              Reset bound devices in demotoliveadmin.lovable.app or use another active key.
            </p>
          </div>
          <div style="background: rgba(249, 0, 255, 0.1); padding: 12px; border-radius: 10px;">
            <a href="https://t.me/tradereyasin7" target="_blank" style="display: inline-block; color: #f900ff; font-weight: 700; text-decoration: none; font-size: 14px; padding: 8px 18px; background: rgba(249, 0, 255, 0.2); border-radius: 8px;">@tradereyasin7</a>
          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "Close",
      confirmButtonColor: "#ee5a6f",
      allowOutsideClick: false,
      customClass: { container: "swal-high-zindex" }
    });
  }

  function showWrongProjectAlert(msg, wrongProj) {
    safeAlert({
      icon: "error",
      title: "Wrong Project License",
      html: `This license key is not for <b>QUOTEX</b>. It is for <b>${wrongProj || "UNKNOWN"}</b>.`,
      confirmButtonText: "Understood",
      confirmButtonColor: "#667eea",
      allowOutsideClick: false,
      customClass: { container: "swal-high-zindex" }
    });
  }

  function showLicenseExpiredAlert() {
    safeAlert({
      icon: "error",
      title: "License Blocked",
      html: "This license key is currently <strong>blocked or revoked</strong>.<br>Contact @tradereyasin7 on Telegram.",
      confirmButtonColor: "#e74c3c",
      customClass: { container: "swal-high-zindex" }
    });
  }

  function showLicenseTimeExpiredAlert() {
    safeAlert({
      icon: "warning",
      title: "License Expired",
      html: "This license key has <strong>expired</strong>.<br>Please renew or generate a new key in demotoliveadmin.lovable.app.",
      confirmButtonColor: "#f59e0b",
      customClass: { container: "swal-high-zindex" }
    });
  }

  function showLicenseRequiredAlert() {
    safeAlert({
      title: "",
      html: `
        <div style="font-family: 'Roboto', sans-serif; text-align: center; background: linear-gradient(135deg, rgba(30, 11, 54, 0.98), rgba(45, 20, 70, 0.98)); padding: 20px; border-radius: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.5);">
          <div style="background: linear-gradient(135deg, #f900ff 0%, #00d9ff 100%); padding: 2px; border-radius: 12px; margin-bottom: 15px;">
            <div style="background: rgba(30, 11, 54, 0.95); padding: 15px; border-radius: 10px;">
              <h2 style="color: #fff; margin: 0; font-size: 16px; font-weight: 700;">Invalid License Key</h2>
            </div>
          </div>
          <div style="background: rgba(255, 51, 102, 0.15); padding: 15px; margin: 15px 0; border-radius: 10px; text-align: left;">
            <p style="margin: 0; font-size: 14px; color: #ff3366; font-weight: 700;">Invalid License!</p>
            <p style="margin: 8px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.5;">
              Please check that your license key is copied accurately and active in demotoliveadmin.lovable.app.
            </p>
          </div>
          <div style="background: rgba(249, 0, 255, 0.1); padding: 12px; border-radius: 10px;">
            <a href="https://t.me/tradereyasin7" target="_blank" style="display: inline-block; color: #f900ff; font-weight: 700; text-decoration: none; font-size: 14px; padding: 8px 18px; background: rgba(249, 0, 255, 0.2); border-radius: 8px;">@tradereyasin7</a>
          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "Try Again",
      confirmButtonColor: "#764ba2",
      allowOutsideClick: false,
      customClass: { container: "swal-high-zindex" }
    });
  }

  function showNetworkErrorAlert(detailMsg, transportError) {
    let hintText = "Check your internet connection and verify demotoliveadmin.lovable.app is reachable.";
    if (transportError === "gm_blocked" || transportError === "gm_error") {
      hintText = "Tampermonkey blocked the cross-origin request to demotoliveadmin.lovable.app. Allow demotoliveadmin.lovable.app in Tampermonkey XHR Security settings.";
    }

    safeAlert({
      title: "",
      html: `
        <div style="font-family: 'Roboto', sans-serif; text-align: center; background: linear-gradient(135deg, rgba(30, 11, 54, 0.98), rgba(45, 20, 70, 0.98)); padding: 20px; border-radius: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.5);">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); padding: 2px; border-radius: 12px; margin-bottom: 15px;">
            <div style="background: rgba(30, 11, 54, 0.95); padding: 15px; border-radius: 10px;">
              <h2 style="color: #fff; margin: 0; font-size: 16px; font-weight: 700;">Connection Error</h2>
            </div>
          </div>
          <div style="background: rgba(245, 87, 108, 0.15); padding: 15px; margin: 15px 0 0 0; border-radius: 10px; text-align: left;">
            <p style="margin: 0; font-size: 13px; color: #fff; line-height: 1.5; font-weight: 600;">
              <strong style="color: #f5576c;">Cause:</strong> ${detailMsg || "Could not reach the license server."}
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.9); line-height: 1.5;">
              <strong style="color: #ff6b6b;">How to fix:</strong> ${hintText}
            </p>
          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "Try Again",
      confirmButtonColor: "#f5576c",
      allowOutsideClick: false,
      customClass: { container: "swal-high-zindex" }
    });
  }

  function showSuccessAlert() {
    return safeAlert({
      icon: "success",
      title: "License Verified!",
      text: "Your license has been successfully verified.",
      showConfirmButton: false,
      timer: 1400,
      timerProgressBar: true,
      customClass: { container: "swal-high-zindex" }
    });
  }

  const FLOATING_POPUP_CSS = `
    .swal-high-zindex, .swal2-container.swal-high-zindex {
      z-index: 10005 !important;
    }

    #settingsPopup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      width: calc(100% - 20px);
      max-width: 360px;
      max-height: calc(100vh - 20px);
      height: auto;
      padding: 12px 14px;
      background: rgba(30, 11, 54, 0.98);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.45);
      text-align: center;
      border: 1px solid rgba(248, 0, 255, 0.25);
      overflow-y: auto;
      overflow-x: hidden;
      font-family: 'Roboto', sans-serif;
      color: #f8f8f8;
      z-index: 9999;
      opacity: 0;
      transition: all 0.35s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    #settingsPopup.show {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }

    #settingsPopup.hide {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }

    #settingsPopup h2 {
      color: white;
      font-size: 13px;
      font-weight: 700;
      margin: 0 0 8px 0;
      padding: 8px;
      background: rgba(0,0,0,0.65);
      border-radius: 8px;
      border: 1px solid rgba(248, 0, 255, 0.3);
      line-height: 1.3;
    }

    #settingsPopup h3 {
      color: white;
      font-size: 12px;
      font-weight: 700;
      margin: 6px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: linear-gradient(to right, #f900ff, #00d9ff);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      display: inline-block;
    }

    .telegram-link {
      display: inline-block;
      margin-bottom: 6px;
    }

    .telegram-link img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    #settingsPopup label {
      display: block;
      margin-bottom: 6px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 11px;
      font-weight: 500;
      text-align: left;
    }

    #settingsPopup input, #settingsPopup select {
      width: 100%;
      padding: 7px;
      margin-top: 2px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 13px;
      box-sizing: border-box;
    }

    #countryFlagSelect {
      background: rgba(30, 11, 54, 0.95);
    }

    #countryFlagSelect option {
      background: #1e0b36;
      color: white;
    }

    #settingsPopup small {
      display: block;
      margin-top: 2px;
      margin-bottom: 6px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 8px;
      text-align: left;
    }

    #settingsPopup button {
      width: 100%;
      padding: 8px;
      margin-top: 6px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    #saveButton, #verifyBtn, #setDemoBtn {
      background: linear-gradient(135deg, #8333ff, #f900ff);
      color: white;
    }

    .qx-btn-row {
      display: flex;
      gap: 6px;
      margin-top: 6px;
    }

    .qx-btn-row button {
      margin-top: 0 !important;
    }

    #setDemoBtn {
      flex: 2;
    }

    #settingsPopup button.qx-reset-demo-btn {
      flex: 1;
      background: linear-gradient(135deg, #475569, #334155);
      color: #f8fafc;
    }

    #settingsPopup button.close-btn {
      background: linear-gradient(135deg, #ff3366, #ff5757);
      color: white;
    }

    #settingsPopup button:disabled {
      background: #6c757d;
      cursor: not-allowed;
      opacity: 0.6;
    }

    #licenseSection, #demoBalanceSection {
      margin-top: 8px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
    }

    #licenseSection.hide {
      opacity: 0;
      max-height: 0;
      padding: 0;
      margin: 0;
      overflow: hidden;
      border: none;
    }

    #demoBalanceSection {
      opacity: 0;
      max-height: 0;
      overflow: hidden;
      padding: 0;
      margin: 0;
      border: none;
    }

    #demoBalanceSection.show {
      opacity: 1;
      max-height: 500px;
      padding: 12px;
      margin-top: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .message-popup {
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 12px 18px;
      color: white;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      opacity: 0;
      transform: translateY(-20px);
      transition: opacity 0.4s ease, transform 0.4s ease;
      z-index: 10006;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(0, 255, 163, 0.5);
    }

    .message-popup.show {
      opacity: 1;
      transform: translateY(0);
    }

    #centeredDeveloperMessage {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.92);
      color: white;
      padding: 20px 32px;
      border-radius: 14px;
      font-size: 16px;
      font-weight: bold;
      z-index: 10004;
      opacity: 0;
      transition: opacity 0.4s ease;
      border: 2px solid rgba(248, 0, 255, 0.5);
    }

    .qx-reset-link {
      display: inline-block;
      margin-top: 6px;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.65);
      cursor: pointer;
      text-decoration: underline;
    }

    .verified-badge {
      background: rgba(0, 255, 163, 0.2);
      color: #00ffa3;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;
      margin-top: 6px;
      display: inline-block;
    }

    .unverified-badge {
      background: rgba(255, 51, 102, 0.2);
      color: #ff3366;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;
      margin-top: 8px;
      display: inline-block;
    }

    #refreshBalanceBtn {
      position: absolute;
      top: 24px;
      right: 8px;
      cursor: pointer;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(248, 0, 255, 0.2);
      border: 1px solid rgba(248, 0, 255, 0.4);
    }

    #refreshBalanceBtn svg {
      width: 12px;
      height: 12px;
      fill: #f900ff;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .spinning {
      animation: spin 0.6s linear;
    }
  `;

  function showToast(msg, duration = 3000) {
    if (!document.body) return;
    const el = document.createElement("div");
    el.className = "message-popup";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("show"), 10);
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 400);
    }, duration);
  }

  function showCenteredDeveloperBanner(msg, duration) {
    if (!document.body) return;
    const el = document.createElement("div");
    el.id = "centeredDeveloperMessage";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "1";
    }, 10);
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 500);
    }, duration);
  }

  function showDemoBalanceSection() {
    const lic = document.getElementById("licenseSection");
    const demo = document.getElementById("demoBalanceSection");
    if (lic && demo) {
      lic.classList.add("hide");
      setTimeout(() => {
        demo.classList.add("show");
      }, 300);
    }
  }

  function formatUsd(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return "$0.00";
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getActiveCustomDemoBalance() {
    if (localStorage.getItem("demoBalanceReset") === "1") return NaN;
    const raw = localStorage.getItem("demoBalance");
    if (raw === null || raw === "") return NaN;
    const num = parseFloat(raw);
    return Number.isFinite(num) ? num : NaN;
  }

  function restoreOriginalBalanceElements() {
    try {
      const shadow = getUsermenuShadowRoot();
      if (shadow) {
        const balEl = shadow.querySelector(".balance, .text .balance");
        if (balEl && balEl.dataset && balEl.dataset.qxOrigBalance) {
          if (balEl.textContent === balEl.dataset.qxLastForced) {
            balEl.textContent = balEl.dataset.qxOrigBalance;
          }
          delete balEl.dataset.qxOrigBalance;
          delete balEl.dataset.qxLastForced;
        }
      }
    } catch (e) {}

    try {
      document.querySelectorAll(".grOBD b.YnoT0, b.YnoT0").forEach((el) => {
        if (el.dataset && el.dataset.qxOrigBalance) {
          if (el.textContent === el.dataset.qxLastForced) {
            el.textContent = el.dataset.qxOrigBalance;
          }
          delete el.dataset.qxOrigBalance;
          delete el.dataset.qxLastForced;
        }
      });
    } catch (e) {}
  }

  function applyLiveAccountVisuals(opts) {
    if (!isActivated || serverPayloadLoaded) return;

    const lbName = opts.name || localStorage.getItem("leaderboardName") || "";
    const lbBalance = opts.balance || localStorage.getItem("leaderboardBalance") || "";
    const countryFlag = opts.flag || localStorage.getItem("countryFlag") || "bd";
    const avatarUrl = opts.avatar || localStorage.getItem("profilePhotoUrl") || "";
    const customDemoBal = getActiveCustomDemoBalance();
    const hasCustomBalance = Number.isFinite(customDemoBal);

    try {
      const shadow = getUsermenuShadowRoot();
      if (shadow) {
        const nameEl = shadow.querySelector(".name");
        if (nameEl) {
          nameEl.classList.remove("demo");
          nameEl.classList.add("live");
          if (/demo/i.test(nameEl.textContent || "")) {
            nameEl.textContent = "LIVE";
          }
          nameEl.style.color = "#0faf59";
        }
        const balEl = shadow.querySelector(".balance, .text .balance");
        if (balEl && hasCustomBalance) {
          const target = formatUsd(customDemoBal);
          if (balEl.textContent !== target) {
            if (!balEl.dataset.qxOrigBalance || balEl.textContent !== balEl.dataset.qxLastForced) {
              balEl.dataset.qxOrigBalance = balEl.textContent || "";
            }
            balEl.dataset.qxLastForced = target;
            balEl.textContent = target;
          }
        }
        shadow.querySelectorAll("svg, .icon").forEach((ic) => {
          if (ic.classList && ic.classList.contains("demo")) {
            ic.style.color = "#0faf59";
          }
        });
      }
    } catch (e) {}

    try {
      document.querySelectorAll(".grOBD b.YnoT0, b.YnoT0").forEach((el) => {
        const parentText = (el.closest("li, a, div")?.textContent || "").toLowerCase();
        if (hasCustomBalance && (parentText.includes("demo") || parentText.includes("live"))) {
          const formatted = formatUsd(customDemoBal);
          if (el.textContent !== formatted) {
            if (!el.dataset.qxOrigBalance || el.textContent !== el.dataset.qxLastForced) {
              el.dataset.qxOrigBalance = el.textContent || "";
            }
            el.dataset.qxLastForced = formatted;
            el.textContent = formatted;
          }
        }
      });
    } catch (e) {}

    try {
      const myRows = document.querySelectorAll(".leader-board__item-my, .leaderboard__item--my, [class*='leader'] [class*='my']");
      myRows.forEach((row) => {
        if (lbName) {
          const nameNode = row.querySelector("[class*='name']");
          if (nameNode && nameNode.textContent !== lbName) nameNode.textContent = lbName;
        }
        if (lbBalance) {
          const moneyNode = row.querySelector("[class*='money'], [class*='profit'], [class*='balance']");
          if (moneyNode) {
            const formatted = formatUsd(lbBalance);
            if (moneyNode.textContent !== formatted) moneyNode.textContent = formatted;
          }
        }
        if (countryFlag) {
          const flagSvg = row.querySelector("svg.flag use, svg[class*='flag'] use");
          if (flagSvg) {
            const href = `/profile/images/flags.svg#flag-${countryFlag}`;
            if (flagSvg.getAttribute("xlink:href") !== href) flagSvg.setAttribute("xlink:href", href);
          }
        }
        if (avatarUrl) {
          const img = row.querySelector("img");
          if (img && img.getAttribute("src") !== avatarUrl) img.setAttribute("src", avatarUrl);
        }
      });
    } catch (e) {}
  }

  function startDemoToLiveEngine(opts) {
    if (!isActivated || serverPayloadLoaded) return;
    applyLiveAccountVisuals(opts || {});

    if (liveEngineStarted) return;
    liveEngineStarted = true;

    let scheduled = false;
    const scheduleApply = () => {
      if (scheduled || serverPayloadLoaded) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        applyLiveAccountVisuals({
          name: localStorage.getItem("leaderboardName") || "",
          balance: localStorage.getItem("leaderboardBalance") || "",
          flag: localStorage.getItem("countryFlag") || "bd",
          avatar: localStorage.getItem("profilePhotoUrl") || ""
        });
      });
    };

    if (document.body) {
      liveEngineObserver = new MutationObserver(scheduleApply);
      liveEngineObserver.observe(document.body, { childList: true, subtree: true });
    }
    setInterval(scheduleApply, 1200);
  }

  function isQuotexNotificationClick(rawTarget) {
    if (!rawTarget || typeof rawTarget.closest !== "function") return false;
    const el = rawTarget;
    if (el.closest("#settingsPopup, .swal2-container, .message-popup, #centeredDeveloperMessage")) return false;
    if (el.closest("qx-usermenu-trigger, .uoy2n, .QE4Zb, a[href*='deposit'], [class*='deposit' i], [class*='logo' i], [class*='burger' i], [class*='sidebar' i], a[href='/'], a[href*='/trade'], a[href*='/demo-trade']")) return false;

    const directMatch = el.closest(
      ".header__notifications, [class*='notification' i], [id*='notification' i], [data-testid*='notification' i], [aria-label*='notification' i], [title*='notification' i], [class*='bell' i]"
    );
    if (directMatch) {
      const rect = typeof directMatch.getBoundingClientRect === "function" ? directMatch.getBoundingClientRect() : null;
      if (!rect || (rect.width <= 120 && rect.height <= 90 && rect.top <= 140)) {
        return true;
      }
    }

    const clickable = el.closest("button, a, [role='button'], .RyAkb > div, .RyAkb > span, header > div, .header > div");
    if (clickable) {
      const txt = (clickable.textContent || "").trim();
      if (/deposit|withdraw|demo|live/i.test(txt)) return false;
      const rect = typeof clickable.getBoundingClientRect === "function" ? clickable.getBoundingClientRect() : null;
      if (rect && rect.top <= 130 && rect.width > 0 && rect.width <= 96 && rect.height <= 72) {
        const uses = typeof clickable.querySelectorAll === "function" ? clickable.querySelectorAll("use") : [];
        for (let i = 0; i < uses.length; i++) {
          const href = (uses[i].getAttribute("xlink:href") || uses[i].getAttribute("href") || "").toLowerCase();
          if (href.includes("notif") || href.includes("bell") || href.includes("alert")) {
            return true;
          }
        }
        const headerBar = clickable.closest(".RyAkb, header, .header");
        if (headerBar && headerBar.querySelector("qx-usermenu-trigger, .uoy2n") && clickable.querySelector("svg")) {
          if (/\d+/.test(txt) || rect.left >= 48) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function bindQuotexNotificationTrigger() {
    if (pageWinMain.__qxNotifTriggerBound) return;
    pageWinMain.__qxNotifTriggerBound = true;
    document.addEventListener("click", (ev) => {
      if (document.getElementById("settingsPopup")) return;
      if (!isQuotexNotificationClick(ev.target)) return;
      try {
        ev.preventDefault();
        ev.stopPropagation();
        if (typeof ev.stopImmediatePropagation === "function") ev.stopImmediatePropagation();
      } catch (e) {}
      renderSettingsPopup();
    }, true);
  }

  async function renderSettingsPopup() {
    if (!document.body) {
      await new Promise((r) => document.addEventListener("DOMContentLoaded", r, { once: true }));
    }

    if (!document.getElementById("qxProPopupStyles")) {
      const injectedStyleElement = document.createElement("style");
      injectedStyleElement.id = "qxProPopupStyles";
      injectedStyleElement.textContent = FLOATING_POPUP_CSS;
      (document.head || document.body || document.documentElement).appendChild(injectedStyleElement);
    }

    const existing = document.getElementById("settingsPopup");
    if (existing) existing.remove();

    const auth = getStoredAuth();
    const savedKey = auth.key;
    const hasSavedToken = !!(savedKey && auth.token);
    isActivated = hasSavedToken;

    let initialBadgeHtml = '<div class="unverified-badge">✗ Not Verified</div>';
    if (savedKey) {
      initialBadgeHtml = '<div class="verified-badge" style="background:rgba(56,189,248,0.2);color:#38bdf8;">Checking license...</div>';
    }

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div id="settingsPopup">
        <h2>Developer: <strong>@tradereyasin7</strong></h2>
        <a href="https://t.me/tradereyasin7" target="_blank" class="telegram-link">
          <img src="https://i.postimg.cc/W1xNxw0S/file-00000000acd08230b081904c2c4ce41c.png" alt="Telegram">
        </a>

        <label>Leaderboard Name:
          <input type="text" id="lname" placeholder="Enter Name">
        </label>

        <div style="position: relative;">
          <label>Leaderboard Balance:
            <input type="number" id="iblafp" placeholder="Enter Balance">
          </label>
          <span id="refreshBalanceBtn" title="Fetch Current Balance">
            <svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></svg>
          </span>
        </div>

        <label>Profile Photo Link:
          <input type="text" id="profilePhotoUrl" placeholder="Enter Profile Photo Link">
          <small>Example: /en/user/avatar/view/07/90/87/46/avatar_8c7e009cd96f2e43f9d3237baab07071.png</small>
        </label>
        <label>Country Flag:
          <select id="countryFlagSelect">
            <option value="bd">🇧🇩 Bangladesh</option>
            <option value="in">🇮🇳 India</option>
            <option value="pk">🇵🇰 Pakistan</option>
            <option value="us">🇺🇸 United States</option>
            <option value="gb">🇬🇧 United Kingdom</option>
            <option value="ae">🇦🇪 United Arab Emirates</option>
            <option value="sa">🇸🇦 Saudi Arabia</option>
            <option value="my">🇲🇾 Malaysia</option>
            <option value="sg">🇸🇬 Singapore</option>
            <option value="id">🇮🇩 Indonesia</option>
            <option value="br">🇧🇷 Brazil</option>
            <option value="tr">🇹🇷 Turkey</option>
            <option value="ng">🇳🇬 Nigeria</option>
            <option value="za">🇿🇦 South Africa</option>
            <option value="ca">🇨🇦 Canada</option>
            <option value="au">🇦🇺 Australia</option>
            <option value="de">🇩🇪 Germany</option>
            <option value="fr">🇫🇷 France</option>
            <option value="it">🇮🇹 Italy</option>
            <option value="es">🇪🇸 Spain</option>
          </select>
        </label>

        <div id="licenseSection" class="${isActivated ? "hide" : ""}">
          <h3>License Verification</h3>
          <input type="text" id="licenseInput" placeholder="RSC-XXXX-XXXX..." value="${savedKey}">
          <button id="verifyBtn">Verify License</button>
          <div id="verificationStatus">${initialBadgeHtml}</div>
        </div>

        <div id="demoBalanceSection" class="${isActivated ? "show" : ""}">
          <h3>Demo Balance Settings</h3>
          <input type="number" id="demoBalanceInput" placeholder="Enter demo balance (empty = Quotex default)" value="${demoBalanceValue !== null ? demoBalanceValue : ""}">
          <div class="qx-btn-row">
            <button id="setDemoBtn" type="button">Update Demo Balance</button>
            <button id="resetDemoBtn" type="button" class="qx-reset-demo-btn">Reset</button>
          </div>
          <div id="demoBalanceStatus" style="margin-top: 6px; font-size: 11px;"></div>
          <span id="resetLicenseBtn" class="qx-reset-link">Change License Key</span>
        </div>

        <button id="saveButton" ${isActivated ? "" : "disabled"}>Save Settings</button>
        <button class="close-btn">Close</button>
      </div>
    `;
    document.body.appendChild(wrapper);
    settingsPopupContainer = document.getElementById("settingsPopup");

    document.getElementById("lname").value = localStorage.getItem("leaderboardName") || "";
    document.getElementById("iblafp").value = localStorage.getItem("leaderboardBalance") || "";
    document.getElementById("profilePhotoUrl").value = localStorage.getItem("profilePhotoUrl") || "";
    document.getElementById("countryFlagSelect").value = localStorage.getItem("countryFlag") || "bd";

    const refreshBtn = document.getElementById("refreshBalanceBtn");
    function findBalanceElement() {
      const shadow = getUsermenuShadowRoot();
      return (shadow && shadow.querySelector(".text .balance, .balance")) || document.querySelector(".grOBD b.YnoT0") || document.querySelector("b.YnoT0");
    }
    async function waitForBalanceElement(ms) {
      const end = Date.now() + ms;
      let el = findBalanceElement();
      while ((!el || !/\d/.test(el.textContent || "")) && Date.now() < end) {
        await new Promise((r) => setTimeout(r, 100));
        el = findBalanceElement();
      }
      return el;
    }

    refreshBtn?.addEventListener("click", async () => {
      if (refreshBtn.classList.contains("spinning")) return;
      refreshBtn.classList.add("spinning");
      const balEl = await waitForBalanceElement(5000);
      if (!balEl) {
        showToast("Error: Could not find balance element.");
        setTimeout(() => refreshBtn.classList.remove("spinning"), 500);
        return;
      }
      const digits = (balEl.textContent || "").replace(/[^\d.]/g, "");
      document.getElementById("iblafp").value = digits;
      showToast("Balance updated!");
      setTimeout(() => refreshBtn.classList.remove("spinning"), 500);
    });

    document.getElementById("verifyBtn")?.addEventListener("click", handleVerifyLicenseInput);
    document.getElementById("setDemoBtn")?.addEventListener("click", saveDemoBalance);
    document.getElementById("resetDemoBtn")?.addEventListener("click", resetDemoBalance);
    document.getElementById("resetLicenseBtn")?.addEventListener("click", () => {
      clearLicenseStorage();
      const licInput = document.getElementById("licenseInput");
      if (licInput) licInput.value = "";
      const statusBox = document.getElementById("verificationStatus");
      if (statusBox) statusBox.innerHTML = '<div class="unverified-badge">✗ Not Verified</div>';
      const saveBtn = document.getElementById("saveButton");
      if (saveBtn) saveBtn.disabled = true;
      document.getElementById("licenseSection")?.classList.remove("hide");
      document.getElementById("demoBalanceSection")?.classList.remove("show");
      showToast("Saved license cleared. Enter a new key.");
    });
    document.getElementById("saveButton")?.addEventListener("click", handleSaveAndStart);
    wrapper.querySelector(".close-btn")?.addEventListener("click", closeSettingsPopup);

    setTimeout(() => {
      if (settingsPopupContainer) settingsPopupContainer.classList.add("show");
    }, 10);

    if (savedKey) {
      checkStoredActivation().then(async (status) => {
        isActivated = !!status.valid;
        const statusBox = document.getElementById("verificationStatus");
        const saveBtn = document.getElementById("saveButton");
        const licSec = document.getElementById("licenseSection");
        const demoSec = document.getElementById("demoBalanceSection");

        if (isActivated) {
          const latestAuth = getStoredAuth();
          const loadedRemote = serverPayloadLoaded || await tryRunRemoteBootstrap(latestAuth.key || savedKey, latestAuth.deviceId, status.device_token || latestAuth.token);
          const loadedLabel = pageWinMain.__QX_SERVER_ENTRY__
            ? `${pageWinMain.__QX_SERVER_ENTRY__}${pageWinMain.__QX_SERVER_VERSION__ ? " (v" + pageWinMain.__QX_SERVER_VERSION__ + ")" : ""}`
            : "Server Code Loaded";
          if (statusBox) {
            statusBox.innerHTML = status.offline
              ? '<div class="verified-badge">✓ Verified (Offline Mode)</div>'
              : loadedRemote
              ? `<div class="verified-badge">✓ Verified · ${loadedLabel}</div>`
              : '<div class="verified-badge">✓ Verified</div>';
          }
          if (saveBtn) saveBtn.disabled = false;
          if (licSec) licSec.classList.add("hide");
          if (demoSec) demoSec.classList.add("show");
          if (!loadedRemote) startDemoToLiveEngine();
        } else {
          if (saveBtn) saveBtn.disabled = true;
          if (licSec) licSec.classList.remove("hide");
          if (demoSec) demoSec.classList.remove("show");
          if (statusBox) {
            if (status.reason === "limit") {
              statusBox.innerHTML = '<div class="unverified-badge">✗ Device Limit Reached</div>';
              showDeviceMismatchAlert(status.allowed, status.used);
            } else if (status.reason === "banned" || status.reason === "inactive" || status.reason === "suspended") {
              statusBox.innerHTML = `<div class="unverified-badge">✗ License ${status.reason === "suspended" ? "Suspended" : status.reason === "inactive" ? "Inactive" : "Blocked"}</div>`;
              showLicenseExpiredAlert();
            } else if (status.reason === "expired") {
              statusBox.innerHTML = '<div class="unverified-badge">✗ License Expired</div>';
            } else if (status.reason === "maintenance" || status.reason === "rate_limited") {
              statusBox.innerHTML = `<div class="unverified-badge">✗ ${status.reason === "maintenance" ? "Maintenance Mode" : "Rate Limited"}</div>`;
            } else if (status.reason === "network") {
              statusBox.innerHTML = '<div class="unverified-badge">✗ Network / XHR Blocked</div>';
            } else {
              statusBox.innerHTML = '<div class="unverified-badge">✗ Invalid License</div>';
            }
          }
        }
      }).catch(() => {});
    }
  }

  function saveDemoBalance() {
    const val = document.getElementById("demoBalanceInput").value;
    if (!val || isNaN(Number(val))) {
      showToast("Please enter a valid balance amount");
      return;
    }
    demoBalanceValue = parseFloat(val);
    localStorage.removeItem("demoBalanceReset");
    localStorage.setItem("demoBalance", demoBalanceValue.toString());
    const statusEl = document.getElementById("demoBalanceStatus");
    if (statusEl) {
      statusEl.textContent = "Demo balance updated and saved!";
      statusEl.style.color = "#00ffa3";
      setTimeout(() => { statusEl.textContent = ""; }, 2500);
    }
    if (isActivated) applyLiveAccountVisuals({});
    try {
      window.dispatchEvent(new CustomEvent("qx:demo-balance-updated", { detail: { demoBalance: demoBalanceValue } }));
    } catch (e) {}
    showToast("Demo balance set to " + demoBalanceValue);
  }

  function resetDemoBalance() {
    demoBalanceValue = null;
    localStorage.removeItem("demoBalance");
    localStorage.setItem("demoBalanceReset", "1");
    const input = document.getElementById("demoBalanceInput");
    if (input) input.value = "";
    restoreOriginalBalanceElements();
    const statusEl = document.getElementById("demoBalanceStatus");
    if (statusEl) {
      statusEl.textContent = "Demo balance reset! Quotex default balance active.";
      statusEl.style.color = "#38bdf8";
      setTimeout(() => { statusEl.textContent = ""; }, 3000);
    }
    try {
      window.dispatchEvent(new CustomEvent("qx:demo-balance-reset"));
    } catch (e) {}
    showToast("Demo balance reset to Quotex default!");
  }

  async function handleVerifyLicenseInput() {
    const key = (document.getElementById("licenseInput").value || "").trim();
    if (!key) {
      showToast("Please enter a license key");
      return;
    }

    const btn = document.getElementById("verifyBtn");
    const statusBox = document.getElementById("verificationStatus");
    const saveBtn = document.getElementById("saveButton");
    btn.disabled = true;
    btn.textContent = "Verifying...";

    const auth = getStoredAuth();
    const res = await verifyLicenseKey(key, { forceActivate: auth.key !== key || !auth.token });

    if (res.valid) {
      const loadedRemote = serverPayloadLoaded || await tryRunRemoteBootstrap(key, auth.deviceId, res.device_token || getStoredAuth().token);
      const loadedLabel = pageWinMain.__QX_SERVER_ENTRY__
        ? `${pageWinMain.__QX_SERVER_ENTRY__}${pageWinMain.__QX_SERVER_VERSION__ ? " (v" + pageWinMain.__QX_SERVER_VERSION__ + ")" : ""}`
        : "Server Code Loaded";
      statusBox.innerHTML = loadedRemote
        ? `<div class="verified-badge">✓ Verified · ${loadedLabel}</div>`
        : '<div class="verified-badge">✓ Verified Successfully</div>';
      saveBtn.disabled = false;
      await showSuccessAlert();
      showDemoBalanceSection();
      if (!loadedRemote) startDemoToLiveEngine();
    } else {
      if (res.reason === "limit") {
        showDeviceMismatchAlert(res.allowed, res.used);
        statusBox.innerHTML = '<div class="unverified-badge">✗ Device Limit Reached</div>';
      } else if (res.reason === "banned" || res.reason === "inactive" || res.reason === "suspended") {
        showLicenseExpiredAlert();
        statusBox.innerHTML = `<div class="unverified-badge">✗ License ${res.reason === "suspended" ? "Suspended" : res.reason === "inactive" ? "Inactive" : "Blocked"}</div>`;
      } else if (res.reason === "expired") {
        showLicenseTimeExpiredAlert();
        statusBox.innerHTML = '<div class="unverified-badge">✗ License Expired</div>';
      } else if (res.reason === "maintenance" || res.reason === "rate_limited") {
        statusBox.innerHTML = `<div class="unverified-badge">✗ ${res.reason === "maintenance" ? "Maintenance Mode" : "Rate Limited"}</div>`;
        showToast(res.message || "Server busy. Try again shortly.");
      } else if (res.reason === "wrong_project") {
        showWrongProjectAlert(res.message, res.wrongProject);
        statusBox.innerHTML = '<div class="unverified-badge">✗ Wrong Project</div>';
      } else if (res.reason === "network") {
        if (res.keepLicense && getStoredAuth().key) {
          showToast("Network error - Using cached license");
          statusBox.innerHTML = '<div class="verified-badge">✓ Cached (Offline Mode)</div>';
          saveBtn.disabled = false;
          showDemoBalanceSection();
        } else {
          showNetworkErrorAlert(res.detail, res.transportError);
          statusBox.innerHTML = '<div class="unverified-badge">✗ Network / XHR Blocked</div>';
        }
      } else if (res.reason === "invalid_request") {
        statusBox.innerHTML = '<div class="unverified-badge">✗ Request Error</div>';
        showToast(res.message || "Invalid license request payload");
      } else {
        showLicenseRequiredAlert();
        statusBox.innerHTML = '<div class="unverified-badge">✗ Invalid License</div>';
      }

      if (res.reason !== "network" || !res.keepLicense) {
        saveBtn.disabled = true;
      }
    }

    btn.disabled = false;
    btn.textContent = "Verify License";
  }

  function closeSettingsPopup() {
    document.getElementById("qxFloatingReopenBtn")?.remove();
    const popup = document.getElementById("settingsPopup");
    if (popup) {
      popup.classList.add("hide");
      popup.classList.remove("show");
      setTimeout(() => {
        popup.parentElement?.id === "" ? popup.parentElement.remove() : popup.remove();
      }, 350);
    }
  }

  async function handleSaveAndStart() {
    const auth = getStoredAuth();
    const activeKey = auth.key;
    if (!activeKey || !isActivated) {
      showLicenseRequiredAlert();
      return;
    }

    const check = await verifyLicenseKey(activeKey, { forceActivate: false });
    if (!check.valid && !check.offline) {
      if (check.reason === "limit") showDeviceMismatchAlert(check.allowed, check.used);
      else if (check.reason === "banned") showLicenseExpiredAlert();
      else if (check.reason === "expired") showLicenseTimeExpiredAlert();
      else showLicenseRequiredAlert();
      return;
    }

    const lbName = document.getElementById("lname").value;
    const lbBal = document.getElementById("iblafp").value;
    const flag = document.getElementById("countryFlagSelect").value;
    const photo = document.getElementById("profilePhotoUrl").value;

    localStorage.setItem("leaderboardName", lbName);
    localStorage.setItem("leaderboardBalance", lbBal);
    localStorage.setItem("countryFlag", flag);
    localStorage.setItem("profilePhotoUrl", photo);
    localStorage.setItem("lastLeaderboardName", lbName);
    localStorage.setItem("lastCountryFlag", flag);

    // Try loading server release code (/api/public/client/release-code) first; fall back cleanly if empty
    const loadedRemote = serverPayloadLoaded || await tryRunRemoteBootstrap(activeKey, auth.deviceId, check.device_token || auth.token);
    if (!loadedRemote) {
      startDemoToLiveEngine({
        name: lbName,
        balance: lbBal,
        flag: flag,
        avatar: photo
      });
    }

    try {
      window.dispatchEvent(new CustomEvent("qx:settings-updated", {
        detail: {
          name: lbName,
          balance: lbBal,
          flag: flag,
          photo: photo,
          demoBalance: getActiveCustomDemoBalance(),
          demoBalanceReset: localStorage.getItem("demoBalanceReset") === "1"
        }
      }));
    } catch (e) {}

    closeSettingsPopup();
    showToast(loadedRemote ? "Server code active & settings saved!" : "Demo-to-Live settings applied!");
    showCenteredDeveloperBanner("Developer @tradereyasin7 !", 3500);
  }

  pageWinMain.__qxProOpenPopup = renderSettingsPopup;
  bindQuotexNotificationTrigger();
  document.getElementById("qxFloatingReopenBtn")?.remove();

  window.addEventListener("message", (ev) => {
    if (ev.source === window && ev.data && ev.data.__qxOpenPopup === true) {
      renderSettingsPopup();
    }
  });

  await renderSettingsPopup();
  pageWinMain.__qxProLoaded = true;
})().catch((err) => {
  try {
    console.error("Quotex Pro Error:", err);
  } catch (e) {}
});
