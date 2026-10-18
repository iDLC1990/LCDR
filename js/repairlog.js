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

  // Цвет строки по первому подходящему слову статуса (как было в таблице)
  const STATUS_COLORS = {
    SCRAP: "#FF9999", WAITING: "#FFFF99", OK: "#99FF99",
    LC: "#FFCC99", ABNORMAL: "#FFCC99", CELL: "#FFB266",
    NO: "#FFB266", "H-LINE": "#FFCCCC", "V-LINE": "#FFCCCC",
    SPRAWDZENIE: "#D1E8FF"
  };

  const page = document.getElementById("repairLogPage");
  if (!page || !window.supabase) return;

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let allRows = [];

  page.innerHTML = `
    <div class="rl-wrap">
      <h2>Repair Log</h2>
      <form id="rlForm" class="rl-form">
        <input id="rlSn" placeholder="Panel SN" autocomplete="off" required>
        <input id="rlStatus" placeholder="Статус (OK, VV, H...)" autocomplete="off" required>
        <button type="submit">+ Добавить</button>
      </form>
      <input id="rlSearch" placeholder="Поиск по SN" autocomplete="off">
      <table class="rl-table">
        <thead>
          <tr><th>№</th><th>Panel SN</th><th>Дата</th><th>Время</th><th>Статус</th><th></th></tr>
        </thead>
        <tbody id="rlBody"></tbody>
      </table>
    </div>`;

  const form = page.querySelector("#rlForm");
  const snInput = page.querySelector("#rlSn");
  const statusInput = page.querySelector("#rlStatus");
  const searchInput = page.querySelector("#rlSearch");
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
    return "";
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function render() {
    const q = searchInput.value.trim().toUpperCase();
    const rows = allRows.filter(r => !q || r.panel_sn.includes(q));
    body.innerHTML = rows.map(r => `
      <tr style="background:${colorFor(r.status)}">
        <td>${r.log_no}</td>
        <td>${esc(r.panel_sn)}</td>
        <td>${esc(r.repair_date)}</td>
        <td>${esc(r.repair_time)}</td>
        <td>${esc(r.status)}</td>
        <td><button class="rl-edit" data-id="${r.log_no}">✎</button></td>
      </tr>`).join("");
  }

  async function load() {
    const { data, error } = await db.from(TABLE)
      .select("*").order("log_no", { ascending: false }).limit(1000);
    if (error) { alert("Ошибка загрузки: " + error.message); return; }
    allRows = data;
    render();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const sn = snInput.value.trim().toUpperCase();
    const status = expandStatus(statusInput.value);
    if (!sn || !status) return;

    const now = new Date();
    const { error } = await db.from(TABLE).insert({
      panel_sn: sn,
      repair_date: localDate(now),
      repair_time: localTime(now),
      status
    });
    if (error) { alert("Ошибка сохранения: " + error.message); return; }

    snInput.value = "";
    statusInput.value = "";
    snInput.focus();
    load();
  });

  body.addEventListener("click", async (e) => {
    const btn = e.target.closest(".rl-edit");
    if (!btn) return;
    const row = allRows.find(r => String(r.log_no) === btn.dataset.id);
    if (!row) return;

    const input = prompt("Новый статус:", row.status);
    if (input === null || !input.trim()) return;

    const { error } = await db.from(TABLE)
      .update({ status: expandStatus(input), updated_at: new Date().toISOString() })
      .eq("log_no", row.log_no);
    if (error) { alert("Ошибка: " + error.message); return; }
    load();
  });

  searchInput.addEventListener("input", render);

  // Открытие страницы из меню
  document.querySelectorAll('[data-page="repairlog"]').forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".label-page").forEach(s => s.style.display = "none");
      document.getElementById("content").style.display = "none";
      page.style.display = "";
      document.getElementById("pageTitle").textContent = "Repair Log";
      load();
    });
  });
})();
