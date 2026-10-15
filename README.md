# LCDR HUB — макет

Статический макет интерфейса: верхняя панель, боковое меню, вкладки и рабочая область.
Сделан на чистом HTML, CSS и JavaScript, без сборки и установки библиотек.

## Структура

```
lcdr-hub/
├── index.html      # разметка страницы
├── css/
│   └── style.css   # стили (цвета — в блоке :root)
├── js/
│   └── app.js      # меню, вкладки, открытие/закрытие страниц
└── README.md
```

## Как посмотреть локально

Просто откройте файл `index.html` в браузере.

## Как выложить на GitHub

1. Создайте новый репозиторий на github.com (например, `lcdr-hub`).
2. Загрузите содержимое папки `lcdr-hub` в репозиторий
   (кнопка **Add file → Upload files** или через git):

   ```bash
   cd lcdr-hub
   git init
   git add .
   git commit -m "Первый макет"
   git branch -M main
   git remote add origin https://github.com/ВАШ_ЛОГИН/lcdr-hub.git
   git push -u origin main
   ```

3. В репозитории откройте **Settings → Pages**.
4. В пункте **Source** выберите `Deploy from a branch`, ветку `main` и папку `/ (root)`, нажмите **Save**.
5. Через минуту сайт будет доступен по адресу `https://ВАШ_ЛОГИН.github.io/lcdr-hub/`.

## Как дорабатывать

- **Цвета и размеры** — в `css/style.css`, в блоке `:root`.
- **Новая страница** — добавьте запись в `PAGES` и пункт меню в `index.html` с атрибутом `data-page="id"`.
- **Содержимое страницы** — добавьте функцию в `RENDERERS` в `js/app.js`, например:

  ```js
  RENDERERS.print = (el) => {
    el.innerHTML = "<h1>Печать этикеток</h1>";
  };
  ```

- **Иконки** — сейчас используются эмодзи; их можно заменить на SVG или картинки.
