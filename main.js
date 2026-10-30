/**
 * 0X Premium Secure Loader, Live Customizer & Instant Zero-Flash DOM Lock (Fixed)
 */

(async function () {
  'use strict';

  // --- 0. TEXT CONTENT SETTER HOOKING (FIXED FOR CASE-INSENSITIVE DEMO) ---
  const originalTextContentSetter = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent').set;

  Object.defineProperty(Node.prototype, 'textContent', {
      set: function(val) {
          if (typeof val === 'string' && /demo/i.test(val)) {
              val = val.replace(/demo/gi, 'LIVE');
          }
          return originalTextContentSetter.call(this, val);
      },
      configurable: true
  });

  // --- 1. NETWORK FETCH & XHR INTERCEPTOR ---
  (function networkDemoBlocker() {
    try {
      const origFetch = window.fetch;
      window.fetch = async function(...args) {
        let [resource, config] = args;
        if (typeof resource === 'string') {
          resource = resource.replace(/demo-trade/g, 'trade').replace(/\/demo/g, '/trade');
        } else if (resource instanceof Request) {
          let url = resource.url.replace(/demo-trade/g, 'trade').replace(/\/demo/g, '/trade');
          resource = new Request(url, resource);
        }
        if (config && config.body && typeof config.body === 'string') {
          config.body = config.body.replace(/"isDemo":\s*(true|false)/g, '"isDemo":false')
                                    .replace(/"demo":\s*(true|false)/g, '"demo":false')
                                    .replace(/"accountType":\s*"[^"]+"/g, '"accountType":"live"')
                                    .replace(/"activeAccountType":\s*"[^"]+"/g, '"activeAccountType":"live"');
        }
        const response = await origFetch.apply(this, [resource, config]);
        const clone = response.clone();
        try {
          const text = await clone.text();
          if (text && (text.includes('demo') || text.includes('DEMO') || text.includes('isDemo') || text.includes('accountType'))) {
            const modified = text.replace(/demo-trade/gi, 'trade')
                                 .replace(/"isDemo":\s*true/gi, '"isDemo":false')
                                 .replace(/"demo":\s*true/gi, '"isDemo":false')
                                 .replace(/"accountType":\s*"demo"/gi, '"accountType":"live"')
                                 .replace(/"activeAccountType":\s*"demo"/gi, '"activeAccountType":"live"')
                                 .replace(/Demo Account/gi, 'Live Account')
                                 .replace(/Demo/gi, 'Live')
                                 .replace(/DEMO/gi, 'LIVE');
            return new Response(modified, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            });
          }
        } catch(e) {}
        return response;
      };

      const origOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url) {
        if (typeof url === 'string') {
          url = url.replace(/demo-trade/g, 'trade').replace(/\/demo/g, '/trade');
        }
        return origOpen.apply(this, [method, url, ...Array.prototype.slice.call(arguments, 2)]);
      };

      const origSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.send = function(body) {
        if (body && typeof body === 'string') {
          body = body.replace(/"isDemo":\s*(true|false)/g, '"isDemo":false')
                     .replace(/"demo":\s*(true|false)/g, '"demo":false')
                     .replace(/"accountType":\s*"[^"]+"/g, '"accountType":"live"')
                     .replace(/"activeAccountType":\s*"[^"]+"/g, '"activeAccountType":"live"');
        }
        return origSend.call(this, body);
      };
    } catch(e) {}
  })();

  // --- 2. EARLY SHADOW ROOT INTERCEPTOR ---
  (function earlyShadowPatch() {
    try {
      if (typeof Element !== 'undefined' && !Element.prototype.__zeroxOrigAttach) {
        Element.prototype.__zeroxOrigAttach = Element.prototype.attachShadow;
        Element.prototype.attachShadow = function(init) {
          const shadow = Element.prototype.__zeroxOrigAttach.call(this, { ...init, mode: 'open' });
          this.__zeroxShadowRoot = shadow;
          return shadow;
        };
      }
    } catch(e) {}
  })();

  // --- 3. CLEANUP PREVIOUS INSTANCES ---
  window.qxLiveObserver?.disconnect();
  clearInterval(window.qxUrlForceInterval);
  clearInterval(window.qxBalanceInterval);
  clearInterval(window.qxProfitLine);
  window.qxProfitLine = null;

  document.getElementById('qx-combined-style')?.remove();
  document.getElementById('qx-profit-line-style')?.remove();
  document.getElementById("shadin-demo")?.remove();
  document.getElementById("shadin-demo-style")?.remove();

  // --- 4. CONFIGURATION & URL/TITLE GUARDS ---
  const cleanUrl = () => {
      if (window.location.href.includes('demo') || window.location.pathname.includes('demo')) {
          const cleanHref = window.location.href
              .replace(/en\/demo-trade/g, 'en/trade')
              .replace(/demo-trade/g, 'trade')
              .replace(/\/demo/g, '/trade');
          window.history.replaceState(window.history.state, '', cleanHref);
      }
  };

  const cleanTitle = () => {
      if (document.title.toLowerCase().includes('demo')) {
          document.title = document.title.replace(/demo/gi, 'Live');
      }
  };

  if(!window.qxHistoryPatched){
      window.qxHistoryPatched = true;
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = function(state, title, url){
          if(url && typeof url === 'string' && (url.includes('demo') || url.includes('demo-trade'))){
              url = url.replace(/en\/demo-trade/g, 'en/trade').replace(/demo-trade/g, 'trade').replace(/\/demo/g, '/trade');
          }
          const res = originalPushState.apply(this, arguments);
          cleanUrl();
          cleanTitle();
          return res;
      };

      history.replaceState = function(state, title, url){
          if(url && typeof url === 'string' && (url.includes('demo') || url.includes('demo-trade'))){
              url = url.replace(/en\/demo-trade/g, 'en/trade').replace(/demo-trade/g, 'trade').replace(/\/demo/g, '/trade');
          }
          const res = originalReplaceState.apply(this, arguments);
          cleanUrl();
          cleanTitle();
          return res;
      };
  }

  cleanUrl();
  cleanTitle();
  window.addEventListener('popstate', () => {
      cleanUrl();
      cleanTitle();
  });

  window.qxUrlForceInterval = setInterval(() => {
      cleanUrl();
      cleanTitle();
      guardLive();
  }, 1);

  // --- 5. CORE HELPER FUNCTIONS ---
  function getBalance(){
    const all = document.querySelectorAll('.zt1hG, header div, header span, .v2KPX');
    for(const el of all){
      const text = el.textContent.trim();
      if(!text.includes('$')) continue;
      const clean = text.replace(/,/g,'').replace('$','').replace(/LIVE/gi,'').replace(/DEMO/gi,'').trim();
      const n = parseFloat(clean);
      if(Number.isFinite(n) && n >= 0 && n < 100000000){
        return n;
      }
    }
    return null;
  }

  function removeBonusBanner() {
      const allDivs = document.querySelectorAll('div, section, aside');
      allDivs.forEach(el => {
          const text = el.textContent || '';
          if(text.includes('50% bonus') || text.includes('bonus on your deposit') || text.includes('Get a 50%')){
              if(el.offsetHeight > 0 && el.offsetHeight < 400){
                  el.style.setProperty('display', 'none', 'important');
              }
          }
      });
  }

  const currentInitBal = getBalance();
  window.qxCustomStartingCapital = currentInitBal !== null ? currentInitBal.toString() : '0';
  if(window.qxCustomName === undefined){
      window.qxCustomName = 'Trader X Team';
  }
  window.qxCustomCountry = 'Bangladesh';

  const countryFlagMap = {
      'Bangladesh': 'bd',
      'India': 'in',
      'United States': 'us',
      'United Kingdom': 'gb',
      'Canada': 'ca',
      'Australia': 'au',
      'United Arab Emirates': 'ae',
      'Saudi Arabia': 'sa',
      'Pakistan': 'pk'
  };

  // --- 6. INJECT STYLES ---
  const style = document.createElement('style');
  style.id = 'qx-combined-style';
  style.textContent = `
      .v2KPX {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 0 !important;
        padding-left: 0 !important;
        margin-left: 0 !important;
        color: #0faf59 !important;
      }
      .qx-level-icon {
        width: 16px !important;
        height: 16px !important;
        min-width: 16px !important;
        max-width: 16px !important;
        min-height: 16px !important;
        max-height: 16px !important;
        display: inline-block !important;
        flex: 0 0 16px !important;
        margin-left: -10px !important;
        margin-right: 8px !important;
        padding: 0 !important;
        vertical-align: middle !important;
      }
      .qx-leaderboard-flag {
        width: 18px !important;
        height: 13px !important;
        object-fit: cover !important;
        border-radius: 2px !important;
        margin-right: 6px !important;
        vertical-align: middle !important;
        display: inline-block !important;
      }
      svg.icon-academic,
      .v2KPX svg:not(.qx-level-icon) {
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
      }
      .usFyP, [class*="watermark"] {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
  `;
  document.head.appendChild(style);

  const profitLineStyle = document.createElement('style');
  profitLineStyle.id = 'qx-profit-line-style';
  profitLineStyle.textContent = `
    .qx-profit-card{ position:relative!important; }
    .qx-profit-line{
      position:absolute!important;
      height:2px!important;
      left:10px!important;
      top:39px!important;
      width:0%;
      background:#0faf59!important;
      z-index:999999!important;
      pointer-events:none!important;
      transition: width .35s ease, background-color .2s ease!important;
    }
  `;
  document.head.appendChild(profitLineStyle);

  // --- 7. LEADERBOARD & PROFIT LOGIC ---
  function findCard(){
    return [...document.querySelectorAll('div')].find(el => {
      const t = (el.innerText || '').trim();
      return (
        t.includes('Trader X Team') &&
        t.includes('Your position:') &&
        /\$?-?[\d,]+(?:\.\d+)?/.test(t) &&
        el.getBoundingClientRect().width > 250 &&
        el.getBoundingClientRect().height > 50 &&
        el.getBoundingClientRect().height < 140
      );
    });
  }

  function updateProfitLine(){
    const card = findCard();
    if(!card) return;
    card.classList.add('qx-profit-card');

    let line = card.querySelector('.qx-profit-line');
    if(!line){
      line = document.createElement('div');
      line.className = 'qx-profit-line';
      card.appendChild(line);
    }

    const currentBalance = getBalance();
    if(currentBalance === null) return;

    const startCap = parseFloat((window.qxCustomStartingCapital || '').replace(/[^0-9.]/g, '')) || 0;
    const profitAmount = currentBalance - startCap;

    if(Math.abs(profitAmount) < 0.000001){
        line.style.width = '0%';
        line.style.background = '#0faf59';
        return;
    }

    if(profitAmount < 0){
        const loss = Math.abs(profitAmount);
        let percent = 30 - (loss / 15000) * 25;
        percent = Math.max(5, Math.min(30, percent));
        line.style.width = percent + '%';
        line.style.background = '#0faf59';
        return;
    }

    const profit = Math.abs(profitAmount);
    let percent = 30 + (profit / 15000) * 50;
    percent = Math.max(30, Math.min(80, percent));
    line.style.width = percent + '%';
    line.style.background = '#0faf59';
  }

  function setLeaderboardPosition(card, positionText){
    let found = false;
    card.querySelectorAll('div,span').forEach(el => {
      if(found) return;
      const value = (el.textContent || '').trim();
      if(value !== '-' && value !== '100+' && !/^\d{1,3}$/.test(value)) return;
      const parent = el.parentElement;
      const grandParent = parent ? parent.parentElement : null;
      const parentText = parent ? (parent.textContent || '') : '';
      const grandText = grandParent ? (grandParent.textContent || '') : '';
      if(parentText.includes('Your position') || grandText.includes('Your position')){
          el.textContent = positionText;
          found = true;
      }
    });

    if(found) return;
    const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while(node = walker.nextNode()){
      const value = (node.textContent || '').trim();
      if(value !== '-' && value !== '100+' && !/^\d{1,3}$/.test(value)) continue;
      const parent = node.parentElement;
      if(!parent) continue;
      const parentText = parent.parentElement ? (parent.parentElement.textContent || '') : '';
      if(parentText.includes('Your position')){
          node.textContent = positionText;
          break;
      }
    }
  }

  function fixLeaderboardPosition(){
    const card = findCard();
    if(!card) return;
    const currentBalance = getBalance();
    if(currentBalance === null) return;
    const startCap = parseFloat((window.qxCustomStartingCapital || '').replace(/[^0-9.]/g, '')) || 0;
    const profitAmount = currentBalance - startCap;

    if(Math.abs(profitAmount) < 0.000001){
        setLeaderboardPosition(card, '-');
        return;
    }
    if(profitAmount < 0){
        setLeaderboardPosition(card, '100+');
        return;
    }

    const myProfit = Math.abs(profitAmount);
    const rows = [];
    const seen = new Set();

    document.querySelectorAll('div,li,tr').forEach(el => {
      if(card.contains(el)) return;
      const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
      if(!text || text.length > 180) return;
      const match = text.match(/^(\d{1,3})\s+.*?\$([\d,]+(?:\.\d+)?)(?:\+)?\s*$/);
      if(!match) return;
      const rank = parseInt(match[1], 10);
      const amount = parseFloat(match[2].replace(/,/g, ''));
      if(!Number.isFinite(rank) || !Number.isFinite(amount) || rank < 1 || rank > 999 || amount <= 0) return;
      const key = rank + '|' + amount;
      if(seen.has(key)) return;
      seen.add(key);
      rows.push({ rank: rank, amount: amount });
    });

    rows.sort((a,b) => a.rank - b.rank);
    let actualRank = null;
    for(const row of rows){
      if(myProfit > row.amount){
          actualRank = row.rank;
          break;
      }
    }

    if(actualRank === null){
      const higherCount = rows.filter(row => row.amount > myProfit).length;
      actualRank = higherCount + 1;
    }

    const positionText = (actualRank >= 1 && actualRank <= 20) ? String(actualRank) : '100+';
    setLeaderboardPosition(card, positionText);
  }

  function fixLeaderboardUI(){
      const currentBalance = getBalance();
      if(currentBalance !== null && (!window.qxCustomStartingCapital || window.qxCustomStartingCapital === '0')){
          window.qxCustomStartingCapital = currentBalance.toString();
      }

      const customName = window.qxCustomName || 'Trader X Team';
      const startCap = parseFloat((window.qxCustomStartingCapital || '').replace(/[^0-9.]/g, '')) || currentBalance || 0;
      const profitAmount = currentBalance !== null ? currentBalance - startCap : 0;
      const absProfit = Math.abs(profitAmount);
      const formattedProfit = '$' + absProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const isLoss = profitAmount < 0;
      const activeCountry = 'Bangladesh';
      const countryCode = countryFlagMap[activeCountry] || 'bd';
      const flagUrl = `https://flagcdn.com/24x18/${countryCode}.png`;

      const divs = document.querySelectorAll('div');
      for(let div of divs){
          if(div.textContent.includes('Your position') && !div.textContent.includes('Leader Board') && div.textContent.length < 300){
              const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT, null, false);
              let node;
              while(node = walker.nextNode()){
                  if(node.textContent.includes('Your position')){
                      node.textContent = 'Your position:';
                  }
              }

              let nameSet = false;
              let textElements = div.querySelectorAll('div, span');
              for(let el of textElements){
                  if(el.children.length === 0){
                      let t = el.textContent.trim();
                      if(t.includes('$') || (t.startsWith('-') && t.includes('.'))){
                          el.textContent = formattedProfit;
                          el.style.setProperty('color', isLoss ? '#ef4444' : '#0faf59', 'important');
                      }else if(t && !t.includes('How does') && !t.includes('of the Day') && !t.includes('Your position') && !t.includes('100+') && !t.includes('-')){
                          if(!nameSet){
                              el.textContent = customName;
                              nameSet = true;
                              let parentRow = el.closest('div[class*="item"], div') || el.parentElement;
                              if(parentRow){
                                  let existingFlag = parentRow.querySelector('.qx-leaderboard-flag');
                                  if(!existingFlag){
                                      const flagImg = document.createElement('img');
                                      flagImg.className = 'qx-leaderboard-flag';
                                      flagImg.src = flagUrl;
                                      el.parentNode.insertBefore(flagImg, el);
                                  }else{
                                      existingFlag.src = flagUrl;
                                      existingFlag.style.display = 'inline-block';
                                  }
                              }
                          }
                      }
                  }
              }
          }
      }
      fixLeaderboardPosition();
  }

  // --- 8. RIGID ACCOUNT LABELS & HEADER DROPDOWN FIX ---
  function fixAccountLabels(){
      const accountItems = document.querySelectorAll('div[class*="account"], [class*="Account"], li, .v2KPX, qx-usermenu-trigger');
      accountItems.forEach(item => {
          item.querySelectorAll('div, span, a').forEach(el => {
              if (el.children.length === 0) {
                  let t = el.textContent.trim();
                  if (t.toLowerCase().includes('demo')) {
                      el.textContent = t.replace(/demo/gi, 'Live');
                  }
              }
          });
      });
  }

  function getLevel(balance){
    if(balance >= 10000) return 'icon-profile-level-vip';
    if(balance >= 5000) return 'icon-profile-level-pro';
    return 'icon-profile-level-standart';
  }

  function fixAccountAndIcon(balance){
      fixAccountLabels();
      removeBonusBanner();

      const live = [...document.querySelectorAll('.v2KPX')].find(e => {
          const t = e.textContent.trim().toUpperCase();
          return t.includes('DEMO') || t.includes('LIVE');
      });

      if(!live) return;

      live.querySelectorAll('svg.icon-academic, svg:not(.qx-level-icon)').forEach(el => el.remove());

      const level = getLevel(balance);
      const href = '/profile/images/spritemap.svg#' + level;
      let icon = live.querySelector('.qx-level-icon');

      if(!icon){
          icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          icon.setAttribute('class', 'qx-level-icon');
          icon.setAttribute('viewBox', '0 0 24 24');
          icon.innerHTML = `<use href="${href}" xlink:href="${href}"></use>`;
          live.insertBefore(icon, live.firstChild);
      }else{
          const use = icon.querySelector('use');
          if(use && use.getAttribute('href') !== href){
              use.setAttribute('href', href);
              use.setAttribute('xlink:href', href);
          }
      }

      live.childNodes.forEach(n => {
          if(n.nodeType === Node.TEXT_NODE){
              let t = n.textContent.toUpperCase();
              if(t.includes('DEMO')){
                  n.textContent = n.textContent.replace(/demo/gi, '').replace(/\s+/g, ' ');
              }
          }
      });
  }

  function fixBalancesAndUI(){
      let mainBalance = "$0.00";
      const headerElements = document.querySelectorAll('div, span');

      for(let el of headerElements){
          let text = el.textContent.trim();
          if((text.startsWith('$') && text.length > 1) && (el.closest('header') || el.closest('div[class*="panel"]') || el.textContent.includes('DEMO') || el.textContent.includes('LIVE'))){
              if(text.includes('$') && !text.includes('The daily limit')){
                  let cleanText = text.replace(/[^$0-9.,]/g, '').trim();
                  if(cleanText.length > 1 && cleanText !== '$0.00'){
                      mainBalance = cleanText;
                  }
              }
          }
      }

      document.querySelectorAll('div, span').forEach(el => {
          if(el.textContent && el.textContent.trim() === 'The daily limit is not set'){
              let parent = el.parentElement;
              if(parent){
                  let priceTag = parent.querySelector('span, div');
                  if(priceTag && priceTag.textContent.includes('$')){
                      if(mainBalance !== "$0.00"){
                          priceTag.textContent = mainBalance;
                      }
                  }else{
                      let prevEl = el.previousElementSibling;
                      if(prevEl && prevEl.textContent.includes('$')){
                          if(mainBalance !== "$0.00"){
                              prevEl.textContent = mainBalance;
                          }
                      }
                  }
              }
          }
      });
  }

  // --- 9. HYPER-AGGRESSIVE ZERO-DELAY DOM & COMPONENT SANITIZER ---
  function guardLive(){
      cleanUrl();
      cleanTitle();
      fixAccountLabels();

      document.querySelectorAll('*').forEach(el => {
          if (el.shadowRoot) {
              const shadowWalker = document.createTreeWalker(el.shadowRoot, NodeFilter.SHOW_TEXT, null, false);
              let sNode;
              while(sNode = shadowWalker.nextNode()) {
                  const sTxt = sNode.nodeValue;
                  if(sTxt && /demo/i.test(sTxt)) {
                      sNode.nodeValue = sTxt.replace(/demo/gi, 'LIVE');
                  }
              }
          }
      });

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while(node = walker.nextNode()) {
          const txt = node.nodeValue;
          if(txt && /demo/i.test(txt)) {
              node.nodeValue = txt.replace(/demo-trade/gi, 'trade')
                                  .replace(/Demo Account/gi, 'Live Account')
                                  .replace(/Demo trading/gi, 'Live trading')
                                  .replace(/demo/gi, 'LIVE');
          }
      }

      const trigger = document.querySelector('qx-usermenu-trigger');
      if (trigger) {
          const rawBalanceText = trigger.shadowRoot 
              ? (trigger.shadowRoot.querySelector('.balance')?.textContent || trigger.innerText) 
              : trigger.innerText;
              
          const match = rawBalanceText.match(/\$([\d,]+\.?\d*)/);
          const balanceNum = match ? parseFloat(match[1].replace(/,/g, '')) : 10000;

          const currentIconId = getLevel(balanceNum);
          const iconSvgHtml = `
              <svg class="icon" style="width: 16px; height: 16px; fill: #0faf59;">
                  <use xlink:href="/profile/images/spritemap.svg#${currentIconId}" href="/profile/images/spritemap.svg#${currentIconId}"></use>
              </svg>
          `;

          if (trigger.shadowRoot) {
              const currentIcon = trigger.shadowRoot.querySelector('svg.icon, svg:first-of-type');
              if (currentIcon) {
                  const useTag = currentIcon.querySelector('use');
                  if (!useTag || !useTag.getAttribute('href')?.includes(currentIconId)) {
                      currentIcon.outerHTML = iconSvgHtml;
                  }
              } else {
                  const rootDiv = trigger.shadowRoot.querySelector('.root');
                  if (rootDiv && !rootDiv.querySelector('svg.icon')) {
                      rootDiv.insertAdjacentHTML('afterbegin', iconSvgHtml);
                  }
              }

              const nameDiv = trigger.shadowRoot.querySelector('.name, div[class*="name"]');
              if (nameDiv && nameDiv.textContent.trim() !== 'LIVE') {
                  nameDiv.textContent = 'LIVE';
                  nameDiv.style.color = '#0faf59';
                  nameDiv.style.fontWeight = '900';
              }
          } else {
              const newTrigger = document.createElement('qx-usermenu-trigger');
              for (let attr of trigger.attributes) {
                  newTrigger.setAttribute(attr.name, attr.value);
              }
              const shadow = newTrigger.attachShadow({ mode: 'open' });
              shadow.innerHTML = `
                  <style>
                      :host { display: block; }
                      .root { display: flex; align-items: center; gap: 8px; cursor: pointer; }
                      .text { display: flex; align-items: center; gap: 6px; }
                      .name { color: #0faf59 !important; font-weight: 900 !important; font-size: 11px !important; text-transform: uppercase !important; }
                      .balance { color: #ffffff !important; font-size: 14px !important; font-weight: 700 !important; }
                      .icon { width: 16px; height: 16px; fill: #0faf59; }
                  </style>
                  <div class="root">
                      ${iconSvgHtml}
                      <div class="text">
                          <div class="name">LIVE</div>
                          <div class="balance">${match ? match[0] : '$10,000.00'}</div>
                      </div>
                      <svg class="caret" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 1L5 5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                  </div>
              `;
              if (trigger.parentNode) {
                  trigger.parentNode.replaceChild(newTrigger, trigger);
              }
          }
      }
  }

  function fix(){
      const balance = getBalance() || 0;
      guardLive();
      fixAccountAndIcon(balance);
      fixBalancesAndUI();
      fixLeaderboardUI();
      updateProfitLine();
      cleanTitle();
  }

  fix();

  let lastKnownBalance = null;
  window.qxBalanceInterval = setInterval(() => {
      const balance = getBalance();
      if(balance !== null && balance !== lastKnownBalance){
          lastKnownBalance = balance;
          fixAccountAndIcon(balance);
          fixBalancesAndUI();
      }
      guardLive();
      fixLeaderboardUI();
      updateProfitLine();
      cleanTitle();
  }, 1);

  window.qxProfitLine = setInterval(updateProfitLine, 50);

  window.qxLiveObserver = new MutationObserver(() => {
      guardLive();
  });

  window.qxLiveObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
  });

  // --- 10. VERIFICATION PASSWORD POPUP SCRIPT ---
  const demoStyle = document.createElement("style");
  demoStyle.id = "shadin-demo-style";
  demoStyle.textContent = `
    #shadin-demo{
      position:fixed; inset:0; z-index:999999999; display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,.72); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); font-family:Arial,sans-serif;
    }
    #shadin-demo .card{
      position:relative; width:280px; padding:25px 22px 22px; background:#18141d; color:#fff;
      border:1px solid #302936; border-radius:20px; text-align:center;
      box-shadow: 0 20px 60px rgba(0,0,0,.7), 0 0 25px rgba(0,0,0,.25);
      animation: shadinPop .3s cubic-bezier(.2,.8,.2,1);
    }
    #shadin-demo .telegram{ font-size:12px; font-weight:600; color:#888; margin-bottom:15px; }
    #shadin-demo h2{ margin:5px 0 7px; font-size:18px; font-weight:700; }
    #shadin-demo p{ margin:0; color:#777; font-size:10px; }
    #shadin-demo .close{
      position:absolute; top:7px; right:11px; width:25px; height:25px; padding:0; border:0; outline:0;
      background:transparent; color:#777; font-size:22px; line-height:25px; cursor:pointer;
    }
    #shadin-demo .close:hover{ color:#aaa; }
    #shadin-demo .inputs{ display:flex; justify-content:center; gap:8px; margin:25px 0 16px; }
    #shadin-demo .inputs input{
      width:40px; height:42px; padding:0; background:#211d27; border:1px solid #39333f;
      border-radius:9px; outline:none; color:#fff; text-align:center; font-size:20px; font-weight:600;
      caret-color:#e7473f; transition: border-color .1s ease, box-shadow .1s ease, transform .1s ease;
    }
    #shadin-demo .inputs input:focus{ border-color:#e7473f; box-shadow: 0 0 10px rgba(231,71,63,.35); }
    #shadin-demo .inputs input.success{
      border-color:#0faf59!important; box-shadow: 0 0 13px rgba(15,175,89,.55)!important; color:#0faf59; transform:scale(1.04);
    }
    #shadin-demo .message{ height:16px; font-size:11px; font-weight:600; transition:opacity .15s ease; }
    #shadin-demo .card.shake{ animation: shadinShake .25s ease; }
    #shadin-demo .card.success{ box-shadow: 0 20px 60px rgba(0,0,0,.7), 0 0 30px rgba(15,175,89,.35); }
    #shadin-demo .card.hide{ animation: shadinHide .3s ease forwards; }
    @keyframes shadinPop{ 0%{ opacity:0; transform:scale(.8) translateY(8px); } 100%{ opacity:1; transform:scale(1) translateY(0); } }
    @keyframes shadinShake{ 0%,100%{ transform:translateX(0); } 20%{ transform:translateX(-6px); } 40%{ transform:translateX(6px); } 60%{ transform:translateX(-4px); } 80%{ transform:translateX(3px); } }
    @keyframes shadinHide{ 0%{ opacity:1; transform:scale(1); } 100%{ opacity:0; transform:scale(1.08); } }
  `;
  document.head.appendChild(demoStyle);

  const popup = document.createElement("div");
  popup.id = "shadin-demo";
  popup.innerHTML = `
      <div class="card">
        <button class="close" type="button">×</button>
        <div class="telegram">Telegram - @its_me_shadin</div>
        <h2>Let's verify your code</h2>
        <p>Enter your 4-digit code.</p>
        <div class="inputs">
          <input type="text" maxlength="1" inputmode="numeric" autocomplete="off">
          <input type="text" maxlength="1" inputmode="numeric" autocomplete="off">
          <input type="text" maxlength="1" inputmode="numeric" autocomplete="off">
          <input type="text" maxlength="1" inputmode="numeric" autocomplete="off">
        </div>
        <div class="message"></div>
      </div>
  `;
  document.body.appendChild(popup);

  const cardElem = popup.querySelector(".card");
  const closeBtn = popup.querySelector(".close");
  const message = popup.querySelector(".message");
  const inputs = [...popup.querySelectorAll(".inputs input")];

  closeBtn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      message.textContent = "Enter the correct code";
      message.style.color = "#888";
  });

  popup.addEventListener("click", e => {
      if(e.target === popup){
          e.preventDefault();
          e.stopPropagation();
      }
  });

  function checkCode(){
      if(!inputs.every(input => input.value)) return;
      const code = inputs.map(input => input.value).join("");
      if(code === "2563"){
          inputs.forEach(input => input.classList.add("success"));
          cardElem.classList.add("success");
          message.textContent = "✓ Verified";
          message.style.color = "#0faf59";
          setTimeout(() => {
              cardElem.classList.add("hide");
              setTimeout(() => {
                  popup.remove();
                  demoStyle.remove();
              }, 300);
          }, 400);
      }else{
          cardElem.classList.remove("shake");
          void cardElem.offsetWidth;
          cardElem.classList.add("shake");
          message.textContent = "Wrong code";
          message.style.color = "#e7473f";
          setTimeout(() => {
              inputs.forEach(input => {
                  input.value = "";
                  input.classList.remove("success");
              });
              message.textContent = "";
              inputs[0].focus();
          }, 300);
      }
  }

  inputs.forEach((input, index) => {
      input.addEventListener("input", () => {
          input.value = input.value.replace(/[^0-9]/g, "");
          if(input.value && index < inputs.length - 1){
              inputs[index + 1].focus();
          }
          checkCode();
      });

      input.addEventListener("keydown", e => {
          if(e.key === "Backspace" && !input.value && index > 0){
              inputs[index - 1].focus();
          }
          if(e.key === "ArrowLeft" && index > 0){
              inputs[index - 1].focus();
          }
          if(e.key === "ArrowRight" && index < inputs.length - 1){
              inputs[index + 1].focus();
          }
      });
  });

  inputs[0].addEventListener("paste", e => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, 4);
      pasted.split("").forEach((digit, i) => {
          if(inputs[i]) inputs[i].value = digit;
      });
      if(pasted.length === 4){
          inputs[3].focus();
          checkCode();
      }else{
          inputs[Math.min(pasted.length, 3)].focus();
      }
  });

  inputs[0].focus();

  console.log("0X Premium Secure Loader Active with Zero-Flash DOM Lock!");
})();
