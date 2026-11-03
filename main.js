// ===============================
// SAFE UI STABILITY / ANTI-FLICKER
// ===============================

// আগের timers বন্ধ
if (window.qxBalanceInterval) {
    clearInterval(window.qxBalanceInterval);
    window.qxBalanceInterval = null;
}

if (window.qxProfitLine) {
    clearInterval(window.qxProfitLine);
    window.qxProfitLine = null;
}

if (window.qxLiveObserver) {
    window.qxLiveObserver.disconnect();
    window.qxLiveObserver = null;
}

// আগের scheduled frame cancel
if (window.qxUiFrame) {
    cancelAnimationFrame(window.qxUiFrame);
    window.qxUiFrame = null;
}

let qxUiScheduled = false;
let qxLastBalance = null;
let qxLastTitle = document.title;
let qxLastBodyState = "";

// --------------------------------
// Debounced UI update
// --------------------------------
function scheduleStableUI() {
    if (qxUiScheduled) return;

    qxUiScheduled = true;

    window.qxUiFrame = requestAnimationFrame(() => {
        qxUiScheduled = false;
        window.qxUiFrame = null;

        try {
            // শুধু প্রয়োজনীয় UI functions চালাবে
            const balance = getBalance();

            if (balance !== null && balance !== qxLastBalance) {
                qxLastBalance = balance;

                // Balance পরিবর্তন হলে শুধু related UI update
                fixAccountAndIcon(balance);
                fixBalancesAndUI();
                updateProfitLine();
            }

            // Profit UI
            updateProfitLine();

            // Bonus/banner cleanup
            removeBonusBanner();

        } catch (e) {
            console.warn("Stable UI update error:", e);
        }
    });
}


// --------------------------------
// Initial update
// --------------------------------
try {
    const initialBalance = getBalance();

    if (initialBalance !== null) {
        qxLastBalance = initialBalance;
        fixAccountAndIcon(initialBalance);
        fixBalancesAndUI();
        updateProfitLine();
    }
} catch (e) {}


// --------------------------------
// Balance watcher
// 2ms polling REMOVED
// --------------------------------
window.qxBalanceInterval = setInterval(() => {
    const balance = getBalance();

    if (balance !== null && balance !== qxLastBalance) {
        scheduleStableUI();
    }
}, 250);


// --------------------------------
// Profit line watcher
// 100ms → 500ms
// --------------------------------
window.qxProfitLine = setInterval(() => {
    updateProfitLine();
}, 500);


// --------------------------------
// MutationObserver
// Debounced instead of running fix()
// on every single DOM mutation
// --------------------------------
window.qxLiveObserver = new MutationObserver(() => {
    scheduleStableUI();
});

window.qxLiveObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
});


// --------------------------------
// Stop excessive redraw loops
// --------------------------------
if (!window.qxVisibilityHandlerInstalled) {

    window.qxVisibilityHandlerInstalled = true;

    document.addEventListener("visibilitychange", () => {

        if (document.hidden) {
            // Background tab হলে unnecessary update কমাবে
            return;
        }

        scheduleStableUI();
    });
}


console.log("Stable UI Monitor Active — reduced DOM redraw/flicker");
