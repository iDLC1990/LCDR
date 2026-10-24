/* Чтение вкладок Google Таблицы по имени без ключа API (через gviz CSV).
   Таблица должна быть открыта «всем, у кого есть ссылка» (читатель).
   Подключение: <script src="js/sheets.js"></script> ПОСЛЕ js/config.js и ПЕРЕД livedata.js и statistic.js.
   window.LCDR_SHEETS.rows('Имя вкладки') -> массив строк, каждая строка массив значений.
   Первая строка результата = первая строка вкладки (как в Google Sheets API). */
(function () {
  const ATTEMPTS = 3;
  const RETRY_MS = 1500;

  function parseCSV(str) {
    const arr = [];
    let quote = false;
    for (let row = 0, col = 0, c = 0; c < str.length; c++) {
      const cc = str[c], nc = str[c + 1];
      arr[row] = arr[row] || [];
      arr[row][col] = arr[row][col] || '';
      if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; c++; continue; }
      if (cc === '"') { quote = !quote; continue; }
      if (cc === ',' && !quote) { col++; continue; }
      if (cc === '\r' && nc === '\n' && !quote) { row++; col = 0; c++; continue; }
      if ((cc === '\n' || cc === '\r') && !quote) { row++; col = 0; continue; }
      arr[row][col] += cc;
    }
    return arr;
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function rows(sheetName) {
    const id = window.APP_CONFIG.SHEET_ID;
    let lastErr = null;
    for (let i = 0; i < ATTEMPTS; i++) {
      try {
        // headers=1: первая строка вкладки остаётся строкой данных, а не склеивается с заголовком
        const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(sheetName)}&_nc=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
        return parseCSV(await res.text());
      } catch (e) {
        lastErr = e;
        if (i < ATTEMPTS - 1) await wait(RETRY_MS * (i + 1));
      }
    }
    throw lastErr;
  }

  window.LCDR_SHEETS = { rows, parseCSV };
})();
