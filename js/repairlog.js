// js/repairlog.js
(function () {
  const SUPABASE_URL = "https://wtqvaeongxncufvpvvge.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cXZhZW9uZ3huY3VmdnB2dmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDM5MjIsImV4cCI6MjEwMjExOTkyMn0.tRsrb29_b9ev3K75npD5zt_Dz9FMltzaRkdK0RPDn-U";
  const TABLE = "repair_log";

  // Сокращения -> статус. Данные из таблицы, исправленной вручную
  const STATUS_MAP = {
    "1": "FILM",
    "2": "SPRAWDZENIE",
    "11": "FILM WAVING",
    A: "ABNORMAL",
    AA: "AUTO PATERN",
    B: "BOT POL",
    BB: "DIRTY BOT POL",
    BBB: "FOREIGN MATERIAL UNDER POL",
    C: "CROSS LINE",
    CC: "CELL BROKEN",
    CCC: "CLOUDING MURA",
    D: "DIRTY DIFFUSER PLATE",
    DD: "DIFFUSER PLATE CRACK",
    F: "FOREIGN MATERIAL",
    FF: "FOREIGN MATERIAL UNDER DIFF PLATE",
    FFF: "FLICKERING IMAGE",
    H: "H-LINE",
    HH: "H-BLOCK",
    L: "LED NG",
    LL: "LC LEAK",
    LLL: "LIGHT LIKAGE",
    MMM: "SPRAWDZENIE Maciej M. W. Wisniewski",
    N: "NO DISPLAY",
    NN: "PCB NG",
    OK: "OK",
    P: "POL UP",
    POL: "POL BURN",
    PP: "PUSH MURA",
    PPP: "PIXEL OUT OF SPECIFICATION",
    R: "REFLECTOR MURA",
    SCR: "SCRAP",
    SS: "SUP-PIN MURA",
    U: "USZCZELKA",
    V: "V-LINE",
    VV: "V-BLOCK",
    VVV: "V GRAY BLOCK",
    W: "WADA OC",
    WTG: "WAITING"
  };

  // Цвет строки по слову статуса. OK — зелёный, WAITING — жёлтый, SCRAP — красный
  const STATUS_COLORS = {
    OK: "#22c55e",
    WAITING: "#facc15",
    SCRAP: "#ef4444",
    LC: "#FFCC99", ABNORMAL: "#FFCC99", CELL: "#FFB266",
    NO: "#FFB266", "H-LINE": "#FFCCCC", "V-LINE": "#FFCCCC",
    SPRAWDZENIE: "#D1E8FF"
  };

  // Тексты интерфейса. Для языков без своего перевода берётся английский
  const T = {
    en: {
      title: "Repair Log", sn: "Serial number", date: "Date", time: "Time", status: "Status",
      add: "+ Add", statusPh: "Status (OK, VV, H...)",
      search: "Search by serial number (all records)", empty: "No records",
      clear: "Clear status", errLoad: "Load error: ", errSave: "Save error: ",
      noPn: "PN not found in the database. Label not printed.",
      noPrinter: "Label printing is not available on this page."
    },
    ru: {
      title: "Журнал ремонта", sn: "Серийный номер", date: "Дата", time: "Время", status: "Статус",
      add: "+ Добавить", statusPh: "Статус (OK, VV, H...)",
      search: "Поиск по серийному номеру (вся база)", empty: "Нет записей",
      clear: "Очистить статус", errLoad: "Ошибка загрузки: ", errSave: "Ошибка сохранения: ",
      noPn: "PN не найден в базе. Этикетка не напечатана.",
      noPrinter: "Печать этикеток недоступна на этой странице."
    },
    uk: {
      title: "Журнал ремонту", sn: "Серійний номер", date: "Дата", time: "Час", status: "Статус",
      add: "+ Додати", statusPh: "Статус (OK, VV, H...)",
      search: "Пошук за серійним номером (уся база)", empty: "Немає записів",
      clear: "Очистити статус", errLoad: "Помилка завантаження: ", errSave: "Помилка збереження: ",
      noPn: "PN не знайдено в базі. Етикетку не надруковано.",
      noPrinter: "Друк етикеток недоступний на цій сторінці."
    },
    pl: {
      title: "Dziennik napraw", sn: "Numer seryjny", date: "Data", time: "Czas", status: "Status",
      add: "+ Dodaj", statusPh: "Status (OK, VV, H...)",
      search: "Szukaj po numerze seryjnym (cała baza)", empty: "Brak wpisów",
      clear: "Wyczyść status", errLoad: "Błąd ładowania: ", errSave: "Błąd zapisu: ",
      noPn: "Nie znaleziono PN w bazie. Etykieta nie została wydrukowana.",
      noPrinter: "Drukowanie etykiet jest niedostępne na tej stronie."
    }
  };

  // Раскладка, градиенты строк и кнопок сокращений
  const LAYOUT_CSS = `
#secretPage .rl-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1.25rem;
  align-items: start;
  margin-bottom: 1rem;
}
#secretPage .rl-left { display: flex; flex-direction: column; gap: 0.6rem; min-width: 0; }
#secretPage .rl-top .rl-form { margin: 0; flex-wrap: nowrap; }
#secretPage .rl-top .rl-form input { min-width: 0; flex: 1 1 0; }
#secretPage .rl-top .rl-form .rl-add { flex: 0 0 auto; white-space: nowrap; }
#secretPage .rl-top #rlSearch { width: 100%; max-width: none; margin: 0; }

#secretPage .rl-codes {
  display: grid;
  grid-template-columns: repeat(12, 3rem);
  gap: 6px;
  margin: 0;
}
#secretPage .rl-codes .rl-code {
  width: 3rem;
  height: 2rem;
  min-width: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: #e5e7eb;
  font-family: Consolas, monospace;
  font-size: 0.8rem;
  cursor: pointer;
  transition: filter 0.2s, box-shadow 0.2s;
}
#secretPage .rl-codes .rl-code:hover { filter: brightness(1.2); }

/* Цветные кнопки: тот же градиент и полоска слева, что у строк таблицы */
#secretPage .rl-codes .rl-code.st-ok {
  background: linear-gradient(90deg,
    color-mix(in srgb, #22c55e 23%, transparent) 0%,
    color-mix(in srgb, #22c55e 8%, transparent) 55%,
    transparent 70%);
  border-color: color-mix(in srgb, #22c55e 50%, transparent);
  box-shadow: inset 4px 0 0 #22c55e;
  color: #fff;
}
#secretPage .rl-codes .rl-code.st-waiting {
  background: linear-gradient(90deg,
    color-mix(in srgb, #facc15 45%, transparent) 0%,
    color-mix(in srgb, #facc15 12%, transparent) 55%,
    transparent 100%);
  border-color: color-mix(in srgb, #facc15 70%, transparent);
  box-shadow: inset 4px 0 0 #facc15;
  color: #fff;
}
#secretPage .rl-codes .rl-code.st-scrap {
  background: linear-gradient(90deg,
    color-mix(in srgb, #ef4444 45%, transparent) 0%,
    color-mix(in srgb, #ef4444 12%, transparent) 55%,
    transparent 100%);
  border-color: color-mix(in srgb, #ef4444 70%, transparent);
  box-shadow: inset 4px 0 0 #ef4444;
  color: #fff;
}

/* Строки таблицы: градиент от цвета статуса и полоска слева */
#secretPage .rl-table tbody tr {
  box-shadow: inset 4px 0 0 var(--row-color, transparent);
  background: linear-gradient(90deg,
    color-mix(in srgb, var(--row-color, transparent) 45%, transparent) 0%,
    color-mix(in srgb, var(--row-color, transparent) 12%, transparent) 55%,
    transparent 100%);
  transition: filter 0.2s;
}
#secretPage .rl-table tbody tr:hover { filter: brightness(1.15); }

@media (max-width: 900px) {
  #secretPage .rl-top { grid-template-columns: minmax(0, 1fr); }
  #secretPage .rl-codes { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  #secretPage .rl-codes .rl-code { width: 100%; }
  #secretPage .rl-top .rl-form { flex-wrap: wrap; }
  #secretPage .rl-top .rl-form input { flex: 1 1 10rem; }
}
`;

  const page = document.getElementById("secretPage");
  const tab = document.getElementById("secretTab");
  if (!page || !tab || !window.supabase) return;

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let allRows = [];
  let searchTimer = null;

  // Язык передаёт сайт (app.js) через window.setSecretLang
  let siteLangCode = document.documentElement.lang || "en";

  function currentLang() {
    const raw = String(siteLangCode || "en").toLowerCase();
    if (raw.startsWith("ru")) return "ru";
    if (raw.startsWith("uk")) return "uk";
    if (raw.startsWith("pl")) return "pl";
    return "en";
  }

  function tr() { return T[currentLang()]; }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Цвет кнопки определяется по слову статуса: OK, WAITING или SCRAP
  function buttonClass(status) {
    const words = String(status).toUpperCase().split(/\s+/);
    if (words.includes("OK")) return " st-ok";
    if (words.includes("WAITING")) return " st-waiting";
    if (words.includes("SCRAP")) return " st-scrap";
    return "";
  }

  // Сокращения в алфавитном порядке
  const codeButtons = Object.keys(STATUS_MAP)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: false, sensitivity: "base" }))
    .map(code =>
      `<button type="button" class="rl-code${buttonClass(STATUS_MAP[code])}" data-code="${code}" title="${esc(STATUS_MAP[code])}">${code}</button>`)
    .join("");

  const styleEl = document.createElement("style");
  styleEl.textContent = LAYOUT_CSS;
  document.head.appendChild(styleEl);

  page.innerHTML = `
    <div class="rl-wrap">
      <h2 id="rlTitle"></h2>
      <div class="rl-top">
        <div class="rl-left">
          <form id="rlForm" class="rl-form">
            <input id="rlSn" autocomplete="off" required>
            <input id="rlStatus" autocomplete="off" required>
            <button type="submit" class="rl-add" id="rlAdd"></button>
          </form>
          <input id="rlSearch" autocomplete="off">
        </div>
        <div class="rl-codes" id="rlCodes">
          ${codeButtons}
          <button type="button" class="rl-code rl-clear" data-action="clear" id="rlClear">✕</button>
        </div>
      </div>
      <div class="rl-table-wrap">
        <table class="rl-table">
          <thead>
            <tr>
              <th class="col-sn" id="thSn"></th>
              <th class="col-date" id="thDate"></th>
              <th class="col-time" id="thTime"></th>
              <th class="col-status" id="thStatus"></th>
            </tr>
          </thead>
          <tbody id="rlBody"></tbody>
        </table>
      </div>
    </div>`;

  const form = page.querySelector("#rlForm");
  const snInput = page.querySelector("#rlSn");
  const statusInput = page.querySelector("#rlStatus");
  const searchInput = page.querySelector("#rlSearch");
  const codesBox = page.querySelector("#rlCodes");
  const body = page.querySelector("#rlBody");

  function pad(n) { return String(n).padStart(2, "0"); }
  function localDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function localTime(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }

  function expandStatus(input) {
    return input.trim().split(/\s+/)
      .map(p => { const u = p.toUpperCase(); return STATUS_MAP[u] || u; })
      .join(" ");
  }

  function colorFor(status) {
    for (const w of String(status).split(" ")) {
      if (STATUS_COLORS[w]) return STATUS_COLORS[w];
    }
    return "transparent";
  }

  // Подписи интерфейса под текущий язык сайта
  function applyLang() {
    const t = tr();
    page.querySelector("#rlTitle").textContent = t.title;
    snInput.placeholder = t.sn;
    statusInput.placeholder = t.statusPh;
    page.querySelector("#rlAdd").textContent = t.add;
    page.querySelector("#rlClear").title = t.clear;
    searchInput.placeholder = t.search;
    page.querySelector("#thSn").textContent = t.sn;
    page.querySelector("#thDate").textContent = t.date;
    page.querySelector("#thTime").textContent = t.time;
    page.querySelector("#thStatus").textContent = t.status;
    render();
  }

  function render() {
    if (!allRows.length) {
      body.innerHTML = `<tr><td colspan="4" class="rl-empty">${tr().empty}</td></tr>`;
      return;
    }
    body.innerHTML = allRows.map(r => `
      <tr style="--row-color:${colorFor(r.status)}">
        <td class="col-sn rl-sn">${esc(r.panel_sn)}</td>
        <td class="col-date">${esc(r.repair_date)}</td>
        <td class="col-time">${esc(r.repair_time)}</td>
        <td class="col-status">${esc(r.status)}</td>
      </tr>`).join("");
  }

  // Без поиска: записи за сегодня. С поиском: по всей таблице, по SN.
  async function load() {
    const q = searchInput.value.trim().toUpperCase();
    let query = db.from(TABLE).select("*").order("id", { ascending: false });

    if (q) {
      query = query.ilike("panel_sn", `%${q}%`).limit(500);
    } else {
      query = query.eq("repair_date", localDate(new Date())).limit(1000);
    }

    const { data, error } = await query;
    if (error) { alert(tr().errLoad + error.message); return; }
    allRows = data;
    render();
  }

  // Следующий номер за день: 1, 2, 3... и снова с 1 на следующий день
  async function nextDailyNo(date) {
    const { data, error } = await db.from(TABLE)
      .select("log_no")
      .eq("repair_date", date)
      .order("log_no", { ascending: false })
      .limit(1);
    if (error) throw error;
    return data.length ? data[0].log_no + 1 : 1;
  }

  codesBox.addEventListener("click", (e) => {
    const btn = e.target.closest(".rl-code");
    if (!btn) return;

    if (btn.dataset.action === "clear") {
      statusInput.value = "";
    } else {
      const cur = statusInput.value.trim();
      statusInput.value = cur ? cur + " " + btn.dataset.code : btn.dataset.code;
    }
    statusInput.focus();
  });

  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(load, 300);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const sn = snInput.value.trim().toUpperCase();
    const status = expandStatus(statusInput.value);
    if (!sn || !status) return;

    const now = new Date();
    const today = localDate(now);

    try {
      const logNo = await nextDailyNo(today);
      const { error } = await db.from(TABLE).insert({
        log_no: logNo,
        panel_sn: sn,
        repair_date: today,
        repair_time: localTime(now),
        status
      });
      if (error) throw error;
    } catch (err) {
      alert(tr().errSave + err.message);
      return;
    }

    // Статус OK: печатаем этикетку в формате, выбранном на вкладке Final station II
    if (status === "OK") {
      if (typeof window.printFinal2BySn !== "function") {
        alert(tr().noPrinter);
      } else {
        try {
          const printed = await window.printFinal2BySn(sn);
          if (!printed) alert(tr().noPn);
        } catch (err) {
          alert(tr().noPn);
        }
      }
    }

    snInput.value = "";
    statusInput.value = "";
    snInput.focus();
    load();
  });

  // Вызывается сайтом при открытии страницы Repair Log
  window.secretShow = function () {
    applyLang();
    load();
  };

  // Вызывается сайтом при смене языка
  window.setSecretLang = function (l) {
    siteLangCode = l;
    applyLang();
  };

  // Alt+Q скрывает пункт Secret. Если страница открыта, закрываем её тоже
  document.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "q" || e.key === "Q" || e.code === "KeyQ")) {
      setTimeout(() => {
        if (tab.style.display === "none" && window.siteClosePage) {
          window.siteClosePage("secret");
        }
      }, 0);
    }
  });

  applyLang();
})();
