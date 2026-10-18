/* Statistic (вкладка «Statistic»): статистика по дням, стиль сайта, без колонки Name.
   Язык задаёт сайт через window.setStatisticLang(код). Все 10 мов сайту.
   Підключення: <script src="js/statistic.js"></script> ПІСЛЯ js/app.js.
   Контейнер: <section id="statsPage">. Дані завантажуються при першому відкритті сторінки. */
(function () {
  const apiKey = 'AIzaSyCP7tzYiGwIZ6cymLAlv_9QgPIEshnRgqI';
  const sheetId = '10W03bvKlVFlIUcxsHkzP_v_13gtnYRBmnrrO0ujB1bU';
  const sheetURL = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/`;
  const SHEET_NAMES = ['FI Station KOVALCHYK Y.', 'FI Station 2 ULANOVYCH.R'];
  const VALID_STATUSES = ['OK', 'NDF'];

  const diagonalMapPrefix = {
    '3P0':65,'3H0':55,'WP0':65,'WP5':65,'3M0':50,'3Q0':43,'WQ0':43,'3C0':32,'WC0':32,'WH8':55,
    'WH0':55,'WM0':50,'WC8':32,'WU0':43,'SQ1':43,'WM5':50,'WC7':32,'WP5':65,'WW1':75,'WM6':50
  };
  const diagonalMap = {
    '860':86,'850':85,'750':75,'700':70,'650':65,'580':58,'575':58,
    '550':55,'545':55,'500':50,'498':50,'495':50,'490':50,
    '438':43,'435':43,'430':43,'428':43,'425':43,'420':43,
    '418':43,'415':43,'398':43,'395':43,'390':43,
    '348':32,'345':32,'340':32,'328':32,'325':32,'320':32,
    '318':32,'315':32,'278':27,'275':27,'270':27,
    '248':24,'245':24,'240':24,'238':24,'235':24,'230':24
  };

  /* ===== Переклади (10 мов, як на сайті) ===== */
  const I18N = {
    en: {
      from: 'From', to: 'To', workers: 'Workers', all: 'all', selectAll: 'Select all', clearAll: 'Clear all',
      update: 'Update', updating: 'Loading...', noData: 'No data for the selected workers',
      total: 'Total (Sum / OK / NDF)', days: 'Days', scrapTitle: '📊 Scrap / Waiting statistics',
      scrapNoData: 'No data', serial: 'Serial', status: 'Status', finalna: 'FINAL', hStatus: 'H Status',
      newNp: 'New / NP', info: 'Info / Description', sortTitle: 'Click to sort', totalRow: 'Total'
    },
    uk: {
      from: 'Від', to: 'До', workers: 'Працівники', all: 'всі', selectAll: 'Вибрати всіх', clearAll: 'Зняти всіх',
      update: 'Оновити', updating: 'Завантаження...', noData: 'Немає даних для вибраних працівників',
      total: 'Разом (Сума / OK / NDF)', days: 'Днів', scrapTitle: '📊 Статистика Scrap / Waiting',
      scrapNoData: 'Немає даних', serial: 'Serial', status: 'Статус', finalna: 'ФІНАЛЬНА', hStatus: 'H Статус',
      newNp: 'New / NP', info: 'Інфо / Опис', sortTitle: 'Натисніть, щоб відсортувати', totalRow: 'Разом'
    },
    ru: {
      from: 'С', to: 'По', workers: 'Сотрудники', all: 'все', selectAll: 'Выбрать всех', clearAll: 'Снять всех',
      update: 'Обновить', updating: 'Загрузка...', noData: 'Нет данных для выбранных сотрудников',
      total: 'Итого (Сумма / OK / NDF)', days: 'Дней', scrapTitle: '📊 Статистика Scrap / Waiting',
      scrapNoData: 'Нет данных', serial: 'Serial', status: 'Статус', finalna: 'ФИНАЛЬНАЯ', hStatus: 'H Статус',
      newNp: 'New / NP', info: 'Инфо / Описание', sortTitle: 'Нажмите для сортировки', totalRow: 'Итого'
    },
    pl: {
      from: 'Od', to: 'Do', workers: 'Pracownicy', all: 'wszyscy', selectAll: 'Zaznacz wszystkich', clearAll: 'Odznacz wszystkich',
      update: 'Aktualizuj', updating: 'Ładowanie...', noData: 'Brak danych dla wybranych pracowników',
      total: 'Razem (Sum / OK / NDF)', days: 'Dni', scrapTitle: '📊 Scrap / Waiting Statistics',
      scrapNoData: 'Brak danych', serial: 'Serial', status: 'Status', finalna: 'FINALNA', hStatus: 'H Status',
      newNp: 'New / NP', info: 'Info / Description', sortTitle: 'Kliknij, aby posortować', totalRow: 'Razem / Total'
    },
    de: {
      from: 'Von', to: 'Bis', workers: 'Mitarbeiter', all: 'alle', selectAll: 'Alle auswählen', clearAll: 'Alle abwählen',
      update: 'Aktualisieren', updating: 'Lade...', noData: 'Keine Daten für die gewählten Mitarbeiter',
      total: 'Gesamt (Summe / OK / NDF)', days: 'Tage', scrapTitle: '📊 Scrap-/Waiting-Statistik',
      scrapNoData: 'Keine Daten', serial: 'Serial', status: 'Status', finalna: 'FINAL', hStatus: 'H-Status',
      newNp: 'New / NP', info: 'Info / Beschreibung', sortTitle: 'Zum Sortieren klicken', totalRow: 'Gesamt'
    },
    fr: {
      from: 'Du', to: 'Au', workers: 'Employés', all: 'tous', selectAll: 'Tout sélectionner', clearAll: 'Tout désélectionner',
      update: 'Actualiser', updating: 'Chargement...', noData: 'Aucune donnée pour les employés sélectionnés',
      total: 'Total (Somme / OK / NDF)', days: 'Jours', scrapTitle: '📊 Statistiques Scrap / Waiting',
      scrapNoData: 'Aucune donnée', serial: 'Serial', status: 'Statut', finalna: 'FINALE', hStatus: 'Statut H',
      newNp: 'New / NP', info: 'Info / Description', sortTitle: 'Cliquer pour trier', totalRow: 'Total'
    },
    es: {
      from: 'Desde', to: 'Hasta', workers: 'Empleados', all: 'todos', selectAll: 'Seleccionar todos', clearAll: 'Desmarcar todos',
      update: 'Actualizar', updating: 'Cargando...', noData: 'No hay datos de los empleados seleccionados',
      total: 'Total (Suma / OK / NDF)', days: 'Días', scrapTitle: '📊 Estadística Scrap / Waiting',
      scrapNoData: 'Sin datos', serial: 'Serial', status: 'Estado', finalna: 'FINAL', hStatus: 'Estado H',
      newNp: 'New / NP', info: 'Info / Descripción', sortTitle: 'Clic para ordenar', totalRow: 'Total'
    },
    it: {
      from: 'Da', to: 'A', workers: 'Dipendenti', all: 'tutti', selectAll: 'Seleziona tutti', clearAll: 'Deseleziona tutti',
      update: 'Aggiorna', updating: 'Caricamento...', noData: 'Nessun dato per i dipendenti selezionati',
      total: 'Totale (Somma / OK / NDF)', days: 'Giorni', scrapTitle: '📊 Statistiche Scrap / Waiting',
      scrapNoData: 'Nessun dato', serial: 'Serial', status: 'Stato', finalna: 'FINALE', hStatus: 'Stato H',
      newNp: 'New / NP', info: 'Info / Descrizione', sortTitle: 'Clicca per ordinare', totalRow: 'Totale'
    },
    pt: {
      from: 'De', to: 'Até', workers: 'Funcionários', all: 'todos', selectAll: 'Selecionar todos', clearAll: 'Desmarcar todos',
      update: 'Atualizar', updating: 'Carregando...', noData: 'Sem dados para os funcionários selecionados',
      total: 'Total (Soma / OK / NDF)', days: 'Dias', scrapTitle: '📊 Estatística Scrap / Waiting',
      scrapNoData: 'Sem dados', serial: 'Serial', status: 'Status', finalna: 'FINAL', hStatus: 'Status H',
      newNp: 'New / NP', info: 'Info / Descrição', sortTitle: 'Clique para ordenar', totalRow: 'Total'
    },
    tr: {
      from: 'Başlangıç', to: 'Bitiş', workers: 'Çalışanlar', all: 'tümü', selectAll: 'Tümünü seç', clearAll: 'Tümünü kaldır',
      update: 'Güncelle', updating: 'Yükleniyor...', noData: 'Seçilen çalışanlar için veri yok',
      total: 'Toplam (Toplam / OK / NDF)', days: 'Gün', scrapTitle: '📊 Scrap / Waiting istatistikleri',
      scrapNoData: 'Veri yok', serial: 'Serial', status: 'Durum', finalna: 'FİNAL', hStatus: 'H Durum',
      newNp: 'New / NP', info: 'Bilgi / Açıklama', sortTitle: 'Sıralamak için tıklayın', totalRow: 'Toplam'
    }
  };

  const CSS = `
#statsPage {
  display: block; box-sizing: border-box; min-height: 100%; padding: 24px 0 30px; overflow: auto;
  background: #000; color: #fff; font-family: "Segoe UI", Tahoma, Arial, sans-serif; font-size: 14px;
}

/* ----- Панель фильтров ----- */
#statsPage .st-controls {
  display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; justify-content: center;
  width: 95%; max-width: 1200px; margin: 0 auto 20px;
}
#statsPage .st-field { display: flex; flex-direction: column; gap: 4px; }
#statsPage .st-field label { font-size: 12px; color: #9CA3AF; font-weight: 600; }
#statsPage input[type=date] {
  padding: 9px 12px; background: #111827; color: #fff; border: 1px solid #374151; border-radius: 8px;
  font-family: inherit; font-size: 14px; color-scheme: dark; outline: none;
}
#statsPage input[type=date]:focus { border-color: #2563EB; }

#statsPage .st-btn {
  background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; border: none;
  padding: 10px 22px; border-radius: 8px; font-weight: 600; font-family: inherit; font-size: 14px;
  cursor: pointer; box-shadow: 0 0 8px rgba(124,58,237,0.35);
}
#statsPage .st-btn:hover { filter: brightness(1.15); }
#statsPage .st-btn:disabled { opacity: 0.6; cursor: wait; }
#statsPage .st-btn-ghost {
  background: #111827; color: #fff; border: 1px solid #374151; padding: 10px 16px; border-radius: 8px;
  font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap;
}
#statsPage .st-btn-ghost:hover { border-color: #2563EB; }

/* ----- Выбор работников ----- */
#statsPage .st-dd { position: relative; }
#statsPage .st-dd-content {
  display: none; position: absolute; top: calc(100% + 6px); left: 0; min-width: 240px; max-height: 300px;
  overflow-y: auto; background: #111827; border: 1px solid #374151; border-radius: 10px; padding: 12px;
  z-index: 100; box-shadow: 0 10px 25px rgba(0,0,0,0.6);
}
#statsPage .st-dd-content.show { display: block; }
#statsPage .st-dd-actions {
  display: flex; justify-content: center; gap: 12px; font-size: 12px; color: #4d94ff;
  padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid #1f2937;
}
#statsPage .st-dd-actions span { cursor: pointer; }
#statsPage .st-dd-actions span:hover { color: #fff; text-decoration: underline; }
#statsPage .st-check { display: flex; align-items: center; gap: 10px; padding: 5px 0; font-size: 13px; cursor: pointer; color: #E5E7EB; }
#statsPage .st-check input { accent-color: #7c3aed; width: 16px; height: 16px; cursor: pointer; }

/* ----- Карточки и таблицы ----- */
#statsPage .st-card {
  width: 95%; max-width: 1200px; margin: 0 auto 20px; background: #0e0e0e; border: 1px solid #1f2937;
  border-radius: 10px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
}
#statsPage .st-table-wrap { overflow-x: auto; }
#statsPage table { width: 100%; border-collapse: collapse; background: #0e0e0e; }
#statsPage th, #statsPage td {
  padding: 10px 12px; text-align: center; border-bottom: 1px solid #1f2937; color: #E5E7EB;
  font-size: 14px; white-space: nowrap;
}
#statsPage th {
  background: #111827; color: #9CA3AF; font-size: 12px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.06em;
}
#statsPage td.name-cell { text-align: left; color: #fff; font-weight: 600; }
#statsPage tr.person-row { cursor: pointer; }
#statsPage tr.person-row:hover td { background: rgba(255,255,255,0.03); }
#statsPage tr.person-row:hover td.name-cell { color: #4d94ff; }
#statsPage .sum-col { color: #4d94ff; font-weight: 700; }
#statsPage tfoot td { background: #111827; font-weight: 700; color: #4d94ff; }
#statsPage .st-split { display: inline-flex; gap: 6px; align-items: center; justify-content: center; }
#statsPage .st-sum { color: #fff; font-weight: 700; }
#statsPage .st-sep { color: #6B7280; }
#statsPage .st-okc { color: #4d94ff; }
#statsPage .st-ndfc { color: #f472b6; }
#statsPage .st-msg { color: #9CA3AF; text-align: center; padding: 20px; margin: 0; }

/* ----- Детали работника ----- */
#statsPage .detail-row td { padding: 12px; background: #0a0a0a; white-space: normal; }
#statsPage .detail-table { border: 1px solid #1f2937; border-radius: 8px; overflow: hidden; }
#statsPage .detail-table th { font-size: 11px; }
#statsPage .detail-table th.sortable { cursor: pointer; }
#statsPage .detail-table th.sortable:hover { color: #fff; }
#statsPage .detail-table td { text-align: left; font-size: 13px; white-space: normal; }
#statsPage .st-ndf { color: #f472b6; font-weight: 600; }
#statsPage .st-scrap { color: #f87171; font-weight: 600; }
#statsPage .st-waiting { color: #fbbf24; font-weight: 600; }
#statsPage .st-ok { color: #E5E7EB; }

/* ----- Scrap / Waiting ----- */
#statsPage .scrap { color: #f87171; font-weight: 700; }
#statsPage .waiting { color: #fbbf24; font-weight: 700; }
#statsPage .st-cell-split { display: flex; justify-content: center; gap: 10px; }

#statsPage details.st-details {
  width: 95%; max-width: 1200px; margin: 0 auto 20px; background: #0e0e0e; border: 1px solid #1f2937;
  border-radius: 10px; overflow: hidden;
}
#statsPage details.st-details > summary {
  cursor: pointer; padding: 12px 18px; background: #111827; color: #fff; font-weight: 700; font-size: 15px; list-style: none;
}
#statsPage details.st-details > summary:hover { color: #4d94ff; }
#statsPage details.st-details > .st-card { width: 100%; max-width: none; margin: 0; border: none; border-radius: 0; box-shadow: none; }

@media (max-width: 1080px) {
  #statsPage .st-controls, #statsPage .st-card, #statsPage details.st-details { width: 100%; }
}
`;

  const MARKUP = `
<div class="st-controls">
  <div class="st-field">
    <label for="st-from" data-st="from"></label>
    <input type="date" id="st-from">
  </div>
  <div class="st-field">
    <label for="st-to" data-st="to"></label>
    <input type="date" id="st-to">
  </div>
  <div class="st-field st-dd" id="st-dd">
    <label>&nbsp;</label>
    <button type="button" id="st-dd-btn" class="st-btn-ghost"></button>
    <div id="st-dd-content" class="st-dd-content">
      <div class="st-dd-actions">
        <span id="st-all" data-st="selectAll"></span>
        <span id="st-none" data-st="clearAll"></span>
      </div>
      <div id="st-checkboxes"></div>
    </div>
  </div>
  <div class="st-field">
    <label>&nbsp;</label>
    <button type="button" id="st-update" class="st-btn"></button>
  </div>
</div>

<div class="st-card" id="st-stats"></div>

<details class="st-details" id="st-scrap-details">
  <summary data-st="scrapTitle"></summary>
  <div class="st-card" id="st-scrap"></div>
</details>
`;

  const $ = (id) => document.getElementById(id);

  let lang = 'en';
  let initialized = false;
  let started = false;
  let loaded = false;
  let busy = false;
  let lastFilteredData = [];
  let selectedPeople = new Set();
  let allPeople = [];

  function t(key) {
    const dict = I18N[lang] || I18N.en;
    return dict[key] !== undefined ? dict[key] : (I18N.en[key] !== undefined ? I18N.en[key] : key);
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  // Сьогоднішня дата у форматі yyyy-mm-dd (локальний час, без зсуву через UTC)
  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function getDiagonals(serial) {
    if (!serial || serial.length < 6) return [];
    const upper = serial.toUpperCase();
    const result = new Set();
    const match = upper.match(/^[A-Z]{3}(\d{3})/);
    if (match && diagonalMap[match[1]]) result.add(diagonalMap[match[1]]);
    const prefix = upper.slice(0, 3);
    if (diagonalMapPrefix[prefix]) result.add(diagonalMapPrefix[prefix]);
    return [...result];
  }

  async function getData(sheetName) {
    try {
      const res = await fetch(`${sheetURL}${encodeURIComponent(sheetName)}?key=${apiKey}&t=${Date.now()}`);
      const data = await res.json();
      return data.values || [];
    } catch (err) {
      console.error('Fetch error:', err);
      return [];
    }
  }

  async function fetchData() {
    let combined = [];
    for (const name of SHEET_NAMES) {
      const sheetData = await getData(name);
      if (sheetData.length < 2) continue;
      const mapped = sheetData.slice(1).map(row => ({
        date: row[0] || '',
        serial: row[2] || '',
        status: (row[4] || '').toUpperCase(),
        finalna: row[6] || '',
        person: row[5] || '',
        statusH: row[7] || '',
        matrixStatus: row[9] || '',
        description: row[10] || ''
      }));
      combined = combined.concat(mapped);
    }
    return combined;
  }

  function updateDropdownButtonText() {
    const total = allPeople.length;
    const count = selectedPeople.size;
    const label = (total === 0 || count === total) ? t('all') : `${count}/${total}`;
    $('st-dd-btn').textContent = `${t('workers')} (${label}) ▼`;
  }

  function buildPersonDropdown() {
    const box = $('st-checkboxes');
    box.innerHTML = '';
    allPeople.forEach(person => {
      const label = document.createElement('label');
      label.className = 'st-check';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = person;
      cb.checked = selectedPeople.has(person);
      cb.addEventListener('change', () => {
        if (cb.checked) selectedPeople.add(person);
        else selectedPeople.delete(person);
        updateDropdownButtonText();
        renderFilteredViews();
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(person));
      box.appendChild(label);
    });
    updateDropdownButtonText();
  }

  function selectAllPeople(select) {
    selectedPeople = select ? new Set(allPeople) : new Set();
    $('st-checkboxes').querySelectorAll('input[type=checkbox]').forEach(cb => { cb.checked = select; });
    updateDropdownButtonText();
    renderFilteredViews();
  }

  async function update() {
    if (busy) return;
    const dateFrom = $('st-from').value;
    const dateTo = $('st-to').value;
    if (!dateFrom || !dateTo) return;

    busy = true;
    $('st-update').disabled = true;
    $('st-update').textContent = t('updating');

    try {
      const allData = await fetchData();
      lastFilteredData = allData.filter(d => {
        const day = d.date.split(' ')[0];
        return day >= dateFrom && day <= dateTo;
      });

      allPeople = Array.from(new Set(lastFilteredData.map(d => d.person).filter(Boolean))).sort();
      const kept = allPeople.filter(p => selectedPeople.has(p));
      selectedPeople = new Set(kept.length ? kept : allPeople);

      buildPersonDropdown();
      loaded = true;
      renderFilteredViews();
    } finally {
      busy = false;
      $('st-update').disabled = false;
      $('st-update').textContent = t('update');
    }
  }

  function renderFilteredViews() {
    if (!loaded) return;
    const data = lastFilteredData.filter(d => selectedPeople.has(d.person));
    renderTable(calculateDetailedStats(data));
    renderScrapWaitingTable(calculateScrapWaitingStats(data));
  }

  function calculateDetailedStats(data) {
    const stats = {};
    data.forEach(({ date, serial, status, person }) => {
      if (!VALID_STATUSES.includes(status)) return;
      const diagonals = getDiagonals(serial);
      if (diagonals.length === 0) return;

      if (!stats[person]) stats[person] = { diagonals: {}, okCount: 0, ndfCount: 0, days: new Set() };

      const day = date.split(' ')[0];
      if (day) stats[person].days.add(day);
      if (status === 'OK') stats[person].okCount++;
      if (status === 'NDF') stats[person].ndfCount++;

      diagonals.forEach(diagonal => {
        if (!stats[person].diagonals[diagonal]) stats[person].diagonals[diagonal] = { sum: 0 };
        stats[person].diagonals[diagonal].sum++;
      });
    });
    return stats;
  }

  function calculateScrapWaitingStats(data) {
    const stats = {};
    data.forEach(({ serial, status, person }) => {
      if (!person || !serial || !status) return;
      const upper = status.toUpperCase();
      const type = upper.includes('SCRAP') ? 'scrap' : upper.includes('WAITING') ? 'waiting' : null;
      if (!type) return;
      const diagonals = getDiagonals(serial);
      if (diagonals.length === 0) return;
      if (!stats[person]) stats[person] = {};
      diagonals.forEach(diagonal => {
        if (!stats[person][diagonal]) stats[person][diagonal] = { scrap: 0, waiting: 0 };
        stats[person][diagonal][type]++;
      });
    });
    return stats;
  }

  function splitCell(total, ok, ndf) {
    return `<div class="st-split">
      <span class="st-sum">${total}</span><span class="st-sep">/</span>
      <span class="st-okc">${ok}</span><span class="st-sep">/</span>
      <span class="st-ndfc">${ndf}</span>
    </div>`;
  }

  function renderTable(stats) {
    const container = $('st-stats');
    const diagonals = Array.from(new Set(
      Object.values(stats).flatMap(p => Object.keys(p.diagonals).map(Number))
    )).sort((a, b) => b - a);

    const people = Object.keys(stats).sort((a, b) =>
      (stats[b].okCount + stats[b].ndfCount) - (stats[a].okCount + stats[a].ndfCount)
    );

    if (people.length === 0) {
      container.innerHTML = `<p class="st-msg">${esc(t('noData'))}</p>`;
      return;
    }

    const diagTotals = {};
    diagonals.forEach(d => { diagTotals[d] = 0; });
    let gOk = 0, gNdf = 0;

    const rows = people.map(person => {
      const p = stats[person];
      const rowTotal = p.okCount + p.ndfCount;
      gOk += p.okCount;
      gNdf += p.ndfCount;
      const cells = diagonals.map(d => {
        const v = p.diagonals[d] ? p.diagonals[d].sum : 0;
        diagTotals[d] += v;
        return `<td>${v || '-'}</td>`;
      }).join('');
      return `<tr class="person-row" data-person="${esc(person)}">
        <td class="name-cell">${esc(person)}</td>${cells}
        <td class="sum-col">${splitCell(rowTotal, p.okCount, p.ndfCount)}</td>
        <td>${p.days.size}</td>
      </tr>`;
    }).join('');

    const footCells = diagonals.map(d => `<td>${diagTotals[d] || '-'}</td>`).join('');

    container.innerHTML = `
      <div class="st-table-wrap">
        <table>
          <thead>
            <tr>
              <th></th>
              ${diagonals.map(d => `<th>${d}</th>`).join('')}
              <th class="sum-col">${esc(t('total'))}</th>
              <th>${esc(t('days'))}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td class="name-cell">${esc(t('totalRow'))}</td>
              ${footCells}
              <td class="sum-col">${splitCell(gOk + gNdf, gOk, gNdf)}</td>
              <td>-</td>
            </tr>
          </tfoot>
        </table>
      </div>`;
  }

  function toggleDetails(row, person) {
    const next = row.nextElementSibling;
    if (next && next.classList.contains('detail-row')) {
      next.remove();
      return;
    }
    const detailRow = document.createElement('tr');
    detailRow.className = 'detail-row';
    const td = document.createElement('td');
    td.colSpan = 100;
    detailRow.appendChild(td);
    row.after(detailRow);
    renderDetailContent(td, person, 'asc');
  }

  function renderDetailContent(td, person, order) {
    const details = lastFilteredData
      .filter(d => d.person === person)
      .sort((a, b) => {
        const c = (a.serial || '').localeCompare(b.serial || '', undefined, { numeric: true, sensitivity: 'base' });
        return order === 'asc' ? c : -c;
      });

    const arrow = order === 'asc' ? ' ▲' : ' ▼';
    const nextOrder = order === 'asc' ? 'desc' : 'asc';

    const rows = details.map(d => {
      const s = (d.status || '').toUpperCase();
      let cls = 'st-ok';
      if (s.includes('SCRAP')) cls = 'st-scrap';
      else if (s.includes('WAITING')) cls = 'st-waiting';
      else if (s.includes('NDF')) cls = 'st-ndf';
      return `<tr>
        <td class="${cls}">${esc(d.serial)}</td>
        <td class="${cls}">${esc(d.status)}</td>
        <td class="${cls}" style="font-weight:700;">${esc(d.finalna)}</td>
        <td class="${cls}">${esc(d.statusH)}</td>
        <td class="${cls}">${esc(d.matrixStatus)}</td>
        <td class="${cls}">${esc(d.description)}</td>
      </tr>`;
    }).join('');

    td.innerHTML = `
      <table class="detail-table">
        <thead>
          <tr>
            <th class="sortable" data-person="${esc(person)}" data-order="${nextOrder}" title="${esc(t('sortTitle'))}">${esc(t('serial'))}${arrow}</th>
            <th>${esc(t('status'))}</th>
            <th>${esc(t('finalna'))}</th>
            <th>${esc(t('hStatus'))}</th>
            <th>${esc(t('newNp'))}</th>
            <th>${esc(t('info'))}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  function renderScrapWaitingTable(stats) {
    const container = $('st-scrap');
    const diagonals = Array.from(new Set(
      Object.values(stats).flatMap(p => Object.keys(p).map(Number))
    )).sort((a, b) => b - a);

    if (diagonals.length === 0) {
      container.innerHTML = `<p class="st-msg">${esc(t('scrapNoData'))}</p>`;
      return;
    }

    const rows = Object.keys(stats).map(person => {
      const cells = diagonals.map(d => {
        const c = stats[person][d];
        return c
          ? `<td><div class="st-cell-split"><span class="scrap">${c.scrap}</span><span class="waiting">${c.waiting}</span></div></td>`
          : '<td>-</td>';
      }).join('');
      return `<tr><td class="name-cell">${esc(person)}</td>${cells}</tr>`;
    }).join('');

    container.innerHTML = `
      <div class="st-table-wrap">
        <table>
          <thead>
            <tr><th></th>${diagonals.map(d => `<th>${d}</th>`).join('')}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function applyText() {
    document.querySelectorAll('#statsPage [data-st]').forEach(el => {
      el.textContent = t(el.dataset.st);
    });
    $('st-update').textContent = busy ? t('updating') : t('update');
    updateDropdownButtonText();
  }

  function init() {
    const root = $('statsPage');
    if (!root) return;

    try {
      const saved = localStorage.getItem('siteLang');
      if (saved && I18N[saved]) lang = saved;
    } catch (e) {}

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    root.innerHTML = MARKUP;

    $('st-from').value = todayStr();
    $('st-to').value = todayStr();

    $('st-dd-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      $('st-dd-content').classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
      if (!$('st-dd').contains(e.target)) $('st-dd-content').classList.remove('show');
    });

    $('st-all').addEventListener('click', () => selectAllPeople(true));
    $('st-none').addEventListener('click', () => selectAllPeople(false));
    $('st-update').addEventListener('click', update);

    // Делегирование: строки работников, сортировка деталей
    $('st-stats').addEventListener('click', (e) => {
      const th = e.target.closest('th.sortable');
      if (th) {
        renderDetailContent(th.closest('td'), th.dataset.person, th.dataset.order);
        return;
      }
      const tr = e.target.closest('tr.person-row');
      if (tr) toggleDetails(tr, tr.dataset.person);
    });

    initialized = true;
    applyText();
  }

  // Язык задаёт сайт (app.js): window.setStatisticLang('uk' | 'ru' | 'pl' | 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'tr')
  window.setStatisticLang = function (l) {
    lang = I18N[l] ? l : 'en';
    if (initialized) {
      applyText();
      renderFilteredViews();
    }
  };

  // Вызывается сайтом (app.js) при открытии вкладки Statistic.
  // Данные загружаются при первом открытии, дальше — по кнопке «Обновить».
  window.statsShow = function () {
    if (started) return;
    started = true;
    update();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
