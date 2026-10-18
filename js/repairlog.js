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

  const page = document.getElementById("secretPage");
  const tab = document.getElementById("secretTab");
  if (!page || !tab || !window.supabase) return;

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let allRows = [];
  let searchTimer = null;

  const codeButtons = Object.entries(STATUS_MAP)
    .map(([code, name]) =>
      `<button type="button" class="rl-code" data-code="${code}" title="${name}">${code}</button>`)
    .join("");

  page.innerHTML = `
    <div class="rl-wrap">
      <h2>Repair Log</h2>
      <form id="rlForm" class="rl-form">
        <input id="rlSn" placeholder="Panel SN" autocomplete="off" required>
        <input id="rlStatus" placeholder="Статус (OK, VV, H...)" autocomplete="off" required>
        <button type="submit" class="rl-add">+ Добавить</button>
      </form>
      <div class="rl-codes" id="rlCodes">
        ${codeButtons}
        <button type="button" class="rl-code rl-clear" data-action="clear" title="Очистить статус">✕</button>
      </div>
      <input id="rlSearch" placeholder="Поиск по SN (по всей базе)" autocomplete="off">
      <div class="rl-table-wrap">
        <table class="rl-table">
          <thead>
            <tr><th>№</th><th>Panel SN</th><th>Дата</th><th>Время</th><th>Статус</th><th></th></tr>
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

  function render() {
    if (!allRows.length) {
      body.innerHTML = `<tr><td colspan="6" class="rl-empty">Нет записей</td></tr>`;
      return;
    }
    body.innerHTML = allRows.map(r => `
      <tr style="--row-color:${colorFor(r.status)}">
        <td>${r.log_no}</td>
        <td class="rl-sn">${esc(r.panel_sn)}</td>
        <td>${esc(r.repair_date)}</td>
        <td>${esc(r.repair_time)}</td>
        <td>${esc(r.status)}</td>
        <td><button class="rl-edit" data-id="${r.id}" title="Изменить статус">✎</button></td>
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
    if (error) { alert("Ошибка загрузки: " + error.message); return; }
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
      alert("Ошибка сохранения: " + err.message);
      return;
    }

    snInput.value = "";
    statusInput.value = "";
    snInput.focus();
    load();
  });

  body.addEventListener("click", async (e) => {
    const btn = e.target.closest(".rl-edit");
    if (!btn) return;
    const row = allRows.find(r => String(r.id) === btn.dataset.id);
    if (!row) return;

    const input = prompt("Новый статус:", row.status);
    if (input === null || !input.trim()) return;

    const { error } = await db.from(TABLE)
      .update({ status: expandStatus(input), updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) { alert("Ошибка: " + error.message); return; }
    load();
  });

  // Открытие Repair Log: только по пункту Secret
  document.querySelectorAll('[data-page="secret"]').forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".label-page").forEach(s => s.style.display = "none");
      document.getElementById("content").style.display = "none";
      page.style.display = "";
      document.getElementById("pageTitle").textContent = "Repair Log";
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
})();
