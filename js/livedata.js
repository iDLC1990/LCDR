/* Статистика по днях (Statistic per day): LCDR Live Data, версія для сайту.
   Основа логіки: оригінальний дашборд LCDR LIVE DATA 2026.
   Підключення: <script src="js/livedata.js"></script> ПІСЛЯ js/app.js.
   Контейнер: <section id="livePage">. Дані завантажуються при першому відкритті сторінки. */
(function () {
  const apiKey = 'AIzaSyCP7tzYiGwIZ6cymLAlv_9QgPIEshnRgqI';
  const sheetId = '10W03bvKlVFlIUcxsHkzP_v_13gtnYRBmnrrO0ujB1bU';
  const sheetIdNew = '1Ets--Hho-SK_x6J9Xy3oVA7ILtYKx4gscBOwy6t4PTs';
  const sheetIdArchive = '1UWu4bcuHg6NHhK8ZvjDlQAIue6R1FLBlmAlBhHBj-D8';
  const helperSheetGid = 1460654843;

  const BG_BASE = 'https://raw.githubusercontent.com/iDLC1990/status-dashboard/main/';
  const BACKGROUNDS = [
    'pexels-carlos-oliva-1966452-3586966.jpg',
    'pexels-eberhardgross-1367192.jpg',
    'pexels-eberhardgross-640781.jpg',
    'pexels-francesco-ungaro-1526713.jpg',
    'pexels-gochrisgoxyz-1643409.jpg',
    'pexels-iriser-1366957.jpg',
    'pexels-joshkjack-135018.jpg',
    'pexels-pixabay-326055.jpg',
    'pexels-rickyrecap-2627063.jpg',
    'pexels-rpnickson-2478248.jpg',
    'pexels-sanaan-3075993.jpg',
    'pexels-simon73-1183099.jpg',
    'pexels-pengwhan-1767434.jpg',
    'pexels-harry-shum-17627821-15984177.jpg',
    'pexels-am83-12709111.jpg',
    'pexels-njeromin-12766489.jpg',
    'pexels-pixabay-533923.jpg',
    'pexels-robshumski-1903702.jpg',
    'pexels-elti-meshau-107925-333850.jpg',
    'pexels-harun-tan-2311991-3980364.jpg',
    'pexels-joyston-judah-331625-933054.jpg',
    'pexels-francesco-ungaro-464336.jpg',
    'pexels-pixabay-35857.jpg',
    'pexels-jahoo-388415.jpg',
    'pexels-therato-1933320.jpg',
    'pexels-quang-nguyen-vinh-222549-2166711.jpg',
    'pexels-thanhhoa-tran-640546-1462892.jpg',
    'pexels-jplenio-3131634.jpg',
    'pexels-quang-nguyen-vinh-222549-2563129.jpg',
    'pexels-david-bartus-43782-2379653.jpg',
    'pexels-dreamypixel-547114.jpg',
    'pexels-sebastiaan9977-1097456.jpg',
    'pexels-souvenirpixels-1519088.jpg',
    'pexels-stywo-1261731.jpg',
    'pexels-thatguycraig000-1563355.jpg',
    'pexels-thatguycraig000-1563356.jpg'
  ];

  const diagonalMapPrefix = {'WH8':55,'WC8':32,'WU0':43,'SQ1':43,'WM5':50,'WC7':32,'WP5':65,'WW1':75,'WM6':50};
  const diagonalMapSuffix = {'860':86,'850':85,'750':75,'700':70,'650':65,'580':58,'575':58,'550':55,'545':55,'500':50,'498':50,'495':50,'490':50,'438':43,'435':43,'430':43,'428':43,'425':43,'420':43,'418':43,'415':43,'398':43,'395':43,'390':43,'348':32,'345':32,'340':32,'328':32,'325':32,'320':32,'318':32,'315':32,'278':27,'275':27,'270':27,'248':24,'245':24,'240':24,'238':24,'235':24,'230':24};

  const CSS = `
#livePage { position: relative; display: block; padding: 0; overflow: auto; color: #fff; font-family: Arial, sans-serif; }
#livePage.helper-docked { padding-right: 310px; box-sizing: border-box; }

#livePage .header { display:flex; justify-content:space-between; align-items:center; padding:20px 10%; background-color: rgba(17,17,17,0.7); border-bottom: 1px solid rgba(0,128,128,0.3); }
#livePage .header h1 { margin:0; color:#008080; font-size:24px; cursor:pointer; transition:0.3s; }
#livePage .header h1:hover { text-shadow: 0 0 10px #0ff; }
#livePage .date-info { color:#008080; font-size:18px; font-weight:bold; }

#livePage .table-container { width:95%; max-width:1200px; margin:24px auto; transition: all 0.4s ease-in-out; }

#livePage .fullscreen-mode { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 90vh !important; z-index: 9999 !important; background: rgba(0,0,0,0.4) !important; backdrop-filter: blur(8px); display: flex !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; margin: 0 !important; max-width: none !important; overflow: hidden !important; }
#livePage .fullscreen-mode #overview-block { width: 90vw !important; height: 90vh !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; border-radius: 10px; box-shadow: 0 0 30px rgba(0,128,128,0.5); }
#livePage .fullscreen-mode .table-header { flex-shrink: 0; padding: 1.5vh 2vw !important; }
#livePage .fullscreen-mode table { flex-grow: 1; height: 100% !important; background-color: rgba(20,20,20,0.95); margin: 0; }
#livePage .fullscreen-mode th, #livePage .fullscreen-mode td { padding: 0.3vh 1vw !important; font-size: min(1.2vw, 2.5vh) !important; height: 1% !important; }
@media (max-width: 1200px) {
  #livePage .fullscreen-mode th, #livePage .fullscreen-mode td { font-size: min(14px, 2.5vh) !important; }
}

#livePage .table-header { background-color:#008080; color:#000; font-weight:bold; font-size:18px; padding:10px 16px; border-radius:10px 10px 0 0; display:flex; justify-content:space-between; align-items:center; position:relative; }
#livePage #table-title { cursor:pointer; user-select:none; transition: text-shadow 0.3s; }
#livePage #table-title:hover { text-shadow: 0 0 6px rgba(255,255,255,0.8); }
#livePage #live-clock { position:absolute; left:50%; transform:translateX(-50%); color:#0ff; background:#000; padding:0 8px; border-radius:4px; font-family:monospace; font-weight:bold; font-size:20px; }

#livePage .toggle-btn { margin:8px 0; font-size:20px; cursor:pointer; background:none; border:none; color:#0ff; padding:5px 10px; transition:0.3s; }
#livePage .toggle-btn:hover { text-shadow: 0 0 8px #0ff; }

#livePage table { width:100%; border-collapse:collapse; background-color:#5555559e; border-radius:0 0 10px 10px; }
#livePage table, #livePage th, #livePage td { border:1px solid #fff; }
#livePage th, #livePage td { padding:10px; text-align:center; }
#livePage th { font-weight:bold; font-size:16px; background: rgba(0,128,128,0.2); }
#livePage td { font-size:16px; }
#livePage td.ld-name { cursor:pointer; }
#livePage .total-row { font-weight:bold; background-color:#333; color:#008080; }
#livePage .sum-col { background-color: rgba(0,0,0,0.3); color:#0ff; font-weight:bold; }

/* ----- Пошук: перемикач Pojedynczy / Zbiorczy ----- */
#livePage .search-row { display:flex; gap:10px; align-items:stretch; width:100%; max-width:720px; margin:20px auto 0; }
#livePage #search { flex:1; min-width:0; padding:12px; font-size:16px; border-radius:5px; border:1px solid #008080; background: rgba(0,0,0,0.6); color:#fff; outline:none; box-sizing:border-box; }
#livePage #bulk-input { flex:1; min-width:0; min-height:90px; background:#000; color:#0ff; border:1px solid #008080; padding:10px; font-family:monospace; resize:vertical; box-sizing:border-box; outline:none; }
#livePage .mode-switch { display:flex; flex-shrink:0; border:1px solid #008080; border-radius:5px; overflow:hidden; }
#livePage .mode-switch button { background: rgba(0,0,0,0.6); color:#0ff; border:none; padding:0 14px; cursor:pointer; font-weight:bold; font-size:13px; }
#livePage .mode-switch button.active { background:#008080; color:#000; }
#livePage .bulk-actions { display:flex; justify-content:center; width:100%; max-width:720px; margin:10px auto 0; }
#livePage #bulk-run { background:#008080; color:#000; border:none; padding:10px 25px; cursor:pointer; font-weight:bold; border-radius:4px; }

#livePage #search-result { margin-top:15px; }
#livePage #search-result table { margin-top:10px; border:2px solid #0ff; background-color:#333; }

@keyframes blink-active {
  0% { background-color: rgba(0,128,128,0.3); }
  50% { background-color: rgba(0,255,255,0.6); }
  100% { background-color: rgba(0,128,128,0.3); }
}
#livePage .latest-record { animation: blink-active 1.5s infinite; border: 2px solid #0ff !important; font-weight: bold; }

#livePage #modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.8); justify-content:center; align-items:center; z-index:10000; }
#livePage #modal.show { display:flex; }
#livePage #modal-content { background:#1a1a1a; color:#0ff; padding:20px; border:2px solid #008080; border-radius:10px; max-height:85%; overflow:auto; width:90%; max-width:1000px; box-shadow: 0 0 20px rgba(0,255,255,0.2); }
#livePage #modal-close { background:#008080; color:#000; border:none; padding:8px 20px; cursor:pointer; font-weight:bold; margin-bottom:15px; border-radius:4px; }

@media (max-width: 1080px) {
  #livePage .table-container { width:100%; }
  #livePage .header { padding:12px 0%; }
  #livePage .header h1 { font-size:12px; }
}

@keyframes rgb-text {
  0% { color:#ff0000; text-shadow:0 0 8px #ff0000; }
  33% { color:#00ff00; text-shadow:0 0 8px #00ff00; }
  66% { color:#0000ff; text-shadow:0 0 8px #0000ff; }
  100% { color:#ff0000; text-shadow:0 0 8px #ff0000; }
}
#livePage .king-user { font-weight:bold !important; animation: rgb-text 3s infinite linear; }
#livePage .king-user::before { content:"👑 "; font-size:1.2em; animation:none; text-shadow: 0 0 5px rgba(255,215,0,0.7); }

#livePage .stepan-user { font-weight:bold !important; font-size:0 !important; }
#livePage .stepan-user::before { content:"🤪🤡 STEPANNNNNN "; font-size:14px; color:#fff; text-shadow: 0 0 8px #ff00ff; }

#livePage .owl-user { font-weight:bold !important; color:#fff; text-shadow:0 0 5px #fff; }
#livePage .owl-user::before { content:"🦉 "; font-size:1.2em; text-shadow:none; }
#livePage .flower-user { font-weight:bold !important; color:#fff; text-shadow:0 0 5px #fff; }
#livePage .flower-user::before { content:"🌸 "; font-size:1.2em; text-shadow:none; }
#livePage .pl-user { font-weight:bold !important; color:#fff; text-shadow:0 0 5px #ffb6c1; }
#livePage .pl-user::before { content:"🌷 "; font-size:1.2em; text-shadow:none; }
#livePage .boxer-user { font-weight:bold !important; color:#fff; }
#livePage .boxer-user::before { content:"🥊🥊 "; font-size:1.2em; }
#livePage .heart-user { font-weight:bold !important; color:#fff; }
#livePage .heart-user::before { content:"🩷 "; font-size:1.2em; color:#ff69b4; text-shadow:0 0 5px #ff69b4; }
#livePage .cat-user { font-weight:bold !important; color:#fff; text-shadow:0 0 5px #fff; }
#livePage .cat-user::before { content:"🐱 😼"; font-size:1.2em; text-shadow:none; }

/* ----- Помічник-робот ----- */
#livePage #helper-widget { --eye:#0ff; position:fixed; top:60px; right:14px; width:280px; z-index:5000; text-align:center; display:flex; flex-direction:column; align-items:center; }
#livePage #helper-widget.st-ok { --eye:#4cff7a; }
#livePage #helper-widget.st-warn { --eye:#ffd84c; }
#livePage #helper-widget.st-bad { --eye:#ff5555; }
#livePage #helper-widget.st-none { --eye:#aaaaaa; }

#livePage #helper-label { background:#008080; color:#000; font-weight:bold; font-size:15px; padding:5px 14px; border-radius:14px; box-shadow:0 0 12px rgba(0,128,128,0.6); margin-bottom:4px; user-select:none; }
#livePage #robot-svg { width:170px; height:auto; cursor:pointer; display:block; overflow:visible; filter: drop-shadow(0 0 10px rgba(0,255,255,0.25)); }
#livePage #robot-body-group { animation: robot-float 3s ease-in-out infinite; }
@keyframes robot-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }

#livePage .robot-eye-fill { fill: var(--eye); transition: fill .3s; }
#livePage .robot-eye-stroke { stroke: var(--eye); transition: stroke .3s; }

#livePage #robot-antenna-light { animation: robot-pulse 1.4s ease-in-out infinite; }
@keyframes robot-pulse { 0%,100% { opacity:1; } 50% { opacity:.3; } }
#livePage #helper-widget.st-load #robot-antenna-light { animation-duration: .3s; }

#livePage #robot-eyes { animation: robot-blink 5s infinite; transform-origin: 100px 78px; }
@keyframes robot-blink { 0%,94%,100% { transform: scaleY(1); } 97% { transform: scaleY(.1); } }

#livePage #helper-widget.st-bad #robot-body-group { animation: robot-shake .4s linear 2; }
@keyframes robot-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }

#livePage #robot-mouth { transform-origin: 100px 106px; }
#livePage #robot-mouth.talking { animation: robot-talk .18s ease-in-out infinite alternate; }
@keyframes robot-talk { from { transform: scaleY(1); } to { transform: scaleY(1.9); } }

#livePage #robot-arm-r { transform-origin: 158px 152px; }
#livePage #helper-widget.st-ok #robot-arm-r { animation: robot-wave .45s ease-in-out 6 alternate; }
@keyframes robot-wave { from { transform: rotate(0deg); } to { transform: rotate(-40deg); } }

#livePage #helper-bubble { position:relative; width:100%; box-sizing:border-box; margin-top:14px; background: rgba(15,20,24,0.93); border:2px solid var(--eye); border-radius:14px; padding:12px; box-shadow: 0 0 18px rgba(0,0,0,0.6); transition: border-color .3s; }
#livePage #helper-bubble::before { content:""; position:absolute; top:-10px; left:50%; width:16px; height:16px; transform: translateX(-50%) rotate(45deg); background: rgba(15,20,24,0.93); border-left:2px solid var(--eye); border-top:2px solid var(--eye); transition: border-color .3s; }
#livePage #helper-widget:not(.open) #helper-bubble { display:none; }

#livePage #helper-input { width:100%; padding:10px; font-size:14px; border-radius:6px; border:1px solid #008080; background: rgba(0,0,0,0.6); color:#fff; outline:none; box-sizing:border-box; }
#livePage #helper-result { margin-top:10px; text-align:center; }
#livePage #helper-result .helper-msg { font-size:14px; margin:4px 0; }
#livePage .helper-status { font-size:26px; font-weight:bold; padding:10px 6px; border-radius:8px; border:2px solid currentColor; background: rgba(0,0,0,0.5); word-break: break-word; }
#livePage .helper-status.ok { color:#4cff7a; }
#livePage .helper-status.warn { color:#ffd84c; }
#livePage .helper-status.bad { color:#ff5555; }
#livePage .helper-meta { color:#aaa; font-size:12px; margin:6px 0 8px; }
#livePage #helper-result table { font-size:12px; margin-top:6px; }
#livePage #helper-result th, #livePage #helper-result td { padding:4px; font-size:12px; cursor:default; }

@media (max-width: 1299px) {
  #livePage #helper-widget { top:auto; bottom:10px; width:260px; }
  #livePage #robot-svg { width:100px; }
  #livePage #helper-bubble { order:-1; margin:0 0 14px 0; }
  #livePage #helper-bubble::before { top:auto; bottom:-10px; transform: translateX(-50%) rotate(225deg); }
}
`;

  const MARKUP = `
<div class="header">
  <h1 id="main-title" title="Kliknij, aby pokazać tabelę na pełnym ekranie">LCDR LIVE DATA 2026</h1>
  <div class="date-info" id="date-info">DATE: --</div>
</div>

<div class="table-container">
  <div class="search-row">
    <input type="text" id="search" placeholder="Podaj SN / pn części (Enter)" autocomplete="off">
    <textarea id="bulk-input" placeholder="Wklej numery SN (każdy w nowej linii). Ctrl+Enter = szukaj" style="display:none"></textarea>
    <div class="mode-switch" id="mode-switch">
      <button type="button" data-mode="single" class="active">Pojedynczy</button>
      <button type="button" data-mode="bulk">Zbiorczy</button>
    </div>
  </div>
  <div class="bulk-actions" id="bulk-actions" style="display:none">
    <button type="button" id="bulk-run">SZUKAJ</button>
  </div>
  <div id="search-result"></div>
</div>

<div id="helper-widget" class="st-idle open">
  <div id="helper-label">Co Się Stało</div>
  <svg id="robot-svg" viewBox="0 0 200 235" xmlns="http://www.w3.org/2000/svg">
    <g id="robot-body-group">
      <line x1="100" y1="40" x2="100" y2="22" stroke="#008080" stroke-width="5" stroke-linecap="round"/>
      <circle id="robot-antenna-light" class="robot-eye-fill" cx="100" cy="16" r="8"/>
      <rect x="26" y="70" width="14" height="32" rx="6" fill="#1f2b32" stroke="#008080" stroke-width="3"/>
      <rect x="160" y="70" width="14" height="32" rx="6" fill="#1f2b32" stroke="#008080" stroke-width="3"/>
      <rect x="40" y="40" width="120" height="92" rx="24" fill="#2b3a42" stroke="#008080" stroke-width="4"/>
      <rect x="54" y="54" width="92" height="64" rx="16" fill="#0b1418"/>
      <g id="robot-eyes">
        <circle cx="78" cy="78" r="14" fill="#e8ffff"/>
        <circle cx="122" cy="78" r="14" fill="#e8ffff"/>
        <circle id="pupil-l" class="robot-eye-fill" cx="78" cy="78" r="7"/>
        <circle id="pupil-r" class="robot-eye-fill" cx="122" cy="78" r="7"/>
      </g>
      <path id="robot-mouth" class="robot-eye-stroke" d="M82 104 Q100 110 118 104" fill="none" stroke-width="4" stroke-linecap="round"/>
      <rect x="90" y="132" width="20" height="10" fill="#1f2b32"/>
      <rect x="55" y="142" width="90" height="70" rx="18" fill="#2b3a42" stroke="#008080" stroke-width="4"/>
      <circle class="robot-eye-fill" cx="100" cy="166" r="9"/>
      <rect x="72" y="188" width="56" height="6" rx="3" fill="#0b1418"/>
      <g>
        <rect x="34" y="148" width="16" height="52" rx="8" fill="#2b3a42" stroke="#008080" stroke-width="3"/>
        <circle cx="42" cy="204" r="9" fill="#1f2b32" stroke="#008080" stroke-width="3"/>
      </g>
      <g id="robot-arm-r">
        <rect x="150" y="148" width="16" height="52" rx="8" fill="#2b3a42" stroke="#008080" stroke-width="3"/>
        <circle cx="158" cy="204" r="9" fill="#1f2b32" stroke="#008080" stroke-width="3"/>
      </g>
      <rect x="68" y="212" width="26" height="14" rx="6" fill="#1f2b32" stroke="#008080" stroke-width="3"/>
      <rect x="106" y="212" width="26" height="14" rx="6" fill="#1f2b32" stroke="#008080" stroke-width="3"/>
    </g>
  </svg>
  <div id="helper-bubble">
    <input type="text" id="helper-input" placeholder="Podaj SN panelu (Enter)" autocomplete="off">
    <div id="helper-result"></div>
  </div>
</div>

<div class="table-container">
  <button id="overview-toggle" class="toggle-btn"> </button>
  <div id="overview-block">
    <div class="table-header">
      <span id="table-title" title="Kliknij, aby skopiować SN">--.--.----</span>
      <span id="live-clock">00:00:00</span>
    </div>
    <table id="combined-table">
      <thead>
        <tr>
          <th>NAME</th><th>NDF</th><th>OK</th><th>WAITING</th><th>SCRAP TTL</th><th>SCRAP PNLA</th><th class="sum-col">SUMA</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>

<div class="table-container">
  <button id="diag-toggle" class="toggle-btn"> </button>
  <div id="diag-block">
    <div class="table-header">FI Station Diagonals</div>
    <table id="diag-table">
      <thead></thead>
      <tbody></tbody>
    </table>
  </div>
</div>

<div id="modal">
  <div id="modal-content">
    <button id="modal-close">ZAMKNIJ</button>
    <div id="modal-body"></div>
  </div>
</div>
`;

  const $ = (id) => document.getElementById(id);
  let combinedDataCache = [];
  let isPnVisible = false;
  let bulkMode = false;
  let started = false;
  let bgIndex = 5;
  let pnCache = { rows: null, time: 0 };
  let helperSheetTitle = null;
  let robotTalkTimer = null;
  let titleBusy = false;
  let titleTimer = null;

  const ROBOT_MOUTHS = {
    idle: 'M82 104 Q100 110 118 104',
    ok:   'M80 100 Q100 117 120 100',
    warn: 'M84 106 L116 106',
    bad:  'M80 111 Q100 97 120 111',
    none: 'M92 106 Q100 97 108 106 Q100 115 92 106',
    load: 'M88 106 L112 106'
  };

  function isVisible() {
    const r = $('livePage');
    return !!r && r.style.display !== 'none';
  }

  function getUserCustomClass(name) {
    switch (name) {
      case 'KOVALCHYK Y.': return 'king-user';
      case 'KUKU O.': return 'owl-user';
      case 'BŁASZKOWSKA M.': return 'pl-user';
      case 'POKALCHUK A.': return 'flower-user';
      case 'NIKOLAIEV D.': return 'boxer-user';
      case 'YAROSHENKO L.': return 'heart-user';
      case 'ZAHUBYPALETS K.': return 'cat-user';
      case 'ULANOVYCH R.': return 'stepan-user';
      default: return '';
    }
  }

  function escHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  // Сьогоднішня дата у форматі 18.10.2026
  function todayStr() {
    const d = new Date();
    return [String(d.getDate()).padStart(2, '0'), String(d.getMonth() + 1).padStart(2, '0'), d.getFullYear()].join('.');
  }

  function extractDiagonal(serial) {
    if (!serial) return null;
    const s = serial.trim();
    return diagonalMapPrefix[s.substring(0, 3)] ||
           diagonalMapSuffix[s.substring(3, 6)] ||
           diagonalMapSuffix[s.slice(-3)] || null;
  }

  function buildSheetURL(spreadsheetId, sheetName) {
    return `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`;
  }

  async function getData(sheetName, spreadsheetId = sheetId) {
    try {
      const res = await fetch(buildSheetURL(spreadsheetId, sheetName));
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      return data.values || [];
    } catch (e) {
      console.error(`Fetch error ${sheetName}:`, e);
      return null;
    }
  }

  async function fetchAndCacheData() {
    try {
      const [s1, s2, s3, s4] = await Promise.all([
        getData('FI Station KOVALCHYK Y.', sheetId),
        getData('FI Station 2 ULANOVYCH.R', sheetId),
        getData('2024', sheetIdArchive),
        getData('123', sheetIdNew)
      ]);
      if (!s1 && !s2 && !s3 && !s4) return false;

      const mapR = (r, insp) => ({
        date: r[0] || '',
        serial: (r[2] || '').trim(),
        type: (r[3] || '').trim().toUpperCase(),
        status: r[4] || '',
        name: r[5] || '',
        nameG: r[6] || '',
        ocAfterRepair: r[9] || '',
        comment: r[10] || '',
        inspector: insp
      });

      combinedDataCache = [
        ...(s1 ? s1.slice(1) : []).map(r => mapR(r, 'KOVALCHYK Y.')),
        ...(s2 ? s2.slice(1) : []).map(r => mapR(r, 'ULANOVYCH.R')),
        ...(s3 ? s3.slice(1) : []).map(r => mapR(r, 'ARCHIVE')),
        ...(s4 ? s4.slice(1) : []).map(r => mapR(r, '123'))
      ];
      return true;
    } catch (e) {
      console.error('Buffer update failed:', e);
      return false;
    }
  }

  function parseDatePart(val) {
    if (!val) return null;
    const first = val.split(' ')[0].trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(first)) return new Date(first);
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(first)) {
      const [d, m, y] = first.split('.');
      return new Date(`${y}-${m}-${d}`);
    }
    const parsed = Date.parse(first);
    return isNaN(parsed) ? null : new Date(parsed);
  }

  function getLastDate(data) {
    const dates = data.map(r => parseDatePart(r.date)).filter(d => d instanceof Date && !isNaN(d));
    return dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
  }

  function toggleBlock(id) {
    const b = $(id);
    b.style.display = window.getComputedStyle(b).display === 'none' ? 'block' : 'none';
  }

  function setBg(i) {
    $('livePage').style.background =
      `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)) center center / cover no-repeat fixed, ` +
      `url('${BG_BASE + BACKGROUNDS[i]}') center center / cover no-repeat fixed`;
  }

  function closeModal() {
    $('modal').classList.remove('show');
  }

  function openModal(name) {
    const dInfoText = $('date-info').textContent;
    const lastDateStr = dInfoText.includes(':') ? dInfoText.split(':')[1].trim() : '';
    const records = combinedDataCache.filter(r => r.name === name && (r.date || '').split(' ')[0] === lastDateStr);
    const body = $('modal-body');

    if (!records.length) {
      body.innerHTML = '<p>Brak danych dla wybranego pracownika na dzisiaj.</p>';
    } else {
      let html = '<table><tr><th>Serial</th><th>Type</th><th>Status</th><th>OC</th><th>COMMENT</th></tr>';
      records.forEach(r => {
        html += `<tr><td>${escHtml(r.serial || '--')}</td><td>${escHtml(r.type || '--')}</td><td>${escHtml(r.status || '--')}</td><td>${escHtml(r.ocAfterRepair || '--')}</td><td>${escHtml(r.comment || '--')}</td></tr>`;
      });
      body.innerHTML = html + '</table>';
    }
    $('modal').classList.add('show');
  }

  function displayCombinedStats(filtered) {
    const stats = {};
    let tNDF = 0, tOK = 0, tWAIT = 0, tTTL = 0, tPNLA = 0, gTotal = 0;

    filtered.forEach(r => {
      const n = r.name || 'UNKNOWN';
      if (!stats[n]) stats[n] = { NDF:0, OK:0, WAITING:0, 'SCRAP TTL':0, 'SCRAP PNLA':0, total:0 };
      if (r.status === 'NDF') { stats[n].NDF++; tNDF++; }
      if (r.status === 'OK') { stats[n].OK++; tOK++; }
      if (r.status === 'WAITING') { stats[n].WAITING++; tWAIT++; }
      if (r.status === 'SCRAP TTL') { stats[n]['SCRAP TTL']++; tTTL++; }
      if (r.status === 'SCRAP PNLA') { stats[n]['SCRAP PNLA']++; tPNLA++; }
      stats[n].total++; gTotal++;
    });

    const tbody = document.querySelector('#combined-table tbody');
    tbody.innerHTML = '';

    Object.entries(stats)
      .sort((a, b) => a[1].OK - b[1].OK)
      .forEach(([name, data]) => {
        const row = document.createElement('tr');
        const userClass = getUserCustomClass(name);
        row.innerHTML = `<td class="ld-name ${userClass}" data-name="${escHtml(name)}">${escHtml(name)}</td><td>${data.NDF}</td><td>${data.OK}</td><td>${data.WAITING}</td><td>${data['SCRAP TTL']}</td><td>${data['SCRAP PNLA']}</td><td class="sum-col">${data.total}</td>`;
        tbody.appendChild(row);
      });

    const tr = document.createElement('tr');
    tr.className = 'total-row';
    tr.innerHTML = `<td>TOTAL</td><td>${tNDF}</td><td>${tOK}</td><td>${tWAIT}</td><td>${tTTL}</td><td>${tPNLA}</td><td class="sum-col">${gTotal}</td>`;
    tbody.appendChild(tr);
  }

  function displayDiagonalStats(filtered) {
    const diagStats = {};
    filtered.forEach(({ name, serial, status }) => {
      if (status !== 'OK' && status !== 'NDF') return;
      const diag = extractDiagonal(serial);
      if (!diag) return;
      const nm = name || 'UNKNOWN';
      if (!diagStats[nm]) diagStats[nm] = {};
      diagStats[nm][diag] = (diagStats[nm][diag] || 0) + 1;
    });

    const tbody = document.querySelector('#diag-table tbody');
    const thead = document.querySelector('#diag-table thead');
    const allDiagonals = [...new Set(Object.values(diagStats).flatMap(o => Object.keys(o)))].map(Number).sort((a, b) => a - b);

    thead.innerHTML = `<tr><th>NAME</th>${allDiagonals.map(d => `<th>${d}</th>`).join('')}<th class="sum-col">SUMA</th></tr>`;
    tbody.innerHTML = '';

    Object.entries(diagStats).sort().forEach(([name, diags]) => {
      const row = document.createElement('tr');
      const userClass = getUserCustomClass(name);
      row.innerHTML = `<td class="${userClass}">${escHtml(name)}</td>` +
        allDiagonals.map(d => `<td>${diags[d] || 0}</td>`).join('') +
        `<td class="sum-col">${Object.values(diags).reduce((a, b) => a + b, 0)}</td>`;
      tbody.appendChild(row);
    });
  }

  async function updateStats() {
    if (await fetchAndCacheData()) {
      const lastDateStr = getLastDate(combinedDataCache).toISOString().split('T')[0];
      $('date-info').textContent = `DATE: ${lastDateStr}`;
      const filtered = combinedDataCache.filter(r => (r.date || '').split(' ')[0] === lastDateStr);
      displayCombinedStats(filtered);
      displayDiagonalStats(filtered);
    }
  }

  // Часы в шапке и текущая дата в заголовке таблицы
  function startLiveClock() {
    const el = $('live-clock');
    const tick = () => {
      const now = new Date();
      el.textContent = [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map(v => String(v).padStart(2, '0')).join(':');
      if (!titleBusy) $('table-title').textContent = todayStr();
    };
    tick();
    setInterval(tick, 1000);
  }

  // Клик по дате таблицы: копирует SN оператора KOVALCHYK за последний день в буфер
  function copySecret() {
    const title = $('table-title');
    const dInfoText = $('date-info').textContent;
    const lastDateStr = dInfoText.includes(':') ? dInfoText.split(':')[1].trim() : '';

    const records = combinedDataCache.filter(r => {
      const recordDate = parseDatePart(r.date);
      const isSameDay = recordDate && recordDate.toISOString().split('T')[0] === lastDateStr;
      return r.inspector === 'KOVALCHYK Y.' &&
             isSameDay &&
             ['OK', 'NDF', 'SCRAP TTL'].includes(r.status) &&
             r.type !== 'MNT';
    });

    const base = todayStr();
    titleBusy = true;
    clearTimeout(titleTimer);

    if (!records.length) {
      title.textContent = 'Brak danych';
    } else {
      navigator.clipboard.writeText(records.map(r => r.serial).join('\n'))
        .then(() => { title.textContent = `✓ Skopiowano: ${records.length}`; })
        .catch(() => { title.textContent = 'Błąd kopiowania'; });
    }

    titleTimer = setTimeout(() => {
      titleBusy = false;
      title.textContent = base;
    }, 1500);
  }

  // Переключатель поиска: Pojedynczy (как раньше) / Zbiorczy (как раньше по лупе)
  function setMode(mode) {
    bulkMode = mode === 'bulk';
    document.querySelectorAll('#mode-switch button').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    $('search').style.display = bulkMode ? 'none' : 'block';
    $('bulk-input').style.display = bulkMode ? 'block' : 'none';
    $('bulk-actions').style.display = bulkMode ? 'flex' : 'none';
    $('search-result').innerHTML = '';
    isPnVisible = false;
    (bulkMode ? $('bulk-input') : $('search')).focus();
  }

  function runSingleSearch() {
    const serial = $('search').value.trim().toUpperCase();
    const output = $('search-result');
    isPnVisible = false;
    if (!serial) { output.innerHTML = ''; return; }

    const matches = combinedDataCache
      .filter(r => (r.serial || '').trim().toUpperCase() === serial)
      .sort((a, b) => (parseDatePart(b.date) || 0) - (parseDatePart(a.date) || 0));

    if (!matches.length) {
      output.innerHTML = "<p style='color:yellow'>Brak info!</p>";
      return;
    }

    output.innerHTML = `<table><thead><tr><th>Data</th><th>Status</th><th>NAPRAWIACZ</th><th>FINALNA</th><th>INFO</th></tr></thead>
      <tbody>${matches.map((d, i) => {
        const userClass = getUserCustomClass(d.name);
        return `<tr ${i === 0 ? 'class="latest-record"' : ''}><td>${escHtml(d.date)}</td><td>${escHtml(d.status)}</td><td class="${userClass}">${escHtml(d.name)}</td><td>${escHtml(d.nameG)}</td><td>${escHtml(d.comment)}</td></tr>`;
      }).join('')}</tbody></table>`;
  }

  function runBulkSearch() {
    const output = $('search-result');
    isPnVisible = false;

    const snList = $('bulk-input').value.split('\n').map(s => s.trim().toUpperCase()).filter(s => s !== '');
    if (!snList.length) { output.innerHTML = ''; return; }

    const groups = {};
    const notFound = [];

    snList.forEach(sn => {
      const matches = combinedDataCache.filter(r => (r.serial || '').trim().toUpperCase() === sn);
      if (matches.length) {
        matches.sort((a, b) => (parseDatePart(b.date) || 0) - (parseDatePart(a.date) || 0));
        const record = matches[0];
        const wName = record.name || 'UNKNOWN';
        if (!groups[wName]) groups[wName] = [];
        groups[wName].push(record);
      } else {
        notFound.push(sn);
      }
    });

    const sortedNames = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
    let resHtml = '';

    sortedNames.forEach(name => {
      const userClass = getUserCustomClass(name);
      resHtml += `
      <details style="margin-bottom:10px; border:1px solid #008080; border-radius:5px;">
        <summary style="padding:10px; cursor:pointer; background:rgba(0,128,128,0.2); font-weight:bold;">
          <span class="${userClass}" style="display:inline-flex;">${escHtml(name)}</span> — [${groups[name].length}]
        </summary>
        <table style="width:100%; border-collapse:collapse; background:#222;">
          <thead><tr style="background:#333;">
            <th style="border:1px solid #fff; padding:10px;">Serial</th>
            <th style="border:1px solid #fff; padding:10px;">Data</th>
            <th style="border:1px solid #fff; padding:10px;">Status</th>
            <th style="border:1px solid #fff; padding:10px;">Finalna</th>
            <th style="border:1px solid #fff; padding:10px;">OC</th>
            <th style="border:1px solid #fff; padding:10px;">Info</th>
          </tr></thead>
          <tbody>
            ${groups[name].map(r => `
              <tr>
                <td style="border:1px solid #fff; padding:10px; text-align:center;">${escHtml(r.serial)}</td>
                <td style="border:1px solid #fff; padding:10px; text-align:center;">${escHtml(r.date)}</td>
                <td style="border:1px solid #fff; padding:10px; text-align:center;">${escHtml(r.status)}</td>
                <td style="border:1px solid #fff; padding:10px; text-align:center;">${escHtml(r.nameG || ' ')}</td>
                <td style="border:1px solid #fff; padding:10px; text-align:center;">${escHtml(r.ocAfterRepair || ' ')}</td>
                <td style="border:1px solid #fff; padding:10px; text-align:center;">${escHtml(r.comment)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </details>`;
    });

    if (notFound.length) {
      resHtml += `
      <details style="margin-top:20px; border:1px solid #ff5555; border-radius:5px;">
        <summary style="padding:10px; cursor:pointer; background:rgba(255,85,85,0.2); color:#ff5555; font-weight:bold;">
          NIE ZNALEZIONO — [${notFound.length}]
        </summary>
        <div style="padding:10px; color:#ff5555;">${escHtml(notFound.join(', '))}</div>
      </details>`;
    }

    output.innerHTML = resHtml || '<p>NIE ZNALEZIONO</p>';
  }

  function onSearchKey(e) {
    if (e.key === 'Enter') runSingleSearch();
  }

  function onBulkKey(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      runBulkSearch();
    }
  }

  /* ----- Аркуш pn: пошук по SN для помічника ----- */
  async function getHelperSheetTitle() {
    if (helperSheetTitle) return helperSheetTitle;
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetIdArchive}?fields=sheets.properties(sheetId,title)&key=${apiKey}`);
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      const sh = (data.sheets || []).find(s => s.properties.sheetId === helperSheetGid);
      if (sh) helperSheetTitle = sh.properties.title;
    } catch (err) {
      console.error('Sheet title lookup failed:', err);
    }
    return helperSheetTitle;
  }

  function cleanSn(v) {
    return String(v || '').replace(/[\s\u200B-\u200D\uFEFF]/g, '').toUpperCase();
  }

  function pnTimestamp(r) {
    const d = String(r[1] || '').trim();
    const t = String(r[2] || '').trim();
    let y = 0, mo = 0, day = 0;
    let m = d.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (m) { day = +m[1]; mo = +m[2]; y = +m[3]; }
    else {
      m = d.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (m) { y = +m[1]; mo = +m[2]; day = +m[3]; }
    }
    if (!y) return 0;
    const tm = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    const h = tm ? +tm[1] : 0, mi = tm ? +tm[2] : 0, sec = tm ? +(tm[3] || 0) : 0;
    return new Date(y, mo - 1, day, h, mi, sec).getTime();
  }

  async function getPnRows() {
    if (pnCache.rows && Date.now() - pnCache.time < 5000) return pnCache.rows;
    const title = await getHelperSheetTitle();
    const rows = await getData(title || 'pn', sheetIdArchive);
    if (rows) pnCache = { rows, time: Date.now() };
    return rows || pnCache.rows;
  }

  function helperStatusClass(status) {
    const s = (status || '').trim().toUpperCase();
    if (s === 'OK') return 'ok';
    if (s === 'VERIFY' || s === 'SPRAWDZENIE') return 'warn';
    return 'bad';
  }

  function setRobotState(state, talk) {
    const w = $('helper-widget');
    const mouth = $('robot-mouth');
    w.classList.remove('st-idle', 'st-ok', 'st-warn', 'st-bad', 'st-none', 'st-load');
    void w.offsetWidth;
    w.classList.add('st-' + state);
    mouth.setAttribute('d', ROBOT_MOUTHS[state] || ROBOT_MOUTHS.idle);
    clearTimeout(robotTalkTimer);
    mouth.classList.remove('talking');
    if (talk) {
      mouth.classList.add('talking');
      robotTalkTimer = setTimeout(() => mouth.classList.remove('talking'), 1500);
    }
  }

  async function onHelperKey(e) {
    if (e.key !== 'Enter') return;
    const out = $('helper-result');
    const sn = cleanSn(e.target.value);
    if (!sn) { out.innerHTML = ''; setRobotState('idle'); return; }

    setRobotState('load');
    out.innerHTML = "<p class='helper-msg' style='color:#0ff;'>Szukam...</p>";

    const rows = await getPnRows();
    if (!rows) {
      out.innerHTML = "<p class='helper-msg' style='color:#ff5555;'>Błąd pobierania danych (pn)</p>";
      setRobotState('bad', true);
      return;
    }

    const matches = rows
      .map((r, idx) => ({ r, idx, ts: pnTimestamp(r) }))
      .filter(x => cleanSn(x.r[0]) === sn)
      .sort((a, b) => (b.ts - a.ts) || (b.idx - a.idx))
      .map(x => x.r);

    if (!matches.length) {
      out.innerHTML = "<p class='helper-msg' style='color:yellow;'>Brak info o tym SN!</p>";
      setRobotState('none', true);
      return;
    }

    const last = matches[0];
    const status = (last[4] || '--').trim();
    const cls = helperStatusClass(status);

    let html = `
      <div class="helper-status ${cls}">${escHtml(status)}</div>
      <div class="helper-meta">${escHtml(last[1] || '')} ${escHtml(last[2] || '')} • #${escHtml(last[3] || '')}</div>`;

    if (matches.length > 1) {
      html += `<table>
        <thead><tr><th>Data</th><th>Godzina</th><th>Status</th></tr></thead>
        <tbody>${matches.map((r, i) => `
          <tr ${i === 0 ? 'class="latest-record"' : ''}>
            <td>${escHtml(r[1] || '')}</td>
            <td>${escHtml(r[2] || '')}</td>
            <td>${escHtml(r[4] || '--')}</td>
          </tr>`).join('')}
        </tbody></table>`;
    }
    out.innerHTML = html;
    setRobotState(cls === 'ok' ? 'ok' : cls === 'warn' ? 'warn' : 'bad', true);
  }

  function onMouseMove(e) {
    if (!isVisible()) return;
    const r = $('robot-svg').getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height * 0.33;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const k = Math.min(5, dist / 20) / dist;
    const t = `translate(${(dx * k).toFixed(1)} ${(dy * k).toFixed(1)})`;
    $('pupil-l').setAttribute('transform', t);
    $('pupil-r').setAttribute('transform', t);
  }

  function applyHelperLayout() {
    const open = $('helper-widget').classList.contains('open');
    $('livePage').classList.toggle('helper-docked', open && window.innerWidth >= 1300);
  }

  async function refreshPnRecord(showLoader = false) {
    const output = $('search-result');
    if (!output) return;
    if (showLoader) output.innerHTML = "<p style='color:#0ff;'>Pobieranie danych (pn)...</p>";

    const rows = await getData('pn', sheetIdArchive);
    if (!rows || rows.length === 0) {
      output.innerHTML = "<p style='color:yellow;'>Brak danych na arkuszu pn!</p>";
      return;
    }

    const hasHeader = rows.length > 1;
    const headers = hasHeader ? rows[0] : null;
    const lastRow = rows[rows.length - 1];

    let html = '<table>';
    if (headers) html += '<thead><tr>' + headers.map(h => `<th>${escHtml(h)}</th>`).join('') + '</tr></thead>';
    html += '<tbody><tr class="latest-record" style="cursor:pointer;" title="Kliknij, aby skopiować cały wiersz">' +
      lastRow.map(v => `<td>${escHtml(v || '--')}</td>`).join('') + '</tr></tbody></table>';
    output.innerHTML = html;

    const row = output.querySelector('.latest-record');
    if (row) {
      row.addEventListener('click', () => {
        const text = Array.from(row.children).map(td => td.innerText).join('\t');
        navigator.clipboard.writeText(text);
        const old = row.style.color;
        row.style.color = '#0ff';
        setTimeout(() => { row.style.color = old; }, 300);
      });
    }
  }

  async function togglePnRecord() {
    const output = $('search-result');
    if (!output) return;
    if (isPnVisible) {
      output.innerHTML = '';
      isPnVisible = false;
    } else {
      isPnVisible = true;
      await refreshPnRecord(true);
    }
  }

  function exitFullscreen() {
    const ov = $('overview-block').parentElement;
    ov.classList.remove('fullscreen-mode');
    $('diag-block').parentElement.style.display = 'block';
  }

  function toggleFullscreen() {
    const ov = $('overview-block').parentElement;
    if (ov.classList.contains('fullscreen-mode')) {
      exitFullscreen();
    } else {
      ov.classList.add('fullscreen-mode');
      $('diag-block').parentElement.style.display = 'none';
    }
  }

  function closeOverlays() {
    closeModal();
    if ($('overview-block').parentElement.classList.contains('fullscreen-mode')) exitFullscreen();
  }

  function onGlobalKey(e) {
    if (!isVisible()) return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      if (e.key === 'Escape') closeOverlays();
      return;
    }
    if (e.altKey) {
      if (e.code === 'Digit1' || e.key === '1') {
        e.preventDefault();
        toggleBlock('overview-block');
      }
      if (e.code === 'Digit2' || e.key === '2') {
        e.preventDefault();
        $('diag-block').parentElement.style.display = 'block';
        toggleBlock('diag-block');
      }
      if (e.code === 'Digit3' || e.key === '3') {
        e.preventDefault();
        togglePnRecord();
      }
    }
    if (e.key === 'Escape') closeOverlays();
  }

  function init() {
    const root = $('livePage');
    if (!root) return;

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    root.innerHTML = MARKUP;

    $('modal-close').onclick = closeModal;
    $('modal').onclick = (e) => { if (e.target === $('modal')) closeModal(); };

    $('table-title').onclick = copySecret;

    $('combined-table').querySelector('tbody').addEventListener('click', (e) => {
      const td = e.target.closest('.ld-name');
      if (td) openModal(td.dataset.name);
    });

    $('overview-toggle').onclick = () => toggleBlock('overview-block');
    $('diag-toggle').onclick = () => toggleBlock('diag-block');

    $('mode-switch').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) setMode(b.dataset.mode);
    });
    $('search').addEventListener('keydown', onSearchKey);
    $('bulk-input').addEventListener('keydown', onBulkKey);
    $('bulk-run').onclick = runBulkSearch;

    $('main-title').onclick = toggleFullscreen;
    $('helper-input').addEventListener('keydown', onHelperKey);

    $('robot-svg').addEventListener('click', () => {
      const w = $('helper-widget');
      w.classList.toggle('open');
      applyHelperLayout();
      if (w.classList.contains('open')) $('helper-input').focus();
    });

    if (window.innerWidth < 1300) $('helper-widget').classList.remove('open');
    applyHelperLayout();
    window.addEventListener('resize', applyHelperLayout);

    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onGlobalKey, true);

    setInterval(() => {
      if (isPnVisible && isVisible()) refreshPnRecord(false);
    }, 5000);

    startLiveClock();
  }

  // Вызывается сайтом (app.js) при открытии вкладки Statistic per day.
  // Данные и фон загружаются только один раз, при первом открытии.
  window.liveShow = function () {
    if (started) return;
    started = true;
    setBg(bgIndex);
    updateStats();
    setInterval(() => { if (isVisible()) updateStats(); }, 60000);
    setInterval(() => {
      if (!isVisible()) return;
      bgIndex = (bgIndex + 1) % BACKGROUNDS.length;
      setBg(bgIndex);
    }, 180000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
