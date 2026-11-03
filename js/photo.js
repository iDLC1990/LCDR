/* Вкладка «Photo»: нажимаешь фамилию работника, сканируешь серийный номер ТВ и делаешь фото.
   Файл сохраняется в Supabase Storage (бакет photos) как ФАМИЛИЯ__серийный.jpg,
   а в списке и при скачивании показывается как серийный.jpg (например tpfdg341234.jpg).
   Фото хранится, пока его не удалят кнопкой «Удалить» (или «Удалить все»).
   Контейнер: <section id="photoPage">. Работает по HTTPS или на localhost.
   Для удаления в Supabase нужна политика на storage.objects (см. инструкцию). */
(function () {
  const PAGE_ID = 'photoPage';
  const BUCKET = 'photos';
  const SB_URL = window.APP_CONFIG.SUPABASE_URL;
  const SB_KEY = window.APP_CONFIG.SUPABASE_KEY;

  // Работники берутся из рабочей таблицы Final II (вкладка WORKERS_SHEET, столбец F), за последние WORKERS_DAYS дней.
  // key — ключ в имени файла (фамилия латиницей без диакритики), label — как на кнопке.
  const WORKERS_SHEET = 'FI Station 2 ULANOVYCH.R';
  const WORKERS_COL = 5;
  const WORKERS_DAYS = 7;
  const WORKERS_CACHE_KEY = 'ph_workers_v1';

  // Прежний список: нужен, чтобы подписать старые фото и как запасной вариант, если таблица недоступна
  const LEGACY_WORKERS = [
    { key: 'BLASZKOWSKA',  label: 'BŁASZKOWSKA M.' },
    { key: 'PYNTIA',       label: 'PYNTIA A.' },
    { key: 'ZAHUBYPALETS', label: 'ZAHUBYPALETS K.' },
    { key: 'KUKU',         label: 'KUKU O.' },
    { key: 'NIKOLAIEV',    label: 'NIKOLAIEV D.' },
    { key: 'YAROSHENKO',   label: 'YAROSHENKO L.' },
    { key: 'POKALCHUK',    label: 'POKALCHUK A.' },
    { key: 'HROZDOVA',     label: 'HROZDOVA A.' },
    { key: 'BUJKO',        label: 'BUJKO K.' },
    { key: 'ULANOVYCH',    label: 'ULANOVYCH R.' }
  ];
  let WORKERS = LEGACY_WORKERS.slice();

  const STYLE = `
#photoPage { padding: 1.25rem; overflow: auto; }
#photoPage .ph-wrap { max-width: 1000px; margin: 0 auto; padding: 1.25rem; border-radius: 16px;
  background: rgba(8,10,18,0.6); border: 1px solid rgba(255,255,255,0.14); color: #fff;
  box-shadow: 0 8px 30px rgba(0,0,0,0.5); backdrop-filter: blur(8px); }
#photoPage h2 { margin: 0 0 1rem; font-size: 1.15rem; font-weight: 700; color: #c4b5fd; }
#photoPage .ph-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 12px; }
#photoPage select, #photoPage input { padding: 9px 10px; background: #111827; color: #fff; border: 1px solid #374151; border-radius: 8px; }
#photoPage #ph-cam { min-width: 14rem; }
#photoPage #ph-serial { min-width: 18rem; font-size: 16px; letter-spacing: .03em; }
#photoPage .ph-auto { margin: -2px 0 10px 0; font-size: 13px; color: #9CA3AF; }
#photoPage .ph-auto.warn { color: #fbbf24; }
#photoPage .ph-workers { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
#photoPage .ph-w { padding: 9px 14px; border: 1px solid #374151; border-radius: 8px; background: #111827;
  color: #e5e7eb; cursor: pointer; font-weight: 600; }
#photoPage .ph-w:hover { border-color: #7c3aed; }
#photoPage .ph-w.sel { background: linear-gradient(135deg,#4f46e5,#7c3aed); border-color: transparent; color: #fff; }
#photoPage .ph-btn { padding: 9px 18px; border: 0; border-radius: 8px; color: #fff; cursor: pointer;
  background: linear-gradient(135deg,#4f46e5,#7c3aed); font-weight: 600; }
#photoPage .ph-btn:disabled { opacity: .4; cursor: not-allowed; }
#photoPage .ph-btn.ghost { background: #374151; }
#photoPage .ph-btn.danger { background: #991B1B; }
#photoPage .ph-btn.danger:hover { background: #B91C1C; }
#photoPage .ph-stage { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
#photoPage .ph-box { background: #000; border: 1px solid #1f2937; border-radius: 10px; min-height: 200px;
  display: flex; align-items: center; justify-content: center; overflow: hidden; }
#photoPage video, #photoPage img { max-width: 100%; max-height: 50vh; display: block; }
#photoPage .ph-msg { color: #9CA3AF; font-size: 13px; margin: 10px 0 14px; min-height: 1.2em; }
#photoPage .ph-table { width: 100%; border-collapse: collapse; background: #0e0e0e; border-radius: 8px; overflow: hidden; }
#photoPage .ph-table th, #photoPage .ph-table td { padding: 8px 12px; border-bottom: 1px solid #1f2937; font-size: 13px; text-align: left; }
#photoPage .ph-table th { background: #111827; color: #9CA3AF; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; font-size: 11px; }
#photoPage .ph-table td.acts { display: flex; gap: 8px; justify-content: flex-end; }
#photoPage .ph-done { color: #4ade80; font-size: 18px; font-weight: 700; text-align: center; }
#photoPage .ph-empty { color: #6B7280; font-size: 13px; padding: 10px 2px; }
@media (max-width: 800px) { #photoPage .ph-stage { grid-template-columns: 1fr; } }
`;

  const MARKUP = `
<div class="ph-wrap">
  <h2>Photo</h2>
  <div class="ph-workers" id="ph-workers"></div>
  <div class="ph-bar">
    <input type="text" id="ph-serial" placeholder="Серийный номер (из Repair Log или сканер)" autocomplete="off" spellcheck="false">
    <select id="ph-cam"></select>
    <button type="button" class="ph-btn" id="ph-snap" disabled>📷 Сделать фото и сохранить</button>
    <button type="button" class="ph-btn ghost" id="ph-retake" style="display:none">Скрыть снимок</button>
  </div>
  <div class="ph-auto" id="ph-auto"></div>
  <div class="ph-stage">
    <div class="ph-box"><video id="ph-video" autoplay playsinline muted></video></div>
    <div class="ph-box"><img id="ph-preview" alt="" style="display:none"></div>
  </div>
  <div class="ph-msg" id="ph-msg"></div>
  <div class="ph-bar" style="justify-content:space-between">
    <strong style="color:#c4b5fd">Фото (хранятся, пока не удалишь)</strong>
    <div class="ph-bar" style="margin:0">
      <button type="button" class="ph-btn ghost" id="ph-refresh">Обновить список</button>
      <button type="button" class="ph-btn danger" id="ph-delall">Удалить все</button>
    </div>
  </div>
  <div id="ph-list"></div>
</div>`;

  const $ = (id) => document.getElementById(id);
  let inited = false;
  let stream = null;
  let previewUrl = null;
  let client = null;
  let selected = null; // выбранный работник (объект из WORKERS)
  let listed = [];     // имена файлов, которые сейчас показаны в списке
  let autoSn = '';       // последний серийный номер из Repair Log
  let autoInfo = '';     // дата и время этой записи
  let autoState = 'wait'; // wait | ok | none | err
  let manualSn = false;  // номер введён или отсканирован вручную: автоподстановка его не перезаписывает
  const RL_QUEUE_KEY = 'rl_queue_v1'; // записи Repair Log, ещё не отправленные в базу (нет связи)

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function msg(text) { $('ph-msg').textContent = text || ''; }

  // Отдельный клиент для вкладки Photo (без сессии), чтобы не конфликтовать с другими клиентами сайта
  function sb() {
    if (!client) {
      client = window.supabase.createClient(SB_URL, SB_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: 'sb-photo-tab'
        }
      });
    }
    return client;
  }

  // На телефоне курсор в поле не ставим: иначе при каждом действии выезжает клавиатура
  function focusSerial() {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (!coarse) $('ph-serial').focus();
  }

  /* ---------- Серийный номер из Repair Log ---------- */

  // Самая свежая запись Repair Log. Неотправленные записи этого устройства новее базы
  async function latestRepairSn() {
    try {
      const q = JSON.parse(localStorage.getItem(RL_QUEUE_KEY) || '[]');
      if (q.length) { const r = q[q.length - 1]; return { sn: r.sn, when: ((r.date || '') + ' ' + (r.time || '')).trim() }; }
    } catch (e) {}
    const res = await Promise.race([
      sb().from('repair_log').select('panel_sn,repair_date,repair_time').order('id', { ascending: false }).limit(1),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000))
    ]);
    if (res.error) throw res.error;
    const r = res.data && res.data[0];
    return r ? { sn: r.panel_sn, when: ((r.repair_date || '') + ' ' + (r.repair_time || '')).trim() } : null;
  }

  function showAuto() {
    const el = $('ph-auto');
    if (!el) return;
    let text = '', warn = false;
    if (manualSn) text = 'Номер введён вручную. Очистите поле, чтобы брать номер из Repair Log.';
    else if (autoState === 'ok') text = 'Из Repair Log: ' + autoSn + (autoInfo ? ' (' + autoInfo + ')' : '');
    else if (autoState === 'none') { text = 'В Repair Log ещё нет записей.'; warn = true; }
    else if (autoState === 'err') { text = 'Не удалось получить номер из Repair Log. Введите номер вручную.'; warn = true; }
    el.textContent = text;
    el.className = 'ph-auto' + (warn ? ' warn' : '');
  }

  async function refreshAuto() {
    try {
      const r = await latestRepairSn();
      autoSn = r ? cleanSerial(r.sn) : '';
      autoInfo = r ? r.when : '';
      autoState = autoSn ? 'ok' : 'none';
      if (!manualSn) $('ph-serial').value = autoSn;
    } catch (e) {
      autoState = 'err';
    }
    showAuto();
  }

  // Серийный номер: только буквы, цифры, _ и -
  function cleanSerial(v) {
    return String(v || '').trim().replace(/[^A-Za-z0-9_-]/g, '');
  }

  /* ---------- Работники ---------- */

  // «BŁASZKOWSKA M.» -> BLASZKOWSKA (первое слово, без диакритики)
  function workerKey(label) {
    const folded = String(label || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/Ł/g, 'L').replace(/ł/g, 'l').toUpperCase();
    const m = /[A-Z]+/.exec(folded);
    return m ? m[0] : '';
  }

  function labelForKey(key) {
    const w = WORKERS.find(x => x.key === key) || LEGACY_WORKERS.find(x => x.key === key);
    return w ? w.label : key;
  }

  // Дата строки таблицы: 02.11.2026 13:00:30 или 2026-11-02 ... -> число для сравнения
  function rowDay(v) {
    const first = String(v || '').trim().split(/\s+/)[0];
    let m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(first);
    if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1]);
    m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(first);
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
    return null;
  }

  // Из строк вкладки: уникальные имена за последние WORKERS_DAYS дней (от последней даты в таблице)
  function workersFromRows(rows) {
    const data = (rows || []).slice(1).map(r => ({ day: rowDay(r[0]), name: String(r[WORKERS_COL] || '').trim() }))
      .filter(x => x.day !== null && x.name);
    if (!data.length) return [];
    const last = Math.max.apply(null, data.map(x => x.day));
    const from = last - (WORKERS_DAYS - 1) * 86400000;
    const byKey = {};
    data.filter(x => x.day >= from).forEach(x => {
      const key = workerKey(x.name);
      if (!key) return;
      // Если один человек записан по-разному («ANNA STAROZHYLOVA» и «STAROZHYLOVA A.»), оставляем форму «ФАМИЛИЯ И.»
      const cur = byKey[key];
      if (!cur || (!/\.$/.test(cur.label) && /\.$/.test(x.name))) byKey[key] = { key, label: x.name };
    });
    // Запись «ИМЯ ФАМИЛИЯ» убираем, если её фамилия уже есть отдельной кнопкой
    const keys = Object.keys(byKey);
    keys.forEach(k => {
      const lab = byKey[k].label;
      if (/\.$/.test(lab)) return;
      const other = lab.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Ł/g, 'L').replace(/ł/g, 'l').toUpperCase().match(/[A-Z]+/g) || [];
      if (other.some(t => t !== k && byKey[t] && /\.$/.test(byKey[t].label))) delete byKey[k];
    });
    return Object.keys(byKey).map(k => byKey[k]).sort((a, b) => a.label.localeCompare(b.label));
  }

  function applyWorkers(list) {
    if (!list.length) return false;
    const key = selected && selected.key;
    WORKERS = list;
    selected = key ? (WORKERS.find(w => w.key === key) || null) : null;
    renderWorkers();
    return true;
  }

  // Загрузка списка работников: таблица -> (при сбое) последний сохранённый список -> прежний список
  async function loadWorkers() {
    try {
      const rows = await window.LCDR_SHEETS.rows(WORKERS_SHEET);
      const list = workersFromRows(rows);
      if (list.length) {
        try { localStorage.setItem(WORKERS_CACHE_KEY, JSON.stringify(list)); } catch (e) {}
        applyWorkers(list);
        return;
      }
    } catch (e) {}
    try {
      const cached = JSON.parse(localStorage.getItem(WORKERS_CACHE_KEY) || '[]');
      if (cached.length) { applyWorkers(cached); return; }
    } catch (e) {}
    applyWorkers(LEGACY_WORKERS.slice());
  }

  function renderWorkers() {
    $('ph-workers').innerHTML = WORKERS
      .map((w, i) => `<button type="button" class="ph-w${selected === w ? ' sel' : ''}" data-w="${i}">${esc(w.label)}</button>`)
      .join('');
  }

  function selectWorker(i) {
    selected = WORKERS[i];
    renderWorkers();
    msg(`Работник: ${selected.label}. Серийный номер берётся из Repair Log.`);
    focusSerial();
  }

  /* ---------- Камера ---------- */

  function stopStream() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    $('ph-video').srcObject = null;
    $('ph-snap').disabled = true;
  }

  async function fillCameraList() {
    const sel = $('ph-cam');
    const current = sel.value;
    const devices = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
    sel.innerHTML = '';
    devices.forEach((d, i) => {
      const opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || `Камера ${i + 1}`;
      sel.appendChild(opt);
    });
    if (current && devices.some(d => d.deviceId === current)) sel.value = current;
  }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      msg('Браузер не поддерживает камеру. Нужен HTTPS или localhost.');
      return;
    }
    stopStream();
    msg('Подключение камеры...');
    const deviceId = $('ph-cam').value;
    const constraints = {
      audio: false,
      video: deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
        : { width: { ideal: 1920 }, height: { ideal: 1080 } }
    };
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      $('ph-video').srcObject = stream;
      await $('ph-video').play().catch(() => {});
      $('ph-snap').disabled = false;
      await fillCameraList();
      msg('');
    } catch (err) {
      msg('Камера недоступна: ' + err.name + ' — ' + err.message);
    }
  }

  /* ---------- Снимок и сохранение ---------- */

  function showPreview(blob) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(blob);
    $('ph-preview').src = previewUrl;
    $('ph-preview').style.display = 'block';
    $('ph-retake').style.display = 'inline-block';
  }

  function resetPreview() {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
    $('ph-preview').style.display = 'none';
    $('ph-preview').removeAttribute('src');
    $('ph-retake').style.display = 'none';
  }

  async function takeShot() {
    if (!selected) { msg('Сначала нажми фамилию работника'); return; }

    const video = $('ph-video');
    if (!stream || !video.videoWidth) { msg('Камера ещё не готова'); return; }

    // Кадр снимаем сразу при нажатии
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) { msg('Не удалось создать снимок'); return; }

    // Серийный номер: введённый вручную, иначе самый свежий из Repair Log
    if (!manualSn) await refreshAuto();
    const serial = cleanSerial($('ph-serial').value);
    if (serial.length < 3) {
      msg('Нет серийного номера: добавьте запись в Repair Log или введите номер вручную');
      focusSerial();
      return;
    }

    const objectName = `${selected.key}__${serial}.jpg`;
    showPreview(blob);
    msg(`Сохраняю ${serial}.jpg...`);
    $('ph-snap').disabled = true;

    try {
      const { error } = await sb().storage.from(BUCKET).upload(objectName, blob, {
        upsert: true,
        contentType: 'image/jpeg',
        cacheControl: '0'
      });
      if (error) throw error;
      msg(`Сохранено: ${serial}.jpg (${selected.label})`);
      manualSn = false;
      refreshAuto();
      focusSerial();
      refreshList();
    } catch (err) {
      msg('Ошибка сохранения: ' + (err.message || err));
    } finally {
      $('ph-snap').disabled = !stream;
    }
  }

  /* ---------- Список, скачивание и удаление ---------- */

  // ФАМИЛИЯ__серийный.jpg -> { worker, serial }
  function parseName(name) {
    const m = /^([A-Z]+)__([A-Za-z0-9_-]+)\.jpg$/.exec(name);
    if (!m) return null;
    return { worker: labelForKey(m[1]), serial: m[2] };
  }

  async function refreshList() {
    const { data, error } = await sb().storage.from(BUCKET).list('', {
      limit: 1000,
      sortBy: { column: 'updated_at', order: 'desc' }
    });
    if (error) { msg('Ошибка списка: ' + error.message); return; }

    const items = (data || [])
      .map(f => ({ f, p: parseName(f.name) }))
      .filter(x => x.p);
    listed = items.map(x => x.f.name);

    // Отметки «скачано» (таблица photo_downloads). Если таблицы нет, отметок просто не будет
    const downloaded = {};
    if (items.length) {
      try {
        const { data: dd } = await sb().from('photo_downloads')
          .select('file_name, downloaded_at')
          .in('file_name', listed);
        (dd || []).forEach(r => { downloaded[r.file_name] = r.downloaded_at; });
      } catch (e) {}
    }

    const rows = items.map(x => {
      // Галочка, если фото скачали уже после того, как оно было снято (повторный снимок сбрасывает отметку)
      const d = downloaded[x.f.name];
      const done = d && x.f.updated_at && new Date(d) > new Date(x.f.updated_at);
      const mark = done ? `<span title="Скачано: ${esc(new Date(d).toLocaleString())}">✔</span>` : '';
      return `<tr>
        <td>${esc(x.p.worker)}</td>
        <td>${esc(x.p.serial)}.jpg</td>
        <td>${esc(x.f.updated_at ? new Date(x.f.updated_at).toLocaleString() : '')}</td>
        <td class="ph-done">${mark}</td>
        <td class="acts">
          <button type="button" class="ph-btn ghost" data-dl="${esc(x.f.name)}">⬇ Скачать</button>
          <button type="button" class="ph-btn danger" data-del="${esc(x.f.name)}">🗑 Удалить</button>
        </td>
      </tr>`;
    }).join('');

    $('ph-list').innerHTML = rows
      ? `<table class="ph-table">
          <thead><tr><th>Работник</th><th>Файл</th><th>Снято</th><th style="text-align:center">Скачано</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`
      : '<div class="ph-empty">Сейчас нет фото</div>';
    $('ph-delall').disabled = !listed.length;
  }

  async function downloadFile(name) {
    const p = parseName(name);
    if (!p) return;
    const fileName = p.serial + '.jpg';
    msg(`Загрузка ${fileName}...`);

    const { data, error } = await sb().storage.from(BUCKET).download(name);
    if (error || !data) { msg(`Фото ${fileName} не найдено`); refreshList(); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    msg(`Скачано: ${fileName}`);
    try { await sb().rpc('mark_photo_downloaded', { p_name: name }); } catch (e) {}
    refreshList();
  }

  // Удаляет файлы из хранилища. Если ни один файл не удалён, значит, нет политики на удаление
  async function removeFiles(names) {
    const { data, error } = await sb().storage.from(BUCKET).remove(names);
    if (error) throw error;
    if (!data || !data.length) throw new Error('файл не удалён: проверь политику удаления в Supabase');
    return data.length;
  }

  async function deleteFile(name) {
    const p = parseName(name);
    if (!p) return;
    try {
      await removeFiles([name]);
      msg(`Удалено: ${p.serial}.jpg`);
    } catch (err) {
      msg('Ошибка удаления: ' + (err.message || err));
    }
    refreshList();
  }

  async function deleteAll() {
    if (!listed.length) return;
    if (!confirm(`Удалить все фото (${listed.length} шт.)? Это нельзя отменить.`)) return;
    try {
      const n = await removeFiles(listed.slice());
      msg(`Удалено фото: ${n}`);
    } catch (err) {
      msg('Ошибка удаления: ' + (err.message || err));
    }
    refreshList();
  }

  /* ---------- Инициализация ---------- */

  function init() {
    const root = $(PAGE_ID);
    if (!root) return;

    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);
    root.innerHTML = MARKUP;
    renderWorkers();
    loadWorkers();

    $('ph-workers').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-w]');
      if (b) selectWorker(+b.dataset.w);
    });
    // Сканер печатает номер и нажимает Enter — по Enter сразу делаем фото
    $('ph-serial').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); takeShot(); }
    });
    // Любой ввод вручную (в том числе сканером) отключает автоподстановку; пустое поле возвращает её
    $('ph-serial').addEventListener('input', () => {
      const v = cleanSerial($('ph-serial').value);
      manualSn = v !== '' && v !== autoSn;
      if (v === '') refreshAuto(); else showAuto();
    });
    $('ph-snap').addEventListener('click', takeShot);
    $('ph-retake').addEventListener('click', resetPreview);
    $('ph-cam').addEventListener('change', startCamera);
    $('ph-refresh').addEventListener('click', refreshList);
    $('ph-delall').addEventListener('click', deleteAll);
    $('ph-list').addEventListener('click', (e) => {
      const dl = e.target.closest('button[data-dl]');
      if (dl) { downloadFile(dl.dataset.dl); return; }
      const del = e.target.closest('button[data-del]');
      if (del) deleteFile(del.dataset.del);
    });

    // Обновляем список раз в 30 секунд, пока открыта вкладка (чтобы видеть фото коллеги)
    setInterval(() => { if (inited && $('ph-list').offsetParent && !document.hidden) refreshList(); }, 30000);
    // Свежий номер из Repair Log подтягиваем каждые 5 секунд, пока открыта вкладка
    setInterval(() => { if (inited && $('ph-serial').offsetParent && !document.hidden && !manualSn) refreshAuto(); }, 5000);

    inited = true;
  }

  // Вызывается сайтом при открытии вкладки
  window.photoShow = function () {
    if (!inited) return;
    startCamera();
    refreshList();
    refreshAuto();
    loadWorkers();
    focusSerial();
  };

  // Вызывается сайтом при уходе с вкладки
  window.photoHide = function () {
    stopStream();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
