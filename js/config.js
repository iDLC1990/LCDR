/* Общие настройки сайта. Подключается в index.html ПЕРЕД всеми остальными модулями
   (после библиотеки Supabase). Адрес и ключ меняются только здесь.
   Ключ anon публичный по задумке: доступ к данным ограничивают политики (RLS) в Supabase. */
window.APP_CONFIG = {
  NAME: 'LCDR HUB',
  SUPABASE_URL: 'https://wtqvaeongxncufvpvvge.supabase.co',
  SUPABASE_KEY: 'sb_publishable_9Jfx167Q8LCF1746d1apwA_eWNb_qNb',
  PNBASE_SYNC_URL: 'https://script.google.com/macros/s/AKfycbwlKKOfqjM4iz_jIHyOgFjR8VMeIn4srzhtyEN5T6ETU1WFd0lnPsC7NehLbkn2oqPz/exec?token=dd6b736145a641059ffa5eadf21f3b38c46ffe2936be4cd5a5d24b619bbd0bda',
  SHEET_ID: '10W03bvKlVFlIUcxsHkzP_v_13gtnYRBmnrrO0ujB1bU',
  // Таблица Supabase для журнала ошибок со всех устройств (создаётся SQL-запросом, см. health.js). Уберите строку, чтобы журнал хранился только на устройстве
  ERROR_TABLE: 'client_errors'
};
