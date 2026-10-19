/* Final inspection station II: список SN из Google Таблицы (вкладка FI 2), печать этикеток.
   Строки, у которых последний статус в журнале ремонта (repair_log) равен OK, подсвечиваются зелёным.
   Підключення: <script src="js/final2.js"></script> ПІСЛЯ js/app.js (JsBarcode и Supabase уже подключены).
   Контейнер: <section id="final2Page">. Мову задає сайт через window.setFinal2Lang(код). */
(function () {
  const CFG = {
    name: 'final2',
    gid: '193025884',               // вкладка таблицы: FI 2
    pageId: 'final2Page',
    setLang: 'setFinal2Lang',
    show: 'final2Show',
    modeKey: 'final2Mode'
  };

  const SHEET_ID = '10W03bvKlVFlIUcxsHkzP_v_13gtnYRBmnrrO0ujB1bU';
  const SB_URL = 'https://wtqvaeongxncufvpvvge.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cXZhZW9uZ3huY3VmdnB2dmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDM5MjIsImV4cCI6MjEwMjExOTkyMn0.tRsrb29_b9ev3K75npD5zt_Dz9FMltzaRkdK0RPDn-U';
  const TABLE = 'televisions', COL_PN = 'tpv_pn', COL_SN = 'panel_sn', COL_BRAND = 'brand';
  const LOG_TABLE = 'repair_log';
  const RETRY_MS = 3000, POLL_MS = 500, MAX_ROWS = 10;
  const NS = 'http://www.w3.org/2000/svg';
  const P = CFG.name;
  const PAGE = `#${CFG.pageId}`;

  /* ===== Переклади (10 мов сайту) ===== */
  const I18N = {
    en: { colSn: "Serial Number (SN)", colPn: "Part Number (PN)", colBrand: "Brand", colPrint: "Print", loading: "Loading data...", noRecords: "No records in the sheet yet", batchNormal: "🖨️ Print selected", batchBrand: "🖨️ Print selected with Brand", titleNew: "Print new format 130x76 mm", titleTwo: "Print 2 copies", titleTwoBrand: "Print 2 copies with Brand", toastSel: "🖍️ Selected {n} — Ctrl+C to copy", toastCopied: "✅ Copied {n} values", toastPn: "⏳ PN not found in the database yet" },
    uk: { colSn: "Serial Number (SN)", colPn: "Part Number (PN)", colBrand: "Brand", colPrint: "Друк", loading: "Завантаження даних...", noRecords: "У таблиці ще немає записів", batchNormal: "🖨️ Друк вибраних", batchBrand: "🖨️ Друк вибраних з Brand", titleNew: "Друк новий формат 130x76мм", titleTwo: "Друк 2 копії", titleTwoBrand: "Друк 2 копії з Brand", toastSel: "🖍️ Виділено {n} — Ctrl+C щоб скопіювати", toastCopied: "✅ Скопійовано {n} значень", toastPn: "⏳ PN ще не знайдено в базі" },
    ru: { colSn: "Serial Number (SN)", colPn: "Part Number (PN)", colBrand: "Brand", colPrint: "Печать", loading: "Загрузка данных...", noRecords: "В таблице пока нет записей", batchNormal: "🖨️ Печать выбранных", batchBrand: "🖨️ Печать выбранных с Brand", titleNew: "Печать нового формата 130x76 мм", titleTwo: "Печать 2 копий", titleTwoBrand: "Печать 2 копий с Brand", toastSel: "🖍️ Выделено {n} — Ctrl+C, чтобы скопировать", toastCopied: "✅ Скопировано значений: {n}", toastPn: "⏳ PN ещё не найден в базе" },
    pl: { colSn: "Serial Number (SN)", colPn: "Part Number (PN)", colBrand: "Brand", colPrint: "Druk", loading: "Ładowanie danych...", noRecords: "W arkuszu nie ma jeszcze rekordów", batchNormal: "🖨️ Drukuj wybrane", batchBrand: "🖨️ Drukuj wybrane z Brand", titleNew: "Drukuj nowy format 130x76 mm", titleTwo: "Drukuj 2 kopie", titleTwoBrand: "Drukuj 2 kopie z Brand", toastSel: "🖍️ Zaznaczono {n} — Ctrl+C, aby skopiować", toastCopied: "✅ Skopiowano wartości: {n}", toastPn: "⏳ PN nie został jeszcze znaleziony w bazie" },
    de: { colSn: "Serial Number (SN)", colPn: "Part Number (PN)", colBrand: "Brand", colPrint: "Druck", loading: "Daten werden geladen...", noRecords: "Noch keine Einträge in der Tabelle", batchNormal: "🖨️ Ausgewählte drucken", batchBrand: "🖨️ Ausgewählte mit Brand drucken", titleNew: "Neues Format 130x76 mm drucken", titleTwo: "2 Kopien drucken", titleTwoBrand: "2 Kopien mit Brand drucken", toastSel: "🖍️ {n} ausgewählt — Strg+C zum Kopieren", toastCopied: "✅ {n} Werte kopiert", toastPn: "⏳ PN noch nicht in der Datenbank gefunden" },
    fr: { colSn: "Serial Number (SN)", colPn: "Part Number (PN)", colBrand: "Brand", colPrint: "Impression", loading: "Chargement des données...", noRecords: "Aucun enregistrement dans la feuille pour l'instant", batchNormal: "🖨️ Imprimer la sélection", batchBrand: "🖨️ Imprimer la sélection avec Brand", titleNew: "Imprimer le nouveau format 130x76 mm", titleTwo: "Imprimer 2 copies", titleTwoBrand: "Imprimer 2 copies avec Brand", toastSel: "🖍️ {n} sélectionnés — Ctrl+C pour copier", toastCopied: "✅ {n} valeurs copiées", toastPn: "⏳ PN pas encore trouvé dans la base" },
    es: { colSn: "Serial Number (SN)", colPn: "Part Number (PN)", colBrand: "Brand", colPrint: "Imprimir", loading: "Cargando datos...", noRecords: "Aún no hay registros en la hoja", batchNormal: "🖨️ Imprimir seleccionados", batchBrand: "🖨️ Imprimir seleccionados con Brand", titleNew: "Imprimir formato nuevo 130x76 mm", titleTwo: "Imprimir 2 copias", titleTwoBrand: "Imprimir 2 copias con Brand", toastSel: "🖍️ Seleccionados {n} — Ctrl+C para copiar", toastCopied: "✅ Copiados {n} valores", toastPn: "⏳ PN aún no encontrado en la base de datos" },
    it: { colSn: "Serial Number (SN)", colPn: "Part Number (PN)", colBrand: "Brand", colPrint: "Stampa", loading: "Caricamento dati...", noRecords: "Nessun record nel foglio per ora", batchNormal: "🖨️ Stampa selezionati", batchBrand: "🖨️ Stampa selezionati con Brand", titleNew: "Stampa nuovo formato 130x76 mm", titleTwo: "Stampa 2 copie", titleTwoBrand: "Stampa 2 copie con Brand", toastSel: "🖍️ Selezionati {n} — Ctrl+C per copiare", toastCopied: "✅ Copiati {n} valori", toastPn: "⏳ PN non ancora trovato nel database" },
    pt: { colSn: "Serial Number (SN)", colPn: "Part Number (PN)", colBrand: "Brand", colPrint: "Imprimir", loading: "Carregando dados...", noRecords: "Ainda não há registros na planilha", batchNormal: "🖨️ Imprimir selecionados", batchBrand: "🖨️ Imprimir selecionados com Brand", titleNew: "Imprimir novo formato 130x76 mm", titleTwo: "Imprimir 2 cópias", titleTwoBrand: "Imprimir 2 cópias com Brand", toastSel: "🖍️ Selecionados {n} — Ctrl+C para copiar", toastCopied: "✅ Copiados {n} valores", toastPn: "⏳ PN ainda não encontrado no banco de dados" },
    tr: { colSn: "Serial Number (SN)", colPn: "Part Number (PN)", colBrand: "Brand", colPrint: "Yazdır", loading: "Veriler yükleniyor...", noRecords: "Tabloda henüz kayıt yok", batchNormal: "🖨️ Seçilenleri yazdır", batchBrand: "🖨️ Seçilenleri Brand ile yazdır", titleNew: "Yeni format 130x76 mm yazdır", titleTwo: "2 kopya yazdır", titleTwoBrand: "Brand ile 2 kopya yazdır", toastSel: "🖍️ {n} seçildi — kopyalamak için Ctrl+C", toastCopied: "✅ {n} değer kopyalandı", toastPn: "⏳ PN veritabanında henüz bulunamadı" }
  };

  const CSS = `
${PAGE} .f-wrap{max-width:1200px;margin:0 auto}
${PAGE} .f-bar{display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:center;margin-bottom:14px}
${PAGE} .f-group{display:flex;gap:10px;align-items:center}
${PAGE} .f-mode{background:#111827;color:#9CA3AF;border:1px solid #374151;border-radius:8px;padding:8px 18px;cursor:pointer;font:600 13px "Segoe UI",Tahoma,Arial,sans-serif}
${PAGE} .f-mode.active{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border-color:transparent}
${PAGE} .btn:disabled{opacity:.4;cursor:not-allowed;filter:none}
${PAGE} .f-new{background:linear-gradient(135deg,#7c3aed,#6d28d9)}
${PAGE} .f-card{background:#0e0e0e;border:1px solid #1f2937;border-radius:10px;overflow:auto;box-shadow:0 10px 25px -5px rgba(0,0,0,.5)}
${PAGE} table{width:100%;border-collapse:collapse}
${PAGE} th,${PAGE} td{padding:10px 12px;text-align:center;border-bottom:1px solid #1f2937;color:#E5E7EB;font-size:14px;white-space:nowrap}
${PAGE} th{background:#111827;color:#9CA3AF;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em}
${PAGE} td[data-col="sn"],${PAGE} td[data-col="pn"]{font-family:Consolas,'Courier New',monospace;font-weight:600}
${PAGE} td.f-sel{background:rgba(37,99,235,.35)!important}
${PAGE} .f-brand{background:#374151;padding:3px 8px;border-radius:4px;font-size:12px;font-weight:600}
${PAGE} .f-acts{display:flex;gap:8px;justify-content:flex-end;align-items:center}
${PAGE} .f-msg{color:#9CA3AF}
${PAGE} .f-spin{display:inline-block;width:12px;height:12px;border:2px solid #374151;border-top-color:#2563EB;border-radius:50%;animation:fSpin .8s linear infinite}
@keyframes fSpin{to{transform:rotate(360deg)}}
.f-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#111827;color:#F9FAFB;border:1px solid #374151;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;opacity:0;pointer-events:none;transition:opacity .2s}
.f-toast.show{opacity:1}
${PAGE} tr.f-ok td{background:rgba(34,197,94,.12)}
${PAGE} tr.f-ok td:first-child{box-shadow:inset 3px 0 0 #22c55e}
${PAGE} .f-okbadge{display:inline-block;margin-left:6px;padding:2px 6px;border-radius:4px;background:#16a34a;color:#fff;font-size:11px;font-weight:700}
`;

  // Стили печати (этикетки печатаются в отдельном окне)
  const PRINT_CSS = `
html,body{margin:0;padding:0;background:#fff}
.pg{break-after:page;page-break-after:always}
.pg:last-child{break-after:auto;page-break-after:auto}
.lbl-std{width:100mm;height:77.6mm;position:relative;background:#fff;color:#000;padding:3.2mm 4mm 2.8mm;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;overflow:hidden}
.top-divider{width:100%;height:0;border-top:1.5px solid #000;margin:0 0 2.2mm 0}
.label-section{width:100%;display:block}
.label-section+.label-section{margin-top:3.1mm}
.section-header{width:100%;height:5.5mm;display:block;position:relative;margin:0 0 1.1mm 0;line-height:5.5mm;text-align:center}
.section-header.has-brand{display:flex;justify-content:space-between;align-items:center;text-align:left}
.header-title{display:block;width:100%;font-size:16.5pt;font-weight:900;line-height:5.5mm;text-align:center}
.section-header.has-brand .header-title{display:inline-block;width:auto;text-align:left}
.brand-tag{font-weight:900;font-size:11pt;text-transform:uppercase;line-height:5.5mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70%;text-align:right}
.barcode-box{width:82mm;height:15.5mm;margin:0 auto;display:block;overflow:hidden;text-align:center}
.barcode-box svg{width:auto!important;max-width:100%!important;height:15.5mm!important;display:inline-block;vertical-align:top;shape-rendering:crispEdges}
.val-pn,.val-sn{width:100%;box-sizing:border-box;text-align:center;font-weight:900;white-space:nowrap;overflow:hidden;line-height:1;margin:1.1mm 0 0 0}
.val-pn{font-size:18pt}
.val-sn{font-size:13pt;transform:scale(1,1.8);transform-origin:center top;margin-top:3.5mm}
.lbl-new{width:130mm;height:75.6mm;position:relative;background:#fff;color:#000;padding:19.05mm 2.54mm 6.35mm 2.54mm;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;overflow:hidden}
.lbl-new::after{content:'';position:absolute;top:1.5mm;left:1.5mm;right:1.5mm;bottom:1.5mm;border:0.5mm solid #000;box-sizing:border-box}
.bw-pn,.bw-sn{width:118mm;height:10.5mm;margin:1.2mm auto 0.6mm;display:block;overflow:hidden;text-align:center}
.bw-pn svg,.bw-sn svg{width:100%!important;height:100%!important;display:inline-block;vertical-align:top;shape-rendering:crispEdges}
.cap{font-size:17pt;font-weight:900;text-align:center;line-height:1;margin:0 0 0.4mm 0;width:100%}
.val{font-size:17pt;font-weight:900;text-align:center;line-height:1;white-space:nowrap;width:100%;margin:0 0 0.4mm 0}
.brand-new{position:absolute;top:3mm;left:4mm;right:4mm;height:16mm;display:flex;align-items:center;justify-content:center;font-size:28pt;font-weight:900;text-transform:uppercase;line-height:1;white-space:nowrap;overflow:hidden}
`;

  const MARKUP = `
<div class="f-wrap">
  <div class="f-bar">
    <div class="f-group">
      <button type="button" class="f-mode active" data-mode="1">100×78</button>
      <button type="button" class="f-mode" data-mode="2">130×76</button>
    </div>
    <div class="f-group">
      <button type="button" class="btn btn-secondary" id="${P}BatchNorm" data-lv="batchNormal" disabled></button>
      <button type="button" class="btn btn-brand" id="${P}BatchBrand" data-lv="batchBrand" disabled></button>
    </div>
  </div>
  <div class="f-card">
    <table>
      <thead><tr>
        <th style="width:40px"><input type="checkbox" id="${P}All"></th>
        <th>#</th>
        <th data-lv="colSn"></th>
        <th data-lv="colPn"></th>
        <th data-lv="colBrand"></th>
        <th style="text-align:right" data-lv="colPrint"></th>
      </tr></thead>
      <tbody id="${P}Body"></tbody>
    </table>
  </div>
</div>`;

  const $ = (id) => document.getElementById(id);
  let lang = 'en';
  let mode = '1';
  let products = [];
  let selected = new Set();
  let dbCache = new Map();
  let loaded = false;
  let loading = false;
  let inited = false;
  let pollTimer = null;
  let colSel = { active: false, col: null, start: -1, cells: [] };

  function t(key, vars) {
    const d = I18N[lang] || I18N.en;
    let s = d[key] !== undefined ? d[key] : (I18N.en[key] || key);
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function isVisible() {
    const el = $(CFG.pageId);
    return !!el && el.style.display !== 'none';
  }

  function applyText() {
    document.querySelectorAll(`${PAGE} [data-lv]`).forEach(el => { el.textContent = t(el.dataset.lv); });
  }

  function toast(msg) {
    let el = $(`${P}Toast`);
    if (!el) {
      el = document.createElement('div');
      el.id = `${P}Toast`;
      el.className = 'f-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 1800);
  }

  /* ---------- Данные: таблица Google (CSV), PN из базы и статусы из журнала ---------- */

  function parseCSV(str) {
    const arr = [];
    let quote = false;
    for (let row = 0, col = 0, c = 0; c < str.length; c++) {
      const cc = str[c], nc = str[c + 1];
      arr[row] = arr[row] || [];
      arr[row][col] = arr[row][col] || '';
      if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; c++; continue; }
      if (cc === '"') { quote = !quote; continue; }
      if (cc === ',' && !quote) { col++; continue; }
      if (cc === '\r' && nc === '\n' && !quote) { row++; col = 0; c++; continue; }
      if ((cc === '\n' || cc === '\r') && !quote) { row++; col = 0; continue; }
      arr[row][col] += cc;
    }
    return arr;
  }

  function sb() {
    if (!window.__lcdrSb) window.__lcdrSb = window.supabase.createClient(SB_URL, SB_KEY);
    return window.__lcdrSb;
  }

  // Возвращает { pn, brand }. pn = null, если PN пока не найден (показывается спиннер)
  async function getPn(sn) {
    const now = Date.now();
    const c = dbCache.get(sn);
    if (c && (c.ok || now - c.t < RETRY_MS)) return c.data;

    try {
      const { data, error } = await sb().from(TABLE).select(`${COL_PN}, ${COL_BRAND}`).eq(COL_SN, sn).limit(1);
      if (!error && data && data.length) {
        const d = { pn: data[0][COL_PN] || 'N/A', brand: data[0][COL_BRAND] || '-' };
        dbCache.set(sn, { ok: true, data: d, t: now });
        return d;
      }
      if (!error) {
        const u = sn.toUpperCase();
        let fb = null;
        if (u.startsWith('TBV') && u.length >= 11) fb = { pn: `750${u.substring(0, 11)}N000`, brand: 'PHP[PHP]' };
        else if (u.startsWith('TOV') && u.length >= 11) fb = { pn: `730${u.substring(0, 11)}N000`, brand: 'PHP[PHP]' };
        if (fb) { dbCache.set(sn, { ok: true, data: fb, t: now }); return fb; }
      }
    } catch (e) {}

    const nf = { pn: null, brand: '-' };
    dbCache.set(sn, { ok: false, data: nf, t: now });
    return nf;
  }

  // Статусы последнего ремонта по SN из журнала. Возвращает { SN: 'OK' | ... }
  async function loadRepairStatuses(sns) {
    const map = {};
    if (!sns.length) return map;
    try {
      const { data, error } = await sb()
        .from(LOG_TABLE)
        .select('panel_sn, status, id')
        .in('panel_sn', sns)
        .order('id', { ascending: false });
      if (error || !data) return map;
      // Первая запись по каждому SN — самая свежая
      data.forEach(r => {
        const key = String(r.panel_sn || '').trim().toUpperCase();
        if (!(key in map)) map[key] = String(r.status || '').trim().toUpperCase();
      });
    } catch (e) {}
    return map;
  }

  async function loadProducts() {
    if (loading || !isVisible()) return;
    loading = true;
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${CFG.gid}&_nc=${Date.now()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('sheet');
      const rows = parseCSV(await res.text());

      const sns = [];
      for (let i = 1; i < rows.length; i++) {
        const sn = rows[i] && rows[i][2] ? rows[i][2].trim() : '';
        if (sn && sn.toUpperCase() !== 'SERIAL NUMBER') sns.push(sn);
      }
      const last = sns.slice(-MAX_ROWS).reverse();
      const keep = new Set(last);
      for (const k of dbCache.keys()) if (!keep.has(k)) dbCache.delete(k);

      const items = [];
      for (const sn of last) {
        const d = await getPn(sn);
        items.push({ sn, pn: d.pn, brand: d.brand });
      }

      const repairMap = await loadRepairStatuses(last);
      items.forEach(it => { it.repair = repairMap[it.sn.toUpperCase()] || ''; });

      products = items;
      if (!hasTableSelection()) render();
    } catch (e) {
      console.warn(`${P}: данные временно недоступны`);
    } finally {
      loaded = true;
      loading = false;
    }
  }

  // Не перерисовываем таблицу, пока пользователь выделяет текст или колонку
  function hasTableSelection() {
    if (colSel.cells.length) return true;
    const s = window.getSelection();
    if (!s || s.rangeCount === 0 || s.isCollapsed) return false;
    const body = $(`${P}Body`);
    return !!body && body.contains(s.getRangeAt(0).commonAncestorContainer);
  }

  /* ---------- Таблица ---------- */

  function render() {
    const body = $(`${P}Body`);
    if (!products.length) {
      body.innerHTML = `<tr><td colspan="6" class="f-msg">${esc(t(loaded ? 'noRecords' : 'loading'))}</td></tr>`;
    } else {
      body.innerHTML = products.map((p, i) => `
        <tr class="${p.repair === 'OK' ? 'f-ok' : ''}">
          <td><input type="checkbox" class="f-row" data-sn="${esc(p.sn)}" ${selected.has(p.sn) ? 'checked' : ''}></td>
          <td><strong>${i + 1}</strong></td>
          <td data-col="sn">${esc(p.sn)}${p.repair === 'OK' ? ' <span class="f-okbadge">OK</span>' : ''}</td>
          <td data-col="pn">${p.pn ? esc(p.pn) : '<span class="f-spin"></span>'}</td>
          <td data-col="brand"><span class="f-brand">${esc(p.brand)}</span></td>
          <td><div class="f-acts">
            <button type="button" class="btn f-new" data-act="new" data-i="${i}" title="${esc(t('titleNew'))}">🆕</button>
            <button type="button" class="btn" data-act="two" data-i="${i}" title="${esc(t('titleTwo'))}">🖨️</button>
            <button type="button" class="btn btn-brand" data-act="brand" data-i="${i}" title="${esc(t('titleTwoBrand'))}">🖨️ Brand</button>
          </div></td>
        </tr>`).join('');
    }
    updateBar();
  }

  function updateBar() {
    const none = selected.size === 0;
    $(`${P}BatchNorm`).disabled = none;
    $(`${P}BatchBrand`).disabled = none;
    $(`${P}All`).checked = products.length > 0 && products.every(p => selected.has(p.sn));
    document.querySelectorAll(`${PAGE} .f-mode`).forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  }

  function setMode(m) {
    mode = m === '2' ? '2' : '1';
    try { localStorage.setItem(CFG.modeKey, mode); } catch (e) {}
    updateBar();
  }

  /* ---------- Выделение колонки (Ctrl + перетягивание) и копирование Ctrl+C ---------- */

  function rowIdx(td) {
    return Array.from($(`${P}Body`).rows).indexOf(td.parentElement);
  }

  function highlightCol(a, b) {
    const lo = Math.min(a, b), hi = Math.max(a, b);
    document.querySelectorAll(`${PAGE} td.f-sel`).forEach(td => td.classList.remove('f-sel'));
    colSel.cells = [];
    Array.from($(`${P}Body`).rows).forEach((tr, i) => {
      if (i < lo || i > hi) return;
      const td = tr.querySelector(`td[data-col="${colSel.col}"]`);
      if (td) { td.classList.add('f-sel'); colSel.cells.push(td); }
    });
  }

  function clearColSel() {
    document.querySelectorAll(`${PAGE} td.f-sel`).forEach(td => td.classList.remove('f-sel'));
    colSel = { active: false, col: null, start: -1, cells: [] };
  }

  /* ---------- Печать ---------- */

  // Штрихкод строится в скрытом SVG, затем вставляется в документ печати
  function bc(value, height, width, stretch) {
    const s = document.createElementNS(NS, 'svg');
    s.style.position = 'absolute';
    s.style.visibility = 'hidden';
    document.body.appendChild(s);
    try {
      JsBarcode(s, String(value || 'N/A'), { format: 'CODE128B', displayValue: false, margin: 0, height, width, flat: true, lineColor: '#000000', background: '#ffffff' });
    } catch (e) {}
    s.removeAttribute('style');
    if (stretch) s.setAttribute('preserveAspectRatio', 'none');
    const out = s.outerHTML;
    document.body.removeChild(s);
    return out;
  }

  // Стандартная этикетка 100x78 мм, по 2 копии на каждый SN
  function stdPages(list, inc) {
    let out = '';
    list.forEach(p => {
      const pn = p.pn || 'N/A', sn = p.sn || 'N/A', brand = p.brand || '-';
      const one = `<div class="pg"><div class="lbl-std">
        <div class="top-divider"></div>
        <div class="label-section">
          <div class="section-header${inc ? ' has-brand' : ''}"><span class="header-title">PN:</span>${inc ? `<span class="brand-tag">${esc(brand)}</span>` : ''}</div>
          <div class="barcode-box">${bc(pn, 48, 1.18)}</div>
          <div class="val-pn">${esc(pn)}</div>
        </div>
        <div class="label-section">
          <div class="section-header"><span class="header-title">SN:</span></div>
          <div class="barcode-box">${bc(sn, 48, 0.92)}</div>
          <div class="val-sn">${esc(sn)}</div>
        </div>
      </div></div>`;
      out += one + one;
    });
    return out;
  }

  // Новая этикетка 130x76 мм, по 2 копии на каждый SN
  function newPages(list, inc) {
    let out = '';
    list.forEach(p => {
      const pn = p.pn || 'N/A', sn = p.sn || 'N/A', brand = p.brand || '-';
      const one = `<div class="pg"><div class="lbl-new">
        ${inc ? `<div class="brand-new">${esc(brand)}</div>` : ''}
        <div class="bw-pn">${bc(pn, 48, 1.3, true)}</div>
        <div class="cap">PN</div>
        <div class="val">${esc(pn)}</div>
        <div class="cap">SN</div>
        <div class="bw-sn">${bc(sn, 48, 1.0, true)}</div>
        <div class="val">${esc(sn)}</div>
      </div></div>`;
      out += one + one;
    });
    return out;
  }

  function printInFrame(html) {
    const old = $(`${P}PrintFrame`);
    if (old) old.remove();
    const f = document.createElement('iframe');
    f.id = `${P}PrintFrame`;
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
    document.body.appendChild(f);
    const w = f.contentWindow;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.onafterprint = () => setTimeout(() => f.remove(), 500);
    setTimeout(() => { w.focus(); w.print(); }, 250);
  }

  function printDoc(pages, w, h) {
    printInFrame(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Label</title><style>@page{size:${w}mm ${h}mm;margin:0}${PRINT_CSS}</style></head><body>${pages}</body></html>`);
  }

  function printStd(list, inc) { printDoc(stdPages(list, inc), 100, 78); }
  function printNew(list, inc) { printDoc(newPages(list, inc), 130, 76); }

  // Пакетная печать и Ctrl+P: формат зависит от выбранной кнопки 100×78 / 130×76
  function printList(list, inc) {
    if (mode === '2') printNew(list, inc);
    else printStd(list, inc);
  }

  function printBatch(inc) {
    const list = products.filter(p => selected.has(p.sn));
    if (!list.length) return;
    printList(list, inc);
    selected.clear();
    render();
  }

  /* ---------- События ---------- */

  function bindEvents() {
    const body = $(`${P}Body`);

    body.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      const p = products[+b.dataset.i];
      if (!p) return;
      if (b.dataset.act === 'new') printNew([p], false);
      else if (b.dataset.act === 'two') printStd([p], false);
      else printStd([p], true);
    });

    body.addEventListener('change', (e) => {
      if (!e.target.classList.contains('f-row')) return;
      const sn = e.target.dataset.sn;
      if (e.target.checked) selected.add(sn);
      else selected.delete(sn);
      updateBar();
    });

    body.addEventListener('mousedown', (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const td = e.target.closest('td[data-col]');
      if (!td) return;
      e.preventDefault();
      clearColSel();
      colSel.active = true;
      colSel.col = td.dataset.col;
      colSel.start = rowIdx(td);
      highlightCol(colSel.start, colSel.start);
    });

    document.addEventListener('mousemove', (e) => {
      if (!colSel.active) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const td = el && el.closest(`td[data-col="${colSel.col}"]`);
      if (td) highlightCol(colSel.start, rowIdx(td));
    });

    document.addEventListener('mouseup', () => {
      if (!colSel.active) return;
      colSel.active = false;
      if (colSel.cells.length) toast(t('toastSel', { n: colSel.cells.length }));
    });

    document.addEventListener('mousedown', (e) => {
      if (!(e.ctrlKey || e.metaKey)) clearColSel();
    });

    document.addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey) || !isVisible()) return;
      const k = e.key.toLowerCase();

      if (k === 'c' && colSel.cells.length) {
        const text = colSel.cells.map(td => td.textContent.trim()).join('\n');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => toast(t('toastCopied', { n: colSel.cells.length })));
        }
      } else if (k === 'p') {
        e.preventDefault();
        if (!products.length) return;
        if (!selected.size && !products[0].pn) { toast(t('toastPn')); return; }
        if (selected.size) printBatch(false);
        else printList([products[0]], false);
      }
    });

    $(`${P}All`).addEventListener('change', (e) => {
      products.forEach(p => {
        if (e.target.checked) selected.add(p.sn);
        else selected.delete(p.sn);
      });
      render();
    });

    $(`${P}BatchNorm`).addEventListener('click', () => printBatch(false));
    $(`${P}BatchBrand`).addEventListener('click', () => printBatch(true));

    document.querySelectorAll(`${PAGE} .f-mode`).forEach(b => {
      b.addEventListener('click', () => setMode(b.dataset.mode));
    });
  }

  /* ---------- Инициализация и вызовы из сайта ---------- */

  function init() {
    const root = $(CFG.pageId);
    if (!root) return;

    try { const s = localStorage.getItem('siteLang'); if (I18N[s]) lang = s; } catch (e) {}
    try { mode = localStorage.getItem(CFG.modeKey) === '2' ? '2' : '1'; } catch (e) {}

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    root.innerHTML = MARKUP;
    bindEvents();
    applyText();
    render();
    inited = true;
  }

  // Вызывается сайтом (app.js) при открытии страницы
  window[CFG.show] = function () {
    if (!inited) return;
    loadProducts();
    if (!pollTimer) pollTimer = setInterval(() => { if (isVisible()) loadProducts(); }, POLL_MS);
  };

  // Язык задаёт сайт (app.js)
  window[CFG.setLang] = function (l) {
    lang = I18N[l] ? l : 'en';
    if (inited) { applyText(); render(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
