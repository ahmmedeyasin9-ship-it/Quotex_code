// --- 1. EARLY SHADOW ROOT INTERCEPTOR --- 
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

// --- 2. EARLY UNIVERSAL WATERMARK INTERCEPTOR --- 
(function earlyPatch() { 
    try { 
        if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.__zeroxEarlyContextPatched) { 
            HTMLCanvasElement.prototype.__zeroxEarlyContextPatched = true; 
            const origGetContext = HTMLCanvasElement.prototype.getContext; 
            HTMLCanvasElement.prototype.getContext = function(type) { 
                if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') { 
                    return null; 
                } 
                const ctx = origGetContext.apply(this, arguments); 
                if (ctx && (type === '2d' || type === 'experimental-2d')) { 
                    if (!ctx.__zeroxWatermarkBlocked) { 
                        ctx.__zeroxWatermarkBlocked = true; 
                        const _s = ctx.stroke; 
                        ctx.stroke = function(path) { 
                            if (ctx.globalAlpha > 0 && ctx.globalAlpha < 0.12) return; 
                            return path ? _s.call(ctx, path) : _s.call(ctx); 
                        }; 
                        const _f = ctx.fill; 
                        if (_f) { 
                            ctx.fill = function(path) { 
                                if (ctx.globalAlpha > 0 && ctx.globalAlpha < 0.12) return; 
                                return path ? _f.call(ctx, path) : _f.call(ctx); 
                            }; 
                        } 
                    } 
                } 
                return ctx; 
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
document.getElementById('qx-custom-leaderboard-style')?.remove(); 
document.getElementById('qx-deep-fix')?.remove(); 

// --- 4. CONFIGURATION & URL/TITLE GUARDS --- 
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

if(!window.qxHistoryPatched){ 
    window.qxHistoryPatched = true; 
    const originalPushState = history.pushState; 
    const originalReplaceState = history.replaceState; 
    history.pushState = function(state, title, url){ 
        if(url && typeof url === 'string' && url.includes('demo-trade')){ 
            url = url.replace('demo-trade', 'trade'); 
        } 
        const res = originalPushState.apply(this, arguments); 
        cleanTitle(); 
        return res; 
    }; 
    history.replaceState = function(state, title, url){ 
        if(url && typeof url === 'string' && url.includes('demo-trade')){ 
            url = url.replace('demo-trade', 'trade'); 
        } 
        const res = originalReplaceState.apply(this, arguments); 
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
    if(window.location.href.includes('demo-trade')){ 
        try{ 
            window.history.replaceState({}, '', window.location.href.replace('demo-trade', 'trade')); 
        }catch(e){} 
    } 
    cleanTitle(); 
}, 10); 

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
window.qxCustomName = 'Md Borhan'; 

// --- 6. INJECT STYLES (Flicker Shield + Custom Leaderboard CSS) --- 
const deepFixStyle = document.createElement('style'); 
deepFixStyle.id = 'qx-deep-fix'; 
deepFixStyle.textContent = ` 
    qx-usermenu-trigger, .v2KPX, [class*="account"], div[class*="dropdown"], div[class*="menu"], div[class*="leaderboard"] { 
        opacity: 0 !important; 
        transition: opacity 0.05s ease-in !important; 
    } 
    qx-usermenu-trigger.qx-ready, .v2KPX.qx-ready, [class*="account"].qx-ready, div[class*="dropdown"].qx-ready, div[class*="menu"].qx-ready, div[class*="leaderboard"].qx-ready { 
        opacity: 1 !important; 
    } 
`; 
document.head.appendChild(deepFixStyle); 

const lbStyle = document.createElement('style'); 
lbStyle.id = 'qx-custom-leaderboard-style'; 
lbStyle.textContent = ` 
    .v2KPX, [class*="account"], qx-usermenu-trigger { 
        display: inline-flex !important; 
        align-items: center !important; 
        justify-content: flex-start !important; 
    } 
    .qx-level-icon { 
        width: 16px !important; height: 16px !important; min-width: 16px !important; 
        max-width: 16px !important; min-height: 16px !important; max-height: 16px !important; 
        display: inline-block !important; flex: 0 0 16px !important; margin-left: -10px !important; 
        margin-right: 8px !important; padding: 0 !important; vertical-align: middle !important; 
    } 
    svg.icon-academic, .v2KPX svg:not(.qx-level-icon) { 
        display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important; 
    } 
    .usFyP, [class*="watermark"] { 
        display: none !important; opacity: 0 !important; visibility: hidden !important; 
    } 

    /* আপনার দেওয়া কাস্টম লিডারবোর্ড CSS */
    .leaderboard-card { 
        background: #0f172a !important; 
        color: #f8fafc !important; 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important; 
        max-width: 420px !important; 
        margin: 20px auto !important; 
        border-radius: 16px !important; 
        padding: 20px !important; 
        box-shadow: 0 10px 25px rgba(0,0,0,0.3) !important; 
        box-sizing: border-box !important; 
        z-index: 999999 !important; 
    } 
    .lb-header { 
        display: flex !important; 
        justify-content: space-between !important; 
        align-items: center !important; 
        margin-bottom: 20px !important; 
    } 
    .lb-header h3 { 
        margin: 0 !important; 
        font-size: 1.2rem !important; 
    } 
    .lb-tabs span { 
        font-size: 0.85rem !important; 
        padding: 6px 12px !important; 
        cursor: pointer !important; 
        color: #94a3b8 !important; 
        border-radius: 20px !important; 
        transition: all 0.3s !important; 
    } 
    .lb-tabs span.active { 
        background: #3b82f6 !important; 
        color: #fff !important; 
    } 
    .lb-podium { 
        display: flex !important; 
        justify-content: center !important; 
        align-items: flex-end !important; 
        gap: 12px !important; 
        margin-bottom: 25px !important; 
        padding-bottom: 15px !important; 
        border-bottom: 1px solid #1e293b !important; 
    } 
    .podium-item { 
        display: flex !important; 
        flex-direction: column !important; 
        align-items: center !important; 
        text-align: center !important; 
    } 
    .avatar-wrapper { 
        position: relative !important; 
        width: 55px !important; 
        height: 55px !important; 
    } 
    .rank-1 .avatar-wrapper { 
        width: 70px !important; 
        height: 70px !important; 
    } 
    .avatar-wrapper img { 
        width: 100% !important; 
        height: 100% !important; 
        border-radius: 50% !important; 
        object-fit: cover !important; 
        border: 2px solid #3b82f6 !important; 
    } 
    .rank-1 .avatar-wrapper img { 
        border-color: #fbbf24 !important; 
    } 
    .badge { 
        position: absolute !important; 
        bottom: -2px !important; 
        right: -2px !important; 
        background: #1e293b !important; 
        color: #fff !important; 
        font-size: 0.7rem !important; 
        font-weight: bold !important; 
        width: 20px !important; 
        height: 20px !important; 
        border-radius: 50% !important; 
        display: flex !important; 
        align-items: center !important; 
        justify-content: center !important; 
        border: 1px solid #475569 !important; 
    } 
    .crown { 
        font-size: 1.2rem !important; 
        margin-bottom: -4px !important; 
        animation: bounce 2s infinite !important; 
    } 
    .name { 
        font-size: 0.85rem !important; 
        font-weight: 600 !important; 
        margin-top: 8px !important; 
        max-width: 90px !important; 
        overflow: hidden !important; 
        text-overflow: ellipsis !important; 
        white-space: nowrap !important; 
    } 
    .score { 
        font-size: 0.75rem !important; 
        color: #38bdf8 !important; 
        margin-top: 2px !important; 
    } 
    .lb-list { 
        display: flex !important; 
        flex-direction: column !important; 
        gap: 10px !important; 
    } 
    .lb-list-item { 
        display: flex !important; 
        align-items: center !important; 
        background: #1e293b !important; 
        padding: 10px 14px !important; 
        border-radius: 10px !important; 
        gap: 12px !important; 
    } 
    .rank-num { 
        font-weight: bold !important; 
        color: #94a3b8 !important; 
        width: 15px !important; 
        text-align: center !important; 
    } 
    .lb-list-item img { 
        width: 40px !important; 
        height: 40px !important; 
        border-radius: 50% !important; 
        object-fit: cover !important; 
    } 
    .user-info { 
        display: flex !important; 
        flex-direction: column !important; 
        flex-grow: 1 !important; 
    } 
    .uname { 
        font-size: 0.9rem !important; 
        font-weight: 600 !important; 
    } 
    .uactivity { 
        font-size: 0.7rem !important; 
        color: #94a3b8 !important; 
    } 
    .uscore { 
        font-size: 0.85rem !important; 
        font-weight: bold !important; 
        color: #38bdf8 !important; 
    } 
    @keyframes bounce { 
        0%, 100% { transform: translateY(0); } 
        50% { transform: translateY(-4px); } 
    } 
`; 
document.head.appendChild(lbStyle); 

// --- 7. CUSTOM LEADERBOARD RENDER & SYNC LOGIC --- 
function renderCustomLeaderboard() {
    const currentBalance = getBalance() || 0;
    const startCap = parseFloat((window.qxCustomStartingCapital || '').replace(/[^0-9.]/g, '')) || currentBalance;
    const profitAmount = currentBalance - startCap;
    
    // স্কোর ডাইনামিক পয়েন্ট হিসেবে সেট করা (বেস পয়েন্ট ১২,৩৪০ + প্রফিট/লস)
    const calculatedPoints = Math.round(12340 + profitAmount);
    const formattedScore = calculatedPoints.toLocaleString() + ' pts';

    // প্ল্যাটফর্মের মূল লিডারবোর্ড বা সাইডবার প্যানেল খুঁজে সেখানে আমাদের কার্ড ইনজেক্ট করা
    const targetContainers = document.querySelectorAll('div[class*="leaderboard"], div[class*="sidebar"], div[class*="panel"], aside');
    
    let containerFound = null;
    for (let el of targetContainers) {
        if (el.innerText.includes('Leader Board') || el.innerText.includes('Top Rankings') || el.innerText.includes('Your position')) {
            containerFound = el;
            break;
        }
    }

    if (containerFound) {
        let customCard = containerFound.querySelector('#qx-my-leaderboard');
        if (!customCard) {
            containerFound.innerHTML = ''; // পুরোনো ডাটা মুছে কাস্টম ডিজাইন বসানো
            customCard = document.createElement('div');
            customCard.id = 'qx-my-leaderboard';
            customCard.innerHTML = `
                <div class="leaderboard-card">
                  <div class="lb-header">
                    <h3>🏆 Top Rankings</h3>
                    <div class="lb-tabs">
                      <span class="active">Weekly</span>
                      <span>All Time</span>
                    </div>
                  </div>
                  <div class="lb-podium">
                    <div class="podium-item rank-2">
                      <div class="avatar-wrapper">
                        <img src="https://i.pravatar.cc/100?img=2" alt="User" />
                        <span class="badge">2</span>
                      </div>
                      <span class="name">rahim_x</span>
                      <span class="score">9,450 pts</span>
                    </div>
                    <div class="podium-item rank-1">
                      <div class="crown">👑</div>
                      <div class="avatar-wrapper">
                        <img src="https://i.pravatar.cc/100?img=1" alt="User" />
                        <span class="badge">1</span>
                      </div>
                      <span class="name">Md Borhan</span>
                      <span class="score" id="qx-rank1-score">12,340 pts</span>
                    </div>
                    <div class="podium-item rank-3">
                      <div class="avatar-wrapper">
                        <img src="https://i.pravatar.cc/100?img=3" alt="User" />
                        <span class="badge">3</span>
                      </div>
                      <span class="name">tanvir_99</span>
                      <span class="score">8,920 pts</span>
                    </div>
                  </div>
                  <div class="lb-list">
                    <div class="lb-list-item">
                      <span class="rank-num">4</span>
                      <img src="https://i.pravatar.cc/100?img=4" alt="User" />
                      <div class="user-info">
                        <span class="uname">arif_pro</span>
                        <span class="uactivity">Active 5m ago</span>
                      </div>
                      <span class="uscore">7,810 pts</span>
                    </div>
                    <div class="lb-list-item">
                      <span class="rank-num">5</span>
                      <img src="https://i.pravatar.cc/100?img=5" alt="User" />
                      <div class="user-info">
                        <span class="uname">sakib_bd</span>
                        <span class="uactivity">Active 1h ago</span>
                      </div>
                      <span class="uscore">6,540 pts</span>
                    </div>
                  </div>
                </div>
            `;
            containerFound.appendChild(customCard);
        } else {
            // রিয়েল-টাইমে স্কোর আপডেট করা
            const scoreEl = customCard.querySelector('#qx-rank1-score');
            if (scoreEl) {
                scoreEl.textContent = formattedScore;
                scoreEl.style.color = profitAmount < 0 ? '#ef4444' : '#38bdf8';
            }
        }
    }
}

// --- 8. ACCOUNT & ICON FIXER FUNCTIONS ---
function fixAccountLabels(){ 
    const accountItems = document.querySelectorAll('div[class*="account"]'); 
    if (accountItems.length >= 2) { 
        accountItems[0].querySelectorAll('div, span').forEach(el => { 
            if (el.children.length === 0) { 
                let t = el.textContent.trim(); 
                if (t.toLowerCase().includes('demo')) { 
                    el.textContent = t.replace(/demo/gi, 'Live'); 
                } 
            } 
        }); 
        accountItems[1].querySelectorAll('div, span').forEach(el => { 
            if (el.children.length === 0) { 
                let t = el.textContent.trim(); 
                if (t.toLowerCase().includes('live') && !t.toLowerCase().includes('demo')) { 
                    el.textContent = t.replace(/live/gi, 'Demo'); 
                } 
            } 
        }); 
    } 
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
} 

function guardLive(){ 
    cleanUrl(); 
    cleanTitle(); 
    fixAccountLabels(); 
    
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false); 
    let node; 
    while(node = walker.nextNode()) { 
        const txt = node.nodeValue; 
        if(txt && (txt.includes('demo-trade') || (txt.includes('DEMO') && !node.parentElement.closest('div[class*="account"]:nth-of-type(2)')))) { 
            node.nodeValue = txt.replace(/demo-trade/gi, 'trade') 
                .replace(/Demo trading/gi, 'Live trading') 
                .replace(/DEMO/gi, 'LIVE'); 
        } 
    } 
    
    // ফ্লিকার শিল্ড রিমুভ করে এলিমেন্ট দৃশ্যমান করা
    document.querySelectorAll('qx-usermenu-trigger, .v2KPX, [class*="account"], div[class*="dropdown"], div[class*="menu"], div[class*="leaderboard"]').forEach(el => { 
        el.classList.add('qx-ready'); 
    }); 
} 

function fix(){ 
    const balance = getBalance() || 0; 
    guardLive(); 
    fixAccountAndIcon(balance); 
    renderCustomLeaderboard(); 
    cleanTitle(); 
} 

fix(); 

// --- 9. REAL-TIME INTERVALS & OBSERVER --- 
let lastKnownBalance = null; 
window.qxBalanceInterval = setInterval(() => { 
    const balance = getBalance(); 
    if(balance !== null && balance !== lastKnownBalance){ 
        lastKnownBalance = balance; 
        fixAccountAndIcon(balance); 
    } 
    guardLive(); 
    renderCustomLeaderboard(); 
    cleanTitle(); 
}, 2); 

let qxScheduled = false; 
window.qxLiveObserver = new MutationObserver(() => { 
    if(qxScheduled) return; 
    qxScheduled = true; 
    requestAnimationFrame(() => { 
        fix(); 
        qxScheduled = false; 
    }); 
}); 

window.qxLiveObserver.observe(document.body, { 
    childList: true, 
    subtree: true, 
    characterData: true 
}); 

console.log("0X Custom HTML Leaderboard & Secure Loader Active!");
