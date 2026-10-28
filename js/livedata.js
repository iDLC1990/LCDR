/* Статистика по днях (Statistic per day): LCDR Live Data, версія для сайту.
   Язык берётся с сайта через window.setLiveLang(код). Все 10 мов сайту.
   Підключення: <script src="js/livedata.js"></script> ПІСЛЯ js/config.js, js/diagonals.js, js/sheets.js і js/app.js.
   Контейнер: <section id="livePage">. Дані завантажуються при першому відкритті сторінки.
   Источник данных: база Supabase, таблица fi_log (её каждую минуту заполняет скрипт из рабочей Google Таблицы).
   Поиск: серийный номер -> история ремонта (fi_log),
          номер части (Panel_pn) -> детали из базы PN (Supabase, таблица pn_base). */
(function () {
  // Названия станций в базе -> как они называются в статистике
  const INSPECTOR = { KOVALCHYK: 'KOVALCHYK Y.', ULANOVYCH: 'ULANOVYCH.R' };
  const FI_COLS = 'station, date_raw, time_raw, serial, repair_type, status, name, name_final, oc_after, comment';

  /* ===== Переклади (10 мов, як на сайті) ===== */
  const I18N = {
    en: {
      titleHint: 'Click on the date to copy SN. Double-click to show the table full screen',
      searchPh: 'Enter SN / part number (Enter)', bulkPh: 'Paste SN numbers, one per line. Ctrl+Enter = search',
      modeSingle: 'Single', modeBulk: 'Bulk', bulkRun: 'SEARCH',
      diagTitle: 'FI Station Diagonals',
      sum: 'SUM', total: 'TOTAL', name: 'NAME',
      copyNone: 'No data', copyOk: '✓ Copied: {n}', copyErr: 'Copy error',
      noInfo: 'No info!', notFound: 'NOT FOUND', notFoundCount: 'NOT FOUND — [{n}]',
      close: 'CLOSE', modalNoData: 'No data for this employee today.',
      hSerial: 'Serial', hType: 'Type', hStatus: 'Status', hOc: 'OC', hComment: 'Comment',
      hDate: 'Date', hFinal: 'Final', hInfo: 'Info', hRepairer: 'Repairer', unknown: 'UNKNOWN'
    },
    uk: {
      titleHint: 'Натисніть на дату, щоб скопіювати SN. Подвійний клік — таблиця на весь екран',
      searchPh: 'Введіть SN / PN деталі (Enter)', bulkPh: 'Вставте SN, кожен з нового рядка. Ctrl+Enter = пошук',
      modeSingle: 'Один', modeBulk: 'Список', bulkRun: 'ПОШУК',
      diagTitle: 'Діагоналі станцій FI',
      sum: 'СУМА', total: 'РАЗОМ', name: 'ПРАЦІВНИК',
      copyNone: 'Немає даних', copyOk: '✓ Скопійовано: {n}', copyErr: 'Помилка копіювання',
      noInfo: 'Немає інформації!', notFound: 'НЕ ЗНАЙДЕНО', notFoundCount: 'НЕ ЗНАЙДЕНО — [{n}]',
      close: 'ЗАКРИТИ', modalNoData: 'На сьогодні даних по цьому працівнику немає.',
      hSerial: 'Serial', hType: 'Тип', hStatus: 'Статус', hOc: 'OC', hComment: 'Коментар',
      hDate: 'Дата', hFinal: 'Фінальна', hInfo: 'Інфо', hRepairer: 'Ремонтник', unknown: 'НЕВІДОМО'
    },
    ru: {
      titleHint: 'Нажмите на дату, чтобы скопировать SN. Двойной клик — таблица на весь экран',
      searchPh: 'Введите SN / PN детали (Enter)', bulkPh: 'Вставьте SN, каждый с новой строки. Ctrl+Enter = поиск',
      modeSingle: 'Один', modeBulk: 'Список', bulkRun: 'ПОИСК',
      diagTitle: 'Диагонали станций FI',
      sum: 'СУММА', total: 'ИТОГО', name: 'СОТРУДНИК',
      copyNone: 'Нет данных', copyOk: '✓ Скопировано: {n}', copyErr: 'Ошибка копирования',
      noInfo: 'Нет информации!', notFound: 'НЕ НАЙДЕНО', notFoundCount: 'НЕ НАЙДЕНО — [{n}]',
      close: 'ЗАКРЫТЬ', modalNoData: 'На сегодня данных по этому сотруднику нет.',
      hSerial: 'Serial', hType: 'Тип', hStatus: 'Статус', hOc: 'OC', hComment: 'Комментарий',
      hDate: 'Дата', hFinal: 'Финальная', hInfo: 'Инфо', hRepairer: 'Ремонтник', unknown: 'НЕИЗВЕСТНО'
    },
    pl: {
      titleHint: 'Kliknij datę, aby skopiować SN. Podwójne kliknięcie — pełny ekran',
      searchPh: 'Podaj SN / PN części (Enter)', bulkPh: 'Wklej numery SN, każdy w nowej linii. Ctrl+Enter = szukaj',
      modeSingle: 'Pojedynczy', modeBulk: 'Zbiorczy', bulkRun: 'SZUKAJ',
      diagTitle: 'Przekątne stanowisk FI',
      sum: 'SUMA', total: 'RAZEM', name: 'PRACOWNIK',
      copyNone: 'Brak danych', copyOk: '✓ Skopiowano: {n}', copyErr: 'Błąd kopiowania',
      noInfo: 'Brak info!', notFound: 'NIE ZNALEZIONO', notFoundCount: 'NIE ZNALEZIONO — [{n}]',
      close: 'ZAMKNIJ', modalNoData: 'Brak danych dla wybranego pracownika na dzisiaj.',
      hSerial: 'Serial', hType: 'Typ', hStatus: 'Status', hOc: 'OC', hComment: 'Komentarz',
      hDate: 'Data', hFinal: 'Finalna', hInfo: 'Info', hRepairer: 'Naprawiający', unknown: 'NIEZNANY'
    },
    de: {
      titleHint: 'Auf das Datum klicken, um SN zu kopieren. Doppelklick = Vollbild',
      searchPh: 'SN / Teilenummer eingeben (Enter)', bulkPh: 'SN-Nummern einfügen, eine pro Zeile. Strg+Enter = suchen',
      modeSingle: 'Einzeln', modeBulk: 'Liste', bulkRun: 'SUCHEN',
      diagTitle: 'FI-Stationsdiagonalen',
      sum: 'SUMME', total: 'GESAMT', name: 'NAME',
      copyNone: 'Keine Daten', copyOk: '✓ Kopiert: {n}', copyErr: 'Kopierfehler',
      noInfo: 'Keine Info!', notFound: 'NICHT GEFUNDEN', notFoundCount: 'NICHT GEFUNDEN — [{n}]',
      close: 'SCHLIESSEN', modalNoData: 'Heute keine Daten für diesen Mitarbeiter.',
      hSerial: 'Serial', hType: 'Typ', hStatus: 'Status', hOc: 'OC', hComment: 'Kommentar',
      hDate: 'Datum', hFinal: 'Final', hInfo: 'Info', hRepairer: 'Reparateur', unknown: 'UNBEKANNT'
    },
    fr: {
      titleHint: 'Cliquez sur la date pour copier le SN. Double-clic = plein écran',
      searchPh: 'Saisissez SN / référence (Entrée)', bulkPh: 'Collez les SN, un par ligne. Ctrl+Entrée = rechercher',
      modeSingle: 'Unitaire', modeBulk: 'Liste', bulkRun: 'RECHERCHER',
      diagTitle: 'Diagonales des stations FI',
      sum: 'SOMME', total: 'TOTAL', name: 'NOM',
      copyNone: 'Aucune donnée', copyOk: '✓ Copié : {n}', copyErr: 'Erreur de copie',
      noInfo: 'Aucune info !', notFound: 'INTROUVABLE', notFoundCount: 'INTROUVABLE — [{n}]',
      close: 'FERMER', modalNoData: "Aucune donnée pour cet employé aujourd'hui.",
      hSerial: 'Serial', hType: 'Type', hStatus: 'Statut', hOc: 'OC', hComment: 'Commentaire',
      hDate: 'Date', hFinal: 'Finale', hInfo: 'Info', hRepairer: 'Réparateur', unknown: 'INCONNU'
    },
    es: {
      titleHint: 'Haga clic en la fecha para copiar el SN. Doble clic = pantalla completa',
      searchPh: 'Introduzca SN / referencia (Intro)', bulkPh: 'Pegue los SN, uno por línea. Ctrl+Intro = buscar',
      modeSingle: 'Individual', modeBulk: 'Lista', bulkRun: 'BUSCAR',
      diagTitle: 'Diagonales de estaciones FI',
      sum: 'SUMA', total: 'TOTAL', name: 'NOMBRE',
      copyNone: 'Sin datos', copyOk: '✓ Copiados: {n}', copyErr: 'Error al copiar',
      noInfo: '¡Sin información!', notFound: 'NO ENCONTRADO', notFoundCount: 'NO ENCONTRADO — [{n}]',
      close: 'CERRAR', modalNoData: 'No hay datos de este empleado para hoy.',
      hSerial: 'Serial', hType: 'Tipo', hStatus: 'Estado', hOc: 'OC', hComment: 'Comentario',
      hDate: 'Fecha', hFinal: 'Final', hInfo: 'Info', hRepairer: 'Reparador', unknown: 'DESCONOCIDO'
    },
    it: {
      titleHint: "Clicca sulla data per copiare l'SN. Doppio clic = schermo intero",
      searchPh: 'Inserisci SN / codice parte (Invio)', bulkPh: 'Incolla gli SN, uno per riga. Ctrl+Invio = cerca',
      modeSingle: 'Singolo', modeBulk: 'Elenco', bulkRun: 'CERCA',
      diagTitle: 'Diagonali stazioni FI',
      sum: 'SOMMA', total: 'TOTALE', name: 'NOME',
      copyNone: 'Nessun dato', copyOk: '✓ Copiati: {n}', copyErr: 'Errore di copia',
      noInfo: 'Nessuna info!', notFound: 'NON TROVATO', notFoundCount: 'NON TROVATO — [{n}]',
      close: 'CHIUDI', modalNoData: 'Nessun dato per questo dipendente oggi.',
      hSerial: 'Serial', hType: 'Tipo', hStatus: 'Stato', hOc: 'OC', hComment: 'Commento',
      hDate: 'Data', hFinal: 'Finale', hInfo: 'Info', hRepairer: 'Riparatore', unknown: 'SCONOSCIUTO'
    },
    pt: {
      titleHint: 'Clique na data para copiar o SN. Duplo clique = tela cheia',
      searchPh: 'Digite SN / referência (Enter)', bulkPh: 'Cole os SN, um por linha. Ctrl+Enter = pesquisar',
      modeSingle: 'Individual', modeBulk: 'Lista', bulkRun: 'PESQUISAR',
      diagTitle: 'Diagonais das estações FI',
      sum: 'SOMA', total: 'TOTAL', name: 'NOME',
      copyNone: 'Sem dados', copyOk: '✓ Copiados: {n}', copyErr: 'Erro ao copiar',
      noInfo: 'Sem informações!', notFound: 'NÃO ENCONTRADO', notFoundCount: 'NÃO ENCONTRADO — [{n}]',
      close: 'FECHAR', modalNoData: 'Não há dados deste funcionário para hoje.',
      hSerial: 'Serial', hType: 'Tipo', hStatus: 'Status', hOc: 'OC', hComment: 'Comentário',
      hDate: 'Data', hFinal: 'Final', hInfo: 'Info', hRepairer: 'Reparador', unknown: 'DESCONHECIDO'
    },
    tr: {
      titleHint: 'SN kopyalamak için tarihe tıklayın. Çift tıklama = tam ekran',
      searchPh: 'SN / parça numarası girin (Enter)', bulkPh: 'SN numaralarını yapıştırın, her satıra bir tane. Ctrl+Enter = ara',
      modeSingle: 'Tekli', modeBulk: 'Toplu', bulkRun: 'ARA',
      diagTitle: 'FI İstasyon köşegenleri',
      sum: 'TOPLAM', total: 'TOPLAM', name: 'AD',
      copyNone: 'Veri yok', copyOk: '✓ Kopyalandı: {n}', copyErr: 'Kopyalama hatası',
      noInfo: 'Bilgi yok!', notFound: 'BULUNAMADI', notFoundCount: 'BULUNAMADI — [{n}]',
      close: 'KAPAT', modalNoData: 'Bugün bu çalışan için veri yok.',
      hSerial: 'Serial', hType: 'Tip', hStatus: 'Durum', hOc: 'OC', hComment: 'Yorum',
      hDate: 'Tarih', hFinal: 'Final', hInfo: 'Bilgi', hRepairer: 'Onarımcı', unknown: 'BİLİNMİYOR'
    }
  };

  // Надписи для скачивания фото (двойной клик по серийному номеру)
  Object.assign(I18N.en, { phOk: 'Downloaded: {n}', phNone: 'No photo for {n}', phErr: 'Photo download error', phHint: 'Double-click to download the photo' });
  Object.assign(I18N.uk, { phOk: 'Завантажено: {n}', phNone: 'Немає фото для {n}', phErr: 'Помилка завантаження фото', phHint: 'Двічі клікніть, щоб завантажити фото' });
  Object.assign(I18N.ru, { phOk: 'Скачано: {n}', phNone: 'Нет фото для {n}', phErr: 'Ошибка скачивания фото', phHint: 'Двойной клик — скачать фото' });
  Object.assign(I18N.pl, { phOk: 'Pobrano: {n}', phNone: 'Brak zdjęcia dla {n}', phErr: 'Błąd pobierania zdjęcia', phHint: 'Kliknij dwukrotnie, aby pobrać zdjęcie' });
  Object.assign(I18N.de, { phOk: 'Heruntergeladen: {n}', phNone: 'Kein Foto für {n}', phErr: 'Fehler beim Foto-Download', phHint: 'Doppelklick zum Herunterladen des Fotos' });
  Object.assign(I18N.fr, { phOk: 'Téléchargé : {n}', phNone: 'Aucune photo pour {n}', phErr: 'Erreur de téléchargement de la photo', phHint: 'Double-clic pour télécharger la photo' });
  Object.assign(I18N.es, { phOk: 'Descargado: {n}', phNone: 'No hay foto de {n}', phErr: 'Error al descargar la foto', phHint: 'Doble clic para descargar la foto' });
  Object.assign(I18N.it, { phOk: 'Scaricato: {n}', phNone: 'Nessuna foto per {n}', phErr: 'Errore di download della foto', phHint: 'Doppio clic per scaricare la foto' });
  Object.assign(I18N.pt, { phOk: 'Baixado: {n}', phNone: 'Sem foto para {n}', phErr: 'Erro ao baixar a foto', phHint: 'Clique duas vezes para baixar a foto' });
  Object.assign(I18N.tr, { phOk: 'İndirildi: {n}', phNone: '{n} için fotoğraf yok', phErr: 'Fotoğraf indirme hatası', phHint: 'Fotoğrafı indirmek için çift tıklayın' });

  Object.assign(I18N.en, { loadErr: 'Failed to load data' });
  Object.assign(I18N.uk, { loadErr: 'Не вдалося завантажити дані' });
  Object.assign(I18N.ru, { loadErr: 'Не удалось загрузить данные' });
  Object.assign(I18N.pl, { loadErr: 'Nie udało się wczytać danych' });
  Object.assign(I18N.de, { loadErr: 'Daten konnten nicht geladen werden' });
  Object.assign(I18N.fr, { loadErr: 'Échec du chargement des données' });
  Object.assign(I18N.es, { loadErr: 'No se pudieron cargar los datos' });
  Object.assign(I18N.it, { loadErr: 'Impossibile caricare i dati' });
  Object.assign(I18N.pt, { loadErr: 'Falha ao carregar os dados' });
  Object.assign(I18N.tr, { loadErr: 'Veriler yüklenemedi' });

  const CSS = `
#livePage {
  position: relative; display: block; box-sizing: border-box;
  min-height: 100%; padding: 24px 0 30px; overflow: auto;
  background: #000; color: #fff;
  font-family: "Segoe UI", Tahoma, Arial, sans-serif; font-size: 14px;
}

/* ----- Блоки ----- */
#livePage .lv-wrap { width: 95%; max-width: 1200px; margin: 0 auto 24px; transition: all 0.3s ease; }
#livePage .lv-wrap:first-child { margin-top: 0; }
#livePage .lv-card {
  background: #0e0e0e; border: 1px solid #1f2937; border-radius: 10px;
  overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
}
#livePage .lv-block-title {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  padding: 12px 18px; background: #111827; color: #fff;
  font-size: 15px; font-weight: 700; border-bottom: 1px solid #1f2937;
}
#livePage #table-title { cursor: pointer; user-select: none; color: #4d94ff; font-size: 15px; font-weight: 700; }
#livePage #table-title:hover { color: #fff; }

#livePage .lv-toggle {
  background: #374151; color: #F3F4F6; border: none; border-radius: 6px;
  padding: 4px 10px; font-size: 12px; cursor: pointer; margin: 0 0 10px auto; display: block;
}
#livePage .lv-toggle:hover { background: #4B5563; }

/* ----- Пошук ----- */
#livePage .lv-search-row { display: flex; gap: 10px; align-items: stretch; max-width: 720px; margin: 0 auto; }
#livePage #search, #livePage #bulk-input {
  flex: 1; min-width: 0; padding: 12px 14px; font-size: 15px;
  background: #111827; color: #fff; border: 1px solid #374151; border-radius: 8px;
  outline: none; box-sizing: border-box; font-family: inherit; transition: border-color 0.2s;
}
#livePage #search:focus, #livePage #bulk-input:focus { border-color: #2563EB; }
#livePage #bulk-input { min-height: 90px; resize: vertical; font-family: Consolas, 'Courier New', monospace; }
#livePage .mode-switch { display: flex; flex-shrink: 0; border: 1px solid #374151; border-radius: 8px; overflow: hidden; }
#livePage .mode-switch button {
  background: #111827; color: #9CA3AF; border: none; padding: 0 14px;
  cursor: pointer; font-weight: 600; font-size: 13px; font-family: inherit; transition: all 0.2s;
}
#livePage .mode-switch button.active { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; }
#livePage .bulk-actions { display: flex; justify-content: center; max-width: 720px; margin: 10px auto 0; }
#livePage #bulk-run {
  background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; border: none;
  padding: 10px 26px; cursor: pointer; font-weight: 600; border-radius: 8px; font-family: inherit;
  box-shadow: 0 0 8px rgba(124,58,237,0.35);
}
#livePage #bulk-run:hover { filter: brightness(1.15); }

#livePage #search-result { margin-top: 16px; }
#livePage .lv-msg { color: #9CA3AF; text-align: center; }

/* ----- Таблицы ----- */
#livePage table { width: 100%; border-collapse: collapse; background: #0e0e0e; }
#livePage th, #livePage td {
  padding: 10px 12px; text-align: center; border-bottom: 1px solid #1f2937; color: #E5E7EB; font-size: 14px;
}
#livePage th {
  background: #111827; color: #9CA3AF; font-size: 12px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.06em;
}
#livePage tbody tr:hover { background: rgba(255,255,255,0.03); }
#livePage td.ld-name { cursor: pointer; text-align: left; color: #fff; font-weight: 600; }
#livePage td.ld-name:hover { color: #4d94ff; }
#livePage .total-row td { font-weight: 700; background: #111827; color: #4d94ff; }
#livePage .sum-col { color: #4d94ff; font-weight: 700; }

#livePage #search-result table { border: 1px solid #1f2937; border-radius: 8px; overflow: hidden; margin-top: 4px; }
#livePage .latest-record td { background: rgba(37,99,235,0.2); font-weight: 700; color: #fff; }

#livePage .lv-table-wrap { overflow-x: auto; }
#livePage .lv-block-title { cursor: pointer; user-select: none; }
#livePage .lv-card.collapsed .lv-table-wrap { display: none; }

/* ----- Групи пакетного пошуку ----- */
#livePage details.bulk-group { margin-bottom: 10px; border: 1px solid #1f2937; border-radius: 8px; overflow: hidden; }
#livePage details.bulk-group summary {
  padding: 10px 14px; cursor: pointer; background: #111827; color: #fff; font-weight: 600;
}
#livePage details.bulk-missing summary { color: #F87171; }
#livePage .bulk-missing-list { padding: 10px 14px; color: #F87171; word-break: break-word; }

/* ----- Модальное окно ----- */
#livePage #modal {
  display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8);
  justify-content: center; align-items: center; z-index: 10000;
}
#livePage #modal.show { display: flex; }
#livePage #modal-content {
  background: #111827; color: #fff; padding: 20px; border: 1px solid #374151; border-radius: 12px;
  max-height: 85%; overflow: auto; width: 90%; max-width: 1000px; box-shadow: 0 10px 25px rgba(0,0,0,0.6);
}
#livePage #modal-close {
  background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; border: none;
  padding: 8px 18px; cursor: pointer; font-weight: 600; margin-bottom: 14px; border-radius: 8px; font-family: inherit;
}

/* ----- Полноэкранный режим ----- */
#livePage .lv-wrap.fullscreen-mode {
  position: fixed !important; top: 0 !important; left: 0 !important;
  width: 100vw !important; height: 100vh !important; max-width: none !important; margin: 0 !important;
  z-index: 9999 !important; background: rgba(0,0,0,0.96); padding: 2vh 2vw; box-sizing: border-box;
  display: flex; flex-direction: column; justify-content: center;
}
#livePage .fullscreen-mode .lv-card { height: 96vh; display: flex; flex-direction: column; }
#livePage .fullscreen-mode .lv-table-wrap { flex-grow: 1; overflow: hidden; display: flex; flex-direction: column; }
#livePage .fullscreen-mode table { flex-grow: 1; height: 100%; }
#livePage .fullscreen-mode th, #livePage .fullscreen-mode td { font-size: min(1.2vw, 2.5vh); padding: 0.3vh 1vw; height: 1%; }

/* ----- Серийный номер: двойной клик скачивает фото ----- */
#livePage td.lv-sn { cursor: pointer; font-family: Consolas, 'Courier New', monospace; }
#livePage td.lv-sn:hover { color: #4d94ff; }
.lv-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: #111827; color: #F9FAFB; border: 1px solid #374151; padding: 10px 18px;
  border-radius: 8px; font-size: 13px; font-weight: 600; z-index: 10001;
  opacity: 0; pointer-events: none; transition: opacity .2s;
}
.lv-toast.show { opacity: 1; }

@media (max-width: 1080px) {
  #livePage .lv-wrap { width: 100%; }
}
`;

  const MARKUP = `
<div class="lv-wrap" id="search-wrap">
  <div class="lv-search-row">
    <input type="text" id="search" data-lv-ph="searchPh" autocomplete="off">
    <textarea id="bulk-input" data-lv-ph="bulkPh" style="display:none"></textarea>
    <div class="mode-switch" id="mode-switch">
      <button type="button" data-mode="single" class="active" data-lv="modeSingle"></button>
      <button type="button" data-mode="bulk" data-lv="modeBulk"></button>
    </div>
  </div>
  <div class="bulk-actions" id="bulk-actions" style="display:none">
    <button type="button" id="bulk-run" data-lv="bulkRun"></button>
  </div>
  <div id="search-result"></div>
</div>

<div class="lv-wrap" id="overview-wrap">
  <div class="lv-card" id="overview-block">
    <div class="lv-block-title" id="overview-title">
      <span id="table-title" data-lv-title="titleHint">--.--.----</span>
    </div>
    <div class="lv-table-wrap">
      <table id="combined-table">
        <thead>
          <tr>
            <th></th><th>NDF</th><th>OK</th><th>WAITING</th><th>SCRAP TTL</th><th class="sum-col" data-lv="sum"></th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  </div>
</div>

<div class="lv-wrap" id="diag-wrap">
  <div class="lv-card" id="diag-block">
    <div class="lv-block-title"><span data-lv="diagTitle"></span></div>
    <div class="lv-table-wrap">
      <table id="diag-table">
        <thead></thead>
        <tbody></tbody>
      </table>
    </div>
  </div>
</div>

<div id="modal">
  <div id="modal-content">
    <button type="button" id="modal-close" data-lv="close"></button>
    <div id="modal-body"></div>
  </div>
</div>
`;

  const $ = (id) => document.getElementById(id);

  let lvLang = 'en';
  let initialized = false;
  let started = false;
  let combinedDataCache = [];
  let lastFiltered = [];
  let lastDateStr = '';
  let lastDayFromDb = '';
  let bulkMode = false;
  let resultMode = null;        // 'single' | 'bulk' | null
  let searchSeq = 0;            // номер последнего поиска (чтобы старый ответ не затёр новый)
  let titleBusy = false;
  let titleTimer = null;
  let clickTimer = null;

  function t(key, vars) {
    const dict = I18N[lvLang] || I18N.en;
    let s = dict[key] !== undefined ? dict[key] : (I18N.en[key] !== undefined ? I18N.en[key] : key);
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }

  function applyText() {
    document.querySelectorAll('#livePage [data-lv]').forEach(el => { el.textContent = t(el.dataset.lv); });
    document.querySelectorAll('#livePage [data-lv-ph]').forEach(el => { el.placeholder = t(el.dataset.lvPh); });
    document.querySelectorAll('#livePage [data-lv-title]').forEach(el => { el.title = t(el.dataset.lvTitle); });
  }

  function isVisible() {
    const r = $('livePage');
    return !!r && r.style.display !== 'none';
  }

  function getUserCustomClass(name) {
    switch (name) {
      case 'KOVALCHYK Y.': return 'king-user';
      case 'KUKU O.': return 'owl-user';
      case 'BŁASZKOWSKA M.': return 'pl-user';
      case 'POKALCHUK A.': return 'flower-user';
      case 'NIKOLAIEV D.': return 'boxer-user';
      case 'YAROSHENKO L.': return 'heart-user';
      case 'ZAHUBYPALETS K.': return 'cat-user';
      case 'ULANOVYCH R.': return 'stepan-user';
      default: return '';
    }
  }

  function escHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  // Сьогоднішня дата у форматі 18.10.2026
  function todayStr() {
    const d = new Date();
    return [String(d.getDate()).padStart(2, '0'), String(d.getMonth() + 1).padStart(2, '0'), d.getFullYear()].join('.');
  }

  // Диагональ по серийному номеру: общая таблица в js/diagonals.js
  function extractDiagonal(serial) {
    return window.LCDR_DIAG.fromSerial(serial);
  }

  // Последний день, за который есть данные в базе
  async function fetchLastDay(sb) {
    const { data, error } = await sb.from('fi_log').select('day').not('day', 'is', null)
      .order('day', { ascending: false }).limit(1);
    if (error) throw error;
    return data && data.length ? data[0].day : '';
  }

  // Загружает из базы все строки последнего дня (статистика, окно работника, копирование серийников)
  async function fetchAndCacheData() {
    try {
      const sb = lvSb();
      const day = await fetchLastDay(sb);
      const rows = [];
      if (day) {
        for (let from = 0; ; from += 1000) {
          const { data, error } = await sb.from('fi_log').select(FI_COLS)
            .eq('day', day).order('time_raw').order('id').range(from, from + 999);
          if (error) throw error;
          rows.push(...data);
          if (data.length < 1000) break;
        }
      }
      lastDayFromDb = day;
      combinedDataCache = rows.map(dbRowToRecord);
      return true;
    } catch (e) {
      console.error('fi_log load failed:', e);
      return false;
    }
  }

  function parseDatePart(val) {
    if (!val) return null;
    const first = val.split(' ')[0].trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(first)) return new Date(first);
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(first)) {
      const [d, m, y] = first.split('.');
      return new Date(`${y}-${m}-${d}`);
    }
    const parsed = Date.parse(first);
    return isNaN(parsed) ? null : new Date(parsed);
  }

  function toggleBlock(blockId) {
    $(blockId).classList.toggle('collapsed');
  }

  function closeModal() {
    $('modal').classList.remove('show');
  }

  function openModal(name) {
    const records = combinedDataCache.filter(r => r.name === name && normDay(r.date) === lastDateStr);
    const body = $('modal-body');

    if (!records.length) {
      body.innerHTML = `<p class="lv-msg">${escHtml(t('modalNoData'))}</p>`;
    } else {
      let html = `<table><thead><tr>
        <th>${escHtml(t('hSerial'))}</th><th>${escHtml(t('hType'))}</th><th>${escHtml(t('hStatus'))}</th>
        <th>${escHtml(t('hOc'))}</th><th>${escHtml(t('hComment'))}</th>
      </tr></thead><tbody>`;
      records.forEach(r => {
        html += `<tr><td class="lv-sn" data-sn="${escHtml(r.serial || '')}" title="${escHtml(t('phHint'))}">${escHtml(r.serial || '--')}</td><td>${escHtml(r.type || '--')}</td><td>${escHtml(r.status || '--')}</td><td>${escHtml(r.ocAfterRepair || '--')}</td><td>${escHtml(r.comment || '--')}</td></tr>`;
      });
      body.innerHTML = html + '</tbody></table>';
    }
    $('modal').classList.add('show');
  }

  function displayCombinedStats(filtered) {
    const stats = {};
    let tNDF = 0, tOK = 0, tWAIT = 0, tTTL = 0, gTotal = 0;

    filtered.forEach(r => {
      const n = r.name || t('unknown');
      if (!stats[n]) stats[n] = { NDF:0, OK:0, WAITING:0, 'SCRAP TTL':0, total:0 };
      if (r.status === 'NDF') { stats[n].NDF++; tNDF++; }
      if (r.status === 'OK') { stats[n].OK++; tOK++; }
      if (r.status === 'WAITING') { stats[n].WAITING++; tWAIT++; }
      if (r.status === 'SCRAP TTL') { stats[n]['SCRAP TTL']++; tTTL++; }
      stats[n].total++; gTotal++;
    });

    const tbody = document.querySelector('#combined-table tbody');
    tbody.innerHTML = '';

    Object.entries(stats)
      .sort((a, b) => a[1].OK - b[1].OK)
      .forEach(([name, data]) => {
        const row = document.createElement('tr');
        row.innerHTML =
          `<td class="ld-name ${getUserCustomClass(name)}" data-name="${escHtml(name)}">${escHtml(name)}</td>` +
          `<td>${data.NDF}</td><td>${data.OK}</td><td>${data.WAITING}</td><td>${data['SCRAP TTL']}</td>` +
          `<td class="sum-col">${data.total}</td>`;
        tbody.appendChild(row);
      });

    const tr = document.createElement('tr');
    tr.className = 'total-row';
    tr.innerHTML = `<td>${escHtml(t('total'))}</td><td>${tNDF}</td><td>${tOK}</td><td>${tWAIT}</td><td>${tTTL}</td><td class="sum-col">${gTotal}</td>`;
    tbody.appendChild(tr);
  }

  function displayDiagonalStats(filtered) {
    const diagStats = {};
    filtered.forEach(({ name, serial, status }) => {
      if (status !== 'OK' && status !== 'NDF') return;
      const diag = extractDiagonal(serial);
      if (!diag) return;
      const nm = name || t('unknown');
      if (!diagStats[nm]) diagStats[nm] = {};
      diagStats[nm][diag] = (diagStats[nm][diag] || 0) + 1;
    });

    const tbody = document.querySelector('#diag-table tbody');
    const thead = document.querySelector('#diag-table thead');
    const allDiagonals = [...new Set(Object.values(diagStats).flatMap(o => Object.keys(o)))].map(Number).sort((a, b) => a - b);

    thead.innerHTML = `<tr><th>${escHtml(t('name'))}</th>${allDiagonals.map(d => `<th>${d}</th>`).join('')}<th class="sum-col">${escHtml(t('sum'))}</th></tr>`;
    tbody.innerHTML = '';

    Object.entries(diagStats).sort().forEach(([name, diags]) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td class="${getUserCustomClass(name)}" style="cursor:default; text-align:left; color:#fff; font-weight:600;">${escHtml(name)}</td>` +
        allDiagonals.map(d => `<td>${diags[d] || 0}</td>`).join('') +
        `<td class="sum-col">${Object.values(diags).reduce((a, b) => a + b, 0)}</td>`;
      tbody.appendChild(row);
    });
  }

  async function updateStats() {
    if (await fetchAndCacheData()) {
      lastDateStr = lastDayFromDb;
      lastFiltered = combinedDataCache.filter(r => normDay(r.date) === lastDateStr);
      displayCombinedStats(lastFiltered);
      displayDiagonalStats(lastFiltered);
    }
  }

  // Заголовок таблицы показывает сегодняшнюю дату
  function refreshTitleDate() {
    if (!titleBusy) $('table-title').textContent = todayStr();
  }

  // Клик по дате: копирует SN оператора KOVALCHYK за последний день
  function copySecret() {
    const title = $('table-title');

    const records = combinedDataCache.filter(r => {
      const isSameDay = normDay(r.date) === lastDateStr;
      return r.inspector === 'KOVALCHYK Y.' &&
             isSameDay &&
             ['OK', 'NDF', 'SCRAP TTL'].includes(r.status) &&
             r.type !== 'MNT';
    });

    const base = todayStr();
    titleBusy = true;
    clearTimeout(titleTimer);

    if (!records.length) {
      title.textContent = t('copyNone');
    } else {
      navigator.clipboard.writeText(records.map(r => r.serial).join('\n'))
        .then(() => { title.textContent = t('copyOk', { n: records.length }); })
        .catch(() => { title.textContent = t('copyErr'); });
    }

    titleTimer = setTimeout(() => {
      titleBusy = false;
      title.textContent = base;
    }, 1500);
  }

  // Одинарный клик по дате — копирование, двойной — полный экран
  function onTitleClick() {
    clearTimeout(clickTimer);
    clickTimer = setTimeout(copySecret, 220);
  }

  function onTitleDblClick() {
    clearTimeout(clickTimer);
    toggleFullscreen();
  }

  // Переключатель поиска: Single / Bulk
  function setMode(mode) {
    bulkMode = mode === 'bulk';
    document.querySelectorAll('#mode-switch button').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    $('search').style.display = bulkMode ? 'none' : 'block';
    $('bulk-input').style.display = bulkMode ? 'block' : 'none';
    $('bulk-actions').style.display = bulkMode ? 'flex' : 'none';
    $('search-result').innerHTML = '';
    resultMode = null;
    searchSeq++;
    (bulkMode ? $('bulk-input') : $('search')).focus();
  }

  /* ----- Скачивание фото по двойному клику на серийном номере (бакет photos в Supabase) ----- */

  function lvSb() {
    if (!window.__lcdrSb) {
      window.__lcdrSb = window.supabase.createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_KEY);
    }
    return window.__lcdrSb;
  }

  let toastTimer = null;
  function lvToast(msg) {
    let el = document.getElementById('lvToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'lvToast';
      el.className = 'lv-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // Файлы в бакете называются ФАМИЛИЯ__серийный.jpg. Ищем по серийному номеру, самый свежий файл первым
  async function downloadPhoto(rawSn) {
    const sn = String(rawSn || '').trim().replace(/[^A-Za-z0-9_-]/g, '');
    if (!sn) return;
    const tail = ('__' + sn + '.jpg').toLowerCase();
    try {
      const sb = lvSb();
      const { data, error } = await sb.storage.from('photos').list('', {
        limit: 1000,
        sortBy: { column: 'updated_at', order: 'desc' }
      });
      if (error) throw error;

      const file = (data || []).find(f => f.name.toLowerCase().endsWith(tail));
      if (!file) { lvToast(t('phNone', { n: sn })); return; }

      const { data: blob, error: e2 } = await sb.storage.from('photos').download(file.name);
      if (e2 || !blob) throw e2 || new Error('empty file');

      const saveName = file.name.split('__')[1] || (sn + '.jpg'); // серийный номер.jpg, как он сохранён
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = saveName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      lvToast(t('phOk', { n: saveName }));

      // Отметка «скачано» для вкладки Photo (таблица photo_downloads). Ошибка отметки не мешает скачиванию
      try { await sb.rpc('mark_photo_downloaded', { p_name: file.name }); } catch (e) {}
    } catch (e) {
      console.error('photo download:', e);
      lvToast(t('phErr'));
    }
  }

  /* ----- Поиск по номеру части (Panel_pn): детали из базы PN (Supabase, таблица pn_base) ----- */

  async function fetchParts(q) {
    const sb = window.__lcdrSb || (window.__lcdrSb = window.supabase.createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_KEY));
    const pat = q.replace(/[\\%_]/g, '\\$&');
    const { data, error } = await sb.from('pn_base')
      .select('id, panel_pn, data, pn, location, info')
      .ilike('panel_pn', pat)
      .order('data', { ascending: false })
      .limit(200);
    if (error) throw error;
    return data;
  }

  // 2026-10-12 -> 12.10.2026
  function fmtDmy(v) {
    const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}.${m[2]}.${m[1]}` : String(v || '');
  }

  function partsHtml(rows) {
    return `<table><thead><tr>
        <th>${escHtml(t('hDate'))}</th><th>PN</th><th>Location</th><th>${escHtml(t('hInfo'))}</th>
      </tr></thead>
      <tbody>${rows.map((r, i) => `
        <tr ${i === 0 ? 'class="latest-record"' : ''}>
          <td>${escHtml(fmtDmy(r.data))}</td><td>${escHtml(r.pn)}</td>
          <td>${escHtml(r.location)}</td><td>${escHtml(r.info)}</td>
        </tr>`).join('')}
      </tbody></table>`;
  }

  /* ----- История ремонта из базы fi_log ----- */

  // "2026-10-25 06:09:04" или "25.10.2026" -> "2026-10-25" (иначе пустая строка)
  function normDay(v) {
    const first = String(v || '').trim().split(' ')[0];
    let m = first.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return first;
    m = first.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
  }

  // Строка fi_log -> запись для страницы
  function dbRowToRecord(r) {
    return {
      date: r.date_raw || '',
      time: (r.time_raw || '').trim(),
      serial: (r.serial || '').trim(),
      type: String(r.repair_type || '').toUpperCase(),
      status: r.status || '',
      name: r.name || '',
      nameG: r.name_final || '',
      ocAfterRepair: r.oc_after || '',
      comment: r.comment || '',
      inspector: INSPECTOR[r.station] || r.station || ''
    };
  }

  // Самые свежие записи сверху
  function sortRecords(list) {
    list.sort((a, b) => {
      const da = normDay(a.date), db = normDay(b.date);
      if (da !== db) return da < db ? 1 : -1;
      return String(b.time || '').localeCompare(String(a.time || ''));
    });
    return list;
  }

  async function fetchHistoryFromDb(serials) {
    const sb = lvSb();
    const rows = [];
    for (let i = 0; i < serials.length; i += 80) {
      const chunk = serials.slice(i, i + 80);
      for (let from = 0; ; from += 1000) {
        const { data, error } = await sb.from('fi_log').select(FI_COLS).in('serial', chunk).order('id').range(from, from + 999);
        if (error) throw error;
        rows.push(...data);
        if (data.length < 1000) break;
      }
    }
    return rows;
  }

  // История по списку серийных номеров: Map серийный номер -> записи (самые свежие первыми).
  // При сбое базы возвращает null.
  async function historyFor(serials) {
    const map = new Map();
    serials.forEach(s => map.set(s, []));
    try {
      const rows = await fetchHistoryFromDb(serials);
      rows.forEach(r => {
        const rec = dbRowToRecord(r);
        const s = rec.serial.toUpperCase();
        if (map.has(s)) map.get(s).push(rec);
      });
    } catch (e) {
      console.error('fi_log history:', e);
      return null;
    }
    map.forEach(list => sortRecords(list));
    return map;
  }

  async function runSingleSearch() {
    const serial = $('search').value.trim().toUpperCase();
    const output = $('search-result');
    if (!serial) { output.innerHTML = ''; resultMode = null; searchSeq++; return; }
    resultMode = 'single';
    const seq = ++searchSeq;

    // 1) серийный номер: история ремонта (база + сегодняшние строки таблицы)
    const hist = await historyFor([serial]);
    if (seq !== searchSeq || resultMode !== 'single') return;
    if (!hist) { output.innerHTML = `<p class="lv-msg">${escHtml(t('loadErr'))}</p>`; return; }
    const matches = hist.get(serial) || [];

    if (matches.length) {
      output.innerHTML = `<table><thead><tr>
          <th>${escHtml(t('hDate'))}</th><th>${escHtml(t('hStatus'))}</th><th>${escHtml(t('hRepairer'))}</th>
          <th>${escHtml(t('hFinal'))}</th><th>${escHtml(t('hInfo'))}</th>
        </tr></thead>
        <tbody>${matches.map((d, i) => `
          <tr ${i === 0 ? 'class="latest-record"' : ''}>
            <td>${escHtml(d.date)}</td><td>${escHtml(d.status)}</td><td>${escHtml(d.name)}</td>
            <td>${escHtml(d.nameG)}</td><td>${escHtml(d.comment)}</td>
          </tr>`).join('')}
        </tbody></table>`;
      return;
    }

    // 2) номер части (Panel_pn): детали из базы PN
    let parts = [];
    try { parts = await fetchParts(serial); } catch (e) { console.error('pn_base:', e); }

    // Пока шёл запрос, пользователь мог начать новый поиск или сменить режим
    if (seq !== searchSeq || resultMode !== 'single') return;

    output.innerHTML = parts.length
      ? partsHtml(parts)
      : `<p class="lv-msg">${escHtml(t('noInfo'))}</p>`;
  }

  async function runBulkSearch() {
    const output = $('search-result');
    const snList = $('bulk-input').value.split('\n').map(s => s.trim().toUpperCase()).filter(s => s !== '');
    if (!snList.length) { output.innerHTML = ''; resultMode = null; searchSeq++; return; }
    resultMode = 'bulk';
    const seq = ++searchSeq;

    const unique = [...new Set(snList)];
    const history = await historyFor(unique);
    if (seq !== searchSeq || resultMode !== 'bulk') return;
    if (!history) { output.innerHTML = `<p class="lv-msg">${escHtml(t('loadErr'))}</p>`; return; }

    const groups = {};
    const notFound = [];

    snList.forEach(sn => {
      const matches = history.get(sn) || [];
      if (matches.length) {
        const record = matches[0];            // самая свежая запись
        const wName = record.name || t('unknown');
        if (!groups[wName]) groups[wName] = [];
        groups[wName].push(record);
      } else {
        notFound.push(sn);
      }
    });

    const sortedNames = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
    let resHtml = '';

    sortedNames.forEach(name => {
      resHtml += `
      <details class="bulk-group">
        <summary><span class="${getUserCustomClass(name)}">${escHtml(name)}</span> — [${groups[name].length}]</summary>
        <table>
          <thead><tr>
            <th>${escHtml(t('hSerial'))}</th><th>${escHtml(t('hDate'))}</th><th>${escHtml(t('hStatus'))}</th>
            <th>${escHtml(t('hFinal'))}</th><th>${escHtml(t('hOc'))}</th><th>${escHtml(t('hInfo'))}</th>
          </tr></thead>
          <tbody>
            ${groups[name].map(r => `
              <tr>
                <td class="lv-sn" data-sn="${escHtml(r.serial)}" title="${escHtml(t('phHint'))}">${escHtml(r.serial)}</td>
                <td>${escHtml(r.date)}</td>
                <td>${escHtml(r.status)}</td>
                <td>${escHtml(r.nameG || ' ')}</td>
                <td>${escHtml(r.ocAfterRepair || ' ')}</td>
                <td>${escHtml(r.comment)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </details>`;
    });

    if (notFound.length) {
      resHtml += `
      <details class="bulk-group bulk-missing">
        <summary>${escHtml(t('notFoundCount', { n: notFound.length }))}</summary>
        <div class="bulk-missing-list">${escHtml(notFound.join(', '))}</div>
      </details>`;
    }

    output.innerHTML = resHtml || `<p class="lv-msg">${escHtml(t('notFound'))}</p>`;
  }

  function onSearchKey(e) {
    if (e.key === 'Enter') runSingleSearch();
  }

  function onBulkKey(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      runBulkSearch();
    }
  }

  function exitFullscreen() {
    $('overview-wrap').classList.remove('fullscreen-mode');
    $('diag-wrap').style.display = '';
    $('search-wrap').style.display = '';
  }

  function toggleFullscreen() {
    const ov = $('overview-wrap');
    if (ov.classList.contains('fullscreen-mode')) {
      exitFullscreen();
    } else {
      ov.classList.add('fullscreen-mode');
      $('diag-wrap').style.display = 'none';
      $('search-wrap').style.display = 'none';
    }
  }

  function closeOverlays() {
    closeModal();
    if ($('overview-wrap').classList.contains('fullscreen-mode')) exitFullscreen();
  }

  function onGlobalKey(e) {
    if (!isVisible()) return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      if (e.key === 'Escape') closeOverlays();
      return;
    }
    if (e.altKey) {
      if (e.code === 'Digit1' || e.key === '1') {
        e.preventDefault();
        toggleBlock('overview-block');
      }
      if (e.code === 'Digit2' || e.key === '2') {
        e.preventDefault();
        $('diag-block').style.display = 'block';
        toggleBlock('diag-block');
      }
    }
    if (e.key === 'Escape') closeOverlays();
  }

  // Перерисовка всего модуля при смене языка сайта
  function refreshLanguage() {
    applyText();
    refreshTitleDate();
    if (lastFiltered.length) {
      displayCombinedStats(lastFiltered);
      displayDiagonalStats(lastFiltered);
    }
    if (resultMode === 'single') runSingleSearch();
    else if (resultMode === 'bulk') runBulkSearch();
  }

  function init() {
    const root = $('livePage');
    if (!root) return;

    try {
      const saved = localStorage.getItem('siteLang');
      if (saved && I18N[saved]) lvLang = saved;
    } catch (e) {}

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    root.innerHTML = MARKUP;

    $('modal-close').onclick = closeModal;
    $('modal').onclick = (e) => { if (e.target === $('modal')) closeModal(); };

    $('table-title').addEventListener('click', onTitleClick);
    $('table-title').addEventListener('dblclick', onTitleDblClick);
    $('overview-title').addEventListener('dblclick', (e) => {
      if (e.target.id !== 'table-title') toggleFullscreen();
    });

    $('combined-table').querySelector('tbody').addEventListener('click', (e) => {
      const td = e.target.closest('.ld-name');
      if (td && td.dataset.name) openModal(td.dataset.name);
    });

    $('overview-title').addEventListener('click', (e) => {
      if (e.target.id !== 'table-title') toggleBlock('overview-block');
    });
    $('diag-block').querySelector('.lv-block-title').addEventListener('click', () => toggleBlock('diag-block'));

    $('mode-switch').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) setMode(b.dataset.mode);
    });
    $('search').addEventListener('keydown', onSearchKey);
    $('bulk-input').addEventListener('keydown', onBulkKey);
    $('bulk-run').onclick = runBulkSearch;

    document.addEventListener('keydown', onGlobalKey, true);

    // Двойной клик по серийному номеру (окно работника, пакетный поиск): скачать фото
    root.addEventListener('dblclick', (e) => {
      const td = e.target.closest && e.target.closest('td.lv-sn');
      if (td && td.dataset.sn) downloadPhoto(td.dataset.sn);
    });

    applyText();
    refreshTitleDate();
    setInterval(refreshTitleDate, 60000);
    initialized = true;
  }

  // Язык задаёт сайт (app.js): window.setLiveLang('uk' | 'ru' | 'pl' | 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'tr')
  window.setLiveLang = function (l) {
    lvLang = I18N[l] ? l : 'en';
    if (initialized) refreshLanguage();
  };

  // Вызывается сайтом (app.js) при открытии вкладки Statistic per day.
  // Данные загружаются при первом открытии, дальше раз в минуту, пока страница открыта.
  window.liveShow = function () {
    if (started) return;
    started = true;
    updateStats();
    setInterval(() => { if (isVisible() && !document.hidden) updateStats(); }, 60000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
