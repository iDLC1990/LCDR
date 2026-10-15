/* ==========================================================
   LCDR HUB — логика макета
   Добавляя новую страницу:
   1) добавьте её в PAGES
   2) добавьте пункт в index.html (с data-page="ваш_id")
   3) при необходимости опишите её содержимое в RENDERERS
   ========================================================== */

// Список всех страниц
const PAGES = {
  final1:  { title: "Final station I" },
  final2:  { title: "Final station II" },
  special: { title: "Special" },
  label:   { title: "Label" },
  live:    { title: "Live Data" },
  stats:   { title: "Statistic" },
  parts:   { title: "PN Base" }
};

// Содержимое страниц. Пока пусто — показывается заглушка.
// Пример: final1: (el) => { el.innerHTML = "<h1>Final station I</h1>"; }
const RENDERERS = {};

// Текущее состояние
const state = {
  openTabs: ["parts", "live", "stats", "final1"],
  active: "final1"
};

// Элементы страницы
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
  contentEl.innerHTML = "";
  if (!state.active) return;

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

// Кнопка ☰ — скрыть/показать меню
menuToggle.addEventListener("click", () => {
  app.classList.toggle("collapsed");
});

// Раскрытие любых групп меню (Print, LCDR и т.д.)
document.querySelectorAll(".nav-parent").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("open");
    btn.nextElementSibling.classList.toggle("open");
  });
});

// Клик по пункту меню — открыть страницу
document.querySelectorAll(".nav-item[data-page]").forEach(item => {
  item.addEventListener("click", e => {
    e.preventDefault();
    openPage(item.dataset.page);
  });
});

// Клики по вкладкам (делегирование)
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

/* ---------- Старт ---------- */

// На телефоне меню по умолчанию скрыто
if (window.innerWidth < 700) {
  app.classList.add("collapsed");
}

render();
