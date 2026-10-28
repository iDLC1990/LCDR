/* Общие настройки сайта. Подключается в index.html ПЕРЕД всеми остальными модулями
   (после библиотеки Supabase). Адрес и ключ меняются только здесь.
   Ключ anon публичный по задумке: доступ к данным ограничивают политики (RLS) в Supabase. */
window.APP_CONFIG = {
  NAME: 'LCDR HUB',
  SUPABASE_URL: 'https://wtqvaeongxncufvpvvge.supabase.co',
  SUPABASE_KEY: 'sb_publishable_9Jfx167Q8LCF1746d1apwA_eWNb_qNb',
  PNBASE_SYNC_URL: 'https://script.google.com/macros/s/AKfycbzpWwuxYNeY7qe3v-XqVnRjk6xUMXuNcjVsw2ML2RXYync0dY-2S0P5_m8uvsBHvlfX/exec',
  SHEET_ID: '10W03bvKlVFlIUcxsHkzP_v_13gtnYRBmnrrO0ujB1bU'
};
