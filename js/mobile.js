/* Телефон: меню закрыто при запуске; открыть: кнопка ☰ или свайп вправо; закрыть: нажатие на затемнение или свайп влево.
   Подключение: <script src="js/mobile.js"></script> ПОСЛЕ js/app.js.
   Порог 700 пикселей такой же, как в app.js (там меню закрывается после выбора страницы). */
(function () {
  const app = document.getElementById('app');
  if (!app) return;
  const isPhone = () => window.innerWidth < 700;
  const isOpen = () => !app.classList.contains('collapsed');

  // Затемнение страницы. Лежит внутри #app, чтобы быть в одном слое с меню
  const backdrop = document.createElement('div');
  backdrop.id = 'menuBackdrop';
  app.insertBefore(backdrop, app.firstChild);
  backdrop.addEventListener('click', () => app.classList.add('collapsed'));

  // Кнопка меню поверх страницы. Лежит прямо в body, чтобы не зависеть от шапки
  const btn = document.createElement('button');
  btn.id = 'mobileMenuBtn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Menu');
  btn.textContent = '\u2630';
  btn.addEventListener('click', () => app.classList.toggle('collapsed'));
  document.body.appendChild(btn);

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
    if (!isPhone() || e.touches.length !== 1) { track = false; return; }
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
})();
