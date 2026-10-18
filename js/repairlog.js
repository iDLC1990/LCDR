// js/repairlog.js
(function () {
  const SUPABASE_URL = "https://wtqvaeongxncufvpvvge.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cXZhZW9uZ3huY3VmdnB2dmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDM5MjIsImV4cCI6MjEwMjExOTkyMn0.tRsrb29_b9ev3K75npD5zt_Dz9FMltzaRkdK0RPDn-U";
  const TABLE = "repair_log";

  const STATUS_MAP = {
    S: "SCRAP", FFD: "FOREIGN MATERIAL UNDER DIFF PLATE",
    VVV: "V GRAY BLOCK", W: "WAITING", OK: "OK", LL: "LC LEAK", A: "ABNORMAL",
    H: "H-LINE", V: "V-LINE", VV: "V-BLOCK", HH: "H-BLOCK", CC: "CELL BROKEN",
    N: "NO DISPLAY", D: "DIRTY DIFF", P: "POL UP", "1": "FILM", SS: "SUP-PIN MURA",
    B: "BOT POL", C: "CROSS LINE", L: "LED NG", F: "FLICKERING IMAGE",
    R: "REFLECTOR MURA", NN: "PCB NG",
    FFF: "FOREIGN MATERIAL", CCC: "CLOUDING MURA",
    LLL: "LIGHT LIKAGE", FF: "FOREIGN MATERIAL UNDER POL", BB: "DIRTY BOT POL",
    AAA: "AUTO PATERN", PP: "PUSH MURA", MMM: "Maciej M. W. Wisniewski", "2": "SPRAWDZENIE"
  };

  const STATUS_COLORS = {
    SCRAP: "#FF9999", WAITING: "#FFFF99", OK: "#99FF99",
    LC: "#FFCC99", ABNORMAL: "#FFCC99", CELL: "#FFB266",
    NO: "#FFB266", "H-LINE": "#FFCCCC", "V-LINE": "#FFCCCC",
    SPRAWDZENIE: "#D1E8FF"
  };

  // Тексты интерфейса на четырёх языках сайта
  const T = {
    en: {
      title: "Repair Log", sn: "Serial number", date: "Date", time: "Time", status: "Status",
      add: "+ Add", snPh: "Serial number", statusPh: "Status (OK, VV, H...)",
      search: "Search by serial number (all records)", empty: "No records",
      clear: "Clear status", errLoad: "Load error: ", errSave: "Save error: "
    },
    ru: {
      title: "Журнал ремонта", sn: "Серийный номер", date: "Дата", time: "Время", status: "Статус",
      add: "+ Добавить", snPh: "Серийный номер", statusPh: "Статус (OK, VV, H...)",
      search: "Поиск по серийному номеру (вся база)", empty: "Нет записей",
      clear: "Очистить статус", errLoad: "Ошибка загрузки: ", errSave: "Ошибка сохранения: "
    },
    uk: {
      title: "Журнал ремонту", sn: "Серійний номер", date: "Дата", time: "Час", status: "Статус",
      add: "+ Додати", snPh: "Серійний номер", statusPh: "Статус (OK, VV, H...)",
      search: "Пошук за серійним номером (уся база)", empty: "Немає записів",
      clear: "Очистити статус", errLoad: "Помилка завантаження: ", errSave: "Помилка збереження: "
    },
    pl: {
      title: "Dziennik napraw", sn: "Numer seryjny", date: "Data", time: "Czas", status: "Status",
      add: "+ Dodaj", snPh: "Numer seryjny", statusPh: "Status (OK, VV, H...)",
      search: "Szukaj po numerze seryjnym (cała baza)", empty: "Brak wpisów",
      clear: "Wyczyść status", errLoad: "Błąd ładowania: ", errSave: "Błąd zapisu: "
    }
  };

  const page = document.getElementById("secretPage");
  const tab = document.getElementById("secretTab");
  if (!page || !tab || !window.supabase) return;

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let allRows = [];
  let searchTimer = null;

  // Язык сайта: из выпадающего списка в верхней панели, иначе из атрибута lang
  function currentLang() {
    const sel = document.querySelector(".topbar select");
    const raw = ((sel && sel.value) || document.documentElement.lang || "en").toLowerCase();
    if (raw.startsWith("ru")) return "ru";
    if (raw.startsWith("uk")) return "uk";
    if (raw.startsWith("pl")) return "pl";
    return "en";
  }

  function tr() { return T[currentLang()]; }

  const codeButtons = Object.entries(STATUS_MAP)
    .map(([code, name]) =>
      `<button type="button" class="rl-code" data-code="${code}" title="${name}">${code}</button>`)
    .join("");

  page.innerHTML = `
    <div class="rl-wrap">
      <h2 id="rlTitle"></h2>
      <form id="rlForm" class="rl-form">
        <input id="rlSn" autocomplete="off" required>
        <input id="rlStatus" autocomplete="off" required>
        <button type="submit" class="rl-add" id="rlAdd"></button>
      </form>
      <div class="rl-codes" id="rlCodes">
        ${codeButtons}
        <button type="button" class="rl-code rl-clear" data-action="clear" id="rlClear">✕</button>
      </div>
      <input id="rlSearch" autocomplete="off">
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

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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

    snInput.value = "";
    statusInput.value = "";
    snInput.focus();
    load();
  });

  // Смена языка на сайте: переписываем подписи
  document.addEventListener("change", (e) => {
    if (e.target.closest && e.target.closest(".topbar select")) applyLang();
  }, true);

  // Открытие Repair Log: только по пункту Secret
  document.querySelectorAll('[data-page="secret"]').forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".label-page").forEach(s => s.style.display = "none");
      document.getElementById("content").style.display = "none";
      page.style.display = "";
      document.getElementById("pageTitle").textContent = tr().title;
      applyLang();
      load();
    });
  });

  // Любой другой пункт меню закрывает Repair Log
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-page]");
    if (el && el.dataset.page !== "secret") {
      page.style.display = "none";
    }
  }, true);

  // Скрытие вкладки по Alt+Q закрывает и страницу
  document.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "q" || e.key === "Q" || e.code === "KeyQ")) {
      setTimeout(() => {
        if (tab.style.display === "none") page.style.display = "none";
      }, 0);
    }
  });

  applyLang();
})();
