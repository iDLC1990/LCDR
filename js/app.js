/* ==========================================================
   LCDR HUB — логика сайта и переключатель языков
   Добавляя новую страницу:
   1) добавьте её в PAGES (key — ключ из I18N)
   2) добавьте пункт в index.html (с data-page="ваш_id")
   3) если страница строится отдельным модулем — добавьте её в STATIC_PAGES,
      иначе опишите содержимое в RENDERERS
   Добавляя язык: добавьте его в LANG_NAMES и в I18N (все ключи).
   ========================================================== */

// Язык по умолчанию — английский
const DEFAULT_LANG = "en";

// 10 языков. Названия в списке показываются на родном языке
const LANG_NAMES = {
  en: "English",
  uk: "Українська",
  ru: "Русский",
  pl: "Polski",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  tr: "Türkçe"
};

// Языки, которые понимают модули. Остальным модулям передаётся English
const LABEL_LANGS  = ["uk", "pl", "en"];
const PNBASE_LANGS = Object.keys(LANG_NAMES);

// Все тексты сайта: меню, вкладки, служебные надписи
const I18N = {
  en: { print:"Print", final1:"Final inspection station I", final2:"Final inspection station II", special:"Special Label", panelLabel:"Panel Label", repairCenter:"LCD Repair Center", statDay:"Statistic per day", stats:"Statistic", repairBase:"LCD Repair Center Base", secret:"Repair Log", photo:"Photo", close:"Close", menu:"Menu", language:"Language", pick:"Select a page in the menu on the left", pending:"Content of “{t}” has not been added yet" },
  uk: { print:"Друк", final1:"Фінальна станція контролю I", final2:"Фінальна станція контролю II", special:"Спеціальна етикетка", panelLabel:"Панельна етикетка", repairCenter:"Центр ремонту LCD", statDay:"Статистика за днями", stats:"Статистика", repairBase:"База Центру ремонту LCD", secret:"Журнал ремонту", photo:"Фото", close:"Закрити", menu:"Меню", language:"Мова", pick:"Оберіть сторінку в меню ліворуч", pending:"Вміст сторінки «{t}» ще не додано" },
  ru: { print:"Печать", final1:"Финальная станция контроля I", final2:"Финальная станция контроля II", special:"Специальная этикетка", panelLabel:"Панельная этикетка", repairCenter:"Центр ремонта LCD", statDay:"Статистика по дням", stats:"Статистика", repairBase:"База центра ремонта LCD", secret:"Журнал ремонта", photo:"Фото", close:"Закрыть", menu:"Меню", language:"Язык", pick:"Выберите страницу в меню слева", pending:"Содержимое страницы «{t}» ещё не добавлено" },
  pl: { print:"Druk", final1:"Stacja końcowej kontroli I", final2:"Stacja końcowej kontroli II", special:"Etykieta specjalna", panelLabel:"Etykieta panelu", repairCenter:"Centrum naprawy LCD", statDay:"Statystyka dzienna", stats:"Statystyka", repairBase:"Baza centrum naprawy LCD", secret:"Dziennik napraw", photo:"Zdjęcie", close:"Zamknij", menu:"Menu", language:"Język", pick:"Wybierz stronę w menu po lewej", pending:"Treść strony «{t}» nie została jeszcze dodana" },
  de: { print:"Drucken", final1:"Endkontrollstation I", final2:"Endkontrollstation II", special:"Spezialetikett", panelLabel:"Panel-Etikett", repairCenter:"LCD-Reparaturzentrum", statDay:"Tagesstatistik", stats:"Statistik", repairBase:"LCD-Reparaturzentrum Basis", secret:"Reparaturprotokoll", photo:"Foto", close:"Schließen", menu:"Menü", language:"Sprache", pick:"Wählen Sie links im Menü eine Seite aus", pending:"Inhalt von „{t}“ wurde noch nicht hinzugefügt" },
  fr: { print:"Impression", final1:"Station d'inspection finale I", final2:"Station d'inspection finale II", special:"Étiquette spéciale", panelLabel:"Étiquette panneau", repairCenter:"Centre de réparation LCD", statDay:"Statistiques par jour", stats:"Statistiques", repairBase:"Base du centre de réparation LCD", secret:"Journal de réparation", photo:"Photo", close:"Fermer", menu:"Menu", language:"Langue", pick:"Sélectionnez une page dans le menu à gauche", pending:"Le contenu de « {t} » n'a pas encore été ajouté" },
  es: { print:"Impresión", final1:"Estación de inspección final I", final2:"Estación de inspección final II", special:"Etiqueta especial", panelLabel:"Etiqueta de panel", repairCenter:"Centro de reparación LCD", statDay:"Estadística por día", stats:"Estadística", repairBase:"Base del centro de reparación LCD", secret:"Registro de reparación", photo:"Foto", close:"Cerrar", menu:"Menú", language:"Idioma", pick:"Seleccione una página en el menú de la izquierda", pending:"El contenido de «{t}» aún no se ha añadido" },
  it: { print:"Stampa", final1:"Stazione di ispezione finale I", final2:"Stazione di ispezione finale II", special:"Etichetta speciale", panelLabel:"Etichetta pannello", repairCenter:"Centro riparazione LCD", statDay:"Statistiche giornaliere", stats:"Statistiche", repairBase:"Base centro riparazione LCD", secret:"Registro riparazioni", photo:"Foto", close:"Chiudi", menu:"Menu", language:"Lingua", pick:"Seleziona una pagina dal menu a sinistra", pending:"Il contenuto di «{t}» non è ancora stato aggiunto" },
  pt: { print:"Impressão", final1:"Estação de inspeção final I", final2:"Estação de inspeção final II", special:"Etiqueta especial", panelLabel:"Etiqueta de painel", repairCenter:"Centro de reparo LCD", statDay:"Estatísticas por dia", stats:"Estatísticas", repairBase:"Base do centro de reparo LCD", secret:"Registro de reparos", photo:"Foto", close:"Fechar", menu:"Menu", language:"Idioma", pick:"Selecione uma página no menu à esquerda", pending:"O conteúdo de «{t}» ainda não foi adicionado" },
  tr: { print:"Yazdırma", final1:"Son kontrol istasyonu I", final2:"Son kontrol istasyonu II", special:"Özel etiket", panelLabel:"Panel etiketi", repairCenter:"LCD Onarım Merkezi", statDay:"Günlük istatistik", stats:"İstatistik", repairBase:"LCD Onarım Merkezi Veritabanı", secret:"Onarım günlüğü", photo:"Fotoğraf", close:"Kapat", menu:"Menü", language:"Dil", pick:"Soldaki menüden bir sayfa seçin", pending:"«{t}» sayfasının içeriği henüz eklenmedi" }
};

// Страницы сайта. key — ключ названия в I18N
// live — показывает текущую дату (например, 18.10.2026), обновляется сама
const PAGES = {
  final1:  { key: "final1" },
  final2:  { key: "final2" },
  special: { key: "special" },
  label:   { key: "panelLabel" },
  live:    { key: "statDay", dateTitle: true },
  stats:   { key: "stats" },
  parts:   { key: "repairBase" },
  photo:   { key: "photo" },
  secret:  { key: "secret" }
};

// Содержимое обычных страниц. Пример: final1: (el) => { el.innerHTML = "<h1>Final 1</h1>"; }
const RENDERERS = {};

// Страницы, которые строят отдельные модули в своих контейнерах
const STATIC_PAGES = {
  label: "labelPage",
  parts: "pnbasePage",
  special: "specialPage",
  live: "livePage",
  stats: "statsPage",
  final1: "final1Page",
  final2: "final2Page",
  secret: "secretPage",
  photo: "photoPage"
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

/* ---------- Язык ---------- */

const langSelect = document.createElement("select");
langSelect.className = "lang-select";
langSelect.innerHTML = Object.entries(LANG_NAMES)
  .map(([code, name]) => `<option value="${code}">${name}</option>`)
  .join("");
document.querySelector(".topbar").appendChild(langSelect);

let siteLang = DEFAULT_LANG;
try {
  const saved = localStorage.getItem("siteLang");
  if (saved && I18N[saved]) siteLang = saved;
} catch (e) {}

// Перевод строки. Если ключа нет в языке — берётся английский
function t(key, vars = {}) {
  const dict = I18N[siteLang] || I18N[DEFAULT_LANG];
  let s = dict[key] ?? I18N[DEFAULT_LANG][key] ?? key;
  Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, v); });
  return s;
}

// Сегодняшняя дата в формате ДД.ММ.ГГГГ, например 18.10.2026
function todayDisplay() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

let lastShownDate = todayDisplay();

function pageTitle(id) {
  const page = PAGES[id];
  if (page.dateTitle) return todayDisplay();
  return t(page.key);
}

// Переводит статичные надписи меню и верхней панели
function applySiteText() {
  document.documentElement.lang = siteLang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    // Пункт «Statistic per day» показывает текущую дату вместо текста
    if (el.dataset.i18n === "statDay") {
      el.textContent = todayDisplay();
    } else {
      el.textContent = t(el.dataset.i18n);
    }
  });
  menuToggle.setAttribute("aria-label", t("menu"));
  langSelect.title = t("language");
  langSelect.value = siteLang;
}

// Смена языка всего сайта. Модули получают язык от сайта
function setSiteLang(lang) {
  if (!I18N[lang]) lang = DEFAULT_LANG;
  siteLang = lang;
  try { localStorage.setItem("siteLang", lang); } catch (e) {}

  applySiteText();
  if (window.setLabelLang)     window.setLabelLang(LABEL_LANGS.includes(lang) ? lang : "en");
  if (window.setPnBaseLang)    window.setPnBaseLang(PNBASE_LANGS.includes(lang) ? lang : "en");
  if (window.setSpecialLang)   window.setSpecialLang(siteLang);
  if (window.setLiveLang)      window.setLiveLang(siteLang);
  if (window.setStatisticLang) window.setStatisticLang(siteLang);
  if (window.setFinal1Lang)    window.setFinal1Lang(siteLang);
  if (window.setFinal2Lang)    window.setFinal2Lang(siteLang);
  if (window.setSecretLang)    window.setSecretLang(siteLang);
  render();
}

/* ---------- Отрисовка ---------- */

function render() {
  renderTabs();
  renderNav();
  renderContent();
  titleEl.textContent = state.active ? pageTitle(state.active) : "";
}

function renderTabs() {
  tabsEl.innerHTML = "";
  state.openTabs.forEach(id => {
    const tab = document.createElement("div");
    tab.className = "tab" + (id === state.active ? " active" : "");
    tab.dataset.id = id;
    tab.innerHTML = `<span class="tab-title">${pageTitle(id)}</span><span class="close" title="${t("close")}">✕</span>`;
    tabsEl.appendChild(tab);
  });
}

function renderNav() {
  document.querySelectorAll(".nav-item[data-page]").forEach(item => {
    item.classList.toggle("active", item.dataset.page === state.active);
  });
}

function renderContent() {
  // Камера останавливается, когда пользователь уходит со вкладки Photo
  if (state.active !== "photo" && window.photoHide) window.photoHide();

  // Статичные страницы: их контейнеры не пересоздаются, состояние сохраняется
  Object.values(STATIC_PAGES).forEach(id => {
    document.getElementById(id).style.display = "none";
  });

  const staticId = STATIC_PAGES[state.active];
  if (staticId) {
    contentEl.style.display = "none";
    document.getElementById(staticId).style.display = "block";
    if (state.active === "label" && window.sbShow) window.sbShow();
    if (state.active === "live" && window.liveShow) window.liveShow();
    if (state.active === "stats" && window.statsShow) window.statsShow();
    if (state.active === "final1" && window.final1Show) window.final1Show();
    if (state.active === "final2" && window.final2Show) window.final2Show();
    if (state.active === "secret" && window.secretShow) window.secretShow();
    if (state.active === "photo" && window.photoShow) window.photoShow();
    return;
  }

  contentEl.style.display = "flex";
  contentEl.innerHTML = "";

  if (!state.active) {
    contentEl.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🗂️</div>
        <p>${t("pick")}</p>
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
        <p>${t("pending", { t: pageTitle(state.active) })}</p>
      </div>`;
  }
}

/* ---------- Действия ---------- */

// Открывается одна страница, предыдущая закрывается
function openPage(id) {
  if (!PAGES[id]) return;
  state.openTabs = [id];
  state.active = id;
  render();
}

function closePage(id) {
  state.openTabs = state.openTabs.filter(tab => tab !== id);
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

langSelect.addEventListener("change", e => setSiteLang(e.target.value));

// Нужно модулю Repair Log, чтобы закрыть страницу при скрытии пункта Alt+Q
window.siteClosePage = closePage;

/* ---------- Старт ---------- */

if (window.innerWidth < 700) {
  app.classList.add("collapsed");
}

applySiteText();
render();

// Модули Label и PN Base создаются после app.js, поэтому язык передаём после загрузки страницы
window.addEventListener("load", () => setSiteLang(siteLang));

// Проверка смены дня: если наступила полночь, дата в меню и на вкладке обновляется сама
setInterval(() => {
  const now = todayDisplay();
  if (now !== lastShownDate) {
    lastShownDate = now;
    applySiteText();
    render();
  }
}, 30000);
