/* ==========================================================
   LCDR HUB — Panel SN Filter
   Загружает Excel/CSV, фильтрует строки, убирает дубликаты по Panel SN
   и отдаёт CSV (panel_sn, tpv_pn, brand) для импорта в Supabase.
   Контейнер: #panelsnPage (создан в index.html). Язык: setPanelSnLang().
   ========================================================== */
(function () {
  const root = document.getElementById("panelsnPage");
  if (!root) return;

  /* ---------- Тексты ---------- */
  const TXT = {
    en: { copied: "SQL script copied to clipboard — paste it in the Supabase SQL Editor", copyFail: "Could not copy the SQL script automatically", download: "Download CSV (for Supabase)", dropTitle: "Click or drop a file here", dropSub: ".xlsx, .xls, .csv — columns: Panel SN, TPV PN, Brand, Process", empty: "Upload a file to see the result", none: "No rows left after filtering", inFile: "In file", afterFilters: "After filters", dupes: "Duplicates removed", marked: "Marked as unneeded", ready: "To export", markTitle: "Mark as unneeded", readError: "Could not read the file" },
    uk: { copied: "SQL-скрипт скопійовано в буфер — вставте його в Supabase SQL Editor", copyFail: "Не вдалося автоматично скопіювати SQL-скрипт", download: "Завантажити CSV (для Supabase)", dropTitle: "Натисніть або перетягніть файл", dropSub: ".xlsx, .xls, .csv — колонки: Panel SN, TPV PN, Brand, Process", empty: "Завантажте файл, щоб побачити результат", none: "Після фільтрації рядків не залишилось", inFile: "У файлі", afterFilters: "Після фільтрів", dupes: "Дублікатів прибрано", marked: "Позначено непотрібними", ready: "До вивантаження", markTitle: "Позначити як непотрібне", readError: "Не вдалося прочитати файл" },
    ru: { copied: "SQL-скрипт скопирован в буфер — вставьте его в Supabase SQL Editor", copyFail: "Не удалось автоматически скопировать SQL-скрипт", download: "Скачать CSV (для Supabase)", dropTitle: "Нажмите или перетащите файл", dropSub: ".xlsx, .xls, .csv — колонки: Panel SN, TPV PN, Brand, Process", empty: "Загрузите файл, чтобы увидеть результат", none: "После фильтрации строк не осталось", inFile: "В файле", afterFilters: "После фильтров", dupes: "Дубликатов убрано", marked: "Отмечено ненужным", ready: "К выгрузке", markTitle: "Отметить как ненужное", readError: "Не удалось прочитать файл" },
    pl: { copied: "Skrypt SQL skopiowany do schowka — wklej go w Supabase SQL Editor", copyFail: "Nie udało się automatycznie skopiować skryptu SQL", download: "Pobierz CSV (dla Supabase)", dropTitle: "Kliknij lub upuść plik", dropSub: ".xlsx, .xls, .csv — kolumny: Panel SN, TPV PN, Brand, Process", empty: "Wgraj plik, aby zobaczyć wynik", none: "Po filtrowaniu nie zostały żadne wiersze", inFile: "W pliku", afterFilters: "Po filtrach", dupes: "Usunięto duplikatów", marked: "Oznaczono jako zbędne", ready: "Do eksportu", markTitle: "Oznacz jako zbędne", readError: "Nie udało się odczytać pliku" }
  };
  let lang = "en";
  const tx = (k) => (TXT[lang] || TXT.en)[k] || TXT.en[k] || k;

  /* ---------- Разметка ---------- */
  root.innerHTML = `
    <div class="rl-wrap">
      <input type="file" id="psFile" accept=".xlsx,.xls,.csv" hidden>
      <div id="psDrop" class="ps-drop">
        <div class="ps-drop-icon">⬆</div>
        <div class="ps-drop-title" data-ps="dropTitle"></div>
        <div class="ps-drop-sub" data-ps="dropSub"></div>
      </div>
      <div id="psStatus" class="ps-status"></div>
      <div class="ps-bar">
        <button id="psDownload" class="rl-add" data-ps="download" disabled></button>
        <span id="psNote" class="ps-note"></span>
      </div>
    </div>
    <div class="rl-wrap">
      <div class="rl-table-wrap ps-table-wrap">
        <table class="rl-table">
          <thead>
            <tr>
              <th class="col-check">✕</th>
              <th class="ps-sort" id="psSortHead">panel_sn <span id="psSortIcon">⇅</span></th>
              <th>tpv_pn</th>
              <th>brand</th>
            </tr>
          </thead>
          <tbody id="psBody"></tbody>
        </table>
      </div>
    </div>`;

  const drop = root.querySelector("#psDrop");
  const fileInput = root.querySelector("#psFile");
  const body = root.querySelector("#psBody");
  const statusEl = root.querySelector("#psStatus");
  const dlBtn = root.querySelector("#psDownload");
  const noteEl = root.querySelector("#psNote");

  let data = [];
  let sortAsc = null;
  let stats = { total: 0, filtered: 0, dupes: 0 };
  let errorMsg = "";

  const INVALID_TPV = ["750TBV", "730TOV", "730TOG", "730TBV", "750GOV"];

  /* ---------- Загрузка файла ---------- */
  drop.addEventListener("click", () => fileInput.click());
  drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("dragover"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("dragover"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("dragover");
    if (e.dataTransfer.files.length) readFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length) readFile(e.target.files[0]);
    fileInput.value = "";
  });

  function readFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        errorMsg = "";
        applyFilters(XLSX.utils.sheet_to_json(ws, { defval: "" }));
      } catch (err) {
        errorMsg = tx("readError") + ": " + err.message;
        render();
      }
    };
    reader.readAsArrayBuffer(file);
  }

  /* ---------- Фильтры ---------- */
  function find(row, keys) {
    for (const k of keys) {
      const v = row[k];
      if (v !== undefined && v !== null && v !== "") return v;
    }
    return "";
  }

  function applyFilters(rows) {
    const kept = [];
    rows.forEach((row) => {
      const proc  = String(find(row, ["Process", "process"])).trim().toUpperCase();
      const tpv   = String(find(row, ["TPV PN", "TPV_PN", "tpv_pn", "TPVPN"])).trim().toUpperCase();
      const sn    = String(find(row, ["Panel SN", "PANEL_SN", "panel_sn", "PanelSN"])).trim().toUpperCase();
      const brand = String(find(row, ["Brand", "brand", "BRAND"])).trim();

      if (proc.includes("OCR")) return;
      if (INVALID_TPV.some((p) => tpv.startsWith(p))) return;
      if (sn.startsWith("LCM")) return;

      kept.push({
        panel_sn: find(row, ["Panel SN", "PANEL_SN", "panel_sn", "PanelSN"]),
        tpv_pn: find(row, ["TPV PN", "TPV_PN", "tpv_pn", "TPVPN"]),
        brand
      });
    });

    // Дубликаты по panel_sn: остаётся строка с заполненным brand
    const hasBrand = (r) => { const b = (r.brand || "").trim(); return b !== "" && b !== "-"; };
    const map = new Map();
    kept.forEach((r) => {
      const key = String(r.panel_sn).trim().toUpperCase();
      if (!key) return;
      if (!map.has(key)) map.set(key, r);
      else if (!hasBrand(map.get(key)) && hasBrand(r)) map.set(key, r);
    });

    data = [];
    let id = 0;
    map.forEach((r) => data.push({ id: id++, panel_sn: r.panel_sn, tpv_pn: r.tpv_pn, brand: r.brand, excluded: false }));

    stats = { total: rows.length, filtered: kept.length, dupes: kept.length - data.length };
    sortAsc = true;
    sortData();
    render();
  }

  /* ---------- Сортировка и исключение строк ---------- */
  function sortData() {
    if (sortAsc === null) return;
    data.sort((a, b) => {
      const x = String(a.panel_sn).toLowerCase();
      const y = String(b.panel_sn).toLowerCase();
      if (x < y) return sortAsc ? -1 : 1;
      if (x > y) return sortAsc ? 1 : -1;
      return 0;
    });
  }

  root.querySelector("#psSortHead").addEventListener("click", () => {
    if (!data.length) return;
    sortAsc = sortAsc !== true;
    sortData();
    render();
  });

  body.addEventListener("change", (e) => {
    if (!e.target.classList.contains("ps-check")) return;
    const id = Number(e.target.getAttribute("data-id"));
    const item = data.find((r) => r.id === id);
    if (item) { item.excluded = e.target.checked; render(); }
  });

  /* ---------- Отрисовка ---------- */
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function applyText() {
    root.querySelectorAll("[data-ps]").forEach((el) => { el.textContent = tx(el.dataset.ps); });
  }

  function render() {
    root.querySelector("#psSortIcon").textContent = sortAsc === true ? "▲" : sortAsc === false ? "▼" : "⇅";

    if (errorMsg) {
      statusEl.innerHTML = `<span>${esc(errorMsg)}</span>`;
      return;
    }

    if (!data.length) {
      const msg = stats.total ? tx("none") : tx("empty");
      body.innerHTML = `<tr><td colspan="4" class="rl-empty">${msg}</td></tr>`;
      dlBtn.disabled = true;
      statusEl.innerHTML = "";
      return;
    }

    const excluded = data.filter((r) => r.excluded).length;
    const ready = data.length - excluded;
    dlBtn.disabled = ready === 0;
    statusEl.innerHTML =
      `<span>${tx("inFile")}: <b>${stats.total}</b></span>` +
      `<span>${tx("afterFilters")}: <b>${stats.filtered}</b></span>` +
      `<span>${tx("dupes")}: <b>${stats.dupes}</b></span>` +
      `<span>${tx("marked")}: <b>${excluded}</b></span>` +
      `<span>${tx("ready")}: <b>${ready}</b></span>`;

    body.innerHTML = data.map((r) => `
      <tr class="${r.excluded ? "ps-excluded" : ""}">
        <td class="col-check"><input type="checkbox" class="ps-check" data-id="${r.id}" ${r.excluded ? "checked" : ""} title="${tx("markTitle")}"></td>
        <td class="rl-sn">${esc(r.panel_sn)}</td>
        <td>${esc(r.tpv_pn)}</td>
        <td>${esc(r.brand)}</td>
      </tr>`).join("");
  }

  /* ---------- SQL для Supabase (копируется в буфер вместе со скачиванием CSV) ---------- */
  const SQL_SCRIPT = `BEGIN;
INSERT INTO televisions (panel_sn, tpv_pn, brand)
SELECT DISTINCT ON (panel_sn) panel_sn, tpv_pn, brand
FROM televisions_temp
ON CONFLICT (panel_sn)
DO UPDATE SET 
    tpv_pn = EXCLUDED.tpv_pn,
    brand = EXCLUDED.brand;
TRUNCATE TABLE televisions_temp;
COMMIT;`;

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // запасной способ, если буфер недоступен
    return new Promise((resolve, reject) => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error("copy failed"));
    });
  }

  /* ---------- Экспорт CSV ---------- */
  dlBtn.addEventListener("click", () => {
    const out = data.filter((r) => !r.excluded);
    if (!out.length) return;
    const q = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    const csv = "panel_sn,tpv_pn,brand\n" +
      out.map((r) => q(r.panel_sn) + "," + q(r.tpv_pn) + "," + q(r.brand)).join("\n") + "\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "supabase_panel_sn_export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    copyText(SQL_SCRIPT)
      .then(() => { noteEl.textContent = tx("copied"); noteEl.classList.remove("ps-note-err"); })
      .catch(() => { noteEl.textContent = tx("copyFail"); noteEl.classList.add("ps-note-err"); });
  });

  /* ---------- Язык (вызывается из app.js) ---------- */
  window.setPanelSnLang = function (l) {
    lang = TXT[l] ? l : "en";
    noteEl.textContent = "";
    applyText();
    render();
  };

  applyText();
  render();
})();
