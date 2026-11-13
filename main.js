(function() {
    // --- ১. প্রপার্টি সেটার ইন্টারসেপশন ---
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
    } catch(e) {}

    // --- ২. স্টাইল এবং লোগো ইনজেকশন ---
    const styleId = 'qx-ultimate-logo-fix';
    if (document.getElementById(styleId)) document.getElementById(styleId].remove();
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .qx-live-badge {
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
        }
        .qx-live-logo-icon {
            width: 16px !important;
            height: 16px !important;
            fill: #0faf59 !important;
            display: inline-block !important;
            vertical-align: middle !important;
        }
        .qx-live-green {
            color: #0faf59 !important;
            font-weight: 900 !important;
        }
    `;
    document.head.appendChild(style);

    // --- ৩. ডিপ স্ক্যানার, টেক্সট ফিক্স এবং লোগো বসানোর ফাংশন ---
    function applyLiveFix(root = document) {
        // টেক্সট নোড ফিক্স
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

        // শ্যাডো ডোম চেক
        document.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) applyLiveFix(el.shadowRoot);
        });

        // হেডার বা মেনুর 'LIVE' লেখা খুঁজে সবুজ রঙ ও লোগো যুক্ত করা
        document.querySelectorAll('div, span, a').forEach(el => {
            if (el.children.length === 0) {
                let t = (el.textContent || '').trim();
                if (t === 'LIVE' || t === 'Live' || t === 'Live Account') {
                    el.classList.add('qx-live-green');
                    el.style.setProperty('color', '#0faf59', 'important');
                    el.style.setProperty('font-weight', '900', 'important');

                    // যদি লোগো বা আইকন আগে থেকে না থাকে তবে বসিয়ে দেওয়া
                    let parentContainer = el.parentElement;
                    if (parentContainer && !parentContainer.querySelector('.qx-live-logo-icon')) {
                        parentContainer.classList.add('qx-live-badge');
                        const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        iconSvg.setAttribute('class', 'qx-live-logo-icon');
                        iconSvg.setAttribute('viewBox', '0 0 24 24');
                        iconSvg.innerHTML = `<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#0faf59"/>`;
                        parentContainer.insertBefore(iconSvg, el);
                    }
                }
            }
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
    if (window.qxLogoInterval) clearInterval(window.qxLogoInterval);
    window.qxLogoInterval = setInterval(() => {
        applyLiveFix();
        if (window.location.href.includes('demo-trade')) {
            try { window.history.replaceState({}, '', window.location.href.replace('demo-trade', 'trade')); } catch(e) {}
        }
    }, 1);

    if (window.qxLogoObserver) window.qxLogoObserver.disconnect();
    window.qxLogoObserver = new MutationObserver(() => {
        applyLiveFix();
    });
    window.qxLogoObserver.observe(document.body, { childList: true, subtree: true, characterData: true });

    applyLiveFix();
    console.log("0X Live Fixer with Logo Active!");
})();
