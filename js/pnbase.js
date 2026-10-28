/* Страница «PN Base» (база деталей). Данные хранятся в Supabase, таблица public.pn_base:
   id, panel_pn, data (date), pn, location, info.
   Подключение: <script src="js/pnbase.js"></script> ПІСЛЯ js/app.js і JsBarcode (supabase-js уже подключён в index.html).
   Контейнер: <section id="pnbasePage">.
   Мову задає сайт через window.setPnBaseLang(код). Підтримуються 10 мов. */
(function () {
  function init() {
    const page = document.getElementById('pnbasePage');
    if (!page) return;

    const css = `
#pnbaseSection .pb-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
#pnbaseSection .pb-row .form-group { flex: 1; min-width: 150px; }
#pnbaseSection .manual-input-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 10px; }
#pnbaseSection .code-text { font-family: Consolas, 'Courier New', monospace; }
#pnbaseSection .pb-status { font-size: 12px; font-weight: 600; color: #2563EB; margin-top: 8px; }
#pnbaseSection .pb-hint { font-size: 12px; color: #6B7280; margin: 0 0 10px; }
#pnbaseSection #pb_edit { background: #F3F4F6; border: 1px solid #D1D5DB; border-radius: 8px; padding: 14px; margin: 12px 0; }
#pnbaseSection .pb-red { background: #991B1B; }
#pnbaseSection .pb-red:hover { background: #B91C1C; }
#pnbaseSection .pb-print { background: none; border: none; cursor: pointer; font-size: 16px; padding: 2px 6px; border-radius: 4px; }
#pnbaseSection .pb-print:hover { background: #E5E7EB; }
#pnbaseSection .data-table { border-collapse: collapse; width: 100%; font-size: 13px; color: #111827; }
#pnbaseSection .data-table th, #pnbaseSection .data-table td { padding: 8px 12px; border-bottom: 1px solid #E5E7EB; text-align: left; }
#pnbaseSection .data-table th { background: #F3F4F6; color: #374151; font-weight: 600; }
#pnbaseSection .pb-btnrow { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
#pnbaseSection .pb-sync { position: relative; width: 44px; height: 44px; padding: 0; border: none; border-radius: 10px; background: transparent; cursor: pointer; }
#pnbaseSection .pb-sync:hover { background: rgba(255,255,255,.08); }
#pnbaseSection .pb-sync:disabled { opacity: .6; cursor: default; }
#pnbaseSection .pb-sync img.pb-chrome { width: 34px; height: 34px; display: block; margin: 0 auto; }
#pnbaseSection .pb-sync img.pb-badge { position: absolute; right: 1px; bottom: 1px; width: 20px; height: 20px; border-radius: 50%; background: #fff; }
#pnbaseSection .pb-sync.pb-spin img.pb-badge { animation: pbspin 1s linear infinite; }
@keyframes pbspin { to { transform: rotate(360deg); } }
.pb-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 10000; }
.pb-box { background: #1f2b35; border: 1px solid #374151; border-radius: 12px; padding: 20px; max-width: 340px; color: #fff; font-size: 14px; text-align: center; }
.pb-box p { margin: 0 0 16px; }
.pb-box .btn { margin: 0 4px; }`;

    const section = `
<div id="pnbaseSection">
  <div class="manual-input-card">
    <div class="manual-input-title" data-i18n="addTitle">Bulk Add</div>
    <div class="form-group" style="margin-bottom: 12px;">
      <label data-i18n="labelPanelPn">Panel_pn (List, one per line)</label>
      <textarea id="pb_panelPn" class="form-input code-text" rows="3" placeholder="750TBV500S74HHN000&#10;750TBV500S78AHN000..."></textarea>
    </div>
    <div class="pb-row">
      <div class="form-group"><label data-i18n="labelData">DATA</label><input type="date" id="pb_addData" class="form-input"></div>
      <div class="form-group"><label data-i18n="labelPn">PN</label><input type="text" id="pb_addPn" class="form-input code-text" placeholder="203BYQ..."></div>
      <div class="form-group"><label data-i18n="labelLocation">Location</label><input type="text" id="pb_addLocation" class="form-input code-text" placeholder="KUWETA 666"></div>
      <div class="form-group"><label data-i18n="labelInfo">info</label><input type="text" id="pb_addInfo" class="form-input code-text" placeholder="DIFF PLATE 50"></div>
    </div>
    <div class="pb-btnrow">
      <button class="btn" onclick="pb.addBulk()" data-i18n="btnAdd">+ Add List</button>
      <button class="pb-sync" id="pb_syncBtn" type="button" onclick="pb.sync()" data-i18n-title="syncTip" title="Sync with Google Sheets"><img class="pb-chrome" alt="" src="data:image/png;base64,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"><img class="pb-badge" alt="" src="data:image/png;base64,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"></button>
    </div>
    <div id="pb_addStatus" class="pb-status"></div>
  </div>

  <div class="manual-input-card">
    <div class="manual-input-title" data-i18n="searchTitle">Search & Edit</div>
    <div class="pb-row" style="margin-bottom: 6px;">
      <input type="text" id="pb_query" class="form-input code-text" style="flex: 3; min-width: 200px;" data-i18n-placeholder="searchPlaceholder" placeholder="Enter PN or Panel_pn">
      <button class="btn" style="flex: 1;" onclick="pb.search()" data-i18n="btnSearch">Search</button>
    </div>
    <div id="pb_searchStatus" class="pb-status"></div>
    <div id="pb_edit" style="display: none;">
      <div class="manual-input-title" data-i18n="editTitle">Edit Found Rows</div>
      <p class="pb-hint" data-i18n="editHint">Leave the field empty if you don't want to change it.</p>
      <div class="pb-row">
        <div class="form-group"><label data-i18n="labelNewData">New Date</label><input type="date" id="pb_editData" class="form-input"></div>
        <div class="form-group"><label data-i18n="labelNewLocation">New Location</label><input type="text" id="pb_editLocation" class="form-input code-text"></div>
        <div class="form-group"><label data-i18n="labelNewInfo">New info</label><input type="text" id="pb_editInfo" class="form-input code-text"></div>
      </div>
      <button class="btn btn-brand" onclick="pb.update()" data-i18n="btnUpdate">Apply Changes</button>
    </div>
    <button class="btn pb-red" id="pb_dedupeBtn" style="display: none; margin-bottom: 10px;" onclick="pb.dedupe()" data-i18n="btnDedupe">Remove duplicates</button>
    <div style="overflow-x: auto;"><div id="pb_results"></div></div>
  </div>
</div>`;

    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    page.innerHTML = section;

    // ===== логіка бази (Supabase) =====
        const SB_URL = window.APP_CONFIG.SUPABASE_URL;
    const SB_KEY = window.APP_CONFIG.SUPABASE_KEY;
    const TABLE = 'pn_base';
    const COLS = 'id, panel_pn, data, pn, location, info';
    const PAGE_SIZE = 1000;   // Supabase отдаёт максимум 1000 строк за запрос, дальше листаем
    const CHUNK = 200;        // сколько id отправляем в одном запросе на правку или удаление

    const $ = (id) => document.getElementById(id);
    const showToast = (m) => alert(m);
    let results = [], lang = 'en';
    try { lang = localStorage.getItem('pnbase_lang') || 'en'; } catch (e) {}

    function sbc() {
      if (!window.__lcdrSb) window.__lcdrSb = window.supabase.createClient(SB_URL, SB_KEY);
      return window.__lcdrSb;
    }

    const TR = {
      en: {addTitle:"Bulk Add",labelPanelPn:"Panel_pn (List, one per line)",labelData:"DATA",labelPn:"PN",labelLocation:"Location",labelInfo:"info",btnAdd:"+ Add List",searchTitle:"Search & Edit",searchPlaceholder:"Enter PN or Panel_pn",btnSearch:"Search",editTitle:"Edit Found Rows",editHint:"Leave the field empty if you don't want to change it.",labelNewData:"New Date",labelNewLocation:"New Location",labelNewInfo:"New info",btnUpdate:"Apply Changes",statusRecord:"Saving...",statusSearch:"Searching...",statusUpdate:"Updating...",notFound:"Nothing found.",errEnterPn:"Enter at least one Panel_pn",errEnterQuery:"Enter search query",errFillOne:"Fill out at least one field!",confirmUpdate:c=>`Update ${c} rows?`,confirmYes:"Yes",confirmNo:"Cancel",btnDedupe:"Remove duplicates",noDuplicates:"No duplicates.",statusDedupe:"Deleting...",confirmDedupe:c=>`Delete ${c} duplicates? Only the latest entry by date will be kept.`,err:"Error",printTip:"Print label",pasteNoCol:"Customer Model column not found",pasteAdded:c=>`✅ Panel_pn added: ${c}`,msgAdded:c=>`✅ Added rows: ${c}`,msgUpdated:c=>`✅ Updated rows: ${c}`,msgDeleted:c=>`✅ Deleted rows: ${c}`,errNoAccess:"Nothing was changed. Check the access policies of table pn_base in Supabase."},
      uk: {addTitle:"Масове додавання",labelPanelPn:"Panel_pn (Список з нового рядка)",labelData:"DATA",labelPn:"PN",labelLocation:"Location",labelInfo:"info",btnAdd:"+ Додати список",searchTitle:"Пошук та Редагування",searchPlaceholder:"Введіть PN або Panel_pn",btnSearch:"Знайти",editTitle:"Змінити знайдені рядки",editHint:"Залиште поле порожнім, якщо не хочете його змінювати.",labelNewData:"Нова Дата",labelNewLocation:"Нова Локація",labelNewInfo:"Нове info",btnUpdate:"Застосувати зміни",statusRecord:"Запис...",statusSearch:"Пошук...",statusUpdate:"Оновлення...",notFound:"Нічого не знайдено.",errEnterPn:"Введіть хоча б один Panel_pn",errEnterQuery:"Введіть запит",errFillOne:"Заповніть хоча б одне поле!",confirmUpdate:c=>`Оновити ${c} рядків?`,confirmYes:"Так",confirmNo:"Скасувати",btnDedupe:"Видалити дублікати",noDuplicates:"Дублікатів немає.",statusDedupe:"Видалення...",confirmDedupe:c=>`Видалити ${c} дублікатів? Залишиться лише останній запис за датою.`,err:"Помилка",printTip:"Друк етикетки",pasteNoCol:"Колонку Customer Model не знайдено",pasteAdded:c=>`✅ Додано Panel_pn: ${c}`,msgAdded:c=>`✅ Додано рядків: ${c}`,msgUpdated:c=>`✅ Оновлено рядків: ${c}`,msgDeleted:c=>`✅ Видалено рядків: ${c}`,errNoAccess:"Нічого не змінено. Перевірте політики доступу таблиці pn_base у Supabase."},
      ru: {addTitle:"Массовое добавление",labelPanelPn:"Panel_pn (Список с новой строки)",labelData:"DATA",labelPn:"PN",labelLocation:"Location",labelInfo:"info",btnAdd:"+ Добавить список",searchTitle:"Поиск и Редактирование",searchPlaceholder:"Введите PN или Panel_pn",btnSearch:"Найти",editTitle:"Изменить найденные строки",editHint:"Оставьте поле пустым, если не хотите его менять.",labelNewData:"Новая Дата",labelNewLocation:"Новая Локация",labelNewInfo:"Новое info",btnUpdate:"Применить изменения",statusRecord:"Запись...",statusSearch:"Поиск...",statusUpdate:"Обновление...",notFound:"Ничего не найдено.",errEnterPn:"Введите хотя бы один Panel_pn",errEnterQuery:"Введите запрос",errFillOne:"Заполните хотя бы одно поле!",confirmUpdate:c=>`Обновить ${c} строк?`,confirmYes:"Да",confirmNo:"Отмена",btnDedupe:"Удалить дубликаты",noDuplicates:"Дубликатов нет.",statusDedupe:"Удаление...",confirmDedupe:c=>`Удалить ${c} дубликатов? Останется только последняя по дате запись.`,err:"Ошибка",printTip:"Печать этикетки",pasteNoCol:"Колонка Customer Model не найдена",pasteAdded:c=>`✅ Добавлено Panel_pn: ${c}`,msgAdded:c=>`✅ Добавлено строк: ${c}`,msgUpdated:c=>`✅ Обновлено строк: ${c}`,msgDeleted:c=>`✅ Удалено строк: ${c}`,errNoAccess:"Ничего не изменилось. Проверьте политики доступа таблицы pn_base в Supabase."},
      pl: {addTitle:"Masowe dodawanie",labelPanelPn:"Panel_pn (Lista z nowej linii)",labelData:"DATA",labelPn:"PN",labelLocation:"Location",labelInfo:"info",btnAdd:"+ Dodaj listę",searchTitle:"Wyszukiwanie i Edycja",searchPlaceholder:"Wpisz PN lub Panel_pn",btnSearch:"Szukaj",editTitle:"Edytuj znalezione wiersze",editHint:"Pozostaw pole puste, jeśli chcesz je pominąć.",labelNewData:"Nowa Data",labelNewLocation:"Nowa Lokalizacja",labelNewInfo:"Nowe info",btnUpdate:"Zastosuj zmiany",statusRecord:"Zapisywanie...",statusSearch:"Szukanie...",statusUpdate:"Aktualizacja...",notFound:"Nic nie znaleziono.",errEnterPn:"Wprowadź co najmniej jeden Panel_pn",errEnterQuery:"Wprowadź zapytanie",errFillOne:"Wypełnij co najmniej jedno pole!",confirmUpdate:c=>`Zaktualizować ${c} wierszy?`,confirmYes:"Tak",confirmNo:"Anuluj",btnDedupe:"Usuń duplikaty",noDuplicates:"Brak duplikatów.",statusDedupe:"Usuwanie...",confirmDedupe:c=>`Usunąć ${c} duplikatów? Zostanie tylko najnowszy wpis wg daty.`,err:"Błąd",printTip:"Drukuj etykietę",pasteNoCol:"Nie znaleziono kolumny Customer Model",pasteAdded:c=>`✅ Dodano Panel_pn: ${c}`,msgAdded:c=>`✅ Dodano wierszy: ${c}`,msgUpdated:c=>`✅ Zaktualizowano wierszy: ${c}`,msgDeleted:c=>`✅ Usunięto wierszy: ${c}`,errNoAccess:"Nic nie zmieniono. Sprawdź polityki dostępu tabeli pn_base w Supabase."},
      de: {addTitle:"Massenerfassung",labelPanelPn:"Panel_pn (Liste, eine pro Zeile)",labelData:"DATUM",labelPn:"PN",labelLocation:"Standort",labelInfo:"Info",btnAdd:"+ Liste hinzufügen",searchTitle:"Suchen & Bearbeiten",searchPlaceholder:"PN oder Panel_pn eingeben",btnSearch:"Suchen",editTitle:"Gefundene Zeilen bearbeiten",editHint:"Feld leer lassen, wenn es nicht geändert werden soll.",labelNewData:"Neues Datum",labelNewLocation:"Neuer Standort",labelNewInfo:"Neue Info",btnUpdate:"Änderungen übernehmen",statusRecord:"Wird gespeichert...",statusSearch:"Suche läuft...",statusUpdate:"Wird aktualisiert...",notFound:"Nichts gefunden.",errEnterPn:"Bitte mindestens einen Panel_pn eingeben",errEnterQuery:"Bitte Suchbegriff eingeben",errFillOne:"Bitte mindestens ein Feld ausfüllen!",confirmUpdate:c=>`${c} Zeilen aktualisieren?`,confirmYes:"Ja",confirmNo:"Abbrechen",btnDedupe:"Duplikate entfernen",noDuplicates:"Keine Duplikate.",statusDedupe:"Wird gelöscht...",confirmDedupe:c=>`${c} Duplikate löschen? Nur der neueste Eintrag nach Datum bleibt erhalten.`,err:"Fehler",printTip:"Etikett drucken",pasteNoCol:"Spalte Customer Model nicht gefunden",pasteAdded:c=>`✅ Panel_pn hinzugefügt: ${c}`,msgAdded:c=>`✅ Zeilen hinzugefügt: ${c}`,msgUpdated:c=>`✅ Zeilen aktualisiert: ${c}`,msgDeleted:c=>`✅ Zeilen gelöscht: ${c}`,errNoAccess:"Nichts wurde geändert. Zugriffsrichtlinien der Tabelle pn_base in Supabase prüfen."},
      fr: {addTitle:"Ajout en masse",labelPanelPn:"Panel_pn (liste, une par ligne)",labelData:"DATE",labelPn:"PN",labelLocation:"Emplacement",labelInfo:"info",btnAdd:"+ Ajouter la liste",searchTitle:"Recherche et modification",searchPlaceholder:"Saisissez un PN ou Panel_pn",btnSearch:"Rechercher",editTitle:"Modifier les lignes trouvées",editHint:"Laissez le champ vide si vous ne voulez pas le modifier.",labelNewData:"Nouvelle date",labelNewLocation:"Nouvel emplacement",labelNewInfo:"Nouvelle info",btnUpdate:"Appliquer les modifications",statusRecord:"Enregistrement...",statusSearch:"Recherche...",statusUpdate:"Mise à jour...",notFound:"Aucun résultat.",errEnterPn:"Saisissez au moins un Panel_pn",errEnterQuery:"Saisissez une requête",errFillOne:"Remplissez au moins un champ !",confirmUpdate:c=>`Mettre à jour ${c} lignes ?`,confirmYes:"Oui",confirmNo:"Annuler",btnDedupe:"Supprimer les doublons",noDuplicates:"Aucun doublon.",statusDedupe:"Suppression...",confirmDedupe:c=>`Supprimer ${c} doublons ? Seule l'entrée la plus récente sera conservée.`,err:"Erreur",printTip:"Imprimer l'étiquette",pasteNoCol:"Colonne Customer Model introuvable",pasteAdded:c=>`✅ Panel_pn ajouté : ${c}`,msgAdded:c=>`✅ Lignes ajoutées : ${c}`,msgUpdated:c=>`✅ Lignes mises à jour : ${c}`,msgDeleted:c=>`✅ Lignes supprimées : ${c}`,errNoAccess:"Rien n'a été modifié. Vérifiez les politiques d'accès de la table pn_base dans Supabase."},
      es: {addTitle:"Adición masiva",labelPanelPn:"Panel_pn (lista, una por línea)",labelData:"FECHA",labelPn:"PN",labelLocation:"Ubicación",labelInfo:"info",btnAdd:"+ Añadir lista",searchTitle:"Buscar y editar",searchPlaceholder:"Introduzca PN o Panel_pn",btnSearch:"Buscar",editTitle:"Editar filas encontradas",editHint:"Deje el campo vacío si no desea cambiarlo.",labelNewData:"Nueva fecha",labelNewLocation:"Nueva ubicación",labelNewInfo:"Nueva info",btnUpdate:"Aplicar cambios",statusRecord:"Guardando...",statusSearch:"Buscando...",statusUpdate:"Actualizando...",notFound:"No se encontró nada.",errEnterPn:"Introduzca al menos un Panel_pn",errEnterQuery:"Introduzca una consulta",errFillOne:"¡Complete al menos un campo!",confirmUpdate:c=>`¿Actualizar ${c} filas?`,confirmYes:"Sí",confirmNo:"Cancelar",btnDedupe:"Eliminar duplicados",noDuplicates:"No hay duplicados.",statusDedupe:"Eliminando...",confirmDedupe:c=>`¿Eliminar ${c} duplicados? Solo se conservará el registro más reciente por fecha.`,err:"Error",printTip:"Imprimir etiqueta",pasteNoCol:"No se encontró la columna Customer Model",pasteAdded:c=>`✅ Panel_pn añadido: ${c}`,msgAdded:c=>`✅ Filas añadidas: ${c}`,msgUpdated:c=>`✅ Filas actualizadas: ${c}`,msgDeleted:c=>`✅ Filas eliminadas: ${c}`,errNoAccess:"No se cambió nada. Revise las políticas de acceso de la tabla pn_base en Supabase."},
      it: {addTitle:"Aggiunta multipla",labelPanelPn:"Panel_pn (elenco, uno per riga)",labelData:"DATA",labelPn:"PN",labelLocation:"Posizione",labelInfo:"info",btnAdd:"+ Aggiungi elenco",searchTitle:"Cerca e modifica",searchPlaceholder:"Inserisci PN o Panel_pn",btnSearch:"Cerca",editTitle:"Modifica le righe trovate",editHint:"Lascia vuoto il campo se non vuoi modificarlo.",labelNewData:"Nuova data",labelNewLocation:"Nuova posizione",labelNewInfo:"Nuove info",btnUpdate:"Applica modifiche",statusRecord:"Salvataggio...",statusSearch:"Ricerca...",statusUpdate:"Aggiornamento...",notFound:"Nessun risultato.",errEnterPn:"Inserisci almeno un Panel_pn",errEnterQuery:"Inserisci una ricerca",errFillOne:"Compila almeno un campo!",confirmUpdate:c=>`Aggiornare ${c} righe?`,confirmYes:"Sì",confirmNo:"Annulla",btnDedupe:"Rimuovi duplicati",noDuplicates:"Nessun duplicato.",statusDedupe:"Eliminazione...",confirmDedupe:c=>`Eliminare ${c} duplicati? Verrà mantenuta solo la voce più recente per data.`,err:"Errore",printTip:"Stampa etichetta",pasteNoCol:"Colonna Customer Model non trovata",pasteAdded:c=>`✅ Panel_pn aggiunto: ${c}`,msgAdded:c=>`✅ Righe aggiunte: ${c}`,msgUpdated:c=>`✅ Righe aggiornate: ${c}`,msgDeleted:c=>`✅ Righe eliminate: ${c}`,errNoAccess:"Non è stato modificato nulla. Controlla le policy di accesso della tabella pn_base in Supabase."},
      pt: {addTitle:"Adição em massa",labelPanelPn:"Panel_pn (lista, uma por linha)",labelData:"DATA",labelPn:"PN",labelLocation:"Localização",labelInfo:"info",btnAdd:"+ Adicionar lista",searchTitle:"Pesquisar e editar",searchPlaceholder:"Digite PN ou Panel_pn",btnSearch:"Pesquisar",editTitle:"Editar linhas encontradas",editHint:"Deixe o campo vazio se não quiser alterá-lo.",labelNewData:"Nova data",labelNewLocation:"Nova localização",labelNewInfo:"Nova info",btnUpdate:"Aplicar alterações",statusRecord:"Salvando...",statusSearch:"Pesquisando...",statusUpdate:"Atualizando...",notFound:"Nada encontrado.",errEnterPn:"Digite pelo menos um Panel_pn",errEnterQuery:"Digite um termo de pesquisa",errFillOne:"Preencha pelo menos um campo!",confirmUpdate:c=>`Atualizar ${c} linhas?`,confirmYes:"Sim",confirmNo:"Cancelar",btnDedupe:"Remover duplicatas",noDuplicates:"Nenhuma duplicata.",statusDedupe:"Excluindo...",confirmDedupe:c=>`Excluir ${c} duplicatas? Apenas o registro mais recente por data será mantido.`,err:"Erro",printTip:"Imprimir etiqueta",pasteNoCol:"Coluna Customer Model não encontrada",pasteAdded:c=>`✅ Panel_pn adicionado: ${c}`,msgAdded:c=>`✅ Linhas adicionadas: ${c}`,msgUpdated:c=>`✅ Linhas atualizadas: ${c}`,msgDeleted:c=>`✅ Linhas excluídas: ${c}`,errNoAccess:"Nada foi alterado. Verifique as políticas de acesso da tabela pn_base no Supabase."},
      tr: {addTitle:"Toplu ekleme",labelPanelPn:"Panel_pn (satır başına bir tane)",labelData:"TARİH",labelPn:"PN",labelLocation:"Konum",labelInfo:"info",btnAdd:"+ Listeyi ekle",searchTitle:"Ara ve düzenle",searchPlaceholder:"PN veya Panel_pn girin",btnSearch:"Ara",editTitle:"Bulunan satırları düzenle",editHint:"Değiştirmek istemiyorsanız alanı boş bırakın.",labelNewData:"Yeni tarih",labelNewLocation:"Yeni konum",labelNewInfo:"Yeni info",btnUpdate:"Değişiklikleri uygula",statusRecord:"Kaydediliyor...",statusSearch:"Aranıyor...",statusUpdate:"Güncelleniyor...",notFound:"Hiçbir şey bulunamadı.",errEnterPn:"En az bir Panel_pn girin",errEnterQuery:"Arama metni girin",errFillOne:"En az bir alanı doldurun!",confirmUpdate:c=>`${c} satır güncellensin mi?`,confirmYes:"Evet",confirmNo:"İptal",btnDedupe:"Yinelenenleri kaldır",noDuplicates:"Yinelenen yok.",statusDedupe:"Siliniyor...",confirmDedupe:c=>`${c} yinelenen silinsin mi? Tarihe göre yalnızca en son kayıt kalacak.`,err:"Hata",printTip:"Etiketi yazdır",pasteNoCol:"Customer Model sütunu bulunamadı",pasteAdded:c=>`✅ Panel_pn eklendi: ${c}`,msgAdded:c=>`✅ Eklenen satır: ${c}`,msgUpdated:c=>`✅ Güncellenen satır: ${c}`,msgDeleted:c=>`✅ Silinen satır: ${c}`,errNoAccess:"Hiçbir şey değişmedi. Supabase'de pn_base tablosunun erişim politikalarını kontrol edin."}
    };

    const SYNC_TR = {
      en: {syncTip:"Sync with Google Sheets",statusSync:"Syncing...",msgSynced:c=>`✅ Google Sheet updated. Rows: ${c}`,errSyncUrl:"Sync link is not set. Add PNBASE_SYNC_URL to config.js"},
      uk: {syncTip:"Синхронізувати з Google Таблицею",statusSync:"Синхронізація...",msgSynced:c=>`✅ Google Таблицю оновлено. Рядків: ${c}`,errSyncUrl:"Не вказано посилання синхронізації. Додайте PNBASE_SYNC_URL у config.js"},
      ru: {syncTip:"Синхронизировать с Google Таблицей",statusSync:"Синхронизация...",msgSynced:c=>`✅ Google Таблица обновлена. Строк: ${c}`,errSyncUrl:"Не указана ссылка синхронизации. Добавьте PNBASE_SYNC_URL в config.js"},
      pl: {syncTip:"Synchronizuj z Arkuszem Google",statusSync:"Synchronizacja...",msgSynced:c=>`✅ Arkusz Google zaktualizowany. Wierszy: ${c}`,errSyncUrl:"Nie ustawiono linku synchronizacji. Dodaj PNBASE_SYNC_URL w config.js"},
      de: {syncTip:"Mit Google Tabelle synchronisieren",statusSync:"Synchronisierung...",msgSynced:c=>`✅ Google Tabelle aktualisiert. Zeilen: ${c}`,errSyncUrl:"Sync-Link nicht gesetzt. PNBASE_SYNC_URL in config.js hinzufügen"},
      fr: {syncTip:"Synchroniser avec Google Sheets",statusSync:"Synchronisation...",msgSynced:c=>`✅ Google Sheets mis à jour. Lignes : ${c}`,errSyncUrl:"Lien de synchronisation non défini. Ajoutez PNBASE_SYNC_URL dans config.js"},
      es: {syncTip:"Sincronizar con Google Sheets",statusSync:"Sincronizando...",msgSynced:c=>`✅ Hoja de Google actualizada. Filas: ${c}`,errSyncUrl:"No se ha definido el enlace de sincronización. Añada PNBASE_SYNC_URL en config.js"},
      it: {syncTip:"Sincronizza con Fogli Google",statusSync:"Sincronizzazione...",msgSynced:c=>`✅ Foglio Google aggiornato. Righe: ${c}`,errSyncUrl:"Link di sincronizzazione non impostato. Aggiungi PNBASE_SYNC_URL in config.js"},
      pt: {syncTip:"Sincronizar com Planilhas Google",statusSync:"Sincronizando...",msgSynced:c=>`✅ Planilha Google atualizada. Linhas: ${c}`,errSyncUrl:"Link de sincronização não definido. Adicione PNBASE_SYNC_URL em config.js"},
      tr: {syncTip:"Google E-Tablolar ile senkronize et",statusSync:"Senkronize ediliyor...",msgSynced:c=>`✅ Google E-Tablo güncellendi. Satır: ${c}`,errSyncUrl:"Senkronizasyon bağlantısı ayarlanmadı. config.js içine PNBASE_SYNC_URL ekleyin"}
    };
    Object.keys(SYNC_TR).forEach((l) => Object.assign(TR[l], SYNC_TR[l]));
    if (!TR[lang]) lang = 'en';
    const T = () => TR[lang];

    function setLang(l) {
      lang = TR[l] ? l : 'en';
      try { localStorage.setItem('pnbase_lang', lang); } catch (e) {}
      document.querySelectorAll('#pnbaseSection [data-i18n]').forEach((el) => { const v = T()[el.dataset.i18n]; if (v) el.textContent = v; });
      document.querySelectorAll('#pnbaseSection [data-i18n-title]').forEach((el) => { const v = T()[el.dataset.i18nTitle]; if (v) el.title = v; });
      document.querySelectorAll('#pnbaseSection [data-i18n-placeholder]').forEach((el) => { const v = T()[el.dataset.i18nPlaceholder]; if (v) el.placeholder = v; });
      if (results.length) renderTable(results);
    }
    window.setPnBaseLang = setLang;

    function ask(message) {
      return new Promise((resolve) => {
        const o = document.createElement('div'); o.className = 'pb-overlay';
        o.innerHTML = '<div class="pb-box"><p></p><button class="btn" data-y></button><button class="btn btn-secondary" data-n></button></div>';
        o.querySelector('p').textContent = message;
        o.querySelector('[data-y]').textContent = T().confirmYes;
        o.querySelector('[data-n]').textContent = T().confirmNo;
        document.body.appendChild(o);
        const done = (r) => { o.remove(); resolve(r); };
        o.querySelector('[data-y]').onclick = () => done(true);
        o.querySelector('[data-n]').onclick = () => done(false);
        o.addEventListener('click', (e) => { if (e.target === o) done(false); });
      });
    }
    const esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    const fmtDate = (v) => { if (!v) return ''; const s = String(v), m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[3]}.${m[2]}.${m[1]}` : s; };
    const fail = (e) => showToast(T().err + ': ' + (e && e.message ? e.message : e));
    const chunks = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };

    // ===== запросы к Supabase =====
    // Экранируем символы шаблона ilike, чтобы % и _ искались как обычные символы
    const likeEsc = (s) => s.replace(/[\\%_]/g, '\\$&');

    // Все строки, где колонка подходит под шаблон (листаем по 1000 строк)
    async function fetchAll(col, pattern) {
      const out = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await sbc().from(TABLE).select(COLS).ilike(col, pattern).order('id').range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        out.push(...data);
        if (data.length < PAGE_SIZE) break;
      }
      return out;
    }

    // Поиск по PN или Panel_pn (без учёта регистра)
    async function findBy(pattern) {
      const [a, b] = await Promise.all([fetchAll('panel_pn', pattern), fetchAll('pn', pattern)]);
      const map = new Map();
      [...a, ...b].forEach((r) => map.set(r.id, r));
      return [...map.values()].map((r) => ({ ...r, rowNumber: r.id }));
    }

    // ===== друк етикетки 130x90 мм =====
    function printLabels(data, pn, location) {
      let d = data;
      if (!d) { const n = new Date(); d = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; }
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.style.position = 'absolute'; svg.style.visibility = 'hidden';
      document.body.appendChild(svg);
      JsBarcode(svg, String(pn), { format: 'CODE128B', displayValue: false, width: 2, height: 95, margin: 0, lineColor: '#000', background: '#fff' });
      svg.removeAttribute('style'); svg.setAttribute('class', 'print-barcode');
      const bc = svg.outerHTML; document.body.removeChild(svg);
      const blk = (title, val, last) => `<div class="print-block${last ? ' print-block-last' : ''}"><div class="print-title">${title}</div><div class="print-value">${esc(val)}</div></div>`;
      printFrame(`<div class="print-label">${bc}${blk('DATE', fmtDate(d))}${blk('PN', pn)}${blk('LOCATION', location, true)}</div>`);
    }
    function printFrame(labelHtml) {
      const docHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Label</title><style>
@page{size:130mm 90mm;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff}
.print-label{width:130mm;height:90mm;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;padding:6mm 6mm 5mm 6mm;overflow:hidden;break-inside:avoid;page-break-inside:avoid}
.print-block{width:100%;max-width:118mm;margin-bottom:3mm}
.print-block-last{margin-bottom:0}
.print-title{font-size:10pt;font-weight:900;line-height:1;margin-bottom:1.5mm}
.print-value{width:100%;max-width:118mm;font-size:16pt;font-weight:900;line-height:1.1;white-space:normal;overflow:visible;overflow-wrap:anywhere;word-break:break-word}
.print-barcode{display:block;width:118mm !important;max-width:118mm !important;height:26mm !important;margin:0 0 4mm 0}
</style></head><body>${labelHtml}</body></html>`;
      const old = document.getElementById('pbPrintFrame'); if (old) old.remove();
      const f = document.createElement('iframe');
      f.id = 'pbPrintFrame';
      f.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
      document.body.appendChild(f);
      const win = f.contentWindow;
      win.document.open(); win.document.write(docHtml); win.document.close();
      win.onafterprint = () => setTimeout(() => f.remove(), 500);
      setTimeout(() => {
        // якщо текст не влазить: спочатку зменшуємо шрифт, потім штрихкод
        const el = win.document.querySelector('.print-label');
        if (el) {
          const vals = el.querySelectorAll('.print-value'), bar = el.querySelector('.print-barcode');
          let size = 16, scale = 1;
          while (el.scrollHeight > el.clientHeight && (size > 7 || scale > 0.5)) {
            if (size > 7) { size -= 0.5; vals.forEach((v) => { v.style.fontSize = size + 'pt'; }); }
            else { scale -= 0.05; if (bar) bar.style.height = (26 * scale) + 'mm'; }
          }
        }
        win.focus(); win.print();
      }, 250);
    }

    // ===== дії =====
    async function addBulk() {
      const panelPns = $('pb_panelPn').value.trim();
      if (!panelPns) return showToast(T().errEnterPn);
      const data = $('pb_addData').value, pn = $('pb_addPn').value.trim(), location = $('pb_addLocation').value.trim(), info = $('pb_addInfo').value.trim();

      // список Panel_pn: по одному в строке, без пустых и повторов внутри списка
      const list = [...new Set(panelPns.split(/\r?\n/).map((s) => s.trim().toUpperCase()).filter(Boolean))];
      if (!list.length) return showToast(T().errEnterPn);
      const rows = list.map((p) => ({ panel_pn: p, data: data || null, pn: pn || null, location: location || null, info: info || null }));

      $('pb_addStatus').textContent = T().statusRecord;
      try {
        for (const part of chunks(rows, 500)) {
          const { error } = await sbc().from(TABLE).insert(part);
          if (error) throw error;
        }
      } catch (e) {
        $('pb_addStatus').textContent = '';
        return fail(e);
      }
      $('pb_addStatus').textContent = '';
      printLabels(data, pn, location);
      $('pb_panelPn').value = ''; $('pb_addInfo').value = '';
      showToast(T().msgAdded(rows.length));
    }
    async function search() {
      const q = $('pb_query').value.trim();
      if (!q) return showToast(T().errEnterQuery);
      $('pb_searchStatus').textContent = T().statusSearch;
      $('pb_results').innerHTML = '';
      $('pb_edit').style.display = 'none'; $('pb_dedupeBtn').style.display = 'none';
      try {
        // сначала точное совпадение, если ничего нет, то поиск по части текста
        const pat = likeEsc(q);
        let found = await findBy(pat);
        if (!found.length) found = await findBy('%' + pat + '%');
        // сначала самые свежие по дате
        found.sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')) || b.id - a.id);
        results = found;
      } catch (e) {
        $('pb_searchStatus').textContent = '';
        return fail(e);
      }
      $('pb_searchStatus').textContent = '';
      if (results.length) {
        renderTable(results);
        $('pb_edit').style.display = 'block'; $('pb_dedupeBtn').style.display = 'inline-flex';
      } else $('pb_results').innerHTML = `<p class="pb-hint">${T().notFound}</p>`;
    }
    function renderTable(data) {
      const x = T();
      let h = `<table class="data-table"><thead><tr><th></th><th>Panel_pn</th><th>${esc(x.labelData)}</th><th>${esc(x.labelPn)}</th><th>${esc(x.labelLocation)}</th><th>${esc(x.labelInfo)}</th></tr></thead><tbody>`;
      data.forEach((r, i) => {
        h += `<tr><td>${i === 0 ? `<button class="pb-print" data-print="0" title="${esc(x.printTip)}">🖨️</button>` : ''}</td><td class="code-text">${esc(r.panel_pn)}</td><td>${esc(r.data)}</td><td class="code-text">${esc(r.pn)}</td><td>${esc(r.location)}</td><td>${esc(r.info)}</td></tr>`;
      });
      $('pb_results').innerHTML = h + '</tbody></table>';
      const b = $('pb_results').querySelector('[data-print]');
      if (b) b.onclick = () => { const r = results[0]; if (r) printLabels(r.data, r.pn, r.location); };
    }
    async function update() {
      if (!results.length) return;
      const ids = results.map((r) => r.id);
      const nd = $('pb_editData').value, nl = $('pb_editLocation').value.trim(), ni = $('pb_editInfo').value.trim();
      if (!nd && !nl && !ni) return showToast(T().errFillOne);
      if (!(await ask(T().confirmUpdate(ids.length)))) return;

      const patch = {};
      if (nd) patch.data = nd;
      if (nl) patch.location = nl;
      if (ni) patch.info = ni;

      $('pb_searchStatus').textContent = T().statusUpdate;
      let done = 0;
      try {
        for (const part of chunks(ids, CHUNK)) {
          const { data, error } = await sbc().from(TABLE).update(patch).in('id', part).select('id');
          if (error) throw error;
          done += data.length;
        }
      } catch (e) {
        $('pb_searchStatus').textContent = '';
        return fail(e);
      }
      $('pb_searchStatus').textContent = '';
      // 0 строк без ошибки значит, что политики Supabase не разрешили изменение
      if (!done) return showToast(T().errNoAccess);

      const f = results[0];
      printLabels(nd || f.data || '', f.pn || '', nl || f.location || '');
      $('pb_editData').value = ''; $('pb_editLocation').value = ''; $('pb_editInfo').value = '';
      setTimeout(search, 700);
      showToast(T().msgUpdated(done));
    }
    // дублікати: по Panel_pn лишається рядок з найпізнішою датою
    function findDuplicates(rows) {
      const groups = {};
      rows.forEach((r) => { const k = String(r.panel_pn || '').trim().toUpperCase(); if (k) (groups[k] = groups[k] || []).push(r); });
      const del = [];
      Object.values(groups).forEach((g) => {
        if (g.length < 2) return;
        g.sort((a, b) => { const d = String(b.data || '').localeCompare(String(a.data || '')); return d !== 0 ? d : b.id - a.id; });
        g.slice(1).forEach((r) => del.push({ id: r.id, panel_pn: r.panel_pn }));
      });
      return del;
    }
    async function dedupe() {
      const del = findDuplicates(results);
      if (!del.length) return showToast(T().noDuplicates);
      if (!(await ask(T().confirmDedupe(del.length)))) return;
      $('pb_searchStatus').textContent = T().statusDedupe;
      let done = 0;
      try {
        for (const part of chunks(del.map((r) => r.id), CHUNK)) {
          const { data, error } = await sbc().from(TABLE).delete().in('id', part).select('id');
          if (error) throw error;
          done += data.length;
        }
      } catch (e) {
        $('pb_searchStatus').textContent = '';
        return fail(e);
      }
      $('pb_searchStatus').textContent = '';
      if (!done) return showToast(T().errNoAccess);
      showToast(T().msgDeleted(done));
      search();
    }

    // ===== вставка таблиці з QSP у Panel_pn: лишається тільки колонка Customer Model =====
    $('pb_panelPn').addEventListener('paste', (e) => {
      const text = (e.clipboardData || window.clipboardData).getData('Text');
      if (!text || !text.includes('\t')) return; // звичайний список з нового рядка — вставляється як є
      e.preventDefault();

      const rows = text.split(/\r?\n/).map((l) => l.split('\t').map((c) => c.trim()));

      // колонку шукаємо за заголовком "Customer Model"; якщо заголовка немає у виділенні — це 3-тя колонка
      let col = 2;
      for (const r of rows) {
        const i = r.findIndex((c) => c.toLowerCase() === 'customer model');
        if (i !== -1) { col = i; break; }
      }

      const seen = new Set();
      const values = [];
      rows.forEach((r) => {
        const v = (r[col] || '').toUpperCase();
        // тільки схожі на Panel_pn (літери/цифри): відсікає заголовки та службові рядки
        if (/^[A-Z0-9]{8,}$/.test(v) && !seen.has(v)) { seen.add(v); values.push(v); }
      });

      if (!values.length) return showToast(T().pasteNoCol);

      const ta = e.target;
      ta.setRangeText(values.join('\n'), ta.selectionStart, ta.selectionEnd, 'end');
      showToast(T().pasteAdded(values.length));
    });


    // ===== синхронизация с Google Таблицей (Apps Script) =====
    async function sync() {
      const url = window.APP_CONFIG.PNBASE_SYNC_URL;
      if (!url) return showToast(T().errSyncUrl);
      const btn = $('pb_syncBtn');
      btn.disabled = true; btn.classList.add('pb-spin');
      $('pb_addStatus').textContent = T().statusSync;
      try {
        const res = await fetch(url, { method: 'GET' });
        const j = await res.json();
        if (!j.ok) throw new Error(j.error || 'sync failed');
        $('pb_addStatus').textContent = '';
        showToast(T().msgSynced(j.rows));
      } catch (e) {
        $('pb_addStatus').textContent = '';
        fail(e);
      } finally {
        btn.disabled = false; btn.classList.remove('pb-spin');
      }
    }

    window.pb = { addBulk, search, update, dedupe, sync };
    setLang(lang);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
