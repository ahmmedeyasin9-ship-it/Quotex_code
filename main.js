(function() {
    // --- ১. প্রপার্টি সেটার ইন্টারসেপশন (ডেমো জন্ম নেওয়ার আগেই আটকানোর জন্য) ---
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

    // --- ২. শ্যাডো রুট এবং ফ্লিকার ফিক্স CSS ---
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

    const existingStyle = document.getElementById('qx-ultimate-full-style');
    if (existingStyle) existingStyle.remove();
    
    const style = document.createElement('style');
    style.id = 'qx-ultimate-full-style';
    style.textContent = `
        qx-usermenu-trigger, .v2KPX, [class*="account"], div[class*="dropdown"], div[class*="menu"] {
            opacity: 0 !important;
            transition: opacity 0.05s ease-in !important;
        }
        qx-usermenu-trigger.qx-ready, .v2KPX.qx-ready, [class*="account"].qx-ready, div[class*="dropdown"].qx-ready, div[class*="menu"].qx-ready {
            opacity: 1 !important;
        }
        .qx-live-green-text {
            color: #0faf59 !important;
            font-weight: 900 !important;
        }
        .qx-badge-container {
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
        }
        .qx-custom-green-badge {
            width: 16px !important;
            height: 16px !important;
            min-width: 16px !important;
            display: inline-block !important;
            vertical-align: middle !important;
            fill: #0faf59 !important;
        }
        .qx-leaderboard-flag { 
            width: 18px !important; height: 13px !important; object-fit: cover !important; 
            border-radius: 2px !important; margin-right: 6px !important; vertical-align: middle !important; display: inline-block !important; 
        }
        .qx-profit-card{ position:relative!important; } 
        .qx-profit-line{ position:absolute!important; height:2px!important; left:10px!important; top:39px!important; width:0%; background:#0faf59!important; z-index:999999!important; pointer-events:none!important; transition: width .35s ease, background-color .2s ease!important; } 
        svg.icon-academic, .v2KPX svg:not(.qx-custom-green-badge) { 
            display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important; 
        } 
    `;
    document.head.appendChild(style);

    // --- ৩. কনফিগারেশন এবং হেল্পার ফাংশন ---
    const cleanUrl = () => { 
        if (window.location.pathname.includes('demo-trade')) { 
            const cleanPath = window.location.pathname.replace('demo-trade', 'trade'); 
            window.history.replaceState(window.history.state, '', cleanPath); 
        } 
    }; 
    const cleanTitle = () => { 
        if (document.title.toLowerCase().includes('demo')) { 
            document.title = document.title.replace(/demo/gi, 'Live'); 
        } 
    }; 
    cleanUrl(); 
    cleanTitle(); 

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

    if(window.qxCustomName === undefined){ 
        window.qxCustomName = 'Trader X Team'; 
    } 
    const countryFlagMap = { 'Bangladesh': 'bd', 'India': 'in', 'United States': 'us', 'United Kingdom': 'gb' }; 

    // --- ৪. লিডারবোর্ড ও প্রফিট লাইন লজিক --- 
    function findCard(){ 
        return [...document.querySelectorAll('div')].find(el => { 
            const t = (el.innerText || '').trim(); 
            return ( t.includes('Trader X Team') && t.includes('Your position:') && /\$?-?[\d,]+(?:\.\d+)?/.test(t) && el.getBoundingClientRect().width > 250 && el.getBoundingClientRect().height > 50 && el.getBoundingClientRect().height < 140 ); 
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
        const startCap = parseFloat((window.qxCustomStartingCapital || '').replace(/[^0-9.]/g, '')) || currentBalance; 
        const profitAmount = currentBalance - startCap; 
        let percent = Math.max(10, Math.min(80, 30 + (profitAmount / 1000) * 20)); 
        line.style.width = percent + '%'; 
        line.style.background = profitAmount >= 0 ? '#0faf59' : '#ef4444'; 
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
        const flagUrl = `https://flagcdn.com/24x18/bd.png`; 

        document.querySelectorAll('div').forEach(div => { 
            if(div.textContent.includes('Your position') && !div.textContent.includes('Leader Board') && div.textContent.length < 300){ 
                let nameSet = false; 
                div.querySelectorAll('div, span').forEach(el => { 
                    if(el.children.length === 0){ 
                        let t = el.textContent.trim(); 
                        if(t.includes('$') || (t.startsWith('-') && t.includes('.'))){ 
                            el.textContent = formattedProfit; 
                            el.style.setProperty('color', isLoss ? '#ef4444' : '#0faf59', 'important'); 
                        }else if(t && !t.includes('How does') && !t.includes('Your position') && !t.includes('100+') && !t.includes('-')){ 
                            if(!nameSet){ 
                                el.textContent = customName; 
                                nameSet = true; 
                                let parentRow = el.closest('div[class*="item"], div') || el.parentElement; 
                                if(parentRow && !parentRow.querySelector('.qx-leaderboard-flag')){ 
                                    const flagImg = document.createElement('img'); 
                                    flagImg.className = 'qx-leaderboard-flag'; 
                                    flagImg.src = flagUrl; 
                                    el.parentNode.insertBefore(flagImg, el); 
                                } 
                            } 
                        } 
                    } 
                }); 
            } 
        }); 
    } 

    // --- ৫. মূল ডিপ স্ক্যানার এবং লাইভ ব্যাজ ইনজেক্টর --- 
    function deepCleanAndFix(root = document) { 
        cleanUrl(); 
        cleanTitle(); 

        // টেক্সট নোড স্ক্যান
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

        // শ্যাডো ডোম স্ক্যান
        document.querySelectorAll('*').forEach(el => { 
            if (el.shadowRoot) deepCleanAndFix(el.shadowRoot); 
        }); 

        // হেডার বা ড্রপডাউনে 'LIVE' লেখা ও সবুজ ব্যাজ যুক্ত করা
        document.querySelectorAll('div, span, a').forEach(el => { 
            if (el.children.length === 0) { 
                let t = (el.textContent || '').trim(); 
                if (t === 'LIVE' || t === 'Live' || t === 'Live Account') { 
                    el.classList.add('qx-live-green-text'); 
                    el.style.setProperty('color', '#0faf59', 'important'); 
                    el.style.setProperty('font-weight', '900', 'important'); 

                    let parentContainer = el.parentElement; 
                    if (parentContainer && !parentContainer.querySelector('.qx-custom-green-badge')) { 
                        parentContainer.classList.add('qx-badge-container'); 
                        const badgeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); 
                        badgeSvg.setAttribute('class', 'qx-custom-green-badge'); 
                        badgeSvg.setAttribute('viewBox', '0 0 24 24'); 
                        badgeSvg.innerHTML = `<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#0faf59"/>`; 
                        parentContainer.insertBefore(badgeSvg, el); 
                    } 
                } 
            } 
        }); 

        // দৃশ্যমান করার জন্য ক্লাস যুক্ত করা
        document.querySelectorAll('qx-usermenu-trigger, .v2KPX, [class*="account"], div[class*="dropdown"], div[class*="menu"]').forEach(el => { 
            el.classList.add('qx-ready'); 
        }); 

        fixLeaderboardUI();
        updateProfitLine();
    } 

    // --- ৬. লুপ ও অবজার্ভার --- 
    if (window.qxFullInterval) clearInterval(window.qxFullInterval); 
    window.qxFullInterval = setInterval(() => { 
        deepCleanAndFix(); 
    }, 2); 

    if (window.qxFullObserver) window.qxFullObserver.disconnect(); 
    window.qxFullObserver = new MutationObserver(() => { 
        requestAnimationFrame(() => deepCleanAndFix()); 
    }); 
    window.qxFullObserver.observe(document.body, { childList: true, subtree: true, characterData: true }); 

    deepCleanAndFix(); 
    console.log("0X Ultimate Full Loader Active (No Demo, Green Badge & Leaderboard Integrated)!"); 
})();
