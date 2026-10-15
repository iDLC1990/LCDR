/* Страница «PN Base» (база деталей).
   Подключение: <script src="js/pnbase.js"></script> ПІСЛЯ js/app.js і JsBarcode.
   Контейнер: <section id="pnbasePage">.
   Мову задає сайт через window.setPnBaseLang('uk' | 'ru' | 'pl' | 'en'). */
(function () {
  function init() {
    const page = document.getElementById('pnbasePage');
    if (!page) return;

    const css = `
#pnbaseSection .pb-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
#pnbaseSection .pb-row .form-group { flex: 1; min-width: 150px; }
#pnbaseSection .manual-input-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 10px; }
#pnbaseSection .code-text { font-family: Consolas, 'Courier New', monospace; }
#pnbaseSection .pb-status { font-size: 12px; font-weight: 600; color: #2563EB; margin-top: 8px; }
#pnbaseSection .pb-hint { font-size: 12px; color: #6B7280; margin: 0 0 10px; }
#pnbaseSection #pb_edit { background: #F3F4F6; border: 1px solid #D1D5DB; border-radius: 8px; padding: 14px; margin: 12px 0; }
#pnbaseSection .pb-red { background: #991B1B; }
#pnbaseSection .pb-red:hover { background: #B91C1C; }
#pnbaseSection .pb-print { background: none; border: none; cursor: pointer; font-size: 16px; padding: 2px 6px; border-radius: 4px; }
#pnbaseSection .pb-print:hover { background: #E5E7EB; }
#pnbaseSection .data-table { border-collapse: collapse; width: 100%; font-size: 13px; color: #111827; }
#pnbaseSection .data-table th, #pnbaseSection .data-table td { padding: 8px 12px; border-bottom: 1px solid #E5E7EB; text-align: left; }
#pnbaseSection .data-table th { background: #F3F4F6; color: #374151; font-weight: 600; }
.pb-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 10000; }
.pb-box { background: #1f2b35; border: 1px solid #374151; border-radius: 12px; padding: 20px; max-width: 340px; color: #fff; font-size: 14px; text-align: center; }
.pb-box p { margin: 0 0 16px; }
.pb-box .btn { margin: 0 4px; }`;

    const section = `
<div id="pnbaseSection">
  <div class="manual-input-card">
    <div class="manual-input-title" data-i18n="addTitle">Масове додавання</div>
    <div class="form-group" style="margin-bottom: 12px;">
      <label data-i18n="labelPanelPn">Panel_pn (Список з нового рядка)</label>
      <textarea id="pb_panelPn" class="form-input code-text" rows="3" placeholder="750TBV500S74HHN000&#10;750TBV500S78AHN000..."></textarea>
    </div>
    <div class="pb-row">
      <div class="form-group"><label data-i18n="labelData">DATA</label><input type="date" id="pb_addData" class="form-input"></div>
      <div class="form-group"><label data-i18n="labelPn">PN</label><input type="text" id="pb_addPn" class="form-input code-text" placeholder="203BYQ..."></div>
      <div class="form-group"><label data-i18n="labelLocation">Location</label><input type="text" id="pb_addLocation" class="form-input code-text" placeholder="KUWETA 666"></div>
      <div class="form-group"><label data-i18n="labelInfo">info</label><input type="text" id="pb_addInfo" class="form-input code-text" placeholder="DIFF PLATE 50"></div>
    </div>
    <button class="btn" onclick="pb.addBulk()" data-i18n="btnAdd">+ Додати список</button>
    <div id="pb_addStatus" class="pb-status"></div>
  </div>

  <div class="manual-input-card">
    <div class="manual-input-title" data-i18n="searchTitle">Пошук та Редагування</div>
    <div class="pb-row" style="margin-bottom: 6px;">
      <input type="text" id="pb_query" class="form-input code-text" style="flex: 3; min-width: 200px;" data-i18n-placeholder="searchPlaceholder" placeholder="Введіть PN або Panel_pn">
      <button class="btn" style="flex: 1;" onclick="pb.search()" data-i18n="btnSearch">Знайти</button>
    </div>
    <div id="pb_searchStatus" class="pb-status"></div>
    <div id="pb_edit" style="display: none;">
      <div class="manual-input-title" data-i18n="editTitle">Змінити знайдені рядки</div>
      <p class="pb-hint" data-i18n="editHint">Залиште поле порожнім, якщо не хочете його змінювати.</p>
      <div class="pb-row">
        <div class="form-group"><label data-i18n="labelNewData">Нова Дата</label><input type="date" id="pb_editData" class="form-input"></div>
        <div class="form-group"><label data-i18n="labelNewLocation">Нова Локація</label><input type="text" id="pb_editLocation" class="form-input code-text"></div>
        <div class="form-group"><label data-i18n="labelNewInfo">Нове info</label><input type="text" id="pb_editInfo" class="form-input code-text"></div>
      </div>
      <button class="btn btn-brand" onclick="pb.update()" data-i18n="btnUpdate">Застосувати зміни</button>
    </div>
    <button class="btn pb-red" id="pb_dedupeBtn" style="display: none; margin-bottom: 10px;" onclick="pb.dedupe()" data-i18n="btnDedupe">Видалити дублікати</button>
    <div style="overflow-x: auto;"><div id="pb_results"></div></div>
  </div>
</div>`;

    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    page.innerHTML = section;

    // ===== логіка бази =====
    const API_URL = "https://script.google.com/macros/s/AKfycbwCvcIfaYATD8AFk9PZezOnMILNgecMKkefI7P81pSR4hxiLQXIa9rirL8LCM7s0AzT/exec";
    const $ = (id) => document.getElementById(id);
    const showToast = (m) => alert(m);
    let results = [], lang = 'uk';
    try { lang = localStorage.getItem('pnbase_lang') || 'uk'; } catch (e) {}

    const TR = {
      ru:{addTitle:"Массовое добавление",labelPanelPn:"Panel_pn (Список с новой строки)",labelData:"DATA",labelPn:"PN",labelLocation:"Location",labelInfo:"info",btnAdd:"+ Добавить список",searchTitle:"Поиск и Редактирование",searchPlaceholder:"Введите PN или Panel_pn",btnSearch:"Найти",editTitle:"Изменить найденные строки",editHint:"Оставьте поле пустым, если не хотите его менять.",labelNewData:"Новая Дата",labelNewLocation:"Новая Локация",labelNewInfo:"Новое info",btnUpdate:"Применить изменения",statusRecord:"Запись...",statusSearch:"Поиск...",statusUpdate:"Обновление...",notFound:"Ничего не найдено.",errEnterPn:"Введите хотя бы один Panel_pn",errEnterQuery:"Введите запрос",errFillOne:"Заполните хотя бы одно поле!",confirmUpdate:c=>`Обновить ${c} строк?`,confirmYes:"Да",confirmNo:"Отмена",btnDedupe:"Удалить дубликаты",noDuplicates:"Дубликатов нет.",statusDedupe:"Удаление...",confirmDedupe:c=>`Удалить ${c} дубликатов? Останется только последняя по дате запись.`,err:"Ошибка",printTip:"Печать этикетки",pasteNoCol:"Колонка Customer Model не найдена",pasteAdded:c=>`✅ Добавлено Panel_pn: ${c}`},
      uk:{addTitle:"Масове додавання",labelPanelPn:"Panel_pn (Список з нового рядка)",labelData:"DATA",labelPn:"PN",labelLocation:"Location",labelInfo:"info",btnAdd:"+ Додати список",searchTitle:"Пошук та Редагування",searchPlaceholder:"Введіть PN або Panel_pn",btnSearch:"Знайти",editTitle:"Змінити знайдені рядки",editHint:"Залиште поле порожнім, якщо не хочете його змінювати.",labelNewData:"Нова Дата",labelNewLocation:"Нова Локація",labelNewInfo:"Нове info",btnUpdate:"Застосувати зміни",statusRecord:"Запис...",statusSearch:"Пошук...",statusUpdate:"Оновлення...",notFound:"Нічого не знайдено.",errEnterPn:"Введіть хоча б один Panel_pn",errEnterQuery:"Введіть запит",errFillOne:"Заповніть хоча б одне поле!",confirmUpdate:c=>`Оновити ${c} рядків?`,confirmYes:"Так",confirmNo:"Скасувати",btnDedupe:"Видалити дублікати",noDuplicates:"Дублікатів немає.",statusDedupe:"Видалення...",confirmDedupe:c=>`Видалити ${c} дублікатів? Залишиться лише останній запис за датою.`,err:"Помилка",printTip:"Друк етикетки",pasteNoCol:"Колонку Customer Model не знайдено",pasteAdded:c=>`✅ Додано Panel_pn: ${c}`},
      pl:{addTitle:"Masowe dodawanie",labelPanelPn:"Panel_pn (Lista z nowej linii)",labelData:"DATA",labelPn:"PN",labelLocation:"Location",labelInfo:"info",btnAdd:"+ Dodaj listę",searchTitle:"Wyszukiwanie i Edycja",searchPlaceholder:"Wpisz PN lub Panel_pn",btnSearch:"Szukaj",editTitle:"Edytuj znalezione wiersze",editHint:"Pozostaw pole puste, jeśli chcesz je pominąć.",labelNewData:"Nowa Data",labelNewLocation:"Nowa Lokalizacja",labelNewInfo:"Nowe info",btnUpdate:"Zastosuj zmiany",statusRecord:"Zapisywanie...",statusSearch:"Szukanie...",statusUpdate:"Aktualizacja...",notFound:"Nic nie znaleziono.",errEnterPn:"Wprowadź co najmniej jeden Panel_pn",errEnterQuery:"Wprowadź zapytanie",errFillOne:"Wypełnij co najmniej jedno pole!",confirmUpdate:c=>`Zaktualizować ${c} wierszy?`,confirmYes:"Tak",confirmNo:"Anuluj",btnDedupe:"Usuń duplikaty",noDuplicates:"Brak duplikatów.",statusDedupe:"Usuwanie...",confirmDedupe:c=>`Usunąć ${c} duplikatów? Zostanie tylko najnowszy wpis wg daty.`,err:"Błąd",printTip:"Drukuj etykietę",pasteNoCol:"Nie znaleziono kolumny Customer Model",pasteAdded:c=>`✅ Dodano Panel_pn: ${c}`},
      en:{addTitle:"Bulk Add",labelPanelPn:"Panel_pn (List, one per line)",labelData:"DATA",labelPn:"PN",labelLocation:"Location",labelInfo:"info",btnAdd:"+ Add List",searchTitle:"Search & Edit",searchPlaceholder:"Enter PN or Panel_pn",btnSearch:"Search",editTitle:"Edit Found Rows",editHint:"Leave the field empty if you don't want to change it.",labelNewData:"New Date",labelNewLocation:"New Location",labelNewInfo:"New info",btnUpdate:"Apply Changes",statusRecord:"Saving...",statusSearch:"Searching...",statusUpdate:"Updating...",notFound:"Nothing found.",errEnterPn:"Enter at least one Panel_pn",errEnterQuery:"Enter search query",errFillOne:"Fill out at least one field!",confirmUpdate:c=>`Update ${c} rows?`,confirmYes:"Yes",confirmNo:"Cancel",btnDedupe:"Remove duplicates",noDuplicates:"No duplicates.",statusDedupe:"Deleting...",confirmDedupe:c=>`Delete ${c} duplicates? Only the latest entry by date will be kept.`,err:"Error",printTip:"Print label",pasteNoCol:"Customer Model column not found",pasteAdded:c=>`✅ Panel_pn added: ${c}`}
    };
    if (!TR[lang]) lang = 'uk';
    const T = () => TR[lang];

    function setLang(l) {
      lang = TR[l] ? l : 'uk';
      try { localStorage.setItem('pnbase_lang', lang); } catch (e) {}
      document.querySelectorAll('#pnbaseSection [data-i18n]').forEach((el) => { const v = T()[el.dataset.i18n]; if (v) el.textContent = v; });
      document.querySelectorAll('#pnbaseSection [data-i18n-placeholder]').forEach((el) => { const v = T()[el.dataset.i18nPlaceholder]; if (v) el.placeholder = v; });
      if (results.length) renderTable(results);
    }
    window.setPnBaseLang = setLang;

    function ask(message) {
      return new Promise((resolve) => {
        const o = document.createElement('div'); o.className = 'pb-overlay';
        o.innerHTML = '<div class="pb-box"><p></p><button class="btn" data-y></button><button class="btn btn-secondary" data-n></button></div>';
        o.querySelector('p').textContent = message;
        o.querySelector('[data-y]').textContent = T().confirmYes;
        o.querySelector('[data-n]').textContent = T().confirmNo;
        document.body.appendChild(o);
        const done = (r) => { o.remove(); resolve(r); };
        o.querySelector('[data-y]').onclick = () => done(true);
        o.querySelector('[data-n]').onclick = () => done(false);
        o.addEventListener('click', (e) => { if (e.target === o) done(false); });
      });
    }
    async function request(payload) {
      try {
        const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
        return await r.json();
      } catch (e) { return { success: false, error: e.message }; }
    }
    const esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    const fmtDate = (v) => { if (!v) return ''; const s = String(v), m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[3]}.${m[2]}.${m[1]}` : s; };
    const fail = (e) => showToast(T().err + ': ' + e);

    // ===== друк етикетки 130x90 мм =====
    function printLabels(data, pn, location) {
      let d = data;
      if (!d) { const n = new Date(); d = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; }
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.style.position = 'absolute'; svg.style.visibility = 'hidden';
      document.body.appendChild(svg);
      JsBarcode(svg, String(pn), { format: 'CODE128B', displayValue: false, width: 2, height: 95, margin: 0, lineColor: '#000', background: '#fff' });
      svg.removeAttribute('style'); svg.setAttribute('class', 'print-barcode');
      const bc = svg.outerHTML; document.body.removeChild(svg);
      const blk = (title, val, last) => `<div class="print-block${last ? ' print-block-last' : ''}"><div class="print-title">${title}</div><div class="print-value">${esc(val)}</div></div>`;
      printFrame(`<div class="print-label">${bc}${blk('DATE', fmtDate(d))}${blk('PN', pn)}${blk('LOCATION', location, true)}</div>`);
    }
    function printFrame(labelHtml) {
      const docHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Label</title><style>
@page{size:130mm 90mm;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff}
.print-label{width:130mm;height:90mm;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;padding:6mm 6mm 5mm 6mm;overflow:hidden;break-inside:avoid;page-break-inside:avoid}
.print-block{width:100%;max-width:118mm;margin-bottom:3mm}
.print-block-last{margin-bottom:0}
.print-title{font-size:10pt;font-weight:900;line-height:1;margin-bottom:1.5mm}
.print-value{width:100%;max-width:118mm;font-size:16pt;font-weight:900;line-height:1.1;white-space:normal;overflow:visible;overflow-wrap:anywhere;word-break:break-word}
.print-barcode{display:block;width:118mm !important;max-width:118mm !important;height:26mm !important;margin:0 0 4mm 0}
</style></head><body>${labelHtml}</body></html>`;
      const old = document.getElementById('pbPrintFrame'); if (old) old.remove();
      const f = document.createElement('iframe');
      f.id = 'pbPrintFrame';
      f.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
      document.body.appendChild(f);
      const win = f.contentWindow;
      win.document.open(); win.document.write(docHtml); win.document.close();
      win.onafterprint = () => setTimeout(() => f.remove(), 500);
      setTimeout(() => {
        // якщо текст не влазить: спочатку зменшуємо шрифт, потім штрихкод
        const el = win.document.querySelector('.print-label');
        if (el) {
          const vals = el.querySelectorAll('.print-value'), bar = el.querySelector('.print-barcode');
          let size = 16, scale = 1;
          while (el.scrollHeight > el.clientHeight && (size > 7 || scale > 0.5)) {
            if (size > 7) { size -= 0.5; vals.forEach((v) => { v.style.fontSize = size + 'pt'; }); }
            else { scale -= 0.05; if (bar) bar.style.height = (26 * scale) + 'mm'; }
          }
        }
        win.focus(); win.print();
      }, 250);
    }

    // ===== дії =====
    async function addBulk() {
      const panelPns = $('pb_panelPn').value.trim();
      if (!panelPns) return showToast(T().errEnterPn);
      const data = $('pb_addData').value, pn = $('pb_addPn').value.trim(), location = $('pb_addLocation').value.trim(), info = $('pb_addInfo').value;
      $('pb_addStatus').textContent = T().statusRecord;
      const res = await request({ action: 'addBulk', panelPns, data, pn, location, info });
      $('pb_addStatus').textContent = '';
      if (res.success) {
        printLabels(data, pn, location);
        $('pb_panelPn').value = ''; $('pb_addInfo').value = '';
        showToast(res.message);
      } else fail(res.error);
    }
    async function search() {
      const q = $('pb_query').value.trim();
      if (!q) return showToast(T().errEnterQuery);
      $('pb_searchStatus').textContent = T().statusSearch;
      $('pb_results').innerHTML = '';
      $('pb_edit').style.display = 'none'; $('pb_dedupeBtn').style.display = 'none';
      const res = await request({ action: 'search', query: q });
      $('pb_searchStatus').textContent = '';
      if (!res.success) return fail(res.error);
      results = res.data;
      if (results.length) {
        renderTable(results);
        $('pb_edit').style.display = 'block'; $('pb_dedupeBtn').style.display = 'inline-flex';
      } else $('pb_results').innerHTML = `<p class="pb-hint">${T().notFound}</p>`;
    }
    function renderTable(data) {
      let h = '<table class="data-table"><thead><tr><th></th><th>Panel_pn</th><th>DATA</th><th>PN</th><th>Location</th><th>info</th></tr></thead><tbody>';
      data.forEach((r, i) => {
        h += `<tr><td>${i === 0 ? `<button class="pb-print" data-print="0" title="${esc(T().printTip)}">🖨️</button>` : ''}</td><td class="code-text">${esc(r.panel_pn)}</td><td>${esc(r.data)}</td><td class="code-text">${esc(r.pn)}</td><td>${esc(r.location)}</td><td>${esc(r.info)}</td></tr>`;
      });
      $('pb_results').innerHTML = h + '</tbody></table>';
      const b = $('pb_results').querySelector('[data-print]');
      if (b) b.onclick = () => { const r = results[0]; if (r) printLabels(r.data, r.pn, r.location); };
    }
    async function update() {
      if (!results.length) return;
      const rowNumbers = results.map((r) => r.rowNumber);
      const nd = $('pb_editData').value, nl = $('pb_editLocation').value.trim(), ni = $('pb_editInfo').value;
      if (!nd && !nl && !ni) return showToast(T().errFillOne);
      if (!(await ask(T().confirmUpdate(rowNumbers.length)))) return;
      $('pb_searchStatus').textContent = T().statusUpdate;
      const res = await request({ action: 'updateBulk', rowNumbers, data: nd, location: nl, info: ni });
      $('pb_searchStatus').textContent = '';
      if (!res.success) return fail(res.error);
      const f = results[0];
      printLabels(nd || f.data || '', f.pn || '', nl || f.location || '');
      $('pb_editData').value = ''; $('pb_editLocation').value = ''; $('pb_editInfo').value = '';
      setTimeout(search, 700);
      showToast(res.message);
    }
    // дублікати: по Panel_pn лишається рядок з найпізнішою датою
    function findDuplicates(rows) {
      const groups = {};
      rows.forEach((r) => { const k = String(r.panel_pn || '').trim().toUpperCase(); if (k) (groups[k] = groups[k] || []).push(r); });
      const del = [];
      Object.values(groups).forEach((g) => {
        if (g.length < 2) return;
        g.sort((a, b) => { const d = String(b.data || '').localeCompare(String(a.data || '')); return d !== 0 ? d : b.rowNumber - a.rowNumber; });
        g.slice(1).forEach((r) => del.push({ rowNumber: r.rowNumber, panel_pn: r.panel_pn }));
      });
      return del;
    }
    async function dedupe() {
      const del = findDuplicates(results);
      if (!del.length) return showToast(T().noDuplicates);
      if (!(await ask(T().confirmDedupe(del.length)))) return;
      $('pb_searchStatus').textContent = T().statusDedupe;
      const res = await request({ action: 'deleteRows', rows: del });
      $('pb_searchStatus').textContent = '';
      if (res.success) { showToast(res.message); search(); } else fail(res.error);
    }

    // ===== вставка таблиці з QSP у Panel_pn: лишається тільки колонка Customer Model =====
    $('pb_panelPn').addEventListener('paste', (e) => {
      const text = (e.clipboardData || window.clipboardData).getData('Text');
      if (!text || !text.includes('\t')) return; // звичайний список з нового рядка — вставляється як є
      e.preventDefault();

      const rows = text.split(/\r?\n/).map((l) => l.split('\t').map((c) => c.trim()));

      // колонку шукаємо за заголовком "Customer Model"; якщо заголовка немає у виділенні — це 3-тя колонка
      let col = 2;
      for (const r of rows) {
        const i = r.findIndex((c) => c.toLowerCase() === 'customer model');
        if (i !== -1) { col = i; break; }
      }

      const seen = new Set();
      const values = [];
      rows.forEach((r) => {
        const v = (r[col] || '').toUpperCase();
        // тільки схожі на Panel_pn (літери/цифри): відсікає заголовки та службові рядки
        if (/^[A-Z0-9]{8,}$/.test(v) && !seen.has(v)) { seen.add(v); values.push(v); }
      });

      if (!values.length) return showToast(T().pasteNoCol);

      const ta = e.target;
      ta.setRangeText(values.join('\n'), ta.selectionStart, ta.selectionEnd, 'end');
      showToast(T().pasteAdded(values.length));
    });

    window.pb = { addBulk, search, update, dedupe };
    setLang(lang);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
