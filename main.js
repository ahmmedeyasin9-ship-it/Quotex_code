// ==UserScript==
// @name         Quotex Demo to Live Pro + Remote Server Client
// @namespace    https://demotoliveadmin.lovable.app
// @version      3.6.0
// @description  Quotex Demo to Live Pro (0X Control Panel) with Anti-Flicker Guard, Deposit & Notification Triggers & Remote Server Sync
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
// @connect      *.run.app
// @run-at       document-start
// ==/UserScript==

// ============================================================================
// PART 1: EARLY ANTI-FLICKER, SHADOW DOM & WATERMARK INTERCEPTOR (document-start)
// ============================================================================
(function initEarlyAntiFlickerAndWatermark() {
  const pageWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

  // Inject directly into the main page world at document-start so Tampermonkey @grant sandbox cannot isolate Element.prototype.attachShadow or Canvas2D/WebGL
  try {
    if (pageWin && pageWin !== window && !pageWin.__qxMainWorldBridgeInjected) {
      pageWin.__qxMainWorldBridgeInjected = true;
      const inlineBootstrap = `(function(){
        if (window.__qxMainWorldPatched) return;
        window.__qxMainWorldPatched = true;
        try {
          var sMap = new WeakMap();
          var oAttach = Element.prototype.attachShadow;
          if (oAttach && !Element.prototype.__zeroxOrigAttach) {
            Element.prototype.__zeroxOrigAttach = oAttach;
            Element.prototype.attachShadow = function(opts) {
              var sr = oAttach.call(this, Object.assign({}, opts || {}, { mode: 'open' }));
              sMap.set(this, sr);
              this.__zeroxShadowRoot = sr;
              if (this.localName === 'qx-usermenu-trigger') {
                window.__qxUsermenuShadow = sr;
              }
              return sr;
            };
          }
          window.__qxGetShadowRoot = function(el) {
            if (!el) return null;
            return el.shadowRoot || sMap.get(el) || el.__zeroxShadowRoot || null;
          };
          window.__qxEnsureUsermenuShadow = function() {
            var t = document.querySelector('qx-usermenu-trigger');
            if (!t) return null;
            return t.shadowRoot || sMap.get(t) || t.__zeroxShadowRoot || window.__qxUsermenuShadow || null;
          };
        } catch(e) {}
        try {
          if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.__zeroxEarlyContextPatched) {
            HTMLCanvasElement.prototype.__zeroxEarlyContextPatched = true;
            var ogc = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function(type) {
              if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
              var ctx = ogc.apply(this, arguments);
              if (ctx && (type === '2d' || type === 'experimental-2d') && !ctx.__zeroxWatermarkBlocked) {
                ctx.__zeroxWatermarkBlocked = true;
                var _s = ctx.stroke, _f = ctx.fill, _ft = ctx.fillText, _st = ctx.strokeText;
                if (_s) ctx.stroke = function(p){ if (ctx.globalAlpha > 0 && ctx.globalAlpha < 0.12) return; return p ? _s.call(ctx, p) : _s.call(ctx); };
                if (_f) ctx.fill = function(p){ if (ctx.globalAlpha > 0 && ctx.globalAlpha < 0.12) return; return p ? _f.call(ctx, p) : _f.call(ctx); };
                if (_ft) ctx.fillText = function(t){ if ((typeof t === 'string' && /\\bdemo\\b/i.test(t)) || (ctx.globalAlpha > 0 && ctx.globalAlpha < 0.15)) return; return _ft.apply(ctx, arguments); };
                if (_st) ctx.strokeText = function(t){ if ((typeof t === 'string' && /\\bdemo\\b/i.test(t)) || (ctx.globalAlpha > 0 && ctx.globalAlpha < 0.15)) return; return _st.apply(ctx, arguments); };
              }
              return ctx;
            };
          }
          if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.__zeroxProtoWatermarkBlocked) {
            CanvasRenderingContext2D.prototype.__zeroxProtoWatermarkBlocked = true;
            var pS = CanvasRenderingContext2D.prototype.stroke, pF = CanvasRenderingContext2D.prototype.fill;
            var pFT = CanvasRenderingContext2D.prototype.fillText, pST = CanvasRenderingContext2D.prototype.strokeText;
            if (pS) CanvasRenderingContext2D.prototype.stroke = function(p){ if (this.globalAlpha > 0 && this.globalAlpha < 0.12) return; return p ? pS.call(this, p) : pS.call(this); };
            if (pF) CanvasRenderingContext2D.prototype.fill = function(p){ if (this.globalAlpha > 0 && this.globalAlpha < 0.12) return; return p ? pF.call(this, p) : pF.call(this); };
            if (pFT) CanvasRenderingContext2D.prototype.fillText = function(t){ if ((typeof t === 'string' && /\\bdemo\\b/i.test(t)) || (this.globalAlpha > 0 && this.globalAlpha < 0.15)) return; return pFT.apply(this, arguments); };
            if (pST) CanvasRenderingContext2D.prototype.strokeText = function(t){ if ((typeof t === 'string' && /\\bdemo\\b/i.test(t)) || (this.globalAlpha > 0 && this.globalAlpha < 0.15)) return; return pST.apply(this, arguments); };
          }
        } catch(e) {}
      })();`;
      const s = document.createElement("script");
      s.textContent = inlineBootstrap;
      (document.head || document.documentElement).appendChild(s);
      s.remove();
    }
  } catch (e) {}

  function isProtectedCustomNode(node) {
    if (!node) return false;
    const el = node.nodeType === 1 ? node : node.parentElement;
    if (!el || typeof el.closest !== "function") return false;
    return !!(
      el.closest(
        "#settingsPopup, #qxTxModal, #qxAnalyticsModal, #qxNativeAlertModal, .swal2-container, .message-popup, #centeredDeveloperMessage, .qx-fake-tx-container, [data-qx-account='demo'], li.RDtBn:nth-of-type(2), div[class*='account']:nth-of-type(2)"
      )
    );
  }

  function replaceDemoTextSafely(str, isHtml) {
    if (typeof str !== "string" || !/demo/i.test(str)) return str;
    if (/Demo\s+Account/i.test(str) || /Demo\s+Balance/i.test(str) || /SPOOF\s+DEMO/i.test(str)) {
      return str;
    }
    let out = str
      .replace(/Demo trading/gi, "Live trading")
      .replace(/\bDEMO\b(?!\s+Account)/g, "LIVE");
    if (!isHtml || !/yBslY|RDtBn|r29tN/i.test(str)) {
      out = out.replace(/demo-trade/gi, "trade");
    }
    return out;
  }

  function captureClosedShadowHost(node) {
    if (window.__qxUsermenuShadow) return;
    try {
      const root = node && typeof node.getRootNode === "function" ? node.getRootNode() : null;
      if (root && root.nodeType === 11 && root.host) {
        root.host.__zeroxShadowRoot = root;
        if (root.host.localName === "qx-usermenu-trigger") {
          window.__qxUsermenuShadow = root;
          try { pageWin.__qxUsermenuShadow = root; } catch (e) {}
        }
      }
    } catch (e) {}
  }

  function patchAttachShadowOnProto(ProtoObj) {
    try {
      if (!ProtoObj || ProtoObj.__zeroxOrigAttach) return;
      const orig = ProtoObj.attachShadow;
      if (typeof orig !== "function") return;
      ProtoObj.__zeroxOrigAttach = orig;
      ProtoObj.attachShadow = function (shadowOptions) {
        const createdShadowRoot = orig.call(
          this,
          Object.assign({}, shadowOptions || {}, { mode: "open" })
        );
        this.__zeroxShadowRoot = createdShadowRoot;
        if (this.localName === "qx-usermenu-trigger") {
          try { pageWin.__qxUsermenuShadow = createdShadowRoot; } catch (e) {}
          window.__qxUsermenuShadow = createdShadowRoot;
        }
        return createdShadowRoot;
      };
    } catch (e) {}
  }

  // 1A. Open closed shadow roots (<qx-usermenu-trigger>) in both sandbox & pageWin
  patchAttachShadowOnProto(typeof Element !== "undefined" ? Element.prototype : null);
  try {
    if (pageWin && pageWin.Element && pageWin.Element.prototype) {
      patchAttachShadowOnProto(pageWin.Element.prototype);
    }
  } catch (e) {}

  if (!pageWin.__qxShadowPatched) {
    pageWin.__qxShadowPatched = true;
    const getShadow = function (targetElement) {
      if (!targetElement) return null;
      return targetElement.shadowRoot || targetElement.__zeroxShadowRoot || null;
    };
    try {
      if (/\/demo-trade/i.test(location.pathname || "") || /demo-trade/i.test(location.href || "")) {
        sessionStorage.setItem("qxSessionIsDemo", "1");
      }
    } catch (e) {}

    const ensureShadow = function () {
      const triggerElement = document.querySelector("qx-usermenu-trigger");
      if (!triggerElement) return null;
      return (
        triggerElement.shadowRoot ||
        triggerElement.__zeroxShadowRoot ||
        pageWin.__qxUsermenuShadow ||
        window.__qxUsermenuShadow ||
        null
      );
    };
    window.__qxGetShadowRoot = getShadow;
    window.__qxEnsureUsermenuShadow = ensureShadow;
    try {
      pageWin.__qxGetShadowRoot = getShadow;
      pageWin.__qxEnsureUsermenuShadow = ensureShadow;
    } catch (e) {}
  }

  // 1B. Synchronous DOM Interceptors (Fast-path Zero-Flicker DEMO Blocker)
  function patchDomSettersOnWindow(winObj) {
    if (!winObj) return;
    try {
      const ElProto = winObj.Element && winObj.Element.prototype;
      const NodeProto = winObj.Node && winObj.Node.prototype;
      if (ElProto && !ElProto.__qxSyncHtmlPatched) {
        ElProto.__qxSyncHtmlPatched = true;
        const origInnerHTML = Object.getOwnPropertyDescriptor(ElProto, "innerHTML");
        if (origInnerHTML && origInnerHTML.set) {
          Object.defineProperty(ElProto, "innerHTML", {
            configurable: true,
            set: function (html) {
              if (!window.__qxUsermenuShadow) captureClosedShadowHost(this);
              if (typeof html === "string" && (html.indexOf("demo") !== -1 || html.indexOf("DEMO") !== -1 || html.indexOf("Demo") !== -1) && !isProtectedCustomNode(this)) {
                html = replaceDemoTextSafely(html, true);
              }
              return origInnerHTML.set.call(this, html);
            },
            get: function () {
              return origInnerHTML.get.call(this);
            }
          });
        }
        const origSetAttr = ElProto.setAttribute;
        if (typeof origSetAttr === "function" && !ElProto.__qxSyncSetAttrPatched) {
          ElProto.__qxSyncSetAttrPatched = true;
          ElProto.setAttribute = function (name, val) {
            if (!window.__qxUsermenuShadow) captureClosedShadowHost(this);
            if (typeof val === "string" && val.indexOf("icon-academic") !== -1) {
              val = val.replace(/icon-academic/g, "icon-profile-level-standart");
            }
            return origSetAttr.call(this, name, val);
          };
        }
      }

      if (NodeProto && !NodeProto.__qxSyncTextPatched) {
        NodeProto.__qxSyncTextPatched = true;
        const origTextContent = Object.getOwnPropertyDescriptor(NodeProto, "textContent");
        if (origTextContent && origTextContent.set) {
          Object.defineProperty(NodeProto, "textContent", {
            configurable: true,
            set: function (text) {
              if (!window.__qxUsermenuShadow) captureClosedShadowHost(this);
              if (typeof text === "string" && (text.indexOf("demo") !== -1 || text.indexOf("DEMO") !== -1 || text.indexOf("Demo") !== -1) && !isProtectedCustomNode(this)) {
                text = replaceDemoTextSafely(text, false);
              }
              return origTextContent.set.call(this, text);
            },
            get: function () {
              return origTextContent.get.call(this);
            }
          });
        }
      }
    } catch (e) {}
  }

  patchDomSettersOnWindow(window);
  if (pageWin && pageWin !== window) patchDomSettersOnWindow(pageWin);

  // 1C. Early Canvas2D & WebGL Background DEMO Watermark Blocker (both sandbox & pageWin)
  function patchCanvasAndGlOnWindow(winObj) {
    if (!winObj) return;
    try {
      const HCE = winObj.HTMLCanvasElement;
      if (typeof HCE !== "undefined" && !HCE.prototype.__zeroxEarlyContextPatched) {
        HCE.prototype.__zeroxEarlyContextPatched = true;
        const origGetContext = HCE.prototype.getContext;
        HCE.prototype.getContext = function (type) {
          if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") {
            return null;
          }
          const ctx = origGetContext.apply(this, arguments);
          if (ctx && (type === "2d" || type === "experimental-2d") && !ctx.__zeroxWatermarkBlocked) {
            ctx.__zeroxWatermarkBlocked = true;
            const _s = ctx.stroke;
            ctx.stroke = function (path) {
              if (ctx.globalAlpha > 0 && ctx.globalAlpha < 0.12) return;
              return path ? _s.call(ctx, path) : _s.call(ctx);
            };
            const _f = ctx.fill;
            if (_f) {
              ctx.fill = function (path) {
                if (ctx.globalAlpha > 0 && ctx.globalAlpha < 0.12) return;
                return path ? _f.call(ctx, path) : _f.call(ctx);
              };
            }
            const _ft = ctx.fillText;
            if (_ft) {
              ctx.fillText = function (text) {
                if ((typeof text === "string" && /\bdemo\b/i.test(text)) || (ctx.globalAlpha > 0 && ctx.globalAlpha < 0.15)) return;
                return _ft.apply(ctx, arguments);
              };
            }
            const _st = ctx.strokeText;
            if (_st) {
              ctx.strokeText = function (text) {
                if ((typeof text === "string" && /\bdemo\b/i.test(text)) || (ctx.globalAlpha > 0 && ctx.globalAlpha < 0.15)) return;
                return _st.apply(ctx, arguments);
              };
            }
          }
          return ctx;
        };
      }
      const C2D = winObj.CanvasRenderingContext2D;
      if (typeof C2D !== "undefined" && !C2D.prototype.__zeroxProtoWatermarkBlocked) {
        C2D.prototype.__zeroxProtoWatermarkBlocked = true;
        const protoS = C2D.prototype.stroke;
        C2D.prototype.stroke = function (path) {
          if (this.globalAlpha > 0 && this.globalAlpha < 0.12) return;
          return path ? protoS.call(this, path) : protoS.call(this);
        };
        const protoF = C2D.prototype.fill;
        if (protoF) {
          C2D.prototype.fill = function (path) {
            if (this.globalAlpha > 0 && this.globalAlpha < 0.12) return;
            return path ? protoF.call(this, path) : protoF.call(this);
          };
        }
        const protoFT = C2D.prototype.fillText;
        if (protoFT) {
          C2D.prototype.fillText = function (text) {
            if ((typeof text === "string" && /\bdemo\b/i.test(text)) || (this.globalAlpha > 0 && this.globalAlpha < 0.15)) return;
            return protoFT.apply(this, arguments);
          };
        }
        const protoST = C2D.prototype.strokeText;
        if (protoST) {
          C2D.prototype.strokeText = function (text) {
            if ((typeof text === "string" && /\bdemo\b/i.test(text)) || (this.globalAlpha > 0 && this.globalAlpha < 0.15)) return;
            return protoST.apply(this, arguments);
          };
        }
      }
      function patchGl(proto) {
        if (!proto || proto.__zeroxWebGlDrawPatched) return;
        proto.__zeroxWebGlDrawPatched = true;
        const _de = proto.drawElements;
        proto.drawElements = function (mode, count) {
          if (count === 1710 || (count > 0 && count % 1710 === 0 && count <= 17100)) return;
          return _de.apply(this, arguments);
        };
      }
      if (typeof winObj.WebGLRenderingContext !== "undefined") patchGl(winObj.WebGLRenderingContext.prototype);
      if (typeof winObj.WebGL2RenderingContext !== "undefined") patchGl(winObj.WebGL2RenderingContext.prototype);
    } catch (e) {}
  }
  patchCanvasAndGlOnWindow(window);
  if (pageWin && pageWin !== window) patchCanvasAndGlOnWindow(pageWin);

  // 1D. Immediate Anti-Flicker CSS & URL/Title Guard
  try {
    const injectEarlyCss = () => {
      const target = document.head || document.documentElement;
      if (!target) return;
      if (!document.getElementById("qx-early-hide-css")) {
        const wmStyle = document.createElement("style");
        wmStyle.id = "qx-early-hide-css";
        wmStyle.textContent = ".usFyP, [class*='watermark'] { display: none !important; opacity: 0 !important; visibility: hidden !important; } svg.icon-academic { display: none !important; }";
        target.appendChild(wmStyle);
      }
      const hasSavedKey = !!(localStorage.getItem("app_license_key") || localStorage.getItem("dtla_license_key"));
      if (hasSavedKey && !document.getElementById("qx-deep-fix")) {
        const deepFix = document.createElement("style");
        deepFix.id = "qx-deep-fix";
        deepFix.textContent = `
          qx-usermenu-trigger:not(.qx-ready),
          .v2KPX:not(.qx-ready),
          [class*="account"]:not(.qx-ready) {
            opacity: 0 !important;
            visibility: hidden !important;
          }
        `;
        target.appendChild(deepFix);
        setTimeout(() => {
          document.querySelectorAll("qx-usermenu-trigger, .v2KPX, [class*='account']").forEach((el) => {
            el.classList.add("qx-ready");
          });
        }, 1800);
      }
    };
    injectEarlyCss();

    if (document.title && /demo/i.test(document.title)) {
      document.title = document.title.replace(/demo/gi, "Live");
    }
    if (!window.qxHistoryPatched) {
      window.qxHistoryPatched = true;
      const origPush = history.pushState;
      const origReplace = history.replaceState;
      history.pushState = function (state, title, url) {
        if (url && typeof url === "string" && url.includes("demo-trade")) {
          url = url.replace(/demo-trade/gi, "trade");
        }
        return origPush.call(this, state, title, url);
      };
      history.replaceState = function (state, title, url) {
        if (url && typeof url === "string" && url.includes("demo-trade")) {
          url = url.replace(/demo-trade/gi, "trade");
        }
        return origReplace.call(this, state, title, url);
      };
    }
  } catch (e) {}
})();

// ============================================================================
// PART 2: REMOTE LICENSE & SERVER TRANSPORT BRIDGE
// ============================================================================
(function () {
  const PRIMARY_SERVER_BASE = "https://demotoliveadmin.lovable.app";
  const pageWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

  function purgeLegacyAdminStorage() {
    try {
      if (localStorage.getItem("qx_lovable_clean_v31") !== "1") {
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
      }
      if (localStorage.getItem("qx_pl_v26_migrated") !== "1") {
        localStorage.removeItem("qxUserSetZeroCap");
        localStorage.removeItem("leaderboardBalance");
        const cap = (localStorage.getItem("qxCustomStartingCapital") || "").trim();
        if (cap === "0" || cap === "NaN" || cap === "0.00") {
          localStorage.removeItem("qxCustomStartingCapital");
        }
        localStorage.setItem("qx_pl_v26_migrated", "1");
      }
    } catch (e) {}
  }
  purgeLegacyAdminStorage();

  function getDeviceId() {
    let id = localStorage.getItem("app_device_id") || localStorage.getItem("dtla_device_id");
    if (!id) {
      const rawId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Date.now() + "-" + Math.random() + "-" + Math.random();
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

  const RAW_PROXY_HINT = "__PROXY_BASE_URL__";
  const FALLBACK_PROXY_BASE = /^https?:\/\//i.test(RAW_PROXY_HINT)
    ? RAW_PROXY_HINT
    : "https://ais-pre-ga2sdbiyy4mi4lhjhm5mwj-878201435123.asia-southeast1.run.app";

  function fetchJson(url, bodyStr, timeoutMs) {
    const ms = timeoutMs || 6500;
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => { try { ctrl.abort(); } catch (e) {} }, ms) : null;
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: bodyStr,
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(async (res) => {
        if (timer) clearTimeout(timer);
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
      .catch((err) => {
        if (timer) clearTimeout(timer);
        const isTimeout = err && err.name === "AbortError";
        return {
          ok: false,
          status: 0,
          data: { valid: false, reason: isTimeout ? "timeout" : "network", detail: (err && err.message) || "CORS or network error" }
        };
      });
  }

  function getGmRequestFn() {
    if (typeof GM_xmlhttpRequest === "function") return GM_xmlhttpRequest;
    if (typeof GM !== "undefined" && typeof GM.xmlHttpRequest === "function") return GM.xmlHttpRequest;
    return null;
  }

  function gmRequestOnce(method, url, bodyStr, useAnonymous) {
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
      }, 6500);
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
        const reqOpts = {
          method: method,
          url: url,
          headers: method === "POST" ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "*/*" },
          data: method === "POST" ? bodyStr : undefined,
          timeout: 6000,
          onload: handleResponse,
          onerror: () => {
            clearTimeout(timer);
            done({ ok: false, status: 0, text: "", data: { valid: false, reason: "gm_error", detail: "GM_xmlhttpRequest error" } });
          },
          ontimeout: () => {
            clearTimeout(timer);
            done({ ok: false, status: 0, text: "", data: { valid: false, reason: "timeout", detail: "GM_xmlhttpRequest timed out" } });
          }
        };
        if (useAnonymous) reqOpts.anonymous = true;
        const maybePromise = gmReq(reqOpts);
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

  async function gmRequest(method, url, bodyStr) {
    const first = await gmRequestOnce(method, url, bodyStr, false);
    if (first && (first.status > 0 || (first.data && (first.data.reason === "no_gm" || first.data.reason === "timeout")))) {
      return first;
    }
    return gmRequestOnce(method, url, bodyStr, true);
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
      const timer = setTimeout(() => done({ ok: false, status: 0, data: { valid: false, reason: "timeout" } }), 9000);
      window.addEventListener("message", onMsg);
      window.postMessage({ __qxExtReq: true, id: reqId, path: path, body: bodyStr }, "*");
    });
  }

  function isTransientNetResult(res) {
    if (!res || !res.data) return true;
    if (res.status >= 500) return true;
    const r = String(res.data.reason || "").toLowerCase();
    return ["network", "timeout", "invalid_response", "no_gm", "gm_blocked", "gm_error", "ext_unavailable"].includes(r);
  }

  async function apiPost(path, payload) {
    const bodyStr = JSON.stringify(payload || {});
    const primaryUrl = PRIMARY_SERVER_BASE + path;
    const proxyUrl = FALLBACK_PROXY_BASE + path;
    const hasGm = !!getGmRequestFn();

    if (hasExtensionBridge()) {
      const extRes = await extBridgePost(path, bodyStr);
      if (extRes && !isTransientNetResult(extRes)) return extRes;
    }

    // In Tampermonkey/Userscript mode, GM_xmlhttpRequest bypasses Quotex page CSP directly
    if (hasGm) {
      const gmRes = await gmRequest("POST", primaryUrl, bodyStr);
      if (gmRes && !isTransientNetResult(gmRes)) return gmRes;
      await new Promise((r) => setTimeout(r, 250));
      const gmProxy = await gmRequest("POST", proxyUrl, bodyStr);
      if (gmProxy && !isTransientNetResult(gmProxy)) return gmProxy;
      const directFallback = await fetchJson(primaryUrl, bodyStr, 6000);
      if (directFallback && !isTransientNetResult(directFallback)) return directFallback;
      return gmProxy || gmRes;
    }

    const directRes = await fetchJson(primaryUrl, bodyStr, 6500);
    if (directRes && !isTransientNetResult(directRes)) return directRes;

    // Immediate failover to CORS proxy if primary URL failed, then one quick retry
    const proxyRes = await fetchJson(proxyUrl, bodyStr, 7000);
    if (proxyRes && !isTransientNetResult(proxyRes)) return proxyRes;

    await new Promise((r) => setTimeout(r, 300));
    const retryDirect = await fetchJson(primaryUrl, bodyStr, 6000);
    if (retryDirect && !isTransientNetResult(retryDirect)) return retryDirect;

    return proxyRes || directRes;
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
      const timer = setTimeout(() => done({ ok: false, text: "" }), 10000);
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
    if (getGmRequestFn()) {
      const g = await gmRequest("GET", resolvedUrl);
      if (g && g.ok && g.text) return g.text;
    }
    try {
      const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => { try { ctrl.abort(); } catch (e) {} }, 7000) : null;
      const r = await fetch(resolvedUrl, { signal: ctrl ? ctrl.signal : undefined });
      if (timer) clearTimeout(timer);
      if (r.ok) return await r.text();
    } catch (e) {}
    return "";
  }

  function getActivateMeta() {
    const ua = typeof navigator !== "undefined" && navigator.userAgent ? navigator.userAgent : "";
    const plat = typeof navigator !== "undefined" && navigator.platform ? navigator.platform : "";
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
  try { pageWin.AppLicense = licenseBridge; } catch (e) {}
})();

// ============================================================================
// PART 3: 0X CONTROL PANEL UI + SERVER BOOTSTRAP + DEPOSIT & NOTIF TRIGGERS
// ============================================================================
(async function () {
  const PRIMARY_SERVER_BASE = "https://demotoliveadmin.lovable.app";
  const pageWinMain = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

  if (pageWinMain.__qxProLoaded && typeof pageWinMain.__qxProOpenPopup === "function") {
    pageWinMain.__qxProOpenPopup();
    return;
  }

  const PROJECT_TYPE = "Quotex";
  const TX_STORAGE_KEY = "qxFakeTransactions";
  const CONFIG_STORAGE_KEY = "qx_0x_panel_config_v1";
  const PAYMENT_METHODS = [
    "Binance Pay",
    "Tether (USDT TRC20)",
    "Tether (USDT ERC20)",
    "Bitcoin (BTC)",
    "bKash",
    "Nagad",
    "Rocket",
    "Visa / Mastercard",
    "Perfect Money",
    "AdvCash",
    "Skrill",
    "Neteller",
    "UPI",
    "PayTM",
    "Bank Transfer"
  ];

  let isActivated = false;
  let settingsPopupContainer = null;
  let serverPayloadLoaded = false;
  let liveEngineObserver = null;
  let liveEngineStarted = false;
  const executedRemoteHashes = new Set();

  let demoBalanceValue = (() => {
    if (localStorage.getItem("demoBalanceReset") === "1") return null;
    const raw = localStorage.getItem("demoBalance");
    const parsed = raw !== null && raw !== "" ? parseFloat(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  })();

  function getDeviceId() {
    return window.AppLicense.getDeviceId();
  }
  function getStoredAuth() {
    return window.AppLicense.getStoredAuth();
  }
  function saveAuth(k, t) {
    return window.AppLicense.saveAuth(k, t);
  }
  function clearLicenseStorage() {
    try {
      [
        "app_license_key", "app_device_token", "dtla_license_key", "dtla_device_token",
        "appActivation", "active_license_key", "lastVerified", "appDeviceToken", "active_device_token"
      ].forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
    isActivated = false;
  }

  function loadTransactions() {
    try {
      const raw = localStorage.getItem(TX_STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
      const cfgRaw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (cfgRaw) {
        const cfg = JSON.parse(cfgRaw);
        if (cfg && Array.isArray(cfg.transactions)) return cfg.transactions;
      }
    } catch (e) {}
    return [];
  }

  const CONFIG_STORAGE_KEY_V2 = "qx_0x_panel_config_v2";
  const COUNTRY_CODE_TO_NAME = {
    bd: "Bangladesh", in: "India", pk: "Pakistan", us: "United States",
    gb: "United Kingdom", ae: "United Arab Emirates", sa: "Saudi Arabia",
    my: "Malaysia", sg: "Singapore", id: "Indonesia", br: "Brazil",
    tr: "Turkey", ng: "Nigeria", za: "South Africa", ca: "Canada",
    au: "Australia", de: "Germany", fr: "France", it: "Italy", es: "Spain"
  };

  function emitPanelEvent(name, detail) {
    const dispatchOn = (target) => {
      try {
        if (target && typeof target.dispatchEvent === "function") {
          target.dispatchEvent(new CustomEvent(name, detail !== undefined ? { detail } : undefined));
        }
      } catch (e) {}
    };
    dispatchOn(window);
    if (pageWinMain && pageWinMain !== window) dispatchOn(pageWinMain);
  }

  function saveTransactions(list) {
    try {
      const normalized = (Array.isArray(list) ? list : []).map((tx) => ({
        id: tx.id,
        type: tx.type || "Deposit",
        amount: Number(tx.amount || 0),
        method: tx.method || "Binance Pay",
        date: tx.date || tx.dateTime || formatNowString(),
        dateTime: tx.dateTime || tx.date || formatNowString(),
        status: tx.status || "Successed"
      }));
      localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(normalized));
      [CONFIG_STORAGE_KEY, CONFIG_STORAGE_KEY_V2].forEach((k) => {
        const cfgRaw = localStorage.getItem(k);
        const cfg = cfgRaw ? JSON.parse(cfgRaw) : {};
        cfg.transactions = normalized;
        localStorage.setItem(k, JSON.stringify(cfg));
      });
      emitPanelEvent("qx:transactions-updated", { transactions: normalized });
    } catch (e) {}
  }

  function syncUnifiedConfig(partial) {
    try {
      [CONFIG_STORAGE_KEY, CONFIG_STORAGE_KEY_V2].forEach((k) => {
        const cfgRaw = localStorage.getItem(k);
        const cfg = cfgRaw ? JSON.parse(cfgRaw) : {};
        const next = Object.assign({}, cfg, partial || {});
        if (k === CONFIG_STORAGE_KEY_V2 && next.countryFlag) {
          next.country = COUNTRY_CODE_TO_NAME[String(next.countryFlag).toLowerCase()] || next.countryFlag;
        }
        localStorage.setItem(k, JSON.stringify(next));
      });
    } catch (e) {}
  }

  function formatNowString() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return (
      d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " +
      pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds())
    );
  }

  function formatUsd(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return "$0.00";
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatSignedUsd(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return "$0.00";
    const abs = Math.abs(num).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (num < 0 ? "-$" : "$") + abs;
  }

  function getActiveCustomDemoBalance() {
    if (localStorage.getItem("demoBalanceReset") === "1") return NaN;
    const raw = localStorage.getItem("demoBalance");
    if (raw === null || raw === "") return NaN;
    const num = parseFloat(raw);
    return Number.isFinite(num) ? num : NaN;
  }

  function getActiveCustomLiveBalance() {
    const raw = localStorage.getItem("qxCustomLiveBalance") || localStorage.getItem("liveBalance");
    if (raw === null || raw === "") return NaN;
    const num = parseFloat(raw);
    return Number.isFinite(num) ? num : NaN;
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
    if (/\/demo-trade(?:\/|$|\?)/i.test(pathname) || /\/demo-trade(?:\/|$|\?)/i.test(href)) return true;
    const shadow = getUsermenuShadowRoot();
    const nameEl = shadow && shadow.querySelector(".name");
    if (nameEl) {
      if (nameEl.classList.contains("demo") || /demo/i.test(nameEl.textContent || "")) return true;
      if (nameEl.classList.contains("live") || /^live(\s+account)?$/i.test((nameEl.textContent || "").trim())) return false;
    }
    const demoRadio = document.querySelector('.grOBD input.r29tN[value="demo"]');
    if (demoRadio && demoRadio.checked) return true;
    if (document.querySelector('.grOBD li.RDtBn.Qx5RW a.yBslY[href*="demo-trade"]')) return true;
    return false;
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

  function confirmAccountSwitch() {
    const btn = document.querySelector(
      ".modal-account-type-changed button.PUCjQ, .modal.modal-account-type-changed button.PUCjQ, .modal.active.center button.PUCjQ, .modal-account-type-changed__body-button"
    );
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
        confirmAccountSwitch();
        return;
      }
      const trigger = document.querySelector(".RyAkb .uoy2n, .uoy2n qx-usermenu-trigger, qx-usermenu-trigger, .RyAkb .QE4Zb, .QE4Zb");
      const menuOpen = !!(document.querySelector(".p0Ijl.Qx5RW, .QE4Zb .p0Ijl, .RyAkb .grOBD, .grOBD li.RDtBn"));
      if (!menuOpen) {
        if (!dispatchFullClick(trigger)) {
          if (count < 25) setTimeout(() => switchToDemo(count + 1), 250);
          return;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      const demoEl =
        document.querySelector('.grOBD a.yBslY[href*="demo-trade"]') ||
        document.querySelector('.grOBD input.r29tN[value="demo"]')?.closest("a.yBslY, li.RDtBn");
      if (!demoEl) {
        if (count < 25) setTimeout(() => switchToDemo(count + 1), 250);
        return;
      }
      dispatchFullClick(demoEl);
      await new Promise((r) => setTimeout(r, 250));
      confirmAccountSwitch();
      setTimeout(confirmAccountSwitch, 450);
      setTimeout(() => dispatchFullClick(trigger), 300);
    } catch (e) {
      if (count < 15) setTimeout(() => switchToDemo(count + 1), 400);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(() => switchToDemo(1), 200));
  } else {
    setTimeout(() => switchToDemo(1), 200);
  }

  // Load SweetAlert2 CDN cleanly
  if (typeof Swal === "undefined" && !document.getElementById("qxSwalCdnScript")) {
    try {
      const script = document.createElement("script");
      script.id = "qxSwalCdnScript";
      script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      script.async = true;
      (document.head || document.documentElement).appendChild(script);
    } catch (e) {}
  }

  // Remote code loader helpers
  function decodeBase64Utf8(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
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
          try { decoded = decodeBase64Utf8(val.trim()); } catch (e) {}
        }
        if (isCssFile) injectRemoteCss(decoded);
        else if (!isNonJsAsset) outScripts.push(decoded);
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
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return str.length + ":" + h;
  }

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

  function tryDecodeRawBase64Code(str) {
    const trimmed = String(str || "").replace(/^\uFEFF/, "").trim();
    if (!trimmed || trimmed.length < 24) return "";
    if (!/^[A-Za-z0-9+/_-]+=*[\r\n\s]*$/.test(trimmed)) return "";
    const compact = trimmed.replace(/[\r\n\s]+/g, "").replace(/-/g, "+").replace(/_/g, "/");
    if (compact.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(compact)) return "";
    try {
      const decoded = decodeBase64Utf8(compact);
      if (decoded && /function|const |let |var |window\.|document\.|\(\s*\)\s*=>|\(function/i.test(decoded)) return decoded;
    } catch (e) {}
    return "";
  }

  function executeServerCode(codeText, ctx) {
    if (!codeText || typeof codeText !== "string") return false;
    let cleanCode = codeText.replace(/^\uFEFF/, "").trim();
    const decodedB64 = tryDecodeRawBase64Code(cleanCode);
    if (decodedB64) cleanCode = decodedB64.replace(/^\uFEFF/, "").trim();
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
      try { pageWinMain.__QX_LAST_EXEC_ERROR__ = (fnErr && fnErr.message) || String(fnErr); } catch (e) {}
    }

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

  let bootstrapInFlight = null;

  async function tryRunRemoteBootstrap(key, deviceId, token) {
    if (serverPayloadLoaded) return true;
    if (bootstrapInFlight) return bootstrapInFlight;
    bootstrapInFlight = (async () => {
      try {
        const payload = { license_key: key, device_id: deviceId, device_token: token };
        let releaseRes = await callLicenseApi("release-code", payload);
        if ((!releaseRes || (releaseRes.valid === false && ["network", "timeout"].includes(String(releaseRes.reason || "").toLowerCase())))) {
          await new Promise((r) => setTimeout(r, 250));
          releaseRes = await callLicenseApi("release-code", payload);
        }
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
          for (let i = 0; i < cssFiles.length; i++) injectRemoteCss(cssFiles[i].content);

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

        const scripts = [];
        if (releaseRes && releaseRes.valid !== false) await extractScriptsRecursive(releaseRes, new Set(), scripts);
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
      } finally {
        bootstrapInFlight = null;
      }
    })();
    return bootstrapInFlight;
  }

  let lastVerifySession = null;
  let verifyInFlight = null;

  async function verifyLicenseKey(rawKey, options) {
    const key = String(rawKey || "").trim();
    if (!key) return { valid: false, reason: "invalid" };
    const auth = getStoredAuth();
    const deviceId = auth.deviceId;
    const storedKey = auth.key;
    const storedToken = auth.token;
    const forceActivate = !!(options && options.forceActivate);
    const skipCache = !!(options && options.skipCache);

    if (
      !forceActivate &&
      !skipCache &&
      lastVerifySession &&
      lastVerifySession.key === key &&
      lastVerifySession.deviceId === deviceId &&
      Date.now() - lastVerifySession.at < 180000
    ) {
      isActivated = true;
      return lastVerifySession.result;
    }

    if (!forceActivate && !skipCache && verifyInFlight && verifyInFlight.key === key) {
      return verifyInFlight.promise;
    }

    const runVerify = async () => {
      try {
      let result = null;
      const shouldTryVerifyFirst = !forceActivate && storedToken && storedKey === key;
      if (shouldTryVerifyFirst) {
        result = await callLicenseApi("verify", { license_key: key, device_id: deviceId, device_token: storedToken });
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
        const ua = typeof navigator !== "undefined" && navigator.userAgent ? navigator.userAgent : "";
        const plat = typeof navigator !== "undefined" && navigator.platform ? navigator.platform : "";
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
        const okRes = { valid: true, key: key, device_token: finalToken, expires_at: result.expires_at || null, project_type: PROJECT_TYPE };
        lastVerifySession = { key, deviceId, at: Date.now(), result: okRes };
        return okRes;
      }

      const reason = String((result && result.reason) || "").toLowerCase();
      if (["network", "network_error", "timeout", "invalid_response", "server_unavailable", "gm_blocked", "gm_error", "no_gm"].includes(reason)) {
        if (storedKey === key && storedToken) {
          isActivated = true;
          return { valid: true, key: key, offline: true, device_token: storedToken };
        }
        return { valid: false, reason: "network", transportError: (result && (result.transport_error || result.reason)) || "network", detail: result && result.detail, keepLicense: storedKey === key };
      }
      if (["device_blocked", "banned", "license_banned", "blocked", "revoked"].includes(reason)) {
        lastVerifySession = null;
        clearLicenseStorage();
        return { valid: false, reason: "banned" };
      }
      if (reason === "inactive" || reason === "suspended") {
        lastVerifySession = null;
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
      if (["device_limit_reached", "limit", "max_devices_reached"].includes(reason)) {
        return { valid: false, reason: "limit", allowed: (result && result.max_devices) || "1", used: (result && result.used_devices) || "1" };
      }
      if (reason === "expired" || reason === "license_expired") {
        lastVerifySession = null;
        clearLicenseStorage();
        return { valid: false, reason: "expired" };
      }
      if (reason === "wrong_project") {
        lastVerifySession = null;
        clearLicenseStorage();
        return { valid: false, reason: "wrong_project", message: result && result.message, wrongProject: result && result.project_type };
      }
      if (reason === "invalid_request") {
        return { valid: false, reason: "invalid_request", message: (result && result.message) || "Invalid license payload" };
      }
      if (storedKey === key) clearLicenseStorage();
      lastVerifySession = null;
      return { valid: false, reason: "invalid" };
    } catch (err) {
      if (storedKey === key && storedToken) {
        isActivated = true;
        return { valid: true, key: key, offline: true, device_token: storedToken };
      }
      return { valid: false, reason: "network", keepLicense: storedKey === key };
    }
    };

    const p = runVerify().finally(() => {
      if (verifyInFlight && verifyInFlight.promise === p) verifyInFlight = null;
    });
    if (!forceActivate && !skipCache) verifyInFlight = { key, promise: p };
    return p;
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
    if (["banned", "wrong_project", "limit", "invalid", "expired"].includes(res.reason)) {
      if (res.reason !== "limit") clearLicenseStorage();
      return res;
    }
    if (res.keepLicense || res.reason === "network" || res.offline) {
      isActivated = true;
      return Object.assign({}, res, { offline: true });
    }
    return { valid: false, reason: res.reason || "invalid" };
  }

  function safeAlert(opts) {
    if (typeof Swal !== "undefined" && typeof Swal.fire === "function") return Swal.fire(opts);
    return new Promise((resolve) => {
      if (!document.body) {
        showToast(opts.title || opts.text || "Notice", 4000);
        resolve({ isConfirmed: false });
        return;
      }
      document.getElementById("qxNativeAlertModal")?.remove();
      const overlay = document.createElement("div");
      overlay.id = "qxNativeAlertModal";
      overlay.style.cssText = "position:fixed;inset:0;z-index:10010;background:rgba(0,0,0,0.68);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Roboto',sans-serif;";
      const card = document.createElement("div");
      card.style.cssText = "width:100%;max-width:380px;background:rgba(30,11,54,0.98);border:1px solid rgba(248,0,255,0.35);border-radius:16px;padding:18px;box-shadow:0 20px 50px rgba(0,0,0,0.6);color:#fff;text-align:center;";
      if (opts.html) {
        const bodyDiv = document.createElement("div");
        bodyDiv.innerHTML = opts.html;
        card.appendChild(bodyDiv);
      } else {
        if (opts.title) {
          const h = document.createElement("h3");
          h.style.cssText = "margin:0 0 8px 0;font-size:17px;font-weight:700;color:#fff;";
          h.textContent = opts.title;
          card.appendChild(h);
        }
        if (opts.text) {
          const p = document.createElement("p");
          p.style.cssText = "margin:0 0 12px 0;font-size:13px;color:rgba(255,255,255,0.88);line-height:1.5;";
          p.textContent = opts.text;
          card.appendChild(p);
        }
      }
      const closeModal = (confirmed) => {
        try { overlay.remove(); } catch (e) {}
        resolve({ isConfirmed: !!confirmed });
      };
      if (opts.showConfirmButton !== false) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = opts.confirmButtonText || "OK";
        btn.style.cssText = "margin-top:14px;padding:10px 22px;border:none;border-radius:8px;font-size:13px;font-weight:700;color:#fff;cursor:pointer;background:" + (opts.confirmButtonColor || "#764ba2") + ";";
        btn.addEventListener("click", () => closeModal(true));
        card.appendChild(btn);
      }
      if (opts.allowOutsideClick !== false) {
        overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(false); });
      }
      overlay.appendChild(card);
      document.body.appendChild(overlay);
      if (opts.timer && Number(opts.timer) > 0) setTimeout(() => closeModal(false), Number(opts.timer));
    });
  }

  function showDeviceMismatchAlert(allowed, used) {
    safeAlert({
      title: "",
      html: `<div style="font-family:'Roboto',sans-serif;text-align:center;background:linear-gradient(135deg,rgba(30,11,54,0.98),rgba(45,20,70,0.98));padding:20px;border-radius:15px;">
        <h2 style="color:#fff;margin:0 0 10px 0;font-size:16px;">Device Limit Reached (${used}/${allowed})</h2>
        <p style="font-size:13px;color:rgba(255,255,255,0.9);">Contact <a href="https://t.me/tradereyasin7" target="_blank" style="color:#f900ff;font-weight:700;">@tradereyasin7</a> on Telegram.</p>
      </div>`,
      confirmButtonText: "Close",
      confirmButtonColor: "#ee5a6f",
      allowOutsideClick: false,
      customClass: { container: "swal-high-zindex" }
    });
  }
  function showWrongProjectAlert(msg, wrongProj) {
    safeAlert({ icon: "error", title: "Wrong Project License", html: `This license key is for <b>${wrongProj || "UNKNOWN"}</b>, not <b>QUOTEX</b>.`, confirmButtonColor: "#667eea", customClass: { container: "swal-high-zindex" } });
  }
  function showLicenseExpiredAlert() {
    safeAlert({ icon: "error", title: "License Blocked", html: "This license key is <strong>blocked or revoked</strong>. Contact @tradereyasin7.", confirmButtonColor: "#e74c3c", customClass: { container: "swal-high-zindex" } });
  }
  function showLicenseTimeExpiredAlert() {
    safeAlert({ icon: "warning", title: "License Expired", html: "This license key has <strong>expired</strong>. Contact @tradereyasin7 to renew.", confirmButtonColor: "#f59e0b", customClass: { container: "swal-high-zindex" } });
  }
  function showLicenseRequiredAlert() {
    safeAlert({ icon: "error", title: "Invalid License Key", html: "Please enter a valid license key or contact <b>@tradereyasin7</b>.", confirmButtonColor: "#764ba2", customClass: { container: "swal-high-zindex" } });
  }
  function showNetworkErrorAlert(detailMsg, transportError) {
    const hint = transportError === "gm_blocked" || transportError === "gm_error"
      ? "Allow cross-origin XHR requests in Tampermonkey settings."
      : "Check your internet connection and try again.";
    safeAlert({ icon: "error", title: "Connection Error", html: `<b>Cause:</b> ${detailMsg || "Server unreachable"}<br><small>${hint}</small>`, confirmButtonColor: "#f5576c", customClass: { container: "swal-high-zindex" } });
  }
  function showSuccessAlert() {
    return safeAlert({ icon: "success", title: "License Verified!", text: "Your license has been successfully verified.", showConfirmButton: false, timer: 1300, timerProgressBar: true, customClass: { container: "swal-high-zindex" } });
  }

  const FLOATING_POPUP_CSS = `
    .swal-high-zindex, .swal2-container.swal-high-zindex { z-index: 10005 !important; }
    #settingsPopup, #qxTxModal, #qxAnalyticsModal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.85);
      width: calc(100% - 20px);
      max-width: 365px;
      max-height: calc(100vh - 20px);
      padding: 12px 14px;
      background: rgba(30, 11, 54, 0.98);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.55);
      text-align: center;
      border: 1px solid rgba(248, 0, 255, 0.28);
      overflow-y: auto;
      overflow-x: hidden;
      font-family: 'Roboto', sans-serif;
      color: #f8f8f8;
      z-index: 9999;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      box-sizing: border-box;
    }
    #qxTxModal, #qxAnalyticsModal { z-index: 10002; max-width: 380px; }
    #settingsPopup.show, #qxTxModal.show, #qxAnalyticsModal.show { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    #settingsPopup.hide { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    #settingsPopup h2, #qxTxModal h2, #qxAnalyticsModal h2 {
      color: white; font-size: 13px; font-weight: 700; margin: 0 0 8px 0; padding: 8px;
      background: rgba(0,0,0,0.65); border-radius: 8px; border: 1px solid rgba(248, 0, 255, 0.3); line-height: 1.3;
    }
    #settingsPopup h3, #qxTxModal h3, #qxAnalyticsModal h3 {
      color: white; font-size: 12px; font-weight: 700; margin: 6px 0 8px 0; text-transform: uppercase; letter-spacing: 1px;
      background: linear-gradient(to right, #f900ff, #00d9ff); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; display: inline-block;
    }
    .telegram-link { display: inline-block; margin-bottom: 6px; }
    .telegram-link img { width: 32px; height: 32px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.2); }
    #settingsPopup label, #qxTxModal label {
      display: block; margin-bottom: 6px; color: rgba(255, 255, 255, 0.9); font-size: 11px; font-weight: 500; text-align: left;
    }
    #settingsPopup input, #settingsPopup select, #qxTxModal input, #qxTxModal select {
      width: 100%; padding: 7px; margin-top: 2px; border: 2px solid rgba(255, 255, 255, 0.2); border-radius: 8px;
      background: rgba(255, 255, 255, 0.1); color: white; font-size: 13px; box-sizing: border-box; outline: none;
    }
    #settingsPopup input:focus, #settingsPopup select:focus, #qxTxModal input:focus, #qxTxModal select:focus {
      border-color: #f900ff;
    }
    #countryFlagSelect, #qxTxType, #qxTxMethod { background: rgba(30, 11, 54, 0.95); }
    #countryFlagSelect option, #qxTxType option, #qxTxMethod option { background: #1e0b36; color: white; }
    #settingsPopup small { display: block; margin-top: 2px; margin-bottom: 6px; color: rgba(255, 255, 255, 0.6); font-size: 8.5px; text-align: left; }
    #settingsPopup button, #qxTxModal button, #qxAnalyticsModal button {
      width: 100%; padding: 8px; margin-top: 6px; border: none; border-radius: 8px; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: all 0.25s ease; text-transform: uppercase; letter-spacing: 0.8px;
    }
    #saveButton, #verifyBtn, #setDemoBtn, #qxAddTxBtn { background: linear-gradient(135deg, #8333ff, #f900ff); color: white; }
    .qx-btn-row { display: flex; gap: 6px; margin-top: 6px; }
    .qx-btn-row button { margin-top: 0 !important; }
    #setDemoBtn { flex: 2; }
    #settingsPopup button.qx-reset-demo-btn, #qxAnalyticsModal button.qx-reset-demo-btn { flex: 1; background: linear-gradient(135deg, #475569, #334155); color: #f8fafc; }
    #settingsPopup button.qx-tool-btn { flex: 1; background: rgba(0, 217, 255, 0.15); border: 1px solid rgba(0, 217, 255, 0.45); color: #38bdf8; }
    #settingsPopup button.qx-tx-btn { flex: 1; background: rgba(16, 185, 129, 0.16); border: 1px solid rgba(16, 185, 129, 0.48); color: #34d399; }
    #settingsPopup button.close-btn, #qxTxModal button.close-btn, #qxAnalyticsModal button.close-btn { background: linear-gradient(135deg, #ff3366, #ff5757); color: white; }
    #settingsPopup button:disabled { background: #6c757d; cursor: not-allowed; opacity: 0.6; }
    #licenseSection, #demoBalanceSection, .qx-sub-card {
      margin-top: 8px; padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.3s ease;
    }
    #licenseSection.hide { opacity: 0; max-height: 0; padding: 0; margin: 0; overflow: hidden; border: none; }
    #demoBalanceSection { opacity: 0; max-height: 0; overflow: hidden; padding: 0; margin: 0; border: none; }
    #demoBalanceSection.show { opacity: 1; max-height: 550px; padding: 10px; margin-top: 8px; border: 1px solid rgba(255, 255, 255, 0.1); }
    .qx-tx-list { max-height: 150px; overflow-y: auto; text-align: left; margin-bottom: 8px; display: flex; flex-direction: column; gap: 6px; }
    .qx-tx-item {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 7px 9px; font-size: 11px;
    }
    .qx-tx-del { width: 24px !important; height: 24px !important; padding: 0 !important; margin: 0 !important; background: rgba(255,51,102,0.25) !important; color: #ff6b8b !important; border-radius: 6px !important; font-size: 12px !important; }
    .qx-stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0; text-align: left; }
    .qx-stat-box { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px; }
    .qx-stat-label { font-size: 10px; color: rgba(255,255,255,0.65); }
    .qx-stat-val { font-size: 14px; font-weight: 700; color: #fff; margin-top: 2px; }
    .message-popup {
      position: fixed; top: 80px; right: 20px; padding: 12px 18px; color: white; border-radius: 10px; font-size: 13px; font-weight: 600;
      opacity: 0; transform: translateY(-20px); transition: opacity 0.4s ease, transform 0.4s ease; z-index: 10006;
      background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(0, 255, 163, 0.5);
    }
    .message-popup.show { opacity: 1; transform: translateY(0); }
    #centeredDeveloperMessage {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.92); color: white;
      padding: 20px 32px; border-radius: 14px; font-size: 16px; font-weight: bold; z-index: 10004; opacity: 0;
      transition: opacity 0.4s ease; border: 2px solid rgba(248, 0, 255, 0.5);
    }
    .qx-reset-link { display: inline-block; margin-top: 6px; font-size: 10px; color: rgba(255, 255, 255, 0.65); cursor: pointer; text-decoration: underline; }
    .verified-badge { background: rgba(0, 255, 163, 0.2); color: #00ffa3; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 600; margin-top: 6px; display: inline-block; }
    .unverified-badge { background: rgba(255, 51, 102, 0.2); color: #ff3366; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 600; margin-top: 8px; display: inline-block; }
    .qx-refresh-icon-btn {
      position: absolute; top: 24px; right: 8px; cursor: pointer; width: 22px; height: 22px; display: flex; align-items: center;
      justify-content: center; border-radius: 50%; background: rgba(248, 0, 255, 0.2); border: 1px solid rgba(248, 0, 255, 0.4);
    }
    .qx-refresh-icon-btn svg { width: 12px; height: 12px; fill: #f900ff; }
    @keyframes qxSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spinning { animation: qxSpin 0.6s linear; }
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
    setTimeout(() => { el.style.opacity = "1"; }, 10);
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
      setTimeout(() => demo.classList.add("show"), 250);
    }
  }

  function readElementReactBalance(el) {
    if (!el) return null;
    try {
      const keys = Object.keys(el);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (!k.startsWith("__reactProps$") && !k.startsWith("__reactFiber$")) continue;
        const obj = el[k];
        const props = k.startsWith("__reactFiber$") ? obj && obj.memoizedProps : obj;
        if (props) {
          if (typeof props.children === "string" && props.children.includes("$")) {
            const n = parseFloat(props.children.replace(/[^\d.-]/g, ""));
            if (Number.isFinite(n)) return n;
          }
          for (const pk of ["balance", "amount", "demoBalance", "liveBalance"]) {
            if (typeof props[pk] === "number" && Number.isFinite(props[pk])) return props[pk];
            if (typeof props[pk] === "string") {
              const n = parseFloat(props[pk].replace(/[^\d.-]/g, ""));
              if (Number.isFinite(n)) return n;
            }
          }
        }
      }
    } catch (e) {}
    return null;
  }

  function findLiveHeaderBalance() {
    const shadow = getUsermenuShadowRoot();
    if (shadow) {
      const el = shadow.querySelector(".text .balance, .balance, [class*='balance']");
      if (el) {
        const rawStr = el.dataset && el.dataset.qxOrigBalance ? el.dataset.qxOrigBalance : (el.textContent || "");
        const num = parseFloat(rawStr.replace(/[^\d.-]/g, ""));
        if (Number.isFinite(num)) return num;
      }
    }
    const trigger = document.querySelector("qx-usermenu-trigger");
    if (trigger) {
      for (const attrName of ["balance", "amount", "data-balance"]) {
        const attrVal = trigger.getAttribute(attrName);
        if (attrVal !== null && attrVal.trim() !== "") {
          const n = parseFloat(attrVal.replace(/[^\d.-]/g, ""));
          if (Number.isFinite(n)) return n;
        }
      }
      const rBal = readElementReactBalance(trigger) ?? readElementReactBalance(trigger.parentElement);
      if (rBal !== null && Number.isFinite(rBal)) return rBal;
    }
    const headerCandidates = document.querySelectorAll(".zt1hG, .RyAkb .uoy2n, .uoy2n, .QE4Zb, header [class*='balance']");
    for (const c of headerCandidates) {
      if (c.closest(".qx-live-trigger-proxy, .grOBD, [data-qx-account], #settingsPopup, #qxAnalyticsModal, #qxTxModal")) continue;
      const txt = (c.textContent || "").trim();
      if (!txt.includes("$") || /daily limit|deposit/i.test(txt)) continue;
      const num = parseFloat(txt.replace(/[^\d.-]/g, ""));
      if (Number.isFinite(num)) return num;
    }
    const preferDemo = sessionStorage.getItem("qxSessionIsDemo") === "1" || isDemoAccount();
    const row = preferDemo
      ? (document.querySelector("[data-qx-account='demo']") || document.querySelector(".grOBD li:nth-child(2)"))
      : document.querySelector(".grOBD li.Qx5RW, .grOBD a.active");
    const rowBalEl = row && row.querySelector("b.YnoT0, b");
    if (rowBalEl) {
      const rBal = readElementReactBalance(rowBalEl);
      if (rBal !== null && Number.isFinite(rBal)) return rBal;
      if (!rowBalEl.dataset.qxOrigDemoText && !rowBalEl.dataset.qxOrigBalance) {
        const num = parseFloat((rowBalEl.textContent || "").replace(/[^\d.-]/g, ""));
        if (Number.isFinite(num)) return num;
      }
    }
    return null;
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
      document.querySelectorAll(".grOBD b.YnoT0, b.YnoT0, [data-qx-orig-balance]").forEach((el) => {
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

  function getStartingCapitalAndProfit(curBal) {
    const rawCap = (localStorage.getItem("qxCustomStartingCapital") || "").trim();
    let startCap = rawCap !== "" ? parseFloat(rawCap) : NaN;
    if (!Number.isFinite(startCap) || (startCap === 0 && curBal !== null && curBal > 0 && localStorage.getItem("qxUserSetZeroCap_v2") !== "1")) {
      if (curBal !== null && Number.isFinite(curBal)) {
        startCap = curBal;
        try { localStorage.setItem("qxCustomStartingCapital", String(curBal)); } catch (e) {}
      } else {
        startCap = 0;
      }
    }
    const rawOffset = (localStorage.getItem("qxLeaderboardProfitOffset") || "").trim();
    const offset = rawOffset !== "" && Number.isFinite(parseFloat(rawOffset)) ? parseFloat(rawOffset) : 0;
    const netProfit = curBal !== null && Number.isFinite(curBal) ? (curBal - startCap) + offset : offset;
    return { startCap, offset, netProfit };
  }

  function applyLiveAccountVisuals(opts) {
    if (!isActivated || serverPayloadLoaded) return;

    const lbName = (opts && opts.name) || localStorage.getItem("leaderboardName") || "";
    const countryFlag = (opts && opts.flag) || localStorage.getItem("countryFlag") || "bd";
    const avatarUrl = (opts && opts.avatar !== undefined ? opts.avatar : localStorage.getItem("profilePhotoUrl")) || "";
    const customLiveBal = getActiveCustomLiveBalance();
    const customDemoBal = getActiveCustomDemoBalance();
    const detectedBal = findLiveHeaderBalance();
    const { netProfit } = getStartingCapitalAndProfit(detectedBal);

    try {
      const shadow = getUsermenuShadowRoot();
      if (shadow) {
        const nameEl = shadow.querySelector(".name");
        if (nameEl) {
          nameEl.classList.remove("demo");
          nameEl.classList.add("live");
          if (/demo/i.test(nameEl.textContent || "")) nameEl.textContent = "LIVE";
          nameEl.style.color = "#0faf59";
        }
        const balEl = shadow.querySelector(".balance, .text .balance");
        if (balEl && Number.isFinite(customLiveBal)) {
          const target = formatUsd(customLiveBal);
          if (balEl.textContent !== target) {
            if (!balEl.dataset.qxOrigBalance || balEl.textContent !== balEl.dataset.qxLastForced) {
              balEl.dataset.qxOrigBalance = balEl.textContent || "";
            }
            balEl.dataset.qxLastForced = target;
            balEl.textContent = target;
          }
        }
        shadow.querySelectorAll("svg, .icon").forEach((ic) => {
          if (ic.classList && ic.classList.contains("demo")) ic.style.color = "#0faf59";
        });
      }
    } catch (e) {}

    try {
      document.querySelectorAll('.grOBD b.YnoT0, b.YnoT0, ul[class*="account"] b, li[class*="RDtBn"] b').forEach((el) => {
        const rowContainer = el.closest("li, [role='menuitem'], div, a");
        const parentText = (rowContainer?.textContent || "").toLowerCase();
        const isDemoRow =
          parentText.includes("demo account") ||
          (parentText.includes("demo") && !parentText.includes("live account")) ||
          Boolean(rowContainer?.querySelector('a[href*="demo"], input[value="demo"]')) ||
          el.closest('[data-qx-account="demo"]') !== null;

        if (isDemoRow) {
          if (Number.isFinite(customDemoBal)) {
            const formatted = formatUsd(customDemoBal);
            if (el.textContent !== formatted) {
              if (!el.dataset.qxOrigBalance || el.textContent !== el.dataset.qxLastForced) {
                el.dataset.qxOrigBalance = el.textContent || "";
              }
              el.dataset.qxLastForced = formatted;
              el.textContent = formatted;
            }
          } else if (el.dataset && el.dataset.qxOrigBalance) {
            if (el.textContent === el.dataset.qxLastForced) {
              el.textContent = el.dataset.qxOrigBalance;
            }
            delete el.dataset.qxOrigBalance;
            delete el.dataset.qxLastForced;
          }
        } else if (parentText.includes("live")) {
          const targetLive = Number.isFinite(customLiveBal) ? customLiveBal : detectedBal;
          if (targetLive !== null && Number.isFinite(targetLive)) {
            const formatted = formatUsd(targetLive);
            if (el.textContent !== formatted) {
              if (!el.dataset.qxOrigBalance || el.textContent !== el.dataset.qxLastForced) {
                el.dataset.qxOrigBalance = el.textContent || "";
              }
              el.dataset.qxLastForced = formatted;
              el.textContent = formatted;
            }
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
        const moneyNode = row.querySelector("[class*='money'], [class*='profit'], [class*='balance']");
        if (moneyNode && Number.isFinite(netProfit)) {
          const formatted = formatSignedUsd(netProfit);
          if (moneyNode.textContent !== formatted) moneyNode.textContent = formatted;
          moneyNode.style.color = netProfit >= 0 ? "#0faf59" : "#ef4444";
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
    let isApplyingVisuals = false;
    let lastFallbackRun = 0;
    const IGNORED_FALLBACK_SEL = "#settingsPopup, #qxTxModal, #qxAnalyticsModal, #qxNativeAlertModal, .swal2-container, .message-popup, #centeredDeveloperMessage";
    const scheduleApply = (mutations) => {
      if (scheduled || serverPayloadLoaded || isApplyingVisuals || document.hidden) return;
      if (Array.isArray(mutations)) {
        let relevant = false;
        for (let i = 0; i < mutations.length; i++) {
          const t = mutations[i].target;
          const el = t && t.nodeType === 1 ? t : t && t.parentElement;
          if (!el || !el.closest || !el.closest(IGNORED_FALLBACK_SEL)) {
            relevant = true;
            break;
          }
        }
        if (!relevant) return;
      }
      scheduled = true;
      const elapsed = performance.now() - lastFallbackRun;
      const delay = elapsed >= 280 ? 0 : (280 - elapsed);
      setTimeout(() => {
        requestAnimationFrame(() => {
          scheduled = false;
          if (isApplyingVisuals || serverPayloadLoaded) return;
          isApplyingVisuals = true;
          lastFallbackRun = performance.now();
          try {
            applyLiveAccountVisuals({
              name: localStorage.getItem("leaderboardName") || "",
              balance: localStorage.getItem("leaderboardBalance") || "",
              flag: localStorage.getItem("countryFlag") || "bd",
              avatar: localStorage.getItem("profilePhotoUrl") || ""
            });
            liveEngineObserver?.takeRecords();
          } finally {
            isApplyingVisuals = false;
          }
        });
      }, delay);
    };

    if (document.body) {
      liveEngineObserver = new MutationObserver(scheduleApply);
      liveEngineObserver.observe(document.body, { childList: true, subtree: true });
    }
    setInterval(() => scheduleApply(null), 1500);
  }

  function openAnalyticsModal() {
    document.getElementById("qxAnalyticsModal")?.remove();
    const curBal = findLiveHeaderBalance();
    const { startCap, netProfit } = getStartingCapitalAndProfit(curBal);
    const txns = loadTransactions();
    const totalDep = txns.filter((t) => t.type === "Deposit").reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    const totalPay = txns.filter((t) => t.type === "Payout").reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);

    const modal = document.createElement("div");
    modal.id = "qxAnalyticsModal";
    modal.innerHTML = `
      <h2>Trading Analytics &amp; Capital</h2>
      <div class="qx-stat-grid">
        <div class="qx-stat-box">
          <div class="qx-stat-label">Current Balance</div>
          <div class="qx-stat-val">${curBal !== null ? formatUsd(curBal) : "$0.00"}</div>
        </div>
        <div class="qx-stat-box">
          <div class="qx-stat-label">Starting Capital</div>
          <div class="qx-stat-val" id="qxAnalyticsCapVal">${formatUsd(startCap)}</div>
        </div>
        <div class="qx-stat-box">
          <div class="qx-stat-label">Leaderboard Profit / Loss</div>
          <div class="qx-stat-val" id="qxAnalyticsProfitVal" style="color:${netProfit >= 0 ? "#00ffa3" : "#ff5757"}">${netProfit >= 0 ? "+" : "-"}${formatUsd(Math.abs(netProfit))}</div>
        </div>
        <div class="qx-stat-box">
          <div class="qx-stat-label">Fake Dep / Payout</div>
          <div class="qx-stat-val" style="font-size:12px;">+${formatUsd(totalDep)} / -${formatUsd(totalPay)}</div>
        </div>
      </div>
      <div class="qx-btn-row">
        <button id="qxResetCapNowBtn" type="button" class="qx-reset-demo-btn">Reset Starting Capital</button>
      </div>
      <button type="button" class="close-btn">Back</button>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add("show"), 10);
    modal.querySelector("#qxResetCapNowBtn")?.addEventListener("click", () => {
      const b = findLiveHeaderBalance();
      if (b !== null) {
        localStorage.setItem("qxCustomStartingCapital", String(b));
        localStorage.removeItem("qxUserSetZeroCap");
        localStorage.removeItem("qxUserSetZeroCap_v2");
        localStorage.setItem("qxLeaderboardProfitOffset", "");
        localStorage.removeItem("leaderboardBalance");
        pageWinMain.qxCustomStartingCapital = String(b);
        const startInp = document.getElementById("startCapInput");
        if (startInp) startInp.value = String(b);
        const inp = document.getElementById("iblafp");
        if (inp) inp.value = "";
        syncUnifiedConfig({ startingCapital: String(b), profitOffset: "" });
        const capEl = modal.querySelector("#qxAnalyticsCapVal");
        if (capEl) capEl.textContent = formatUsd(b);
        const profEl = modal.querySelector("#qxAnalyticsProfitVal");
        if (profEl) {
          profEl.textContent = "+$0.00";
          profEl.style.color = "#00ffa3";
        }
        emitPanelEvent("qx:settings-updated");
        showToast("Starting capital reset to " + formatUsd(b) + " (P/L = $0.00)");
      } else {
        showToast("Could not detect current balance");
      }
    });
    modal.querySelector(".close-btn")?.addEventListener("click", () => modal.remove());
  }

  function openTransactionsModal() {
    document.getElementById("qxTxModal")?.remove();
    const modal = document.createElement("div");
    modal.id = "qxTxModal";

    const renderList = () => {
      const listEl = modal.querySelector("#qxTxListBox");
      if (!listEl) return;
      const list = loadTransactions();
      if (list.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;padding:12px;font-size:11px;color:rgba(255,255,255,0.55);">No fake transactions added yet.</div>';
        return;
      }
      listEl.innerHTML = "";
      list.forEach((tx, idx) => {
        const row = document.createElement("div");
        row.className = "qx-tx-item";
        const isDep = tx.type === "Deposit";
        const displayDate = tx.dateTime || tx.date || "";
        row.innerHTML = `
          <div>
            <div style="font-weight:700;color:${isDep ? "#00ffa3" : "#ff6b8b"}">${isDep ? "+" : "-"}${formatUsd(tx.amount)} · ${tx.type}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.65);">${tx.method} · ${displayDate}</div>
          </div>
          <button type="button" class="qx-tx-del" data-idx="${idx}" title="Delete">✕</button>
        `;
        row.querySelector(".qx-tx-del")?.addEventListener("click", () => {
          const cur = loadTransactions();
          cur.splice(idx, 1);
          saveTransactions(cur);
          renderList();
          showToast("Transaction removed");
        });
        listEl.appendChild(row);
      });
    };

    const methodOptions = PAYMENT_METHODS.map((m) => `<option value="${m}">${m}</option>`).join("");
    modal.innerHTML = `
      <h2>Fake Deposit &amp; Payout History</h2>
      <div id="qxTxListBox" class="qx-tx-list"></div>
      <div class="qx-sub-card">
        <h3>Add New Transaction</h3>
        <label>Transaction Type:
          <select id="qxTxType">
            <option value="Deposit">Deposit</option>
            <option value="Payout">Payout</option>
          </select>
        </label>
        <label>Amount ($):
          <input type="number" id="qxTxAmount" placeholder="500.00" step="0.01" value="500">
        </label>
        <label>Payment Method:
          <select id="qxTxMethod">${methodOptions}</select>
        </label>
        <label>Date &amp; Time:
          <input type="text" id="qxTxDate" value="${formatNowString()}">
        </label>
        <button id="qxAddTxBtn" type="button">+ Add Transaction</button>
      </div>
      <button type="button" class="close-btn">Back</button>
    `;
    document.body.appendChild(modal);
    renderList();
    setTimeout(() => modal.classList.add("show"), 10);

    modal.querySelector("#qxAddTxBtn")?.addEventListener("click", () => {
      const type = modal.querySelector("#qxTxType").value;
      const amt = parseFloat(modal.querySelector("#qxTxAmount").value);
      const method = modal.querySelector("#qxTxMethod").value;
      const dateTime = (modal.querySelector("#qxTxDate").value || "").trim() || formatNowString();
      if (!Number.isFinite(amt) || amt <= 0) {
        showToast("Enter a valid positive amount");
        return;
      }
      const id = String(Math.floor(10000000 + Math.random() * 89999999));
      const cur = loadTransactions();
      cur.unshift({ id, type, amount: amt, method, date: dateTime, dateTime, status: "Successed" });
      saveTransactions(cur);
      modal.querySelector("#qxTxDate").value = formatNowString();
      renderList();
      showToast(type + " transaction added!");
    });
    modal.querySelector(".close-btn")?.addEventListener("click", () => modal.remove());
  }

  function saveDemoBalance() {
    const val = (document.getElementById("demoBalanceInput")?.value || "").trim();
    const num = Number(val);
    if (!val || !Number.isFinite(num) || num < 0) {
      showToast("Please enter a valid balance amount");
      return;
    }
    demoBalanceValue = num;
    localStorage.removeItem("demoBalanceReset");
    localStorage.setItem("demoBalance", String(demoBalanceValue));
    syncUnifiedConfig({ spoofDemoBalance: String(demoBalanceValue) });
    const statusEl = document.getElementById("demoBalanceStatus");
    if (statusEl) {
      statusEl.textContent = "Demo balance updated! (Live stays natural)";
      statusEl.style.color = "#00ffa3";
      setTimeout(() => { statusEl.textContent = ""; }, 2500);
    }
    emitPanelEvent("qx:demo-balance-updated", { demoBalance: demoBalanceValue });
    if (!serverPayloadLoaded) applyLiveAccountVisuals({});
    showToast("Demo balance set to " + formatUsd(demoBalanceValue));
  }

  function resetDemoBalance() {
    demoBalanceValue = null;
    localStorage.removeItem("demoBalance");
    localStorage.setItem("demoBalanceReset", "1");
    syncUnifiedConfig({ spoofDemoBalance: null });
    const input = document.getElementById("demoBalanceInput");
    if (input) input.value = "";
    restoreOriginalBalanceElements();
    const statusEl = document.getElementById("demoBalanceStatus");
    if (statusEl) {
      statusEl.textContent = "Demo balance reset! Quotex default active.";
      statusEl.style.color = "#38bdf8";
      setTimeout(() => { statusEl.textContent = ""; }, 3000);
    }
    emitPanelEvent("qx:demo-balance-reset");
    if (!serverPayloadLoaded) applyLiveAccountVisuals({});
    showToast("Demo balance reset to Quotex default!");
  }

  function closeSettingsPopup() {
    document.getElementById("qxTxModal")?.remove();
    document.getElementById("qxAnalyticsModal")?.remove();
    const popup = document.getElementById("settingsPopup");
    if (popup) {
      popup.classList.add("hide");
      popup.classList.remove("show");
      setTimeout(() => {
        popup.parentElement?.id === "" ? popup.parentElement.remove() : popup.remove();
      }, 300);
    }
  }

  async function handleVerifyLicenseInput() {
    const key = (document.getElementById("licenseInput").value || "").trim();
    if (!key) {
      const statusBox = document.getElementById("verificationStatus");
      if (statusBox) statusBox.innerHTML = '<div class="unverified-badge">✗ Invalid License</div>';
      showLicenseRequiredAlert();
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
      const loadedRemote = serverPayloadLoaded || (await tryRunRemoteBootstrap(key, auth.deviceId, res.device_token || getStoredAuth().token));
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
      } else if (["banned", "inactive", "suspended"].includes(res.reason)) {
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
          statusBox.innerHTML = '<div class="unverified-badge">✗ Network Blocked</div>';
        }
      } else if (res.reason === "invalid_request") {
        statusBox.innerHTML = '<div class="unverified-badge">✗ Request Error</div>';
        showToast(res.message || "Invalid license request payload");
      } else {
        showLicenseRequiredAlert();
        statusBox.innerHTML = '<div class="unverified-badge">✗ Invalid License</div>';
      }
      if (res.reason !== "network" || !res.keepLicense) saveBtn.disabled = true;
    }

    btn.disabled = false;
    btn.textContent = "Verify License";
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
      if (check.reason === "network" && auth.token) {
        // Allow saving with existing verified device token if network flickered temporarily
      } else if (check.reason === "limit") {
        showDeviceMismatchAlert(check.allowed, check.used);
        return;
      } else if (["banned", "inactive", "suspended"].includes(check.reason)) {
        showLicenseExpiredAlert();
        return;
      } else if (check.reason === "expired") {
        showLicenseTimeExpiredAlert();
        return;
      } else {
        showLicenseRequiredAlert();
        return;
      }
    }

    const lbName = (document.getElementById("lname").value || "").trim();
    let startCap = (document.getElementById("startCapInput")?.value || "").trim();
    const profitOffset = (document.getElementById("iblafp").value || "").trim();
    const flag = document.getElementById("countryFlagSelect").value || "bd";
    const photo = (document.getElementById("profilePhotoUrl").value || "").trim();
    const rawDemoVal = (document.getElementById("demoBalanceInput")?.value || "").trim();

    if (rawDemoVal !== "" && Number.isFinite(parseFloat(rawDemoVal)) && parseFloat(rawDemoVal) >= 0) {
      demoBalanceValue = parseFloat(rawDemoVal);
      localStorage.removeItem("demoBalanceReset");
      localStorage.setItem("demoBalance", String(demoBalanceValue));
    } else if (rawDemoVal === "") {
      demoBalanceValue = null;
      localStorage.removeItem("demoBalance");
      localStorage.setItem("demoBalanceReset", "1");
      restoreOriginalBalanceElements();
    }

    if (startCap === "") {
      const autoBal = findLiveHeaderBalance();
      if (autoBal !== null && Number.isFinite(autoBal)) startCap = String(autoBal);
      localStorage.removeItem("qxUserSetZeroCap_v2");
      localStorage.removeItem("qxUserSetZeroCap");
    } else if (parseFloat(startCap) === 0) {
      localStorage.setItem("qxUserSetZeroCap_v2", "1");
    } else {
      localStorage.removeItem("qxUserSetZeroCap_v2");
      localStorage.removeItem("qxUserSetZeroCap");
    }

    localStorage.setItem("leaderboardName", lbName);
    localStorage.setItem("qxCustomStartingCapital", startCap);
    localStorage.setItem("qxLeaderboardProfitOffset", profitOffset);
    localStorage.removeItem("leaderboardBalance");
    localStorage.setItem("countryFlag", flag);
    localStorage.setItem("profilePhotoUrl", photo);
    localStorage.setItem("lastLeaderboardName", lbName);
    localStorage.setItem("lastCountryFlag", flag);

    pageWinMain.qxCustomName = lbName || undefined;
    pageWinMain.qxCustomStartingCapital = startCap;
    pageWinMain.qxCustomCountry = flag;
    pageWinMain.qxCustomAvatar = photo;

    const activeDemoNum = getActiveCustomDemoBalance();
    syncUnifiedConfig({
      customName: lbName,
      startingCapital: startCap || null,
      profitOffset: profitOffset,
      countryFlag: flag,
      customAvatar: photo,
      spoofDemoBalance: Number.isFinite(activeDemoNum) ? String(activeDemoNum) : null
    });

    const loadedRemote = serverPayloadLoaded || (await tryRunRemoteBootstrap(activeKey, auth.deviceId, check.device_token || auth.token));
    if (!loadedRemote) {
      startDemoToLiveEngine({
        name: lbName,
        flag: flag,
        avatar: photo
      });
    }

    emitPanelEvent("qx:settings-updated", {
      name: lbName,
      startingCapital: startCap,
      profitOffset: profitOffset,
      flag: flag,
      photo: photo,
      demoBalance: Number.isFinite(activeDemoNum) ? activeDemoNum : null,
      demoBalanceReset: localStorage.getItem("demoBalanceReset") === "1"
    });

    closeSettingsPopup();
    showToast(loadedRemote ? "Server code active & settings saved!" : "Settings saved!");
    showCenteredDeveloperBanner("Developer @tradereyasin7 !", 3000);
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

    document.getElementById("settingsPopup")?.remove();

    const auth = getStoredAuth();
    const savedKey = auth.key;
    isActivated = !!(savedKey && auth.token);
    demoBalanceValue = (() => {
      if (localStorage.getItem("demoBalanceReset") === "1") return null;
      const raw = localStorage.getItem("demoBalance");
      const parsed = raw !== null && raw !== "" ? parseFloat(raw) : NaN;
      return Number.isFinite(parsed) ? parsed : null;
    })();

    const initialBadgeHtml = savedKey
      ? '<div class="verified-badge" style="background:rgba(56,189,248,0.2);color:#38bdf8;">Checking license...</div>'
      : '<div class="unverified-badge">✗ Not Verified</div>';

    const refreshSvg = `<svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></svg>`;

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
          <label>Starting Capital ($):
            <input type="number" id="startCapInput" step="0.01" placeholder="Initial balance (auto-captured)">
          </label>
          <span id="refreshStartCapBtn" class="qx-refresh-icon-btn" title="Set Current Balance as Starting Capital">${refreshSvg}</span>
        </div>

        <div style="position: relative;">
          <label>Profit / Loss Offset ($):
            <input type="number" id="iblafp" step="0.01" placeholder="Optional + / - adjustment (blank = pure P/L)">
          </label>
          <span id="refreshBalanceBtn" class="qx-refresh-icon-btn" title="Clear Offset & Recalculate Live P/L">${refreshSvg}</span>
          <small id="qxLivePlPreview" style="font-size:10px;color:#00ffa3;margin-top:2px;">P/L = Current Balance - Starting Capital</small>
        </div>

        <label>Profile Photo Link:
          <input type="text" id="profilePhotoUrl" placeholder="Enter Profile Photo Link (blank = clean avatar)">
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
          <button id="verifyBtn" type="button">Verify License</button>
          <div id="verificationStatus">${initialBadgeHtml}</div>
        </div>

        <div id="demoBalanceSection" class="${isActivated ? "show" : ""}">
          <h3>Demo Balance &amp; Tools</h3>
          <input type="number" id="demoBalanceInput" step="0.01" placeholder="Enter demo balance (empty = Quotex default)" value="${demoBalanceValue !== null ? demoBalanceValue : ""}">
          <div class="qx-btn-row">
            <button id="setDemoBtn" type="button">Update Demo Balance</button>
            <button id="resetDemoBtn" type="button" class="qx-reset-demo-btn">Reset</button>
          </div>
          <div class="qx-btn-row">
            <button id="openAnalyticsBtn" type="button" class="qx-tool-btn">Analytics</button>
            <button id="openTxBtn" type="button" class="qx-tx-btn">$ Fake Txns</button>
          </div>
          <div id="demoBalanceStatus" style="margin-top: 6px; font-size: 11px;"></div>
          <span id="resetLicenseBtn" class="qx-reset-link">Change License Key</span>
        </div>

        <button id="saveButton" type="button" ${isActivated ? "" : "disabled"}>Save Settings</button>
        <button type="button" class="close-btn">Close</button>
      </div>
    `;
    document.body.appendChild(wrapper);
    settingsPopupContainer = document.getElementById("settingsPopup");

    const curBalInit = findLiveHeaderBalance();
    let initialStartCap = (localStorage.getItem("qxCustomStartingCapital") || "").trim();
    if ((!initialStartCap || (initialStartCap === "0" && localStorage.getItem("qxUserSetZeroCap_v2") !== "1")) && curBalInit !== null) {
      initialStartCap = String(curBalInit);
      try { localStorage.setItem("qxCustomStartingCapital", initialStartCap); } catch (e) {}
    }

    document.getElementById("lname").value = localStorage.getItem("leaderboardName") || "";
    document.getElementById("startCapInput").value = initialStartCap;
    document.getElementById("iblafp").value = localStorage.getItem("qxLeaderboardProfitOffset") || "";
    document.getElementById("profilePhotoUrl").value = localStorage.getItem("profilePhotoUrl") || "";
    document.getElementById("countryFlagSelect").value = localStorage.getItem("countryFlag") || "bd";

    const updatePlPreview = () => {
      const previewEl = document.getElementById("qxLivePlPreview");
      if (!previewEl) return;
      const cur = findLiveHeaderBalance();
      const capRaw = (document.getElementById("startCapInput")?.value || "").trim();
      const offRaw = (document.getElementById("iblafp")?.value || "").trim();
      const cap = capRaw !== "" && Number.isFinite(parseFloat(capRaw)) ? parseFloat(capRaw) : (cur !== null ? cur : 0);
      const off = offRaw !== "" && Number.isFinite(parseFloat(offRaw)) ? parseFloat(offRaw) : 0;
      if (cur === null) {
        previewEl.textContent = "P/L = Current Balance - Starting Capital";
        previewEl.style.color = "#00ffa3";
        return;
      }
      const pl = (cur - cap) + off;
      const signStr = pl > 0 ? "+" + formatUsd(pl) : pl < 0 ? "-" + formatUsd(Math.abs(pl)) : "$0.00";
      previewEl.textContent = `Live P/L: ${signStr} (${formatUsd(cur)} - ${formatUsd(cap)}${off !== 0 ? (off > 0 ? " + " + formatUsd(off) : " - " + formatUsd(Math.abs(off))) : ""})`;
      previewEl.style.color = pl < 0 ? "#ff6b8b" : "#00ffa3";
    };
    updatePlPreview();
    document.getElementById("startCapInput")?.addEventListener("input", updatePlPreview);
    document.getElementById("iblafp")?.addEventListener("input", updatePlPreview);

    const flagSelectEl = document.getElementById("countryFlagSelect");
    flagSelectEl?.addEventListener("change", () => {
      const nextFlag = flagSelectEl.value || "bd";
      localStorage.setItem("countryFlag", nextFlag);
      localStorage.setItem("lastCountryFlag", nextFlag);
      pageWinMain.qxCustomCountry = nextFlag;
      syncUnifiedConfig({ countryFlag: nextFlag });
      emitPanelEvent("qx:settings-updated", { flag: nextFlag });
    });

    const refreshStartCapBtn = document.getElementById("refreshStartCapBtn");
    refreshStartCapBtn?.addEventListener("click", () => {
      if (refreshStartCapBtn.classList.contains("spinning")) return;
      refreshStartCapBtn.classList.add("spinning");
      const bal = findLiveHeaderBalance();
      if (bal === null) {
        showToast("Error: Could not find balance element.");
      } else {
        document.getElementById("startCapInput").value = String(bal);
        updatePlPreview();
        showToast("Starting capital set to " + formatUsd(bal));
      }
      setTimeout(() => refreshStartCapBtn.classList.remove("spinning"), 550);
    });

    const refreshBtn = document.getElementById("refreshBalanceBtn");
    refreshBtn?.addEventListener("click", () => {
      if (refreshBtn.classList.contains("spinning")) return;
      refreshBtn.classList.add("spinning");
      document.getElementById("iblafp").value = "";
      localStorage.removeItem("leaderboardBalance");
      localStorage.setItem("qxLeaderboardProfitOffset", "");
      updatePlPreview();
      const bal = findLiveHeaderBalance();
      if (bal !== null) {
        const { netProfit } = getStartingCapitalAndProfit(bal);
        showToast("Auto P/L active: " + (netProfit >= 0 ? "+" : "-") + formatUsd(Math.abs(netProfit)));
      } else {
        showToast("Offset cleared — auto P/L active!");
      }
      setTimeout(() => refreshBtn.classList.remove("spinning"), 550);
    });

    document.getElementById("verifyBtn")?.addEventListener("click", handleVerifyLicenseInput);
    document.getElementById("setDemoBtn")?.addEventListener("click", saveDemoBalance);
    document.getElementById("resetDemoBtn")?.addEventListener("click", resetDemoBalance);
    document.getElementById("openAnalyticsBtn")?.addEventListener("click", openAnalyticsModal);
    document.getElementById("openTxBtn")?.addEventListener("click", openTransactionsModal);
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

    setTimeout(() => { if (settingsPopupContainer) settingsPopupContainer.classList.add("show"); }, 10);

    if (savedKey) {
      checkStoredActivation().then(async (status) => {
        isActivated = !!status.valid;
        const statusBox = document.getElementById("verificationStatus");
        const saveBtn = document.getElementById("saveButton");
        const licSec = document.getElementById("licenseSection");
        const demoSec = document.getElementById("demoBalanceSection");
        if (isActivated) {
          const latestAuth = getStoredAuth();
          const loadedRemote = serverPayloadLoaded || (await tryRunRemoteBootstrap(latestAuth.key || savedKey, latestAuth.deviceId, status.device_token || latestAuth.token));
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
            } else if (["banned", "inactive", "suspended"].includes(status.reason)) {
              statusBox.innerHTML = `<div class="unverified-badge">✗ License ${status.reason === "suspended" ? "Suspended" : status.reason === "inactive" ? "Inactive" : "Blocked"}</div>`;
              showLicenseExpiredAlert();
            } else if (status.reason === "expired") {
              statusBox.innerHTML = '<div class="unverified-badge">✗ License Expired</div>';
              showLicenseTimeExpiredAlert();
            } else if (status.reason === "maintenance" || status.reason === "rate_limited") {
              statusBox.innerHTML = `<div class="unverified-badge">✗ ${status.reason === "maintenance" ? "Maintenance Mode" : "Rate Limited"}</div>`;
            } else if (status.reason === "network") {
              statusBox.innerHTML = '<div class="unverified-badge">✗ Network / XHR Blocked</div>';
            } else {
              statusBox.innerHTML = '<div class="unverified-badge">✗ Invalid License</div>';
              showLicenseRequiredAlert();
            }
          }
        }
      }).catch(() => {});
    }
  }

  // Trigger Popup when clicking Quotex's DEPOSIT button OR NOTIFICATION BELL OR Alt+X
  function isQuotexDepositClick(rawTarget) {
    if (!rawTarget || typeof rawTarget.closest !== "function") return false;
    const el = rawTarget;
    if (el.closest("#settingsPopup, #qxTxModal, #qxAnalyticsModal, #qxNativeAlertModal, .swal2-container, .message-popup, #centeredDeveloperMessage, .qx-fake-tx-container")) {
      return false;
    }
    if (el.closest("qx-usermenu-trigger, .uoy2n, .QE4Zb")) return false;

    const depositAnchor = el.closest("a[href*='deposit' i], [data-testid*='deposit' i], .header__deposit, [class*='deposit' i]");
    if (depositAnchor && !depositAnchor.closest("form")) {
      const rect = typeof depositAnchor.getBoundingClientRect === "function" ? depositAnchor.getBoundingClientRect() : null;
      if (!rect || (rect.width > 0 && rect.width <= 320 && rect.height <= 90)) {
        return true;
      }
    }

    const clickable = el.closest("button, a, [role='button']");
    if (clickable && !clickable.closest("form")) {
      const txt = (clickable.textContent || "").replace(/\s+/g, " ").trim();
      if (/^(\+\s*)?deposit$/i.test(txt)) {
        return true;
      }
    }
    return false;
  }

  function isQuotexNotificationClick(rawTarget) {
    if (!rawTarget || typeof rawTarget.closest !== "function") return false;
    const el = rawTarget;
    if (el.closest("#settingsPopup, #qxTxModal, #qxAnalyticsModal, #qxNativeAlertModal, .swal2-container, .message-popup, #centeredDeveloperMessage")) return false;
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

  function bindQuotexTriggers() {
    if (pageWinMain.__qxTriggersBound) return;
    pageWinMain.__qxTriggersBound = true;
    document.addEventListener(
      "click",
      (ev) => {
        const isDep = isQuotexDepositClick(ev.target);
        const isNotif = !isDep && isQuotexNotificationClick(ev.target);
        if (!isDep && !isNotif) return;
        try {
          ev.preventDefault();
          ev.stopPropagation();
          if (typeof ev.stopImmediatePropagation === "function") ev.stopImmediatePropagation();
        } catch (e) {}
        if (document.getElementById("settingsPopup")) {
          closeSettingsPopup();
        } else {
          renderSettingsPopup();
        }
      },
      true
    );

    document.addEventListener("keydown", (ev) => {
      if (ev.altKey && (ev.key === "x" || ev.key === "X")) {
        ev.preventDefault();
        if (document.getElementById("settingsPopup")) closeSettingsPopup();
        else renderSettingsPopup();
      }
    });
  }

  pageWinMain.__qxProOpenPopup = renderSettingsPopup;
  bindQuotexTriggers();
  document.getElementById("qxFloatingReopenBtn")?.remove();

  window.addEventListener("message", (ev) => {
    if (ev.source === window && ev.data && ev.data.__qxOpenPopup === true) {
      renderSettingsPopup();
    }
  });

  // Auto-bootstrap silently if license key is already saved; open popup on first launch if no key yet
  const initialAuth = getStoredAuth();
  if (initialAuth.key) {
    checkStoredActivation().then(async (status) => {
      isActivated = !!status.valid;
      if (isActivated) {
        const latestAuth = getStoredAuth();
        const loadedRemote = await tryRunRemoteBootstrap(latestAuth.key || initialAuth.key, latestAuth.deviceId, status.device_token || latestAuth.token);
        if (!loadedRemote) startDemoToLiveEngine();
      } else {
        await renderSettingsPopup();
      }
    }).catch(() => {});
  } else {
    await renderSettingsPopup();
  }

  pageWinMain.__qxProLoaded = true;
})().catch((err) => {
  try { console.error("Quotex Pro Error:", err); } catch (e) {}
});
