// Dipakai app/layout.js (server) — sengaja BUKAN modul 'use client': konstanta dari modul klien
// tidak bisa dibaca komponen server (yang diterima hanya referensi klien, bukan nilainya).
// Penjelasan cara kerja ada di lib/i18n.js.
export const LANG_KEY = 'h2h-lang'
export const LANG_BOOT_SCRIPT =
  "try{if(localStorage.getItem('h2h-lang')==='en'){var d=document.documentElement;d.lang='en';d.setAttribute('data-lang','en');d.classList.add('lang-pending');setTimeout(function(){d.classList.remove('lang-pending')},3000)}}catch(e){}"
export const LANG_BOOT_STYLE = 'html.lang-pending body{visibility:hidden}'
