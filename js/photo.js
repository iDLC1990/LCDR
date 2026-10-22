/* Вкладка «Photo»: снимок с подключённой камеры (USB или встроенной), превью и скачивание.
   Камера включается при открытии вкладки и выключается при уходе с неё.
   Контейнер: <section id="photoPage">. Работает по HTTPS или на localhost. */
(function () {
  const PAGE_ID = 'photoPage';
  const STYLE = `
#photoPage { padding: 1.25rem; overflow: auto; }
#photoPage .ph-wrap { max-width: 960px; margin: 0 auto; padding: 1.25rem; border-radius: 16px;
  background: rgba(8,10,18,0.6); border: 1px solid rgba(255,255,255,0.14); color: #fff;
  box-shadow: 0 8px 30px rgba(0,0,0,0.5); backdrop-filter: blur(8px); }
#photoPage h2 { margin: 0 0 1rem; font-size: 1.15rem; font-weight: 700; color: #c4b5fd; }
#photoPage .ph-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 12px; }
#photoPage select { padding: 8px 10px; background: #111827; color: #fff; border: 1px solid #374151; border-radius: 8px; min-width: 14rem; }
#photoPage .ph-btn { padding: 9px 18px; border: 0; border-radius: 8px; color: #fff; cursor: pointer;
  background: linear-gradient(135deg,#4f46e5,#7c3aed); font-weight: 600; }
#photoPage .ph-btn:disabled { opacity: .4; cursor: not-allowed; }
#photoPage .ph-btn.ghost { background: #374151; }
#photoPage .ph-link { padding: 9px 18px; border-radius: 8px; color: #fff; text-decoration: none;
  background: linear-gradient(135deg,#2563eb,#7c3aed); font-weight: 600; }
#photoPage .ph-stage { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
#photoPage .ph-box { background: #000; border: 1px solid #1f2937; border-radius: 10px; min-height: 200px;
  display: flex; align-items: center; justify-content: center; overflow: hidden; }
#photoPage video, #photoPage img { max-width: 100%; max-height: 60vh; display: block; }
#photoPage .ph-msg { color: #9CA3AF; font-size: 13px; margin-top: 10px; min-height: 1.2em; }
@media (max-width: 800px) { #photoPage .ph-stage { grid-template-columns: 1fr; } }
`;

  const MARKUP = `
<div class="ph-wrap">
  <h2>Photo</h2>
  <div class="ph-bar">
    <select id="ph-cam"></select>
    <button type="button" class="ph-btn" id="ph-snap" disabled>📷 Сделать фото</button>
    <button type="button" class="ph-btn ghost" id="ph-retake" style="display:none">Переснять</button>
    <a class="ph-link" id="ph-download" style="display:none">⬇ Скачать фото</a>
  </div>
  <div class="ph-stage">
    <div class="ph-box"><video id="ph-video" autoplay playsinline muted></video></div>
    <div class="ph-box"><img id="ph-preview" alt="" style="display:none"></div>
  </div>
  <div class="ph-msg" id="ph-msg"></div>
</div>`;

  const $ = (id) => document.getElementById(id);
  let inited = false;
  let stream = null;
  let previewUrl = null;
  let lastBlob = null;

  function msg(text) { $('ph-msg').textContent = text || ''; }

  function stopStream() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    $('ph-video').srcObject = null;
    $('ph-snap').disabled = true;
  }

  // Список камер: USB и встроенные. Подписи видны только после выдачи разрешения
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
    return devices;
  }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      msg('Браузер не поддерживает доступ к камере. Нужен HTTPS или localhost.');
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
      // После разрешения браузер отдаёт полные названия камер
      await fillCameraList();
      msg('');
    } catch (err) {
      msg('Камера недоступна: ' + err.name + ' — ' + err.message);
    }
  }

  function resetPreview() {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
    lastBlob = null;
    $('ph-preview').style.display = 'none';
    $('ph-preview').removeAttribute('src');
    $('ph-download').style.display = 'none';
    $('ph-retake').style.display = 'none';
  }

  function takeShot() {
    const video = $('ph-video');
    if (!stream || !video.videoWidth) { msg('Камера ещё не готова'); return; }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) { msg('Не удалось сохранить снимок'); return; }
      resetPreview();
      lastBlob = blob;
      previewUrl = URL.createObjectURL(blob);
      $('ph-preview').src = previewUrl;
      $('ph-preview').style.display = 'block';
      const a = $('ph-download');
      a.href = previewUrl;
      a.download = `photo_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
      a.style.display = 'inline-block';
      $('ph-retake').style.display = 'inline-block';
      msg('Снимок готов. Нажмите «Скачать фото».');
    }, 'image/jpeg', 0.92);
  }

  function init() {
    const root = $(PAGE_ID);
    if (!root) return;
    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);
    root.innerHTML = MARKUP;

    $('ph-snap').addEventListener('click', takeShot);
    $('ph-retake').addEventListener('click', resetPreview);
    $('ph-cam').addEventListener('change', startCamera);
    inited = true;
  }

  // Вызывается сайтом при открытии вкладки
  window.photoShow = function () {
    if (!inited) return;
    startCamera();
  };

  // Вызывается сайтом при уходе с вкладки
  window.photoHide = function () {
    stopStream();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
