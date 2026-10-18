/* Ручне / масове введення та друк (SN, PN, Brand) з оригіналу.
   Блок стоїть над таблицею на сторінках Final station I та II, згортається кліком по смузі над полями.
   Формат друку (100×78 або 130×76) береться з перемикача на сторінці (localStorage final1Mode / final2Mode).
   Мову задає сайт (select у верхній панелі).
   Підключення: <script src="js/manual.js"></script> ПІСЛЯ js/final1.js і js/final2.js. */
(function () {
  const PAGES = [
    { id: 'final1Page', modeKey: 'final1Mode' },
    { id: 'final2Page', modeKey: 'final2Mode' }
  ];

  const SB_URL = 'https://wtqvaeongxncufvpvvge.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cXZhZW9uZ3huY3VmdnB2dmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDM5MjIsImV4cCI6MjEwMjExOTkyMn0.tRsrb29_b9ev3K75npD5zt_Dz9FMltzaRkdK0RPDn-U';
  const TABLE = 'televisions', COL_PN = 'tpv_pn', COL_SN = 'panel_sn', COL_BRAND = 'brand';
  const NS = 'http://www.w3.org/2000/svg';
  const COLLAPSE_KEY = 'manualCollapse:';

  /* ===== Переклади (10 мов сайту) ===== */
  const I18N = {
    en: { sn: "Serial Number (SN)", pn: "Part Number (PN)", brand: "Brand", print: "🖨️ Print", printBrand: "🖨️ With Brand", alertFill: "Please fill in at least Serial Number or Part Number!", alertNoData: "No data found to print!" },
    uk: { sn: "Serial Number (SN)", pn: "Part Number (PN)", brand: "Brand", print: "🖨️ Друк", printBrand: "🖨️ З Brand", alertFill: "Будь ласка, заповніть хоча б Serial Number або Part Number!", alertNoData: "Не знайдено даних для друку!" },
    ru: { sn: "Serial Number (SN)", pn: "Part Number (PN)", brand: "Brand", print: "🖨️ Печать", printBrand: "🖨️ С Brand", alertFill: "Пожалуйста, заполните хотя бы Serial Number или Part Number!", alertNoData: "Не найдено данных для печати!" },
    pl: { sn: "Serial Number (SN)", pn: "Part Number (PN)", brand: "Brand", print: "🖨️ Drukuj", printBrand: "🖨️ Z Brand", alertFill: "Wypełnij co najmniej Serial Number lub Part Number!", alertNoData: "Nie znaleziono danych do druku!" },
    de: { sn: "Serial Number (SN)", pn: "Part Number (PN)", brand: "Brand", print: "🖨️ Drucken", printBrand: "🖨️ Mit Brand", alertFill: "Bitte mindestens Serial Number oder Part Number ausfüllen!", alertNoData: "Keine Daten zum Drucken gefunden!" },
    fr: { sn: "Serial Number (SN)", pn: "Part Number (PN)", brand: "Brand", print: "🖨️ Imprimer", printBrand: "🖨️ Avec Brand", alertFill: "Veuillez remplir au moins Serial Number ou Part Number !", alertNoData: "Aucune donnée à imprimer !" },
    es: { sn: "Serial Number (SN)", pn: "Part Number (PN)", brand: "Brand", print: "🖨️ Imprimir", printBrand: "🖨️ Con Brand", alertFill: "¡Complete al menos Serial Number o Part Number!", alertNoData: "¡No se encontraron datos para imprimir!" },
    it: { sn: "Serial Number (SN)", pn: "Part Number (PN)", brand: "Brand", print: "🖨️ Stampa", printBrand: "🖨️ Con Brand", alertFill: "Compila almeno Serial Number o Part Number!", alertNoData: "Nessun dato da stampare!" },
    pt: { sn: "Serial Number (SN)", pn: "Part Number (PN)", brand: "Brand", print: "🖨️ Imprimir", printBrand: "🖨️ Com Brand", alertFill: "Preencha pelo menos Serial Number ou Part Number!", alertNoData: "Nenhum dado encontrado para imprimir!" },
    tr: { sn: "Serial Number (SN)", pn: "Part Number (PN)", brand: "Brand", print: "🖨️ Yazdır", printBrand: "🖨️ Brand ile", alertFill: "En az Serial Number veya Part Number doldurun!", alertNoData: "Yazdırılacak veri bulunamadı!" }
  };

  const CSS = `
.mn-card { max-width: 1200px; width: 100%; margin: 0 auto 16px; box-sizing: border-box; }
.mn-head { height: 12px; margin: -6px 0 10px 0; border-radius: 6px; background: #1f2937; cursor: pointer; user-select: none; }
.mn-head:hover { background: #374151; }
.mn-card.mn-collapsed .mn-body { display: none; }
.mn-card.mn-collapsed .mn-head { margin-bottom: -6px; }
.mn-grid { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 12px; align-items: end; }
.mn-grid .form-group { min-width: 0; }
.mn-grid textarea { width: 100%; resize: vertical; min-height: 72px; font-size: 13px; line-height: 1.4; box-sizing: border-box; }
.mn-card .code-text { font-family: Consolas, 'Courier New', monospace; }
.mn-btns { display: flex; flex-direction: column; gap: 10px; }
.mn-btns .btn { width: 100%; }
@media (max-width: 900px) { .mn-grid { grid-template-columns: 1fr; } }
`;

  // Стили печати (тот же набор, что и в модулях final1/final2)
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
<div class="manual-input-card mn-card">
  <div class="mn-head"></div>
  <div class="mn-body">
    <div class="mn-grid">
      <div class="form-group">
        <label data-mn-t="sn"></label>
        <textarea class="form-input code-text mn-sn" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label data-mn-t="pn"></label>
        <textarea class="form-input code-text mn-pn" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label data-mn-t="brand"></label>
        <textarea class="form-input mn-brand" rows="3"></textarea>
      </div>
      <div class="mn-btns">
        <button type="button" class="btn btn-secondary mn-print" data-mn-t="print"></button>
        <button type="button" class="btn btn-brand mn-print-brand" data-mn-t="printBrand"></button>
      </div>
    </div>
  </div>
</div>`.trim();

  let lang = 'en';
  const dbCache = new Map();

  function t(key) {
    const d = I18N[lang] || I18N.en;
    return d[key] || I18N.en[key] || key;
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Текущий формат печати той же страницы: 100x78 или 130x76 (перемикатель на странице)
  function currentMode(modeKey) {
    try { return localStorage.getItem(modeKey) === '2' ? '2' : '1'; } catch (e) { return '1'; }
  }

  function sb() {
    if (!window.__lcdrSb) window.__lcdrSb = window.supabase.createClient(SB_URL, SB_KEY);
    return window.__lcdrSb;
  }

  // PN и Brand по SN из базы (с запасным вариантом для TBV/TOV, как в оригинале)
  async function lookupPn(sn) {
    const cached = dbCache.get(sn);
    if (cached) return cached;

    let result = { pn: '', brand: '' };
    try {
      const { data, error } = await sb().from(TABLE).select(`${COL_PN}, ${COL_BRAND}`).eq(COL_SN, sn).limit(1);
      if (!error && data && data.length) {
        result = { pn: data[0][COL_PN] || '', brand: data[0][COL_BRAND] || '' };
      } else {
        const u = sn.toUpperCase();
        if (u.startsWith('TBV') && u.length >= 11) result = { pn: `750${u.substring(0, 11)}N000`, brand: 'PHP[PHP]' };
        else if (u.startsWith('TOV') && u.length >= 11) result = { pn: `730${u.substring(0, 11)}N000`, brand: 'PHP[PHP]' };
      }
    } catch (e) {}

    if (result.pn) dbCache.set(sn, result);
    return result;
  }

  // Разбор строки, скопированной из таблицы (колонки через Tab)
  function parseSheetRow(parts) {
    if (!parts || parts.length === 0) return null;
    if (parts.length >= 8) {
      if ((parts[5] || '').toLowerCase() === 'panel sn') return null;
      if (!parts[5] && !parts[7]) return null;
      return { sn: parts[5] || '', pn: parts[7] || '', brand: parts[4] || '' };
    }
    if ((parts[0] || '').toLowerCase().startsWith('total')) return null;
    if (!parts[0]) return null;
    return { sn: parts[0] || '', pn: parts[1] || '', brand: parts[2] || '' };
  }

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
  function stdPages(items, inc) {
    let out = '';
    items.forEach(p => {
      const one = `<div class="pg"><div class="lbl-std">
        <div class="top-divider"></div>
        <div class="label-section">
          <div class="section-header${inc ? ' has-brand' : ''}"><span class="header-title">PN:</span>${inc ? `<span class="brand-tag">${esc(p.brand)}</span>` : ''}</div>
          <div class="barcode-box">${bc(p.pn, 48, 1.18)}</div>
          <div class="val-pn">${esc(p.pn)}</div>
        </div>
        <div class="label-section">
          <div class="section-header"><span class="header-title">SN:</span></div>
          <div class="barcode-box">${bc(p.sn, 48, 0.92)}</div>
          <div class="val-sn">${esc(p.sn)}</div>
        </div>
      </div></div>`;
      out += one + one;
    });
    return out;
  }

  // Новая этикетка 130x76 мм, по 2 копии на каждый SN
  function newPages(items, inc) {
    let out = '';
    items.forEach(p => {
      const one = `<div class="pg"><div class="lbl-new">
        ${inc ? `<div class="brand-new">${esc(p.brand)}</div>` : ''}
        <div class="bw-pn">${bc(p.pn, 48, 1.3, true)}</div>
        <div class="cap">PN</div>
        <div class="val">${esc(p.pn)}</div>
        <div class="cap">SN</div>
        <div class="bw-sn">${bc(p.sn, 48, 1.0, true)}</div>
        <div class="val">${esc(p.sn)}</div>
      </div></div>`;
      out += one + one;
    });
    return out;
  }

  function printInFrame(html) {
    const old = document.getElementById('mnPrintFrame');
    if (old) old.remove();
    const f = document.createElement('iframe');
    f.id = 'mnPrintFrame';
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

  // Формат берётся из переключателя страницы: 100x78 или 130x76
  function printItems(items, inc, modeKey) {
    if (currentMode(modeKey) === '2') printDoc(newPages(items, inc), 130, 76);
    else printDoc(stdPages(items, inc), 100, 78);
  }

  // Друк з полів введення (логіка з оригіналу)
  async function printManual(card, inc, modeKey) {
    const snRaw = card.querySelector('.mn-sn').value.trim();
    const pnRaw = card.querySelector('.mn-pn').value.trim();
    const brandRaw = card.querySelector('.mn-brand').value.trim();

    if (!snRaw && !pnRaw) { alert(t('alertFill')); return; }

    const snLines = snRaw ? snRaw.split(/\r?\n/).map(s => s.trim()) : [];
    const pnLines = pnRaw ? pnRaw.split(/\r?\n/).map(s => s.trim()) : [];
    const brandLines = brandRaw ? brandRaw.split(/\r?\n/).map(s => s.trim()) : [];

    const max = Math.max(snLines.length, pnLines.length, brandLines.length);
    const items = [];

    for (let i = 0; i < max; i++) {
      let sn = snLines[i] || '';
      let pn = pnLines[i] || '';
      let brand = brandLines[i] || (brandLines[0] || '-');

      if (sn.includes('\t')) {
        const row = parseSheetRow(sn.split('\t').map(p => p.trim()));
        if (row) {
          sn = row.sn;
          if (row.pn) pn = row.pn;
          if (row.brand) brand = row.brand;
        } else {
          sn = '';
        }
      }

      if (sn && !pn) {
        const db = await lookupPn(sn);
        if (db.pn) pn = db.pn;
        if ((!brand || brand === '-') && db.brand) brand = db.brand;
      }

      if (sn || pn) items.push({ sn: sn || 'N/A', pn: pn || 'N/A', brand: brand || '-' });
    }

    if (!items.length) { alert(t('alertNoData')); return; }

    printItems(items, inc, modeKey);
  }

  // Вставка таблицы из Google Таблиц: SN, PN и Brand разносятся по полям
  function onSnPaste(e) {
    const card = e.target.closest('.mn-card');
    const cd = e.clipboardData || window.clipboardData;
    const text = cd ? cd.getData('Text') : '';
    if (!text || !text.includes('\t')) return;
    e.preventDefault();

    const rows = [];
    text.split(/\r?\n/).filter(l => l.trim() !== '').forEach(line => {
      const row = parseSheetRow(line.split('\t').map(p => p.trim()));
      if (row) rows.push(row);
    });

    card.querySelector('.mn-sn').value = rows.map(r => r.sn).join('\n');
    card.querySelector('.mn-pn').value = rows.some(r => r.pn) ? rows.map(r => r.pn).join('\n') : '';
    card.querySelector('.mn-brand').value = rows.some(r => r.brand) ? rows.map(r => r.brand).join('\n') : '';
  }

  function applyLang(card) {
    card.querySelectorAll('[data-mn-t]').forEach(el => { el.textContent = t(el.dataset.mnT); });
  }

  function setLang(l) {
    lang = I18N[l] ? l : 'en';
    document.querySelectorAll('.mn-card').forEach(applyLang);
  }

  function toggle(card, pageId) {
    const collapsed = card.classList.toggle('mn-collapsed');
    try { localStorage.setItem(COLLAPSE_KEY + pageId, collapsed ? '1' : '0'); } catch (e) {}
  }

  function mount(page) {
    const root = document.getElementById(page.id);
    if (!root || root.querySelector('.mn-card')) return;

    const holder = document.createElement('div');
    holder.innerHTML = MARKUP;
    const card = holder.firstElementChild;
    root.insertBefore(card, root.firstChild);

    card.querySelector('.mn-head').addEventListener('click', () => toggle(card, page.id));
    card.querySelector('.mn-print').addEventListener('click', () => printManual(card, false, page.modeKey));
    card.querySelector('.mn-print-brand').addEventListener('click', () => printManual(card, true, page.modeKey));
    card.querySelector('.mn-sn').addEventListener('paste', onSnPaste);

    try {
      if (localStorage.getItem(COLLAPSE_KEY + page.id) === '1') card.classList.add('mn-collapsed');
    } catch (e) {}

    applyLang(card);
  }

  function mountAll() {
    PAGES.forEach(mount);
  }

  function init() {
    try {
      const saved = localStorage.getItem('siteLang');
      if (saved && I18N[saved]) lang = saved;
    } catch (e) {}

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    mountAll();
  }

  // Смена языка на сайте (select в верхней панели)
  document.addEventListener('change', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('lang-select')) setLang(e.target.value);
  });

  window.setManualLang = setLang;

  // Блок добавляется после того, как модули final1/final2 построили свои страницы
  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('load', mountAll);
})();
