/* ==========================================================
   LCDR HUB — логика макета
   Добавляя новую страницу:
   1) добавьте её в PAGES
   2) добавьте пункт в index.html (с data-page="ваш_id")
   3) если страница строится отдельным модулем — добавьте её в STATIC_PAGES,
      иначе опишите содержимое в RENDERERS
   ========================================================== */

const PAGES = {
  final1:  { title: "Final station I" },
  final2:  { title: "Final station II" },
  special: { title: "Special" },
  label:   { title: "Label" },
  live:    { title: "Live Data" },
  stats:   { title: "Statistic" },
  parts:   { title: "PN Base" }
};

// Содержимое обычных страниц. Пример: final1: (el) => { el.innerHTML = "<h1>Final 1</h1>"; }
const RENDERERS = {};

// Страницы, которые строят отдельные модули в своих контейнерах
const STATIC_PAGES = {
  label: "labelPage",
  parts: "pnbasePage"
};

// При загрузке сайта вкладок нет — пользователь открывает их сам из меню
const state = {
  openTabs: [],
  active: null
};

const app        = document.getElementById("app");
const menuToggle = document.getElementById("menuToggle");
const tabsEl     = document.getElementById("tabs");
const contentEl  = document.getElementById("content");
const titleEl    = document.getElementById("pageTitle");

/* ---------- Отрисовка ---------- */

function render() {
  renderTabs();
  renderNav();
  renderContent();
  titleEl.textContent = state.active ? PAGES[state.active].title : "";
}

function renderTabs() {
  tabsEl.innerHTML = "";
  state.openTabs.forEach(id => {
    const tab = document.createElement("div");
    tab.className = "tab" + (id === state.active ? " active" : "");
    tab.dataset.id = id;
    tab.innerHTML = `<span class="tab-title">${PAGES[id].title}</span><span class="close" title="Закрыть">✕</span>`;
    tabsEl.appendChild(tab);
  });
}

function renderNav() {
  document.querySelectorAll(".nav-item[data-page]").forEach(item => {
    item.classList.toggle("active", item.dataset.page === state.active);
  });
}

function renderContent() {
  // Статичные страницы: их контейнеры не пересоздаются, состояние сохраняется
  Object.values(STATIC_PAGES).forEach(id => {
    document.getElementById(id).style.display = "none";
  });

  const staticId = STATIC_PAGES[state.active];
  if (staticId) {
    contentEl.style.display = "none";
    document.getElementById(staticId).style.display = "block";
    if (state.active === "label" && window.sbShow) window.sbShow();
    return;
  }

  contentEl.style.display = "flex";
  contentEl.innerHTML = "";

  if (!state.active) {
    contentEl.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🗂️</div>
        <p>Выберите страницу в меню слева</p>
      </div>`;
    return;
  }

  const renderer = RENDERERS[state.active];
  if (renderer) {
    renderer(contentEl);
  } else {
    contentEl.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📄</div>
        <p>Содержимое страницы «${PAGES[state.active].title}» ещё не добавлено</p>
      </div>`;
  }
}

/* ---------- Действия ---------- */

function openPage(id) {
  if (!PAGES[id]) return;
  if (!state.openTabs.includes(id)) state.openTabs.push(id);
  state.active = id;
  render();
}

function closePage(id) {
  state.openTabs = state.openTabs.filter(t => t !== id);
  if (state.active === id) {
    state.active = state.openTabs[state.openTabs.length - 1] || null;
  }
  render();
}

/* ---------- Обработчики событий ---------- */

menuToggle.addEventListener("click", () => {
  app.classList.toggle("collapsed");
});

document.querySelectorAll(".nav-parent").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("open");
    btn.nextElementSibling.classList.toggle("open");
  });
});

document.querySelectorAll(".nav-item[data-page]").forEach(item => {
  item.addEventListener("click", e => {
    e.preventDefault();
    openPage(item.dataset.page);
  });
});

tabsEl.addEventListener("click", e => {
  const tab = e.target.closest(".tab");
  if (!tab) return;
  const id = tab.dataset.id;

  if (e.target.classList.contains("close")) {
    closePage(id);
  } else {
    state.active = id;
    render();
  }
});

/* ---------- Язык сайта (Label и PN Base) ---------- */
function setSiteLang(lang) {
  if (window.setLabelLang) window.setLabelLang(lang);
  if (window.setPnBaseLang) window.setPnBaseLang(lang);
}

/* ---------- Старт ---------- */

if (window.innerWidth < 700) {
  app.classList.add("collapsed");
}

render();
