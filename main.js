(function() {
    // --- ১. প্রপার্টি সেটার ওভাররাইড (যাতে 'Demo' লেখার জন্ম নেওয়ার আগেই 'Live' হয়ে যায়) ---
    try {
        const nvDesc = Object.getOwnPropertyDescriptor(Node.prototype, 'nodeValue');
        if (nvDesc && nvDesc.set) {
            Object.defineProperty(Node.prototype, 'nodeValue', {
                set: function(val) {
                    if (typeof val === 'string' && val.toLowerCase().includes('demo')) {
                        val = val.replace(/demo-trade/gi, 'trade')
                                 .replace(/DEMO/gi, 'LIVE')
                                 .replace(/Demo/gi, 'Live');
                    }
                    return nvDesc.set.call(this, val);
                },
                get: nvDesc.get
            });
        }

        const tcDesc = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
        if (tcDesc && tcDesc.set) {
            Object.defineProperty(Node.prototype, 'textContent', {
                set: function(val) {
                    if (typeof val === 'string' && val.toLowerCase().includes('demo')) {
                        val = val.replace(/demo-trade/gi, 'trade')
                                 .replace(/DEMO/gi, 'LIVE')
                                 .replace(/Demo/gi, 'Live');
                    }
                    return tcDesc.set.call(this, val);
                },
                get: tcDesc.get
            });
        }

        const ihDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        if (ihDesc && ihDesc.set) {
            Object.defineProperty(Element.prototype, 'innerHTML', {
                set: function(val) {
                    if (typeof val === 'string' && val.toLowerCase().includes('demo')) {
                        val = val.replace(/demo-trade/gi, 'trade')
                                 .replace(/DEMO/gi, 'LIVE')
                                 .replace(/Demo/gi, 'Live');
                    }
                    return ihDesc.set.call(this, val);
                },
                get: ihDesc.get
            });
        }
    } catch(e) {}

    // --- ২. অপাসিটি শিল্ড (প্রসেস কমপ্লিট হওয়ার আগে হাইড রাখা) ---
    const styleId = 'qx-ultimate-fix';
    if (document.getElementById(styleId)) document.getElementById(styleId).remove();
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        qx-usermenu-trigger, .v2KPX, [class*="account"], div[class*="dropdown"], div[class*="menu"] {
            opacity: 0 !important;
            transition: opacity 0.01s ease !important;
        }
        qx-usermenu-trigger.qx-ready, .v2KPX.qx-ready, [class*="account"].qx-ready, div[class*="dropdown"].qx-ready, div[class*="menu"].qx-ready {
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(style);

    // --- ৩. ডিপ স্ক্যানার এবং ক্লিনার ফাংশন ---
    function cleanAll(root = document) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
            let txt = node.nodeValue;
            if (txt && txt.toLowerCase().includes('demo')) {
                node.nodeValue = txt.replace(/demo-trade/gi, 'trade')
                                    .replace(/DEMO/gi, 'LIVE')
                                    .replace(/Demo/gi, 'Live');
            }
        }
        document.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) cleanAll(el.shadowRoot);
        });
        document.querySelectorAll('qx-usermenu-trigger, .v2KPX, [class*="account"], div[class*="dropdown"], div[class*="menu"]').forEach(el => {
            el.classList.add('qx-ready');
        });
    }

    // --- ৪. ইউআরএল এবং টাইটেল গার্ড ---
    if (window.location.pathname.includes('demo-trade')) {
        window.history.replaceState({}, '', window.location.pathname.replace('demo-trade', 'trade'));
    }
    if (document.title.toLowerCase().includes('demo')) {
        document.title = document.title.replace(/demo/gi, 'Live');
    }

    // --- ৫. সুপার-ফাস্ট লুপ ও অবজার্ভার ---
    if (window.qxUltimateInterval) clearInterval(window.qxUltimateInterval);
    window.qxUltimateInterval = setInterval(() => {
        cleanAll();
        if (window.location.href.includes('demo-trade')) {
            try { window.history.replaceState({}, '', window.location.href.replace('demo-trade', 'trade')); } catch(e) {}
        }
    }, 1);

    if (window.qxUltimateObserver) window.qxUltimateObserver.disconnect();
    window.qxUltimateObserver = new MutationObserver(() => {
        cleanAll();
    });
    window.qxUltimateObserver.observe(document.body, { childList: true, subtree: true, characterData: true });

    cleanAll();
    console.log("0X Ultimate Zero-Demo Interceptor Active!");
})();
