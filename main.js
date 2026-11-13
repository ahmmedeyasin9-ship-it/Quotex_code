(function() {
    // ১. শ্যাডো রুট এবং রেন্ডারিং প্যাচ
    if (typeof Element !== 'undefined' && !Element.prototype.__zeroxOrigAttach) {
        Element.prototype.__zeroxOrigAttach = Element.prototype.attachShadow;
        Element.prototype.attachShadow = function(init) {
            const shadow = Element.prototype.__zeroxOrigAttach.call(this, { ...init, mode: 'open' });
            this.__zeroxShadowRoot = shadow;
            return shadow;
        };
    }

    // ২. ফ্লিকার রোধ করার জন্য ইনস্ট্যান্ট অপাসিটি শিল্ড
    const existingStyle = document.getElementById('qx-deep-fix');
    if (existingStyle) existingStyle.remove();
    
    const style = document.createElement('style');
    style.id = 'qx-deep-fix';
    style.textContent = `
        qx-usermenu-trigger, .v2KPX, [class*="account"], div[class*="dropdown"], div[class*="menu"] {
            opacity: 0 !important;
            transition: opacity 0.05s ease-in !important;
        }
        qx-usermenu-trigger.qx-ready, .v2KPX.qx-ready, [class*="account"].qx-ready, div[class*="dropdown"].qx-ready, div[class*="menu"].qx-ready {
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(style);

    // ৩. মূল রিপ্লেসমেন্ট এবং ডিপ শ্যাডো স্ক্যানার ফাংশন
    function deepClean(root = document) {
        // নরমাল DOM টেক্সট স্ক্যান
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
            let txt = node.nodeValue;
            if (txt && (txt.includes('DEMO') || txt.includes('Demo') || txt.includes('demo-trade'))) {
                node.nodeValue = txt.replace(/demo-trade/gi, 'trade')
                                    .replace(/Demo account/gi, 'Live account')
                                    .replace(/DEMO ACCOUNT/gi, 'LIVE ACCOUNT')
                                    .replace(/DEMO/gi, 'LIVE')
                                    .replace(/Demo/gi, 'Live');
            }
        }

        // শ্যাডো রুট (Shadow DOM) স্ক্যান করা
        document.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) {
                deepClean(el.shadowRoot);
            }
        });

        // অ্যাকাউন্ট মেনু বা ড্রপডাউনের স্ট্যাটাস ফিক্স করা
        document.querySelectorAll('div, span, li, a').forEach(el => {
            if (el.children.length === 0) {
                let text = (el.textContent || '').trim();
                if (text === 'Demo' || text === 'DEMO' || text === 'Demo Account') {
                    el.textContent = 'Live';
                    el.style.setProperty('color', '#0faf59', 'important');
                    el.style.setProperty('font-weight', '900', 'important');
                }
            }
        });

        // দৃশ্যমান করার জন্য ক্লাস যুক্ত করা
        document.querySelectorAll('qx-usermenu-trigger, .v2KPX, [class*="account"], div[class*="dropdown"], div[class*="menu"]').forEach(el => {
            el.classList.add('qx-ready');
        });
    }

    // ৪. ইউআরএল এবং টাইটেল পরিষ্কার রাখা
    if (window.location.pathname.includes('demo-trade')) {
        window.history.replaceState({}, '', window.location.pathname.replace('demo-trade', 'trade'));
    }
    if (document.title.toLowerCase().includes('demo')) {
        document.title = document.title.replace(/demo/gi, 'Live');
    }

    // ৫. রিয়েল-টাইম লুপ এবং অবজার্ভার (অতি দ্রুত কাজ করার জন্য)
    if (window.qxDeepInterval) clearInterval(window.qxDeepInterval);
    window.qxDeepInterval = setInterval(() => {
        deepClean();
        if (window.location.href.includes('demo-trade')) {
            try { window.history.replaceState({}, '', window.location.href.replace('demo-trade', 'trade')); } catch(e) {}
        }
    5}, 2); // প্রতি ২ মিলিসেকেন্ডে চেক করবে

    if (window.qxDeepObserver) window.qxDeepObserver.disconnect();
    window.qxDeepObserver = new MutationObserver(() => {
        requestAnimationFrame(() => deepClean());
    });
    window.qxDeepObserver.observe(document.body, { childList: true, subtree: true, characterData: true });

    deepClean();
    console.log("0X Deep Shadow & Menu Cleaner Active!");
})();
