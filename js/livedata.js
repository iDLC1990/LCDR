/* Статистика по днях (Statistic per day): LCDR Live Data, версія для сайту.
   Підключення: <script src="js/livedata.js"></script> ПІСЛЯ js/app.js.
   Контейнер: <section id="livePage">. Дані завантажуються при першому відкритті сторінки. */
(function () {
  const apiKey = 'AIzaSyCP7tzYiGwIZ6cymLAlv_9QgPIEshnRgqI';
  const sheetId = '10W03bvKlVFlIUcxsHkzP_v_13gtnYRBmnrrO0ujB1bU';
  const sheetIdNew = '1Ets--Hho-SK_x6J9Xy3oVA7ILtYKx4gscBOwy6t4PTs';
  const sheetIdArchive = '1UWu4bcuHg6NHhK8ZvjDlQAIue6R1FLBlmAlBhHBj-D8';
  const helperSheetGid = 1460654843;

  const diagonalMapPrefix = {'WH8':55,'WC8':32,'WU0':43,'SQ1':43,'WM5':50,'WC7':32,'WP5':65,'WW1':75,'WM6':50};
  const diagonalMapSuffix = {'860':86,'850':85,'750':75,'700':70,'650':65,'580':58,'575':58,'550':55,'545':55,'500':50,'498':50,'495':50,'490':50,'438':43,'435':43,'430':43,'428':43,'425':43,'420':43,'418':43,'415':43,'398':43,'395':43,'390':43,'348':32,'345':32,'340':32,'328':32,'325':32,'320':32,'318':32,'315':32,'278':27,'275':27,'270':27,'248':24,'245':24,'240':24,'238':24,'235':24,'230':24};

  const CSS = `
#livePage {
  position: relative; display: block; box-sizing: border-box;
  min-height: 100%; padding: 0 0 30px; overflow: auto;
  background: #000; color: #fff;
  font-family: "Segoe UI", Tahoma, Arial, sans-serif; font-size: 14px;
}

/* ----- Шапка ----- */
#livePage .lv-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 18px 28px; border-bottom: 1px solid #1f2937; background: #000;
}
#livePage .lv-title { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.3px; cursor: pointer; user-select: none; }
#livePage .lv-title:hover { color: #4d94ff; }
#livePage .lv-date { font-size: 14px; font-weight: 600; color: #4d94ff; }

/* ----- Блоки ----- */
#livePage .lv-wrap { width: 95%; max-width: 1200px; margin: 24px auto; transition: all 0.3s ease; }
#livePage .lv-card {
  background: #0e0e0e; border: 1px solid #1f2937; border-radius: 10px;
  overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
}
#livePage .lv-block-title {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 18px; background: #111827; color: #fff;
  font-size: 15px; font-weight: 700; border-bottom: 1px solid #1f2937;
}
#livePage .lv-block-title span.sub { color: #9CA3AF; font-size: 12px; font-weight: 500; }
#livePage #table-title { cursor: pointer; user-select: none; color: #4d94ff; }
#livePage #table-title:hover { color: #fff; }

#livePage .lv-toggle {
  background: #374151; color: #F3F4F6; border: none; border-radius: 6px;
  padding: 4px 10px; font-size: 12px; cursor: pointer; margin: 0 0 10px auto; display: block;
}
#livePage .lv-toggle:hover { background: #4B5563; }

/* ----- Поиск ----- */
#livePage .lv-search-row { display: flex; gap: 10px; align-items: stretch; max-width: 720px; margin: 0 auto; }
#livePage #search, #livePage #bulk-input {
  flex: 1; min-width: 0; padding: 12px 14px; font-size: 15px;
  background: #111827; color: #fff; border: 1px solid #374151; border-radius: 8px;
  outline: none; box-sizing: border-box; font-family: inherit; transition: border-color 0.2s;
}
#livePage #search:focus, #livePage #bulk-input:focus { border-color: #2563EB; }
#livePage #bulk-input { min-height: 90px; resize: vertical; font-family: Consolas, 'Courier New', monospace; }
#livePage .mode-switch { display: flex; flex-shrink: 0; border: 1px solid #374151; border-radius: 8px; overflow: hidden; }
#livePage .mode-switch button {
  background: #111827; color: #9CA3AF; border: none; padding: 0 14px;
  cursor: pointer; font-weight: 600; font-size: 13px; font-family: inherit; transition: all 0.2s;
}
#livePage .mode-switch button.active { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; }
#livePage .bulk-actions { display: flex; justify-content: center; max-width: 720px; margin: 10px auto 0; }
#livePage #bulk-run {
  background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; border: none;
  padding: 10px 26px; cursor: pointer; font-weight: 600; border-radius: 8px; font-family: inherit;
  box-shadow: 0 0 8px rgba(124,58,237,0.35);
}
#livePage #bulk-run:hover { filter: brightness(1.15); }

#livePage #search-result { margin-top: 16px; }

/* ----- Таблицы ----- */
#livePage table { width: 100%; border-collapse: collapse; background: #0e0e0e; }
#livePage th, #livePage td {
  padding: 10px 12px; text-align: center; border-bottom: 1px solid #1f2937; color: #E5E7EB; font-size: 14px;
}
#livePage th {
  background: #111827; color: #9CA3AF; font-size: 12px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.06em;
}
#livePage tbody tr:hover { background: rgba(255,255,255,0.03); }
#livePage td.ld-name { cursor: pointer; text-align: left; color: #fff; font-weight: 600; }
#livePage td.ld-name:hover { color: #4d94ff; }
#livePage .total-row td { font-weight: 700; background: #111827; color: #4d94ff; }
#livePage .sum-col { color: #4d94ff; font-weight: 700; }

#livePage #search-result table { border: 1px solid #1f2937; border-radius: 8px; overflow: hidden; margin-top: 4px; }
#livePage .latest-record td { background: rgba(37,99,235,0.2); font-weight: 700; color: #fff; }

#livePage .lv-table-wrap { overflow-x: auto; }

/* ----- Модальное окно ----- */
#livePage #modal {
  display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8);
  justify-content: center; align-items: center; z-index: 10000;
}
#livePage #modal.show { display: flex; }
#livePage #modal-content {
  background: #111827; color: #fff; padding: 20px; border: 1px solid #374151; border-radius: 12px;
  max-height: 85%; overflow: auto; width: 90%; max-width: 1000px; box-shadow: 0 10px 25px rgba(0,0,0,0.6);
}
#livePage #modal-close {
  background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; border: none;
  padding: 8px 18px; cursor: pointer; font-weight: 600; margin-bottom: 14px; border-radius: 8px; font-family: inherit;
}

/* ----- Полноэкранный режим ----- */
#livePage .lv-wrap.fullscreen-mode {
  position: fixed !important; top: 0 !important; left: 0 !important;
  width: 100vw !important; height: 100vh !important; max-width: none !important; margin: 0 !important;
  z-index: 9999 !important; background: rgba(0,0,0,0.96); padding: 2vh 2vw; box-sizing: border-box;
  display: flex; flex-direction: column; justify-content: center;
}
#livePage .fullscreen-mode .lv-card { height: 96vh; display: flex; flex-direction: column; }
#livePage .fullscreen-mode .lv-table-wrap { flex-grow: 1; overflow: hidden; display: flex; flex-direction: column; }
#livePage .fullscreen-mode table { flex-grow: 1; height: 100%; }
#livePage .fullscreen-mode th, #livePage .fullscreen-mode td { font-size: min(1.2vw, 2.5vh); padding: 0.3vh 1vw; height: 1%; }

@media (max-width: 1080px) {
  #livePage .lv-wrap { width: 100%; }
  #livePage .lv-header { padding: 12px 16px; }
  #livePage .lv-title { font-size: 15px; }
}
`;

  const MARKUP = `
<div class="lv-header">
  <h1 class="lv-title" id="main-title" title="Kliknij, aby pokazać tabelę na pełnym ekranie">LCDR LIVE DATA 2026</h1>
  <div class="lv-date" id="date-info">DATE: --</div>
</div>

<div class="lv-wrap" id="search-wrap">
  <div class="lv-search-row">
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

<div class="lv-wrap" id="overview-wrap">
  <button type="button" id="overview-toggle" class="lv-toggle">▲</button>
  <div class="lv-card" id="overview-block">
    <div class="lv-block-title">
      <span id="table-title" title="Kliknij, aby skopiować SN">--.--.----</span>
      <span class="sub">FI Station Overview</span>
    </div>
    <div class="lv-table-wrap">
      <table id="combined-table">
        <thead>
          <tr>
            <th></th><th>NDF</th><th>OK</th><th>WAITING</th><th>SCRAP TTL</th><th class="sum-col">SUMA</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  </div>
</div>

<div class="lv-wrap" id="diag-wrap">
  <button type="button" id="diag-toggle" class="lv-toggle">▲</button>
  <div class="lv-card" id="diag-block">
    <div class="lv-block-title"><span>FI Station Diagonals</span></div>
    <div class="lv-table-wrap">
      <table id="diag-table">
        <thead></thead>
        <tbody></tbody>
      </table>
    </div>
  </div>
</div>

<div id="modal">
  <div id="modal-content">
    <button type="button" id="modal-close">ZAMKNIJ</button>
    <div id="modal-body"></div>
  </div>
</div>
`;

  const $ = (id) => document.getElementById(id);
  let combinedDataCache = [];
  let isPnVisible = false;
  let bulkMode = false;
  let started = false;
  let pnCache = { rows: null, time: 0 };
  let helperSheetTitle = null;
  let titleBusy = false;
  let titleTimer = null;

  function isVisible() {
    const r = $('livePage');
    return !!r && r.style.display !== 'none';
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

  function toggleBlock(blockId, btnId) {
    const b = $(blockId);
    const hidden = window.getComputedStyle(b).display === 'none';
    b.style.display = hidden ? 'block' : 'none';
    if (btnId) $(btnId).textContent = hidden ? '▲' : '▼';
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
      let html = '<table><thead><tr><th>Serial</th><th>Type</th><th>Status</th><th>OC</th><th>COMMENT</th></tr></thead><tbody>';
      records.forEach(r => {
        html += `<tr><td>${escHtml(r.serial || '--')}</td><td>${escHtml(r.type || '--')}</td><td>${escHtml(r.status || '--')}</td><td>${escHtml(r.ocAfterRepair || '--')}</td><td>${escHtml(r.comment || '--')}</td></tr>`;
      });
      body.innerHTML = html + '</tbody></table>';
    }
    $('modal').classList.add('show');
  }

  function displayCombinedStats(filtered) {
    const stats = {};
    let tNDF = 0, tOK = 0, tWAIT = 0, tTTL = 0, gTotal = 0;

    filtered.forEach(r => {
      const n = r.name || 'UNKNOWN';
      if (!stats[n]) stats[n] = { NDF:0, OK:0, WAITING:0, 'SCRAP TTL':0, total:0 };
      if (r.status === 'NDF') { stats[n].NDF++; tNDF++; }
      if (r.status === 'OK') { stats[n].OK++; tOK++; }
      if (r.status === 'WAITING') { stats[n].WAITING++; tWAIT++; }
      if (r.status === 'SCRAP TTL') { stats[n]['SCRAP TTL']++; tTTL++; }
      stats[n].total++; gTotal++;
    });

    const tbody = document.querySelector('#combined-table tbody');
    tbody.innerHTML = '';

    Object.entries(stats)
      .sort((a, b) => a[1].OK - b[1].OK)
      .forEach(([name, data]) => {
        const row = document.createElement('tr');
        row.innerHTML =
          `<td class="ld-name" data-name="${escHtml(name)}">${escHtml(name)}</td>` +
          `<td>${data.NDF}</td><td>${data.OK}</td><td>${data.WAITING}</td><td>${data['SCRAP TTL']}</td>` +
          `<td class="sum-col">${data.total}</td>`;
        tbody.appendChild(row);
      });

    const tr = document.createElement('tr');
    tr.className = 'total-row';
    tr.innerHTML = `<td>TOTAL</td><td>${tNDF}</td><td>${tOK}</td><td>${tWAIT}</td><td>${tTTL}</td><td class="sum-col">${gTotal}</td>`;
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
      row.innerHTML = `<td class="ld-name" style="cursor:default">${escHtml(name)}</td>` +
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

  // Заголовок таблицы показывает сегодняшнюю дату
  function refreshTitleDate() {
    if (!titleBusy) $('table-title').textContent = todayStr();
  }

  // Клик по дате: копирует SN оператора KOVALCHYK за последний день
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

  // Переключатель поиска: Pojedynczy / Zbiorczy
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
      output.innerHTML = "<p style='color:#9CA3AF'>Brak info!</p>";
      return;
    }

    output.innerHTML = `<table><thead><tr><th>Data</th><th>Status</th><th>NAPRAWIACZ</th><th>FINALNA</th><th>INFO</th></tr></thead>
      <tbody>${matches.map((d, i) => `
        <tr ${i === 0 ? 'class="latest-record"' : ''}>
          <td>${escHtml(d.date)}</td><td>${escHtml(d.status)}</td><td>${escHtml(d.name)}</td>
          <td>${escHtml(d.nameG)}</td><td>${escHtml(d.comment)}</td>
        </tr>`).join('')}
      </tbody></table>`;
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
      resHtml += `
      <details class="bulk-group">
        <summary>${escHtml(name)} — [${groups[name].length}]</summary>
        <table>
          <thead><tr>
            <th>Serial</th><th>Data</th><th>Status</th><th>Finalna</th><th>OC</th><th>Info</th>
          </tr></thead>
          <tbody>
            ${groups[name].map(r => `
              <tr>
                <td>${escHtml(r.serial)}</td>
                <td>${escHtml(r.date)}</td>
                <td>${escHtml(r.status)}</td>
                <td>${escHtml(r.nameG || ' ')}</td>
                <td>${escHtml(r.ocAfterRepair || ' ')}</td>
                <td>${escHtml(r.comment)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </details>`;
    });

    if (notFound.length) {
      resHtml += `
      <details class="bulk-group bulk-missing">
        <summary>NIE ZNALEZIONO — [${notFound.length}]</summary>
        <div class="bulk-missing-list">${escHtml(notFound.join(', '))}</div>
      </details>`;
    }

    output.innerHTML = resHtml || '<p style="color:#9CA3AF">NIE ZNALEZIONO</p>';
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

  /* ----- Аркуш pn: показ останнього запису (Alt + 3) ----- */
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

  async function refreshPnRecord(showLoader = false) {
    const output = $('search-result');
    if (!output) return;
    if (showLoader) output.innerHTML = "<p style='color:#9CA3AF;'>Pobieranie danych (pn)...</p>";

    const title = await getHelperSheetTitle();
    const rows = await getData(title || 'pn', sheetIdArchive);
    if (!rows || rows.length === 0) {
      output.innerHTML = "<p style='color:#9CA3AF;'>Brak danych na arkuszu pn!</p>";
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
        row.style.opacity = '0.6';
        setTimeout(() => { row.style.opacity = ''; }, 300);
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
    $('overview-wrap').classList.remove('fullscreen-mode');
    $('diag-wrap').style.display = '';
    $('search-wrap').style.display = '';
  }

  function toggleFullscreen() {
    const ov = $('overview-wrap');
    if (ov.classList.contains('fullscreen-mode')) {
      exitFullscreen();
    } else {
      ov.classList.add('fullscreen-mode');
      $('diag-wrap').style.display = 'none';
      $('search-wrap').style.display = 'none';
    }
  }

  function closeOverlays() {
    closeModal();
    if ($('overview-wrap').classList.contains('fullscreen-mode')) exitFullscreen();
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
        toggleBlock('overview-block', 'overview-toggle');
      }
      if (e.code === 'Digit2' || e.key === '2') {
        e.preventDefault();
        $('diag-block').style.display = 'block';
        toggleBlock('diag-block', 'diag-toggle');
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
      if (td && td.dataset.name) openModal(td.dataset.name);
    });

    $('overview-toggle').onclick = () => toggleBlock('overview-block', 'overview-toggle');
    $('diag-toggle').onclick = () => toggleBlock('diag-block', 'diag-toggle');

    $('mode-switch').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) setMode(b.dataset.mode);
    });
    $('search').addEventListener('keydown', onSearchKey);
    $('bulk-input').addEventListener('keydown', onBulkKey);
    $('bulk-run').onclick = runBulkSearch;

    $('main-title').onclick = toggleFullscreen;

    document.addEventListener('keydown', onGlobalKey, true);

    setInterval(() => {
      if (isPnVisible && isVisible()) refreshPnRecord(false);
    }, 5000);

    refreshTitleDate();
    setInterval(refreshTitleDate, 60000);
  }

  // Вызывается сайтом (app.js) при открытии вкладки Statistic per day.
  // Данные загружаются только один раз, при первом открытии.
  window.liveShow = function () {
    if (started) return;
    started = true;
    updateStats();
    setInterval(() => { if (isVisible()) updateStats(); }, 60000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
