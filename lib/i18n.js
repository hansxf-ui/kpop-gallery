'use client'
import { createContext, createElement, useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react'
import { EN } from './i18n-en'
import { EN_DATA } from './i18n-en-data'
import { LANG_KEY } from './langBoot'

// Pilihan bahasa (fitur 12). Bahasa Indonesia = bawaan & sumber teks; Inggris opsional.
// Teks Indonesia dipakai sebagai kunci kamus — kalau terjemahan belum ada (mis. data jadwal
// baru saja diubah pemilik), teks Indonesia yang tampil: tidak pernah kosong, tidak pernah basi.
//
// Mencegah kilatan bahasa (pengunjung EN sempat melihat teks Indonesia):
//   1. Skrip kecil di <head> (app/layout.js, LANG_BOOT_SCRIPT di lib/langBoot.js) membaca pilihan tersimpan SEBELUM
//      halaman tampil. Untuk EN: <html lang="en" data-lang="en" class="lang-pending">, dan CSS
//      `html.lang-pending body { visibility: hidden }` menahan tampilan.
//   2. LangProvider membaca data-lang di useLayoutEffect (setelah hidrasi, SEBELUM browser
//      menggambar), merender ulang dalam EN, lalu melepas kelas lang-pending.
//   3. Pengaman: skrip melepas lang-pending sendiri setelah 3 detik kalau JS gagal/lambat.
// Server tetap merender bahasa Indonesia (SEO & crawler tidak berubah) dan tidak ada
// hydration mismatch, karena render pertama di klien juga Indonesia.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
const LangCtx = createContext({ lang: 'id', setLang: () => {} })

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('id') // server & render pertama selalu Indonesia
  const [booted, setBooted] = useState(false)
  // Baca pilihan tersimpan setelah hidrasi, sebelum browser menggambar. Kedua setState
  // digabung jadi satu render ulang, jadi lang-pending baru dilepas setelah teks sudah EN.
  useIsoLayoutEffect(() => {
    let stored = document.documentElement.getAttribute('data-lang')
    if (!stored) { try { stored = localStorage.getItem(LANG_KEY) } catch {} }
    if (stored === 'en') setLangState('en')
    setBooted(true)
  }, [])
  useIsoLayoutEffect(() => {
    if (!booted) return
    const d = document.documentElement
    d.lang = lang
    d.setAttribute('data-lang', lang)
    d.classList.remove('lang-pending')
  }, [lang, booted])
  const setLang = useCallback((l) => {
    const v = l === 'en' ? 'en' : 'id'
    setLangState(v)
    try { localStorage.setItem(LANG_KEY, v) } catch {}
  }, [])
  return createElement(LangCtx.Provider, { value: { lang, setLang } }, children)
}

export const useLang = () => useContext(LangCtx)
export const localeOf = (lang) => (lang === 'en' ? 'en-GB' : 'id-ID')
export const useLocale = () => localeOf(useContext(LangCtx).lang)

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k)

// t('Teks Indonesia {n}', { n: 3 }) → terjemahan sesuai bahasa aktif, {n} diganti nilainya.
// Nilai kamus boleh berupa fungsi (vars) => teks, untuk bentuk tunggal/jamak bahasa Inggris.
export function translate(lang, text, vars) {
  let s = text
  if (lang === 'en' && typeof text === 'string') {
    const v = has(EN, text) ? EN[text] : has(EN_DATA, text) ? EN_DATA[text] : undefined
    if (typeof v === 'function') s = v(vars || {})
    else if (typeof v === 'string') s = v
  }
  if (vars && typeof s === 'string') for (const [k, val] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(val))
  return s
}

export function useT() {
  const { lang } = useContext(LangCtx)
  return useCallback((text, vars) => translate(lang, text, vars), [lang])
}

// Judul tab ikut bahasa aktif. Metadata server (Open Graph, judul awal) tetap Indonesia.
export function useDocTitle(text, vars) {
  const t = useT()
  const judul = text ? t(text, vars) : null
  useEffect(() => {
    document.title = judul ? `${judul} · Hearts2Hearts Gallery` : 'Hearts2Hearts Gallery'
  }, [judul])
}
