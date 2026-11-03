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
document.getElementById('qx-profit-line-style')?.remove(); 

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
if(window.qxCustomName === undefined){ 
    window.qxCustomName = 'Trader X Team'; 
} 
window.qxCustomCountry = 'Bangladesh'; 
const countryFlagMap = { 
    'Bangladesh': 'bd', 'India': 'in', 'United States': 'us', 'United Kingdom': 'gb', 
    'Canada': 'ca', 'Australia': 'au', 'United Arab Emirates': 'ae', 'Saudi Arabia': 'sa', 'Pakistan': 'pk' 
}; 

// --- 6. INJECT STYLES --- 
const style = document.createElement('style'); 
style.id = 'qx-combined-style'; 
style.textContent = ` 
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
    .qx-leaderboard-flag { 
        width: 18px !important; height: 13px !important; object-fit: cover !important; 
        border-radius: 2px !important; margin-right: 6px !important; vertical-align: middle !important; display: inline-block !important; 
    } 
    svg.icon-academic, .v2KPX svg:not(.qx-level-icon) { 
        display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important; 
    } 
    .usFyP, [class*="watermark"] { 
        display: none !important; opacity: 0 !important; visibility: hidden !important; 
    } 
`; 
document.head.appendChild(style); 

const profitLineStyle = document.createElement('style'); 
profitLineStyle.id = 'qx-profit-line-style'; 
profitLineStyle.textContent = ` 
    .qx-profit-card{ position:relative!important; } 
    .qx-profit-line{ position:absolute!important; height:2px!important; left:10px!important; top:39px!important; width:0%; background:#0faf59!important; z-index:999999!important; pointer-events:none!important; transition: width .35s ease, background-color .2s ease!important; } 
`; 
document.head.appendChild(profitLineStyle); 

// --- 7. LEADERBOARD & PROFIT LOGIC --- 
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

    const accountListItems = document.querySelectorAll('li[class*="RdTBn"], .account, li'); 
    accountListItems.forEach(item => { 
        const text = item.textContent || ''; 
        if(text.includes('Live Account')) { 
            const spanRuj = item.querySelector('.RujZE'); 
            const inputRadio = item.querySelector('input[type="radio"]'); 
            if(spanRuj) { spanRuj.style.display = 'inline-block'; spanRuj.style.visibility = 'visible'; spanRuj.style.opacity = '1'; } 
            if(inputRadio) { inputRadio.checked = true; } 
            const linkEl = item.querySelector('a'); 
            if(linkEl) { linkEl.classList.add('active'); } 
        } else if(text.includes('Demo Account')) { 
            const spanRuj = item.querySelector('.RujZE'); 
            const inputRadio = item.querySelector('input[type="radio"]'); 
            if(spanRuj) { spanRuj.style.display = 'none'; } 
            if(inputRadio) { inputRadio.checked = false; } 
            const linkEl = item.querySelector('a'); 
            if(linkEl) { linkEl.classList.remove('active'); } 
        } 
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

// --- AGGRESSIVE LIVE GUARD (SUPER FAST SCAN) --- 
function guardLive(){ 
    cleanUrl(); 
    cleanTitle(); 
    fixAccountLabels(); 
    
    // Instant text node replacer to prevent any flicker 
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

    const trigger = document.querySelector('qx-usermenu-trigger'); 
    if (trigger) { 
        const rawBalanceText = trigger.shadowRoot ? (trigger.shadowRoot.querySelector('.balance')?.textContent || trigger.innerText) : trigger.innerText; 
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
            if (nameDiv) { 
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
}, 2); // ইন্টারভাল স্পিড বাড়িয়ে দেওয়া হয়েছে যাতে ট্রেড নেওয়ার সাথে সাথে ঠিক হয়ে যায়

window.qxProfitLine = setInterval(updateProfitLine, 100); 

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

console.log("0X Premium Secure Loader Active (Blink Fixed)!");
