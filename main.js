(function() {
  // Quotex Resilient Live/VIP Patch v2.5
  // Fixed for recent Quotex UI changes (Works without broken class hashes)
  const TARGET_TITLE = 'Live Account';
  const ACCENT_COLOR = '#00c853';
  const CUSTOM_BALANCE = null;
  const IS_VIP = true;
  const IS_PRO = false;

  function updateQuotexUI() {
    // 1. Scan and replace Demo Account text with resilient TreeWalker
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    const nodesToReplace = [];

    while ((node = walker.nextNode())) {
      const val = node.nodeValue;
      if (!val) continue;

      // Check for Demo variants
      if (/Demo account|ডেমো একাউন্ট|Cuenta demo|Compte démo/i.test(val)) {
        nodesToReplace.push({ node, text: TARGET_TITLE, isAccount: true });
      } else if (/^\s*Demo\s*$/i.test(val)) {
        nodesToReplace.push({ node, text: 'Live', isAccount: true });
      } else if (/Demo trading|ডেমো ট্রেডিং/i.test(val)) {
        nodesToReplace.push({ node, text: val.replace(/Demo trading/gi, 'Live trading') });
      } else if (CUSTOM_BALANCE && /\$\s?[\d,]+\.?\d*/.test(val)) {
        // Only target balance inside header/account area
        const parent = node.parentElement;
        if (parent && (parent.closest('header') || parent.closest('[class*="header"]') || parent.closest('[class*="balance"]') || parent.closest('[class*="profile"]'))) {
          nodesToReplace.push({ node, text: '$' + CUSTOM_BALANCE, isBalance: true });
        }
      }
    }

    nodesToReplace.forEach(item => {
      item.node.nodeValue = item.text;
      const el = item.node.parentElement;
      if (el && item.isAccount) {
        el.style.color = ACCENT_COLOR;
        el.style.fontWeight = 'bold';
      }
    });

    // 2. Fix Demo Badges & Icons in Header
    document.querySelectorAll('header, [class*="header"], [class*="account"], [class*="profile"]').forEach(header => {
      // Find elements containing 'Live' or formerly 'Demo'
      header.querySelectorAll('div, span, button, a, p').forEach(el => {
        if (el.children.length === 0 && (el.textContent.includes('Live') || el.textContent.includes('Demo'))) {
          el.textContent = TARGET_TITLE;
          el.style.color = ACCENT_COLOR;
        }
      });

      // Update SVG icons (replace academic/demo cap with VIP/Pro icon)
      const svgs = header.querySelectorAll('svg');
      svgs.forEach(svg => {
        const use = svg.querySelector('use');
        if (use) {
          const href = use.getAttribute('xlink:href') || use.getAttribute('href') || '';
          if (href.includes('academic') || href.includes('standart') || href.includes('demo')) {
            use.setAttribute('xlink:href', IS_VIP ? '/profile/images/spritemap.svg#icon-profile-level-vip' : '/profile/images/spritemap.svg#icon-profile-level-pro');
            use.setAttribute('href', IS_VIP ? '/profile/images/spritemap.svg#icon-profile-level-vip' : '/profile/images/spritemap.svg#icon-profile-level-pro');
          }
        }
        // Change icon color if it's the level icon
        if (svg.classList.contains('icon-academic')) {
          svg.classList.remove('icon-academic');
          svg.classList.add(IS_VIP ? 'icon-profile-level-vip' : 'icon-profile-level-pro');
        }
      });
    });

    // 3. Update Title & History
    if (document.title.includes('Demo')) { document.title = document.title.replace(/Demo/gi, 'Live'); }
    if (location.pathname.includes('demo')) { history.replaceState(null, '', '/en/trade'); }
  }

  // Initial execution
  updateQuotexUI();

  // 4. Resilient MutationObserver to stop React VDOM rollbacks
  if (!window.__quotexObserverAttached) {
    window.__quotexObserverAttached = true;
    let timeoutId = null;
    const observer = new MutationObserver(() => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        updateQuotexUI();
      }, 50);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    console.log("%c[Quotex Resilient Patch] Observer Active!", "color: #00c853; font-weight: bold;");
  }

  // Fallback heartbeat interval
  setInterval(updateQuotexUI, 300);
  console.log("%c[Quotex Resilient Patch] Successfully Applied!", "color: #00c853; font-size: 14px; font-weight: bold;");
})();
