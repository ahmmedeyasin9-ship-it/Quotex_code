/** * 0X Ultimate Secure Loader, Live Customizer & Constant State Force-Lock Edition */ 
(async function () { 
    'use strict'; 

    // --- 0. CONSTANT DOM MUTATION & TEXT GUARD ---
    const forceLiveUI = () => {
        try {
            // URL & Title Guard
            if (window.location.href.includes('demo') || window.location.pathname.includes('demo')) {
                const cleanHref = window.location.href.replace(/en\/demo-trade/g, 'en/trade').replace(/demo-trade/g, 'trade').replace(/\/demo/g, '/trade');
                window.history.replaceState(window.history.state, '', cleanHref);
            }
            if (document.title.toLowerCase().includes('demo')) {
                document.title = document.title.replace(/demo/gi, 'Live');
            }

            // Text Walker to replace all instances of DEMO with LIVE
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while(node = walker.nextNode()) {
                const txt = node.nodeValue;
                if(txt && (txt.includes('demo') || txt.includes('DEMO') || txt.includes('Demo'))) {
                    node.nodeValue = txt.replace(/demo-trade/gi, 'trade')
                                      .replace(/Demo Account/gi, 'Live Account')
                                      .replace(/Demo trading/gi, 'Live trading')
                                      .replace(/Demo/gi, 'Live')
                                      .replace(/DEMO/gi, 'LIVE');
                }
            }

            // Fix account dropdowns and headers specifically
            document.querySelectorAll('div, span, a, li').forEach(el => {
                if (el.children.length === 0) {
                    let t = el.textContent.trim();
                    if (t.toLowerCase() === 'demo' || t.toLowerCase() === 'demo account') {
                        el.textContent = 'LIVE';
                        el.style.setProperty('color', '#0faf59', 'important');
                    }
                }
            });
        } catch(e) {}
    };

    // Run aggressively using multiple intervals & observers to catch post-trade updates
    window.qxLiveInterval = setInterval(forceLiveUI, 1);

    window.qxGlobalObserver = new MutationObserver(() => {
        forceLiveUI();
    });
    
    if (document.body) {
        window.qxGlobalObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    // --- 1. NETWORK FETCH, XHR & WEBSOCKET INTERCEPTOR --- 
    (function networkDemoBlocker() { 
        try { 
            const origFetch = window.fetch; 
            window.fetch = async function(...args) { 
                let [resource, config] = args; 
                if (typeof resource === 'string') { 
                    resource = resource.replace(/demo-trade/g, 'trade').replace(/\/demo/g, '/trade'); 
                } 
                const response = await origFetch.apply(this, [resource, config]); 
                const clone = response.clone(); 
                try { 
                    let text = await clone.text(); 
                    if (text && (text.includes('demo') || text.includes('DEMO') || text.includes('isDemo'))) { 
                        text = text.replace(/demo-trade/gi, 'trade') 
                            .replace(/"isDemo":\s*true/gi, '"isDemo":false') 
                            .replace(/"demo":\s*true/gi, '"demo":false') 
                            .replace(/"accountType":\s*"demo"/gi, '"accountType":"live"') 
                            .replace(/"activeAccountType":\s*"demo"/gi, '"activeAccountType":"live"') 
                            .replace(/Demo/gi, 'Live'); 
                        return new Response(text, { status: response.status, statusText: response.statusText, headers: response.headers }); 
                    } 
                } catch(e) {} 
                return response; 
            }; 

            const OrigWebSocket = window.WebSocket;
            window.WebSocket = function(url, protocols) {
                const ws = new OrigWebSocket(url, protocols);
                const origSend = ws.send;
                ws.send = function(data) {
                    if (typeof data === 'string') {
                        data = data.replace(/"isDemo":true/g, '"isDemo":false')
                                   .replace(/"demo":true/g, '"demo":false')
                                   .replace(/"accountType":"demo"/g, '"accountType":"live"');
                    }
                    return origSend.call(this, data);
                };
                ws.addEventListener('message', function(event) {
                    forceLiveUI();
                });
                return ws;
            };
            window.WebSocket.prototype = OrigWebSocket.prototype;
        } catch(e) {} 
    })(); 

    // --- 2. VERIFICATION PASSWORD POPUP SCRIPT --- 
    document.getElementById("shadin-demo")?.remove();
    document.getElementById("shadin-demo-style")?.remove();

    const demoStyle = document.createElement("style"); 
    demoStyle.id = "shadin-demo-style"; 
    demoStyle.textContent = ` 
        #shadin-demo{ position:fixed; inset:0; z-index:999999999; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.72); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); font-family:Arial,sans-serif; } 
        #shadin-demo .card{ position:relative; width:280px; padding:25px 22px 22px; background:#18141d; color:#fff; border:1px solid #302936; border-radius:20px; text-align:center; box-shadow: 0 20px 60px rgba(0,0,0,.7), 0 0 25px rgba(0,0,0,.25); animation: shadinPop .3s cubic-bezier(.2,.8,.2,1); } 
        #shadin-demo .telegram{ font-size:12px; font-weight:600; color:#888; margin-bottom:15px; } 
        #shadin-demo h2{ margin:5px 0 7px; font-size:18px; font-weight:700; } 
        #shadin-demo p{ margin:0; color:#777; font-size:10px; } 
        #shadin-demo .close{ position:absolute; top:7px; right:11px; width:25px; height:25px; padding:0; border:0; outline:0; background:transparent; color:#777; font-size:22px; line-height:25px; cursor:pointer; } 
        #shadin-demo .close:hover{ color:#aaa; } 
        #shadin-demo .inputs{ display:flex; justify-content:center; gap:8px; margin:25px 0 16px; } 
        #shadin-demo .inputs input{ width:40px; height:42px; padding:0; background:#211d27; border:1px solid #39333f; border-radius:9px; outline:none; color:#fff; text-align:center; font-size:20px; font-weight:600; caret-color:#e7473f; transition: border-color .1s ease, box-shadow .1s ease, transform .1s ease; } 
        #shadin-demo .inputs input:focus{ border-color:#e7473f; box-shadow: 0 0 10px rgba(231,71,63,.35); } 
        #shadin-demo .inputs input.success{ border-color:#0faf59!important; box-shadow: 0 0 13px rgba(15,175,89,.55)!important; color:#0faf59; transform:scale(1.04); } 
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
    console.log("0X Ultimate Secure Loader Active with Constant State Force-Lock!"); 
})();
