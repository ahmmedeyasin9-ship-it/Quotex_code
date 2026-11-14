(() => {
    window.qxLiveObserver?.disconnect();
    clearInterval(window.qxLiveFix);
    clearInterval(window.qxUrlForceInterval);
    clearInterval(window.qxBalanceInterval);
    clearInterval(window.qxProfitLine);
    window.qxProfitLine = null;

    document.getElementById('qx-combined-style')?.remove();
    document.getElementById('qx-dot-fix-style')?.remove();
    document.getElementById('qx-manager-host')?.remove();
    document.getElementById('qx-manager-modal-container')?.remove();
    document.getElementById('shadin-bg')?.remove();
    document.getElementById('access-denied-demo')?.remove();
    document.getElementById('access-denied-demo-style')?.remove();
    document.getElementById("shadin-demo")?.remove();
    document.getElementById("shadin-demo-style")?.remove();
    document.getElementById('qx-profit-line-style')?.remove();

    function getBalance(){
      const all = document.querySelectorAll('.zt1hG, header div, header span, .v2KPX');

      for(const el of all){
        const text = el.textContent?.trim() || '';

        if(!text.includes('$')) continue;

        const clean = text
          .replace(/,/g,'')
          .replace('$','')
          .replace(/LIVE/gi,'')
          .replace(/DEMO/gi,'')
          .trim();

        const n = parseFloat(clean);

        if(
          Number.isFinite(n) &&
          n >= 0 &&
          n < 100000000
        ){
          return n;
        }
      }

      return null;
    }

    function removeBonusBanner() {
        const allDivs = document.querySelectorAll('div, section, aside');

        allDivs.forEach(el => {
            const text = el.textContent || '';

            if(
                text.includes('50% bonus') ||
                text.includes('bonus on your deposit') ||
                text.includes('Get a 50%')
            ){
                if(
                    el.offsetHeight > 0 &&
                    el.offsetHeight < 400
                ){
                    el.style.setProperty(
                        'display',
                        'none',
                        'important'
                    );
                }
            }
        });
    }

    const currentInitBal = getBalance();

    window.qxCustomStartingCapital =
        currentInitBal !== null
        ? currentInitBal.toString()
        : '0';

    if(window.qxCustomName === undefined){
        window.qxCustomName = 'Trader X Team';
    }

    window.qxCustomCountry = 'Bangladesh';


    if(!window.qxHistoryPatched){
        window.qxHistoryPatched = true;

        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function(state, title, url){
            if(
                url &&
                typeof url === 'string' &&
                url.includes('demo-trade')
            ){
                url = url.replace('demo-trade', 'trade');
            }

            return originalPushState.apply(this, arguments);
        };

        history.replaceState = function(state, title, url){
            if(
                url &&
                typeof url === 'string' &&
                url.includes('demo-trade')
            ){
                url = url.replace('demo-trade', 'trade');
            }

            return originalReplaceState.apply(this, arguments);
        };
    }


    if(window.location.href.includes('demo-trade')){
        try{
            window.history.replaceState(
                {},
                '',
                window.location.href.replace('demo-trade', 'trade')
            );
        }catch(e){}
    }


    window.qxUrlForceInterval = setInterval(() => {
        if(window.location.href.includes('demo-trade')){
            try{
                window.history.replaceState(
                    {},
                    '',
                    window.location.href.replace('demo-trade', 'trade')
                );
            }catch(e){}
        }
    }, 500);


    const style = document.createElement('style');
    style.id = 'qx-combined-style';
    style.textContent = `
        .v2KPX {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          gap: 0 !important;
          padding-left: 0 !important;
          margin-left: 0 !important;
          color: #0faf59 !important;
        }

        .qx-level-icon {
          width: 16px !important;
          height: 16px !important;
          min-width: 16px !important;
          max-width: 16px !important;
          min-height: 16px !important;
          max-height: 16px !important;
          display: inline-block !important;
          flex: 0 0 16px !important;
          margin-left: -10px !important;
          margin-right: 8px !important;
          padding: 0 !important;
          vertical-align: middle !important;
          will-change: transform, opacity !important;
          transition: transform 0.1s ease, opacity 0.1s ease !important;
        }

        .qx-level-icon.qx-icon-updating {
          transform: scale(0.7) rotate(-45deg) !important;
          opacity: 0.4 !important;
        }

        .qx-level-icon use {
          width: 100% !important;
          height: 100% !important;
        }

        .qx-leaderboard-flag {
          width: 18px !important;
          height: 13px !important;
          object-fit: cover !important;
          border-radius: 2px !important;
          margin-right: 6px !important;
          vertical-align: middle !important;
          display: inline-block !important;
        }

        svg.icon-academic,
        .v2KPX svg:not(.qx-level-icon) {
          display: none !important;
          visibility: hidden !important;
          width: 0 !important;
          height: 0 !important;
        }

        .usFyP,
        [class*="watermark"] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }

        div[class*="account"]:first-of-type input[type="radio"],
        div[class*="account"]:first-of-type span[class*="yJfVf"] {
            display: inline-block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }

        div[class*="account"]:first-of-type span[class*="yJfVf"] {
            background-color: #fff !important;
        }
    `;
    document.head.appendChild(style);


    const profitLineStyle = document.createElement('style');
    profitLineStyle.id = 'qx-profit-line-style';
    profitLineStyle.textContent = `
    .qx-profit-card{
      position:relative!important;
    }

    .qx-profit-original-line{
      border-bottom-color:transparent!important;
    }

    .qx-profit-line{
      position:absolute!important;
      height:2px!important;
      left:10px!important;
      bottom:auto!important;
      top:39px!important;
      width:0%;
      background:#0faf59!important;
      z-index:999999!important;
      pointer-events:none!important;
      transition: width .35s ease, background-color .2s ease!important;
    }
    `;
    document.head.appendChild(profitLineStyle);


    const countryFlagMap = {
        'Bangladesh': 'bd',
        'India': 'in',
        'United States': 'us',
        'United Kingdom': 'gb',
        'Canada': 'ca',
        'Australia': 'au',
        'United Arab Emirates': 'ae',
        'Saudi Arabia': 'sa',
        'Pakistan': 'pk'
    };


    function findCard(){
      // কোয়টক্স লিডারবোর্ডের ইউজার কার্ড ট্র্যাক করার জন্য ফ্লেক্সিবল ফাইন্ডার
      return [...document.querySelectorAll('div, section, article')].find(el => {
        const t = (el.innerText || '').trim();

        return (
          (t.includes('Trader X Team') || t.includes('Your position')) &&
          /\$?-?[\d,]+(?:\.\d+)?/.test(t) &&
          el.getBoundingClientRect().width > 200 &&
          el.getBoundingClientRect().height > 40
        );
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

      const startCap = parseFloat(
          (window.qxCustomStartingCapital || '').replace(/[^0-9.]/g, '')
      ) || 0;

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

          if(
              value !== '-' &&
              value !== '100+' &&
              !/^\d{1,3}$/.test(value)
          ){
              return;
          }

          const parent = el.parentElement;
          const grandParent = parent ? parent.parentElement : null;
          const parentText = parent ? (parent.textContent || '') : '';
          const grandText = grandParent ? (grandParent.textContent || '') : '';

          if(
              parentText.includes('position') ||
              grandText.includes('position')
          ){
              el.textContent = positionText;
              found = true;
          }
      });

      if(found) return;

      const walker = document.createTreeWalker(
          card,
          NodeFilter.SHOW_TEXT,
          null,
          false
      );

      let node;
      while(node = walker.nextNode()){
          const value = (node.textContent || '').trim();

          if(
              value !== '-' &&
              value !== '100+' &&
              !/^\d{1,3}$/.test(value)
          ){
              continue;
          }

          const parent = node.parentElement;
          if(!parent) continue;

          const parentText = parent.parentElement ? (parent.parentElement.textContent || '') : '';

          if(parentText.includes('position')){
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

      const startCap = parseFloat(
          (window.qxCustomStartingCapital || '').replace(/[^0-9.]/g, '')
      ) || 0;

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

      // কোয়টক্স লিডারবোর্ডের লিস্ট রো গুলো স্ক্যান করার জন্য সিলেক্টর
      document.querySelectorAll('div[class*="row"], div[class*="item"], li, tr').forEach(el => {
          if(card.contains(el)) return;

          const text = (el.innerText || '').replace(/\s+/g, ' ').trim();

          if(!text || text.length > 180) return;

          const match = text.match(/^(\d{1,3})\s+.*?\$([\d,]+(?:\.\d+)?)(?:\+)?\s*$/);
          if(!match) return;

          const rank = parseInt(match[1], 10);
          const amount = parseFloat(match[2].replace(/,/g, ''));

          if(
              !Number.isFinite(rank) ||
              !Number.isFinite(amount) ||
              rank < 1 ||
              rank > 999 ||
              amount <= 0
          ){
              return;
          }

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

      const positionText =
          actualRank >= 1 && actualRank <= 20
          ? String(actualRank)
          : '100+';

      setLeaderboardPosition(card, positionText);
    }


    function fixLeaderboardUI(){
        const currentBalance = getBalance();

        if(
            currentBalance !== null &&
            (!window.qxCustomStartingCapital || window.qxCustomStartingCapital === '0')
        ){
            window.qxCustomStartingCapital = currentBalance.toString();
        }

        const customName = window.qxCustomName || 'Trader X Team';
        const startCap = parseFloat(
            (window.qxCustomStartingCapital || '').replace(/[^0-9.]/g, '')
        ) || currentBalance || 0;

        const profitAmount = currentBalance !== null ? currentBalance - startCap : 0;
        const absProfit = Math.abs(profitAmount);

        const formattedProfit = '$' + absProfit.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        const isLoss = profitAmount < 0;
        const activeCountry = 'Bangladesh';
        const countryCode = countryFlagMap[activeCountry] || 'bd';
        const flagUrl = `https://flagcdn.com/24x18/${countryCode}.png`;

        const divs = document.querySelectorAll('div');

        for(let div of divs){
            let divText = div.textContent || '';
            if(
                (divText.includes('position') || divText.includes('Trader X Team')) &&
                !divText.includes('Leader Board') &&
                divText.length < 400
            ){
                let nameSet = false;
                let textElements = div.querySelectorAll('div, span');

                for(let el of textElements){
                    if(el.children.length === 0){
                        let t = el.textContent.trim();

                        if(t.includes('$') || (t.startsWith('-') && t.includes('.'))){
                            el.textContent = formattedProfit;
                            el.style.setProperty(
                                'color',
                                isLoss ? '#ef4444' : '#0faf59',
                                'important'
                            );
                        }else if(
                            t &&
                            !t.includes('How does') &&
                            !t.includes('of the Day') &&
                            !t.includes('position') &&
                            !t.includes('100+') &&
                            !t.includes('-')
                        ){
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

        if(accountItems.length >= 2){
            const firstTextEl = accountItems[0].querySelector('div, span');

            if(firstTextEl && firstTextEl.children.length === 0){
                let t = firstTextEl.textContent.trim();
                if(t.includes('Demo') || t.includes('Demo Account')){
                    firstTextEl.textContent = 'Live Account';
                }
            }

            const secondTextEl = accountItems[1].querySelector('div, span');

            if(secondTextEl && secondTextEl.children.length === 0){
                let t = secondTextEl.textContent.trim();
                if(t.includes('Live') || t.includes('Live Account')){
                    secondTextEl.textContent = 'Demo Account';
                }
            }
        }else{
            const elements = document.querySelectorAll('div, span');
            let foundLive = false;

            for(let el of elements){
                if(el.children.length === 0){
                    let text = el.textContent.trim();

                    if(text === 'Live Account'){
                        if(!foundLive){
                            foundLive = true;
                        }else{
                            el.textContent = 'Demo Account';
                        }
                    }
                }
            }
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

      live.childNodes.forEach(n => {
          if(n.nodeType === Node.TEXT_NODE){
              let t = n.textContent.toUpperCase();
              if(t.includes('DEMO')){
                  n.textContent = n.textContent.replace(/demo/gi, '').replace(/\s+/g, ' ');
              }
          }
      });

      let hasLiveText = false;

      live.childNodes.forEach(n => {
          if(
              n.nodeType === Node.TEXT_NODE &&
              !n.textContent.includes('Leader Board') &&
              n.textContent.includes('LIVE')
          ){
              hasLiveText = true;
          }
      });

      if(!hasLiveText && !live.querySelector('span')){
          const textNode = document.createTextNode('LIVE ');
          live.insertBefore(textNode, live.firstChild.nextSibling);
      }
    }


    function fixBalancesAndUI(){
        let mainBalance = "$0.00";
        const headerElements = document.querySelectorAll('div, span');

        for(let el of headerElements){
            let text = el.textContent.trim();

            if(
                (text.startsWith('$') && text.length > 1) &&
                (
                    el.closest('header') ||
                    el.closest('div[class*="panel"]') ||
                    el.textContent.includes('DEMO') ||
                    el.textContent.includes('LIVE')
                )
            ){
                if(text.includes('$') && !text.includes('The daily limit')){
                    let cleanText = text.replace(/[^$0-9.,]/g, '').trim();

                    if(cleanText.length > 1 && cleanText !== '$0.00'){
                        mainBalance = cleanText;
                    }
                }
            }
        }

        const elements = document.querySelectorAll('div, span');

        elements.forEach(el => {
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


    function fix(){
        const balance = getBalance() || 0;
        fixAccountAndIcon(balance);
        fixBalancesAndUI();
        fixLeaderboardUI();
        updateProfitLine();
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

        fixLeaderboardUI();
        updateProfitLine();
    }, 50);


    window.qxProfitLine = setInterval(updateProfitLine, 300);


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

    console.log("Quotex leaderboard fully optimized and fixed.");

})();
