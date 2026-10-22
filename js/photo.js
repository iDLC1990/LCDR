/* Вкладка «Photo»: снимок с камеры сохраняется в Supabase Storage под именем работника
   (например ULANOVYCH.JPG). Ниже список работников со статусом и кнопкой «Скачать».
   Фото живёт 15 минут. Контейнер: <section id="photoPage">. Работает по HTTPS или на localhost. */
(function () {
  const PAGE_ID = 'photoPage';
  const BUCKET = 'photos';
  const SB_URL = 'https://wtqvaeongxncufvpvvge.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cXZhZW9uZ3huY3VmdnB2dmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDM5MjIsImV4cCI6MjEwMjExOTkyMn0.tRsrb29_b9ev3K75npD5zt_Dz9FMltzaRkdK0RPDn-U';
  const LIFE_MS = 15 * 60 * 1000; // срок жизни фото

  // label — как в списке, file — имя файла в бакете
  const WORKERS = [
    { label: 'BŁASZKOWSKA M.', file: 'BLASZKOWSKA.JPG' },
    { label: 'PYNTIA A.',      file: 'PYNTIA.JPG' },
    { label: 'ZAHUBYPALETS K.', file: 'ZAHUBYPALETS.JPG' },
    { label: 'KUKU O.',        file: 'KUKU.JPG' },
    { label: 'NIKOLAIEV D.',   file: 'NIKOLAIEV.JPG' },
    { label: 'YAROSHENKO L.',  file: 'YAROSHENKO.JPG' },
    { label: 'POKALCHUK A.',   file: 'POKALCHUK.JPG' },
    { label: 'HROZDOVA A.',    file: 'HROZDOVA.JPG' },
    { label: 'BUJKO K.',       file: 'BUJKO.JPG' },
    { label: 'ULANOVYCH R.',   file: 'ULANOVYCH.JPG' }
  ];

  const STYLE = `
#photoPage { padding: 1.25rem; overflow: auto; }
#photoPage .ph-wrap { max-width: 960px; margin: 0 auto; padding: 1.25rem; border-radius: 16px;
  background: rgba(8,10,18,0.6); border: 1px solid rgba(255,255,255,0.14); color: #fff;
  box-shadow: 0 8px 30px rgba(0,0,0,0.5); backdrop-filter: blur(8px); }
#photoPage h2 { margin: 0 0 1rem; font-size: 1.15rem; font-weight: 700; color: #c4b5fd; }
#photoPage .ph-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 12px; }
#photoPage select { padding: 8px 10px; background: #111827; color: #fff; border: 1px solid #374151; border-radius: 8px; }
#photoPage #ph-worker { min-width: 13rem; }
#photoPage #ph-cam { min-width: 14rem; }
#photoPage .ph-btn { padding: 9px 18px; border: 0; border-radius: 8px; color: #fff; cursor: pointer;
  background: linear-gradient(135deg,#4f46e5,#7c3aed); font-weight: 600; }
#photoPage .ph-btn:disabled { opacity: .4; cursor: not-allowed; }
#photoPage .ph-btn.ghost { background: #374151; }
#photoPage .ph-link { padding: 9px 18px; border-radius: 8px; color: #fff; text-decoration: none;
  background: linear-gradient(135deg,#2563eb,#7c3aed); font-weight: 600; }
#photoPage .ph-stage { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
#photoPage .ph-box { background: #000; border: 1px solid #1f2937; border-radius: 10px; min-height: 200px;
  display: flex; align-items: center; justify-content: center; overflow: hidden; }
#photoPage video, #photoPage img { max-width: 100%; max-height: 50vh; display: block; }
#photoPage .ph-msg { color: #9CA3AF; font-size: 13px; margin: 10px 0 14px; min-height: 1.2em; }
#photoPage .ph-table { width: 100%; border-collapse: collapse; background: #0e0e0e; border-radius: 8px; overflow: hidden; }
#photoPage .ph-table th, #photoPage .ph-table td { padding: 8px 12px; border-bottom: 1px solid #1f2937; font-size: 13px; text-align: left; }
#photoPage .ph-table th { background: #111827; color: #9CA3AF; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; font-size: 11px; }
#photoPage .ph-table td.ok { color: #4ade80; }
#photoPage .ph-table td.no { color: #6B7280; }
@media (max-width: 800px) { #photoPage .ph-stage { grid-template-columns: 1fr; } }
`;

  const MARKUP = `
<div class="ph-wrap">
  <h2>Photo</h2>
  <div class="ph-bar">
    <select id="ph-worker"></select>
    <select id="ph-cam"></select>
    <button type="button" class="ph-btn" id="ph-snap" disabled>📷 Сделать фото и сохранить</button>
    <button type="button" class="ph-btn ghost" id="ph-retake" style="display:none">Переснять</button>
    <a class="ph-link" id="ph-download" style="display:none">⬇ Скачать фото</a>
  </div>
  <div class="ph-stage">
    <div class="ph-box"><video id="ph-video" autoplay playsinline muted></video></div>
    <div class="ph-box"><img id="ph-preview" alt="" style="display:none"></div>
  </div>
  <div class="ph-msg" id="ph-msg"></div>
  <div class="ph-bar" style="justify-content:space-between">
    <strong style="color:#c4b5fd">Фото работников</strong>
    <button type="button" class="ph-btn ghost" id="ph-refresh">Обновить список</button>
  </div>
  <div id="ph-list"></div>
</div>`;

  const $ = (id) => document.getElementById(id);
  let inited = false;
  let stream = null;
  let previewUrl = null;
  let client = null;

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function msg(text) { $('ph-msg').textContent = text || ''; }

  // Отдельный клиент только для Storage: без сессии и со своим storageKey,
  // чтобы не конфликтовать с другими клиентами Supabase на сайте
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

  function showPreview(blob, fileName) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(blob);
    $('ph-preview').src = previewUrl;
    $('ph-preview').style.display = 'block';
    const a = $('ph-download');
    a.href = previewUrl;
    a.download = fileName;
    a.style.display = 'inline-block';
    $('ph-retake').style.display = 'inline-block';
  }

  function resetPreview() {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
    $('ph-preview').style.display = 'none';
    $('ph-preview').removeAttribute('src');
    $('ph-download').style.display = 'none';
    $('ph-retake').style.display = 'none';
  }

  async function takeShot() {
    const video = $('ph-video');
    if (!stream || !video.videoWidth) { msg('Камера ещё не готова'); return; }

    const worker = WORKERS[+$('ph-worker').value];
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) { msg('Не удалось создать снимок'); return; }

    showPreview(blob, worker.file);
    msg(`Сохраняю ${worker.file}...`);
    $('ph-snap').disabled = true;

    try {
      const { error } = await sb().storage.from(BUCKET).upload(worker.file, blob, {
        upsert: true,
        contentType: 'image/jpeg',
        cacheControl: '0'
      });
      if (error) throw error;
      msg(`Сохранено: ${worker.file}`);
      refreshList();
    } catch (err) {
      msg('Ошибка сохранения: ' + (err.message || err));
    } finally {
      $('ph-snap').disabled = !stream;
    }
  }

  /* ---------- Список работников и скачивание ---------- */

  // Сколько минут осталось до удаления (или -1, если фото просрочено / его нет)
  function minutesLeft(file) {
    if (!file || !file.updated_at) return -1;
    const left = LIFE_MS - (Date.now() - new Date(file.updated_at).getTime());
    return left > 0 ? Math.ceil(left / 60000) : -1;
  }

  async function refreshList() {
    const { data, error } = await sb().storage.from(BUCKET).list('', { limit: 100 });
    if (error) { msg('Ошибка списка: ' + error.message); return; }
    const files = {};
    (data || []).forEach(f => { files[f.name] = f; });

    const rows = WORKERS.map((w, i) => {
      const f = files[w.file];
      const left = minutesLeft(f);
      const alive = left > 0;
      const status = alive ? `✅ ещё ${left} мин` : '— нет';
      return `<tr>
        <td>${esc(w.label)}</td>
        <td>${esc(w.file)}</td>
        <td class="${alive ? 'ok' : 'no'}">${status}</td>
        <td>${alive ? esc(new Date(f.updated_at).toLocaleTimeString()) : ''}</td>
        <td><button type="button" class="ph-btn ghost" data-dl="${i}" ${alive ? '' : 'disabled'}>⬇ Скачать</button></td>
      </tr>`;
    }).join('');

    $('ph-list').innerHTML = `
      <table class="ph-table">
        <thead><tr><th>Работник</th><th>Файл</th><th>Статус</th><th>Снято</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  async function downloadWorker(index) {
    const w = WORKERS[index];
    msg(`Загрузка ${w.file}...`);
    const { data: list } = await sb().storage.from(BUCKET).list('', { search: w.file, limit: 1 });
    const f = (list || []).find(x => x.name === w.file);
    if (minutesLeft(f) <= 0) { msg(`Фото ${w.file} уже удалено или просрочено`); refreshList(); return; }

    const { data, error } = await sb().storage.from(BUCKET).download(w.file);
    if (error || !data) { msg(`Фото ${w.file} не найдено`); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = w.file;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    msg(`Скачано: ${w.file}`);
  }

  /* ---------- Инициализация ---------- */

  function init() {
    const root = $(PAGE_ID);
    if (!root) return;

    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);
    root.innerHTML = MARKUP;

    $('ph-worker').innerHTML = WORKERS
      .map((w, i) => `<option value="${i}">${esc(w.label)} → ${esc(w.file)}</option>`)
      .join('');

    $('ph-snap').addEventListener('click', takeShot);
    $('ph-retake').addEventListener('click', resetPreview);
    $('ph-cam').addEventListener('change', startCamera);
    $('ph-refresh').addEventListener('click', refreshList);
    $('ph-list').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-dl]');
      if (b && !b.disabled) downloadWorker(+b.dataset.dl);
    });

    // Обновляем список раз в 30 секунд, пока открыта вкладка
    setInterval(() => { if (inited && $('ph-list').offsetParent) refreshList(); }, 30000);

    inited = true;
  }

  // Вызывается сайтом при открытии вкладки
  window.photoShow = function () {
    if (!inited) return;
    startCamera();
    refreshList();
  };

  // Вызывается сайтом при уходе с вкладки
  window.photoHide = function () {
    stopStream();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
