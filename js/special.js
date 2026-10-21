/* Спеціальні етикетки (Special Label): великий текст, рамка з 11 рядків, SCC та ICON.
   SCC-текст друкується на 50x30 мм (кількість комплектів працює тільки для SCC).
   ICON друкується окремою кнопкою на 49.5x24.5 мм, одна етикетка за натискання.
   Підключення: <script src="js/special.js"></script> ПІСЛЯ js/app.js.
   Контейнер: <section id="specialPage">. Мову задає сайт через window.setSpecialLang(код).
   Картинка ICON береться з файлу icon.jpg у корені репозиторію. */
(function () {
  const ICON_SRC = 'icon.jpg';
  // true  - обрізати білі поля навколо малюнка (кольори та якість не змінюються)
  // false - використовувати повний файл icon.jpg як є
  const ICON_TRIM = false;

  // Фіксовані розміри друку (мм)
  const SCC_LABEL_W = 50;
  const SCC_LABEL_H = 30;      // висота етикетки для SCC-тексту
  const SCC_TEXT_H = 25;       // висота зони для тексту
  const ICON_LABEL_W = 49.5;
  const ICON_LABEL_H = 24.5;   // етикетка для картинки ICON

  const SCC_TEXT_WIDTH_MM = 46;
  const SCC_MAX_PT = 60, SCC_MIN_PT = 8, SCC_LINE_HEIGHT = 1.1;

  const TR = {
    uk: { bigTitle:"🔠 Друк тексту на всю етикетку (OK, WAITING, SCRAP)", word:"Слово або статус", wordPh:"Наприклад: OK, WAITING, SCRAP", size:"Розмір етикетки", printText:"🖨️ Друк тексту", repeatTitle:"🔂 Друк рамки / повторюваного тексту (11 рядків)", repeatLabel:"Текст для дублювання", repeatPh:"Наприклад: TRANSPORTATION FRAME", printRepeat:"🖨️ Друк 11 рядків", sccTitle:"🏷️ Друк етикеток SCC", sccPh1:"Введіть значення SCC 1", sccPh2:"Введіть значення SCC 2", copies:"Кількість комплектів", printScc:"🖨️ Друк SCC", alertText:"Введіть текст!", alertScc:"Позначте галочкою хоча б одне поле SCC та заповніть значення!", alertImg:"Не вдалося завантажити зображення" },
    ru: { bigTitle:"🔠 Печать текста на всю этикетку (OK, WAITING, SCRAP)", word:"Слово или статус", wordPh:"Например: OK, WAITING, SCRAP", size:"Размер этикетки", printText:"🖨️ Печать текста", repeatTitle:"🔂 Печать рамки / повторяющегося текста (11 строк)", repeatLabel:"Текст для дублирования", repeatPh:"Например: TRANSPORTATION FRAME", printRepeat:"🖨️ Печать 11 строк", sccTitle:"🏷️ Печать этикеток SCC", sccPh1:"Введите значение SCC 1", sccPh2:"Введите значение SCC 2", copies:"Количество комплектов", printScc:"🖨️ Печать SCC", alertText:"Введите текст!", alertScc:"Отметьте хотя бы одно поле SCC и заполните значение!", alertImg:"Не удалось загрузить изображение" },
    pl: { bigTitle:"🔠 Druk tekstu na całej etykiecie (OK, WAITING, SCRAP)", word:"Słowo lub status", wordPh:"Np.: OK, WAITING, SCRAP", size:"Rozmiar etykiety", printText:"🖨️ Drukuj tekst", repeatTitle:"🔂 Druk ramki / powtarzanego tekstu (11 wierszy)", repeatLabel:"Tekst do powtórzenia", repeatPh:"Np.: TRANSPORTATION FRAME", printRepeat:"🖨️ Drukuj 11 wierszy", sccTitle:"🏷️ Druk etykiet SCC", sccPh1:"Wpisz wartość SCC 1", sccPh2:"Wpisz wartość SCC 2", copies:"Liczba kompletów", printScc:"🖨️ Drukuj SCC", alertText:"Wpisz tekst!", alertScc:"Zaznacz co najmniej jedno pole SCC i wpisz wartość!", alertImg:"Nie udało się wczytać obrazu" },
    en: { bigTitle:"🔠 Print text across the whole label (OK, WAITING, SCRAP)", word:"Word or status", wordPh:"For example: OK, WAITING, SCRAP", size:"Label size", printText:"🖨️ Print text", repeatTitle:"🔂 Print frame / repeated text (11 lines)", repeatLabel:"Text to repeat", repeatPh:"For example: TRANSPORTATION FRAME", printRepeat:"🖨️ Print 11 lines", sccTitle:"🏷️ Print SCC labels", sccPh1:"Enter SCC 1 value", sccPh2:"Enter SCC 2 value", copies:"Number of sets", printScc:"🖨️ Print SCC", alertText:"Enter text!", alertScc:"Check at least one SCC field and enter its value!", alertImg:"Failed to load the image" },
    de: { bigTitle:"🔠 Text über das ganze Etikett drucken (OK, WAITING, SCRAP)", word:"Wort oder Status", wordPh:"Zum Beispiel: OK, WAITING, SCRAP", size:"Etikettengröße", printText:"🖨️ Text drucken", repeatTitle:"🔂 Rahmen / wiederholten Text drucken (11 Zeilen)", repeatLabel:"Zu wiederholender Text", repeatPh:"Zum Beispiel: TRANSPORTATION FRAME", printRepeat:"🖨️ 11 Zeilen drucken", sccTitle:"🏷️ SCC-Etiketten drucken", sccPh1:"SCC 1 Wert eingeben", sccPh2:"SCC 2 Wert eingeben", copies:"Anzahl Sätze", printScc:"🖨️ SCC drucken", alertText:"Bitte Text eingeben!", alertScc:"Bitte mindestens ein SCC-Feld markieren und einen Wert eingeben!", alertImg:"Bild konnte nicht geladen werden" },
    fr: { bigTitle:"🔠 Imprimer du texte sur toute l'étiquette (OK, WAITING, SCRAP)", word:"Mot ou statut", wordPh:"Par exemple : OK, WAITING, SCRAP", size:"Taille de l'étiquette", printText:"🖨️ Imprimer le texte", repeatTitle:"🔂 Imprimer un cadre / texte répété (11 lignes)", repeatLabel:"Texte à répéter", repeatPh:"Par exemple : TRANSPORTATION FRAME", printRepeat:"🖨️ Imprimer 11 lignes", sccTitle:"🏷️ Imprimer des étiquettes SCC", sccPh1:"Saisissez la valeur SCC 1", sccPh2:"Saisissez la valeur SCC 2", copies:"Nombre de jeux", printScc:"🖨️ Imprimer SCC", alertText:"Saisissez du texte !", alertScc:"Cochez au moins un champ SCC et saisissez sa valeur !", alertImg:"Impossible de charger l'image" },
    es: { bigTitle:"🔠 Imprimir texto en toda la etiqueta (OK, WAITING, SCRAP)", word:"Palabra o estado", wordPh:"Por ejemplo: OK, WAITING, SCRAP", size:"Tamaño de etiqueta", printText:"🖨️ Imprimir texto", repeatTitle:"🔂 Imprimir marco / texto repetido (11 líneas)", repeatLabel:"Texto a repetir", repeatPh:"Por ejemplo: TRANSPORTATION FRAME", printRepeat:"🖨️ Imprimir 11 líneas", sccTitle:"🏷️ Imprimir etiquetas SCC", sccPh1:"Introduzca el valor SCC 1", sccPh2:"Introduzca el valor SCC 2", copies:"Número de juegos", printScc:"🖨️ Imprimir SCC", alertText:"¡Introduzca texto!", alertScc:"¡Marque al menos un campo SCC e introduzca su valor!", alertImg:"No se pudo cargar la imagen" },
    it: { bigTitle:"🔠 Stampa testo su tutta l'etichetta (OK, WAITING, SCRAP)", word:"Parola o stato", wordPh:"Esempio: OK, WAITING, SCRAP", size:"Dimensione etichetta", printText:"🖨️ Stampa testo", repeatTitle:"🔂 Stampa cornice / testo ripetuto (11 righe)", repeatLabel:"Testo da ripetere", repeatPh:"Esempio: TRANSPORTATION FRAME", printRepeat:"🖨️ Stampa 11 righe", sccTitle:"🏷️ Stampa etichette SCC", sccPh1:"Inserisci il valore SCC 1", sccPh2:"Inserisci il valore SCC 2", copies:"Numero di set", printScc:"🖨️ Stampa SCC", alertText:"Inserisci il testo!", alertScc:"Seleziona almeno un campo SCC e inserisci il valore!", alertImg:"Impossibile caricare l'immagine" },
    pt: { bigTitle:"🔠 Imprimir texto em toda a etiqueta (OK, WAITING, SCRAP)", word:"Palavra ou status", wordPh:"Por exemplo: OK, WAITING, SCRAP", size:"Tamanho da etiqueta", printText:"🖨️ Imprimir texto", repeatTitle:"🔂 Imprimir moldura / texto repetido (11 linhas)", repeatLabel:"Texto a repetir", repeatPh:"Por exemplo: TRANSPORTATION FRAME", printRepeat:"🖨️ Imprimir 11 linhas", sccTitle:"🏷️ Imprimir etiquetas SCC", sccPh1:"Digite o valor SCC 1", sccPh2:"Digite o valor SCC 2", copies:"Número de conjuntos", printScc:"🖨️ Imprimir SCC", alertText:"Digite o texto!", alertScc:"Marque pelo menos um campo SCC e digite o valor!", alertImg:"Não foi possível carregar a imagem" },
    tr: { bigTitle:"🔠 Tüm etikete metin yazdır (OK, WAITING, SCRAP)", word:"Kelime veya durum", wordPh:"Örneğin: OK, WAITING, SCRAP", size:"Etiket boyutu", printText:"🖨️ Metni yazdır", repeatTitle:"🔂 Çerçeve / tekrarlanan metin yazdır (11 satır)", repeatLabel:"Tekrarlanacak metin", repeatPh:"Örneğin: TRANSPORTATION FRAME", printRepeat:"🖨️ 11 satır yazdır", sccTitle:"🏷️ SCC etiketleri yazdır", sccPh1:"SCC 1 değerini girin", sccPh2:"SCC 2 değerini girin", copies:"Set sayısı", printScc:"🖨️ SCC yazdır", alertText:"Metin girin!", alertScc:"En az bir SCC alanını işaretleyin ve değerini girin!", alertImg:"Resim yüklenemedi" }
  };

  const MARKUP = `
<div class="manual-input-card">
  <div class="manual-input-title" data-sp="bigTitle"></div>
  <div class="sp-row">
    <div class="form-group sp-grow">
      <label data-sp="word"></label>
      <input type="text" id="spBigText" class="form-input code-text" value="OK" data-sp-ph="wordPh">
    </div>
    <div class="form-group">
      <label data-sp="size"></label>
      <select id="spBigSize" class="form-input">
        <option value="100x78">100 × 78 mm</option>
        <option value="80x68">80 × 68 mm</option>
        <option value="50x25">50 × 25 mm</option>
      </select>
    </div>
    <div class="form-group sp-end">
      <label>&nbsp;</label>
      <button class="btn btn-brand" id="spBtnText" data-sp="printText"></button>
    </div>
  </div>
</div>

<div class="manual-input-card">
  <div class="manual-input-title" data-sp="repeatTitle"></div>
  <div class="sp-row">
    <div class="form-group sp-grow">
      <label data-sp="repeatLabel"></label>
      <input type="text" id="spRepeat" class="form-input code-text" value="TRANSPORTATION FRAME" data-sp-ph="repeatPh">
    </div>
    <div class="form-group sp-end">
      <label>&nbsp;</label>
      <button class="btn btn-brand" id="spBtnRepeat" data-sp="printRepeat"></button>
    </div>
  </div>
</div>

<div class="manual-input-card">
  <div class="manual-input-title" data-sp="sccTitle"></div>
  <div class="sp-line">
    <input type="checkbox" class="sp-check" id="spChk1">
    <span class="sp-lbl">SCC 1</span>
    <input type="text" id="spVal1" class="form-input code-text" data-sp-ph="sccPh1">
  </div>
  <div class="sp-line">
    <input type="checkbox" class="sp-check" id="spChk2">
    <span class="sp-lbl">SCC 2</span>
    <input type="text" id="spVal2" class="form-input code-text" data-sp-ph="sccPh2">
  </div>
  <div class="sp-foot">
    <button class="btn btn-brand" id="spBtnScc" data-sp="printScc"></button>
    <input type="number" id="spCopies" class="form-input" min="1" value="1" data-sp-title="copies">
    <button class="btn btn-brand" id="spBtnIcon">🖨️ ICON</button>
  </div>
</div>`;

  const STYLE = `
#specialPage { max-width: 56rem; margin: 0 auto; }
#specialPage .manual-input-title { font-size: 1rem; font-weight: 700; color: #2563EB; margin-bottom: 0.6rem; }
#specialPage .sp-row { display: flex; flex-wrap: wrap; gap: 0.8rem; align-items: flex-end; }
#specialPage .sp-grow { flex: 1 1 14rem; min-width: 0; }
#specialPage .sp-end { justify-content: flex-end; }
#specialPage .sp-line { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 0.6rem; flex-wrap: wrap; }
#specialPage .sp-line .form-input { flex: 1 1 12rem; min-width: 0; }
#specialPage .sp-lbl { min-width: 3.8rem; font-size: 0.85rem; font-weight: 600; color: #E5E7EB; }
#specialPage .sp-check { width: 1.1rem; height: 1.1rem; accent-color: #2563EB; cursor: pointer; }
#specialPage .sp-foot { display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; margin-top: 0.4rem; }
#specialPage #spCopies { width: 5.5rem; text-align: center; }
`;

  let lang = 'en';
  try { const l = localStorage.getItem('siteLang'); if (TR[l]) lang = l; } catch (e) {}

  function t(key) {
    return (TR[lang] && TR[lang][key]) || TR.en[key] || key;
  }
  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function applyText() {
    document.querySelectorAll('#specialPage [data-sp]').forEach(el => { el.textContent = t(el.dataset.sp); });
    document.querySelectorAll('#specialPage [data-sp-ph]').forEach(el => { el.placeholder = t(el.dataset.spPh); });
    document.querySelectorAll('#specialPage [data-sp-title]').forEach(el => { el.title = t(el.dataset.spTitle); });
  }

  function printInFrame(html) {
    const old = document.getElementById('spPrintFrame');
    if (old) old.remove();
    const f = document.createElement('iframe');
    f.id = 'spPrintFrame';
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
    document.body.appendChild(f);
    const win = f.contentWindow;
    win.document.open(); win.document.write(html); win.document.close();
    win.onafterprint = () => setTimeout(() => f.remove(), 500);
    setTimeout(() => { win.focus(); win.print(); }, 250);
  }

  // Текст у SCC переноситься по словах і підбирається до найбільшого розміру, що влазить у зону тексту
  function buildWrappedText(text, textHmm) {
    const MM = 96 / 25.4;
    const maxW = SCC_TEXT_WIDTH_MM * MM, maxH = textHmm * MM;
    const words = text.split(/\s+/).filter(Boolean);
    const longest = words.reduce((a, b) => (b.length >= a.length ? b : a), '');

    const wordProbe = document.createElement('div');
    wordProbe.style.cssText = 'position:absolute;visibility:hidden;left:-9999px;top:0;white-space:nowrap;font-family:Arial,Helvetica,sans-serif;font-weight:900;';
    document.body.appendChild(wordProbe);

    const probe = document.createElement('div');
    probe.style.cssText = `position:absolute;visibility:hidden;left:-9999px;top:0;width:${SCC_TEXT_WIDTH_MM}mm;font-family:Arial,Helvetica,sans-serif;font-weight:900;text-align:center;line-height:${SCC_LINE_HEIGHT};`;
    probe.textContent = text;
    document.body.appendChild(probe);

    function fits(pt, anywhere) {
      if (!anywhere) {
        wordProbe.style.fontSize = pt + 'pt';
        wordProbe.textContent = longest;
        if (wordProbe.scrollWidth > maxW + 1) return false;
      }
      probe.style.fontSize = pt + 'pt';
      probe.style.overflowWrap = anywhere ? 'anywhere' : 'normal';
      return probe.scrollHeight <= maxH + 1 && probe.scrollWidth <= probe.clientWidth + 1;
    }
    function findFit(anywhere) {
      let lo = SCC_MIN_PT * 2, hi = SCC_MAX_PT * 2, best = null;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (fits(mid / 2, anywhere)) { best = mid / 2; lo = mid + 1; } else { hi = mid - 1; }
      }
      return best;
    }

    let pt = findFit(false);
    if (pt === null) pt = findFit(true);
    if (pt === null) pt = SCC_MIN_PT;

    document.body.removeChild(wordProbe);
    document.body.removeChild(probe);
    return `<div class="txt" style="font-size:${pt}pt">${esc(text)}</div>`;
  }

  // ===== ICON: файл icon.jpg використовується як є.
  let iconUrl = '';

  function loadIcon() {
    const url = new URL(ICON_SRC, document.baseURI).href;
    const img = new Image();
    img.onload = () => {
      if (!ICON_TRIM) { iconUrl = url; return; }

      const sw = img.naturalWidth, sh = img.naturalHeight;
      const src = document.createElement('canvas');
      src.width = sw; src.height = sh;
      const sctx = src.getContext('2d', { willReadFrequently: true });
      sctx.drawImage(img, 0, 0);
      const sd = sctx.getImageData(0, 0, sw, sh).data;

      let minX = sw, minY = sh, maxX = -1, maxY = -1;
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const i = (y * sw + x) * 4;
          const g = 0.299 * sd[i] + 0.587 * sd[i + 1] + 0.114 * sd[i + 2];
          if (g < 235) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < 0) { iconUrl = url; return; }

      const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.02);
      minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
      maxX = Math.min(sw - 1, maxX + pad); maxY = Math.min(sh - 1, maxY + pad);
      const cw = maxX - minX + 1, ch = maxY - minY + 1;

      const out = document.createElement('canvas');
      out.width = cw; out.height = ch;
      const octx = out.getContext('2d');
      octx.imageSmoothingEnabled = false;
      octx.drawImage(src, minX, minY, cw, ch, 0, 0, cw, ch);
      iconUrl = out.toDataURL('image/png');
    };
    img.onerror = () => { iconUrl = ''; };
    img.src = url;
  }

  function init() {
    const host = document.getElementById('specialPage');
    if (!host) return;

    const st = document.createElement('style');
    st.textContent = STYLE;
    document.head.appendChild(st);
    host.innerHTML = MARKUP;

    const $ = (id) => document.getElementById(id);

    function printBigText() {
      const text = $('spBigText').value.trim().toUpperCase();
      if (!text) return alert(t('alertText'));
      const [labelW, labelH] = $('spBigSize').value.split('x').map(Number);

      const svgNS = 'http://www.w3.org/2000/svg';
      const tmp = document.createElementNS(svgNS, 'svg');
      const tt = document.createElementNS(svgNS, 'text');
      tt.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
      tt.setAttribute('font-weight', '900');
      tt.setAttribute('font-size', '100');
      tt.textContent = text;
      tmp.appendChild(tt);
      tmp.style.position = 'absolute'; tmp.style.visibility = 'hidden';
      document.body.appendChild(tmp);
      const b = tt.getBBox();
      document.body.removeChild(tmp);

      const px = b.width * 0.02, py = b.height * 0.05;
      const vb = [b.x - px, b.y - py, b.width + 2 * px, b.height + 2 * py].join(' ');
      const h = (labelH - 0.4).toFixed(1);

      printInFrame(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        @page { size: ${labelW}mm ${labelH}mm; margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        .lbl { width: ${labelW}mm; height: ${h}mm; overflow: hidden; background: #fff; }
        .lbl svg { display: block; width: 100%; height: 100%; }
      </style></head><body><div class="lbl">
        <svg viewBox="${vb}" preserveAspectRatio="none">
          <text x="${b.x + b.width / 2}" y="${b.y + b.height / 2}" dominant-baseline="central" text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="100">${esc(text)}</text>
        </svg>
      </div></body></html>`);
    }

    function printRepeatText() {
      const text = $('spRepeat').value.trim().toUpperCase();
      if (!text) return alert(t('alertText'));
      let lines = '';
      for (let i = 0; i < 11; i++) lines += `<div class="ln">${esc(text)}</div>`;

      printInFrame(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        @page { size: 100mm 78mm; margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        .lbl { width: 100mm; height: 77.6mm; padding: 2mm; display: flex; flex-direction: column;
               justify-content: space-between; overflow: hidden; background: #fff; }
        .ln { font-family: Arial, Helvetica, sans-serif; font-size: 16pt; text-align: center;
              text-transform: uppercase; color: #000; line-height: 1; }
      </style></head><body><div class="lbl">${lines}</div></body></html>`);
    }

    // Кнопка SCC: печатає відмічені SCC 1 / SCC 2. Кількість комплектів діє тільки тут.
    function printSCC() {
      const v1 = $('spVal1').value.trim(), v2 = $('spVal2').value.trim();
      const textBlocks = [];
      if ($('spChk1').checked && v1) textBlocks.push(buildWrappedText(v1, SCC_TEXT_H));
      if ($('spChk2').checked && v2) textBlocks.push(buildWrappedText(v2, SCC_TEXT_H));

      if (textBlocks.length === 0) return alert(t('alertScc'));

      let n = parseInt($('spCopies').value, 10);
      if (!n || n < 1) n = 1;
      if (n > 500) n = 500;

      // Порядок у комплекті: SCC 1 -> SCC 2
      let body = '';
      for (let i = 0; i < n; i++) {
        textBlocks.forEach(b => { body += `<div class="lbl lbl-scc">${b}</div>`; });
      }

      printInFrame(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        @page { size: ${SCC_LABEL_W}mm ${SCC_LABEL_H}mm; margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        .lbl { box-sizing: border-box; overflow: hidden; break-inside: avoid; page-break-inside: avoid;
               display: grid; place-items: center; padding: 2mm; }
        .lbl:not(:last-child) { break-after: page; page-break-after: always; }
        .lbl-scc { width: ${SCC_LABEL_W}mm; height: ${SCC_LABEL_H - 0.5}mm; }
        .txt { width: 100%; color: #000; font-family: Arial, Helvetica, sans-serif; font-weight: 900;
               line-height: 1.1; overflow-wrap: anywhere; text-align: center; }
      </style></head><body>${body}</body></html>`);
    }

    // Кнопка ICON: одна етикетка 49.5x24.5 мм, без кількості комплектів
    function printIcon() {
      if (!iconUrl) return alert(t('alertImg'));

      printInFrame(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        @page { size: ${ICON_LABEL_W}mm ${ICON_LABEL_H}mm; margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        .lbl { width: ${ICON_LABEL_W}mm; height: ${ICON_LABEL_H}mm; overflow: hidden; display: block; }
        .pic { width: 100%; height: 100%; object-fit: contain; display: block; }
      </style></head><body><div class="lbl"><img class="pic" src="${iconUrl}" alt=""></div></body></html>`);
    }

    $('spBtnText').onclick = printBigText;
    $('spBtnRepeat').onclick = printRepeatText;
    $('spBtnScc').onclick = printSCC;
    $('spBtnIcon').onclick = printIcon;

    loadIcon();
    applyText();
  }

  // Язык передаёт сайт (app.js)
  window.setSpecialLang = function (l) {
    lang = TR[l] ? l : 'en';
    applyText();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
