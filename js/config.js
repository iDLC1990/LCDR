/* Общие настройки сайта. Подключается в index.html ПЕРЕД всеми остальными модулями
   (после библиотеки Supabase). Адрес и ключ меняются только здесь.
   Ключ anon публичный по задумке: доступ к данным ограничивают политики (RLS) в Supabase. */
window.APP_CONFIG = {
  NAME: 'LCDR HUB',
  SUPABASE_URL: 'https://wtqvaeongxncufvpvvge.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cXZhZW9uZ3huY3VmdnB2dmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDM5MjIsImV4cCI6MjEwMjExOTkyMn0.tRsrb29_b9ev3K75npD5zt_Dz9FMltzaRkdK0RPDn-U',
  SHEET_ID: '10W03bvKlVFlIUcxsHkzP_v_13gtnYRBmnrrO0ujB1bU'
};
