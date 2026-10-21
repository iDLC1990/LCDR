/* Спеціальні етикетки (Special Label): великий текст, рамка з 11 рядків, SCC та ICON.
   SCC-текст друкується на 50x30 мм, кількість комплектів діє тільки для SCC.
   ICON друкується окремою кнопкою на 49.5x24.5 мм, одна етикетка за натискання.
   Підключення: <script src="js/special.js"></script> ПІСЛЯ js/app.js.
   Контейнер: <section id="specialPage">. Мову задає сайт через window.setSpecialLang(код).
   Картинка ICON береться з файлу icon.jpg у корені репозиторію. */
(function () {
  const ICON_SRC = 'icon.jpg';
  // true  - обрізати білі поля навколо малюнка (кольори та якість не змінюються)
  // false - використовувати повний файл icon.jpg як є
  const ICON_TRIM = true;

  // Розміри друку (мм)
  const SCC_WIDTH_MM = 49;
  const SCC_LABEL_H = 30;       // висота етикетки SCC
  const SCC_TEXT_H = 25;        // висота зони для тексту SCC
  const SCC_TEXT_WIDTH_MM = 46;
  const ICON_LABEL_W = 49.5;
  const ICON_LABEL_H = 24.5;
  const SCC_MAX_PT = 60, SCC_MIN_PT = 8, SCC_LINE_HEIGHT = 1.1;

  const TR = {
    uk: { print: "🖨️ Друк", printScc: "🖨️ Друк SCC", printIcon: "🖨️ Друк ICON" },
    ru: { print: "🖨️ Печать", printScc: "🖨️ Печать SCC", printIcon: "🖨️ Печать ICON" },
    pl: { print: "🖨️ Drukuj", printScc: "🖨️ Drukuj SCC", printIcon: "🖨️ Drukuj ICON" },
    en: { print: "🖨️ Print", printScc: "🖨️ Print SCC", printIcon: "🖨️ Print ICON" },
    de: { print: "🖨️ Drucken", printScc: "🖨️ SCC drucken", printIcon: "🖨️ ICON drucken" },
    fr: { print: "🖨️ Imprimer", printScc: "🖨️ Imprimer SCC", printIcon: "🖨️ Imprimer ICON" },
    es: { print: "🖨️ Imprimir", printScc: "🖨️ Imprimir SCC", printIcon: "🖨️ Imprimir ICON" },
    it: { print: "🖨️ Stampa", printScc: "🖨️ Stampa SCC", printIcon: "🖨️ Stampa ICON" },
    pt: { print: "🖨️ Imprimir", printScc: "🖨️ Imprimir SCC", printIcon: "🖨️ Imprimir ICON" },
    tr: { print: "🖨️ Yazdır", printScc: "🖨️ SCC yazdır", printIcon: "🖨️ ICON yazdır" }
  };

  const MARKUP = `
<div class="manual-input-card">
  <div class="sp-row">
    <div class="form-group sp-grow">
      <input type="text" id="spBigText" class="form-input code-text" value="OK">
    </div>
    <div class="form-group">
      <select id="spBigSize" class="form-input">
        <option value="100x78">100 × 78 mm</option>
        <option value="80x68">80 × 68 mm</option>
        <option value="50x25">50 × 25 mm</option>
      </select>
    </div>
    <div class="form-group sp-end">
      <button class="btn btn-brand" id="spBtnText" data-sp="print"></button>
    </div>
  </div>
</div>

<div class="manual-input-card">
  <div class="sp-row">
    <div class="form-group sp-grow">
      <input type="text" id="spRepeat" class="form-input code-text" value="TRANSPORTATION FRAME">
    </div>
    <div class="form-group sp-end">
      <button class="btn btn-brand" id="spBtnRepeat" data-sp="print"></button>
    </div>
  </div>
</div>

<div class="manual-input-card">
  <div class="sp-line">
    <input type="checkbox" class="sp-check" id="spChk1">
    <input type="text" id="spVal1" class="form-input code-text">
  </div>
  <div class="sp-line">
    <input type="checkbox" class="sp-check" id="spChk2">
    <input type="text" id="spVal2" class="form-input code-text">
  </div>
  <div class="sp-foot">
    <button class="btn btn-brand" id="spBtnScc" data-sp="printScc"></button>
    <input type="number" id="spCopies" class="form-input" min="1" value="1">
    <button class="btn btn-brand" id="spBtnIcon" data-sp="printIcon"></button>
  </div>
</div>`;

  const STYLE = `
#specialPage { max-width: 56rem; margin: 0 auto; }
#specialPage .sp-row { display: flex; flex-wrap: wrap; gap: 0.8rem; align-items: flex-end; }
#specialPage .sp-grow { flex: 1 1 14rem; min-width: 0; }
#specialPage .sp-end { justify-content: flex-end; }
#specialPage .sp-line { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 0.6rem; flex-wrap: wrap; }
#specialPage .sp-line .form-input { flex: 1 1 12rem; min-width: 0; }
#specialPage .sp-check { width: 1.1rem; height: 1.1rem; accent-color: #2563EB; cursor: pointer; }
#specialPage .sp-foot { display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; margin-top: 0.4rem; flex-wrap: wrap; }
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

  // ===== ICON: файл icon.jpg використовується як є (або обрізається по малюнку).
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

      // Шукаємо межі малюнка (тільки для обрізки, самі пікселі не змінюються)
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

      // Без запасу: обрізка точно по межах малюнка
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

    // Текст на всю етикетку (100x78, 80x68 або 50x25 мм)
    function printBigText() {
      const text = $('spBigText').value.trim().toUpperCase();
      if (!text) return;
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

    // Рамка з 11 рядків: етикетка 76 x 130 мм (ширина x довжина).
    // Текст іде поперек етикетки, по всій ширині 76 мм, без повороту.
    // 11 рядків рівномірно розподілені по довжині 130 мм.
    function printRepeatText() {
      const text = $('spRepeat').value.trim().toUpperCase();
      if (!text) return;

      const LABEL_W = 76;   // ширина етикетки (мм), текст іде по ній
      const LABEL_H = 130;  // довжина етикетки (мм)
      const LINES = 11;

      // Крок між рядками по довжині етикетки
      const PITCH = LABEL_H / LINES;
      // Розмір шрифту, при якому текст займає всю ширину 76 мм (Arial Bold, ~13.9 em)
      const FONT = LABEL_W / 13.9;
      // Висота великих літер ≈ 0.716 від розміру шрифту
      const CAP = FONT * 0.716;

      let rows = '';
      for (let i = 0; i < LINES; i++) {
        // Базова лінія рядка: центр кроку + половина висоти літер
        const y = i * PITCH + PITCH / 2 + CAP / 2;
        rows += `<text x="0" y="${y.toFixed(3)}" font-family="Arial, Helvetica, sans-serif" font-weight="700"
          font-size="${FONT.toFixed(3)}" textLength="${LABEL_W}" lengthAdjust="spacing">${esc(text)}</text>`;
      }

      printInFrame(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        @page { size: ${LABEL_W}mm ${LABEL_H}mm; margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        .lbl { width: ${LABEL_W}mm; height: ${LABEL_H}mm; overflow: hidden; background: #fff; }
        .lbl svg { display: block; width: ${LABEL_W}mm; height: ${LABEL_H}mm; }
      </style></head><body><div class="lbl">
        <svg viewBox="0 0 ${LABEL_W} ${LABEL_H}" preserveAspectRatio="none">${rows}</svg>
      </div></body></html>`);
    }

    // Кнопка SCC: друкує відмічені SCC 1 / SCC 2 на 50x30 мм. Кількість комплектів діє тільки тут.
    function printSCC() {
      const v1 = $('spVal1').value.trim(), v2 = $('spVal2').value.trim();
      const blocks = [];
      if ($('spChk1').checked && v1) blocks.push(buildWrappedText(v1, SCC_TEXT_H));
      if ($('spChk2').checked && v2) blocks.push(buildWrappedText(v2, SCC_TEXT_H));

      if (blocks.length === 0) return;

      let n = parseInt($('spCopies').value, 10);
      if (!n || n < 1) n = 1;
      if (n > 500) n = 500;

      // Порядок у комплекті: SCC 1 -> SCC 2
      let body = '';
      for (let i = 0; i < n; i++) {
        blocks.forEach(b => { body += `<div class="lbl">${b}</div>`; });
      }

      printInFrame(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        @page { size: ${SCC_WIDTH_MM}mm ${SCC_LABEL_H}mm; margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        .lbl { display: grid; place-items: center; width: ${SCC_WIDTH_MM}mm; height: ${SCC_LABEL_H - 0.5}mm;
               padding: 2mm; box-sizing: border-box; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
        .lbl:not(:last-child) { break-after: page; page-break-after: always; }
        .txt { width: 100%; color: #000; font-family: Arial, Helvetica, sans-serif; font-weight: 900;
               line-height: 1.1; overflow-wrap: anywhere; text-align: center; }
      </style></head><body>${body}</body></html>`);
    }

    // Кнопка ICON: одна етикетка 49.5x24.5 мм, без кількості комплектів
    function printIcon() {
      if (!iconUrl) return;

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
