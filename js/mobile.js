/* Телефон: меню (свайп), флаги языков, прокрутка таблиц, классы для css/mobile.css.
   Подключение: <script src="js/mobile.js"></script> ПОСЛЕ js/app.js.
   Порог 700 пикселей такой же, как в app.js (там меню закрывается после выбора страницы). */
(function () {
  const app = document.getElementById('app');
  if (!app) return;
  const root = document.documentElement;

  // Флаги языков в правом верхнем углу (украинский, польский, английский)
  const FLAGS = [['uk', '\uD83C\uDDFA\uD83C\uDDE6'], ['pl', '\uD83C\uDDF5\uD83C\uDDF1'], ['en', '\uD83C\uDDEC\uD83C\uDDE7']];

  /* ---------- Тип устройства ---------- */
  const coarse = () => !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  // Телефон с сенсорным экраном: короткая сторона экрана меньше 600 (в портрете и в повороте)
  const touchPhone = () => coarse() && Math.min(window.innerWidth, window.innerHeight) < 600;
  const isPhone = () => window.innerWidth < 700 || touchPhone();
  const isOpen = () => !app.classList.contains('collapsed');

  function setClasses() {
    root.classList.toggle('is-phone', isPhone());
    root.classList.toggle('touch-phone', touchPhone());
  }
  setClasses();
  window.addEventListener('resize', setClasses);
  window.addEventListener('orientationchange', () => setTimeout(setClasses, 200));

  /* ---------- Меню ---------- */
  // Затемнение страницы. Лежит внутри #app, чтобы быть в одном слое с меню
  const backdrop = document.createElement('div');
  backdrop.id = 'menuBackdrop';
  app.insertBefore(backdrop, app.firstChild);
  backdrop.addEventListener('click', () => app.classList.add('collapsed'));

  // По умолчанию меню открыто и закрывает страницу: на телефоне при запуске закрываем его
  if (isPhone()) app.classList.add('collapsed');

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPhone()) app.classList.add('collapsed');
  });

  // Свайпы. Открыть: потянуть вправо, начав в левой трети экрана. Закрыть: потянуть влево при открытом меню.
  // Если палец начал движение внутри таблицы, которую уже прокрутили вправо, это прокрутка таблицы, меню не трогаем.
  const ZONE = 0.3, MIN_DX = 60, MAX_MS = 800;
  let sx = 0, sy = 0, st = 0, track = false;

  function inScrolledTable(el) {
    for (; el && el !== document.body && el.nodeType === 1; el = el.parentNode) {
      const ov = window.getComputedStyle(el).overflowX;
      if ((ov === 'auto' || ov === 'scroll') && el.scrollWidth > el.clientWidth && el.scrollLeft > 0) return true;
    }
    return false;
  }

  document.addEventListener('touchstart', (e) => {
    // При приближении щипком палец двигает страницу, а не открывает меню
    if (!isPhone() || e.touches.length !== 1 || (window.visualViewport && window.visualViewport.scale > 1.05)) { track = false; return; }
    const t = e.touches[0];
    sx = t.clientX; sy = t.clientY; st = Date.now();
    track = isOpen() ? true : (sx < window.innerWidth * ZONE && !inScrolledTable(e.target));
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (!track) return;
    track = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Date.now() - st > MAX_MS || Math.abs(dx) < MIN_DX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx > 0 && !isOpen()) app.classList.remove('collapsed');
    else if (dx < 0 && isOpen()) app.classList.add('collapsed');
  }, { passive: true });


  /* ---------- Щипок двумя пальцами ---------- */
  // Приближать можно. Уменьшать страницу меньше экрана нельзя: вокруг неё появляется белое поле браузера
  const vv = window.visualViewport;
  if (vv) {
    let startScale = 1;
    document.addEventListener('gesturestart', () => { startScale = vv.scale; }, { passive: false });
    document.addEventListener('gesturechange', (e) => {
      if (touchPhone() && e.scale && startScale * e.scale < 1) e.preventDefault();
    }, { passive: false });

    // Если страница всё же стала меньше экрана, на мгновение фиксируем масштаб 1 и возвращаем прежние настройки
    let zoomTimer = null;
    const resetZoom = () => {
      const meta = document.querySelector('meta[name="viewport"]');
      if (!meta) return;
      const orig = meta.getAttribute('content') || '';
      const base = orig.replace(/,?\s*(maximum|minimum)-scale=[^,]*/g, '');
      meta.setAttribute('content', base + ', maximum-scale=1, minimum-scale=1');
      setTimeout(() => meta.setAttribute('content', orig), 350);
    };
    vv.addEventListener('resize', () => {
      if (!touchPhone()) return;
      clearTimeout(zoomTimer);
      zoomTimer = setTimeout(() => { if (vv.scale < 0.99) resetZoom(); }, 300);
    });
  }

  /* ---------- Флаги языков ---------- */
  // Переключают скрытый список языков из app.js, поэтому весь перевод работает как раньше
  const langSelect = document.querySelector('.lang-select');
  if (langSelect) {
    const box = document.createElement('div');
    box.id = 'langFlags';
    FLAGS.forEach(([code, label]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.lang = code;
      b.setAttribute('aria-label', code);
      b.textContent = label;
      if (/^[A-Z]+$/.test(label)) b.className = 'txt';
      b.addEventListener('click', () => {
        langSelect.value = code;
        langSelect.dispatchEvent(new Event('change', { bubbles: true }));
        mark();
      });
      box.appendChild(b);
    });
    document.body.appendChild(box);

    function mark() {
      let cur = 'en';
      try { cur = localStorage.getItem('siteLang') || root.lang || 'en'; } catch (e) { cur = root.lang || 'en'; }
      Array.prototype.forEach.call(box.querySelectorAll('button'), (b) => {
        b.classList.toggle('active', b.dataset.lang === cur);
      });
    }
    mark();
    // На телефоне доступны только эти три языка: если сохранён другой (например, русский), включаем украинский
    try {
      const saved = localStorage.getItem('siteLang') || root.lang || 'en';
      if (touchPhone() && !FLAGS.some(f => f[0] === saved)) {
        langSelect.value = 'uk';
        langSelect.dispatchEvent(new Event('change', { bubbles: true }));
        mark();
      }
    } catch (e) {}
    // Язык мог смениться без нажатия на флаг (например, при загрузке страницы)
    new MutationObserver(mark).observe(root, { attributes: true, attributeFilter: ['lang'] });
  }

  /* ---------- Таблицы: каждая прокручивается сама ---------- */
  // Таблица шире экрана, а её родитель не прокручивается: оборачиваем, чтобы вбок двигалась только она, а не вся страница
  function scanTables() {
    if (!touchPhone()) return;
    Array.prototype.forEach.call(document.querySelectorAll('main table'), (tb) => {
      if (tb.closest('.tbl-scroll')) return;
      const p = tb.parentElement;
      if (!p) return;
      const ov = window.getComputedStyle(p).overflowX;
      if (ov === 'auto' || ov === 'scroll') return;           // уже прокручивается отдельно
      if (tb.offsetWidth <= p.clientWidth + 1) return;         // помещается
      const wrap = document.createElement('div');
      wrap.className = 'tbl-scroll';
      p.insertBefore(wrap, tb);
      wrap.appendChild(tb);
    });
  }

  // Свёрнутая карточка на телефоне должна занимать всю ширину. Если какой-то из её родителей сжат по содержимому
  // (страница тянется к правому краю), растягиваем и его: помечаем родителей классом fill-w (правило в css/mobile.css)
  function fillCollapsed() {
    if (!touchPhone()) return;
    Array.prototype.forEach.call(document.querySelectorAll('.card-collapsed'), (card) => {
      for (let el = card.parentElement; el && el !== document.body; el = el.parentElement) {
        if (el.matches && el.matches('main, .main, .app, #app')) break;   // каркас сайта не трогаем
        el.classList.add('fill-w');
      }
    });
  }

  let scanTimer = null;
  const scheduleScan = () => { clearTimeout(scanTimer); scanTimer = setTimeout(() => { scanTables(); fillCollapsed(); }, 150); };
  const watched = document.querySelector('main') || document.body;
  new MutationObserver(scheduleScan).observe(watched, { childList: true, subtree: true });
  // Карточка сворачивается сменой класса card-collapsed
  new MutationObserver(scheduleScan).observe(watched, { attributes: true, attributeFilter: ['class'], subtree: true });
  window.addEventListener('resize', scheduleScan);
  scheduleScan();
})();
