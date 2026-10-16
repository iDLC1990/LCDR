/* Сворачивание карточек на страницах Label и PN Base.
   Подключение: <script src="js/collapse.js"></script> ПОСЛЕ js/pnbase.js. */
(function () {
  const PAGE_LIST = [
    { id: "labelPage",  name: "label",  onExpand: () => { if (window.sbShow) window.sbShow(); } },
    { id: "pnbasePage", name: "pnbase", onExpand: null }
  ];

  const style = document.createElement("style");
  style.textContent = `
.card-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  width: 2rem;
  height: 1.6rem;
  margin-bottom: 0.4rem;
  border: 1px solid #374151;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.45), rgba(37, 99, 235, 0.45));
  color: #ffffff;
  font-size: 0.75rem;
  cursor: pointer;
}
.card-toggle:hover {
  filter: brightness(1.2);
}
.card-body {
  display: block;
}`;
  document.head.appendChild(style);

  function makeCollapsible(card, storageKey, onExpand) {
    if (card.dataset.collapsible) return;
    card.dataset.collapsible = "1";

    // Переносим всё содержимое карточки в обёртку, чтобы её можно было скрыть
    const body = document.createElement("div");
    body.className = "card-body";
    while (card.firstChild) body.appendChild(card.firstChild);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card-toggle";

    card.appendChild(btn);
    card.appendChild(body);

    function show(collapsed) {
      body.style.display = collapsed ? "none" : "block";
      btn.textContent = collapsed ? "▼" : "▲";
    }

    // Восстанавливаем сохранённое состояние
    let collapsed = false;
    try { collapsed = localStorage.getItem(storageKey) === "1"; } catch (e) {}
    show(collapsed);

    btn.addEventListener("click", () => {
      collapsed = !collapsed;
      show(collapsed);
      try { localStorage.setItem(storageKey, collapsed ? "1" : "0"); } catch (e) {}
      if (!collapsed && onExpand) onExpand();   // превью этикетки нужно перерисовать после показа
    });
  }

  function init() {
    PAGE_LIST.forEach(page => {
      const root = document.getElementById(page.id);
      if (!root) return;
      root.querySelectorAll(".manual-input-card").forEach((card, i) => {
        makeCollapsible(card, `collapse:${page.name}:${i}`, page.onExpand);
      });
    });
  }

  // Запускаем после того, как Label и PN Base построили свои блоки
  window.addEventListener("load", init);
})();
