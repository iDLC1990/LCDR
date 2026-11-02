/* Телефон: меню закрыто при запуске, нажатие на затемнение закрывает его.
   Подключение: <script src="js/mobile.js"></script> ПОСЛЕ js/app.js.
   Порог 700 пикселей такой же, как в app.js (там меню закрывается после выбора страницы). */
(function () {
  const app = document.getElementById('app');
  if (!app) return;
  const isPhone = () => window.innerWidth < 700;

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
})();
