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

    // ২. ফ্লিকার রোধ করার জন্য ইনস্ট্যান্ট অপাসিটি শিল্ড এবং লিডারবোর্ড/প্রফিট স্টাইল
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
        .qx-leaderboard-flag { 
            width: 18px !important; height: 13px !important; object-fit: cover !important; 
            border-radius: 2px !important; margin-right: 6px !important; vertical-align: middle !important; display: inline-block !important; 
        }
        .qx-profit-card { position: relative !important; } 
        .qx-profit-line { position: absolute !important; height: 2px !important; left: 10px !important; top: 39px !important; width: 0%; background: #0faf59 !important; z-index: 999999 !important; pointer-events: none !important; transition: width .35s ease, background-color .2s ease !important; } 
    `;
    document.head.appendChild(style);

    // হেল্পার ফাংশন: ব্যালেন্স ট্র্যাক করার জন্য
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

    // লিডারবোর্ড প্রফিট কার্ড ও প্রফিট লাইন আপডেট করার লজিক
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

        fixLeaderboardUI();
        updateProfitLine();
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
    }, 2); // প্রতি ২ মিলিসেকেন্ডে চেক করবে

    if (window.qxDeepObserver) window.qxDeepObserver.disconnect();
    window.qxDeepObserver = new MutationObserver(() => {
        requestAnimationFrame(() => deepClean());
    });
    window.qxDeepObserver.observe(document.body, { childList: true, subtree: true, characterData: true });

    deepClean();
    console.log("0X Deep Shadow, Menu Cleaner & Leaderboard Active!");
})();
