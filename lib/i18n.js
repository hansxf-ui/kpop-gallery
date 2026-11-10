'use client'
import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react'
import { EN } from './i18n-en'

// Pilihan bahasa (fitur 12). Bahasa Indonesia = bawaan & sumber teks; Inggris opsional.
// Teks Indonesia dipakai sebagai kunci kamus — kalau terjemahan belum ada, teks Indonesia
// yang tampil (tidak pernah kosong). Pilihan disimpan di perangkat.
const KEY = 'h2h-lang'
const LangCtx = createContext({ lang: 'id', setLang: () => {} })

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('id') // server & render pertama selalu Indonesia
  useEffect(() => {
    try { if (localStorage.getItem(KEY) === 'en') setLangState('en') } catch {}
  }, [])
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  const setLang = useCallback((l) => {
    const v = l === 'en' ? 'en' : 'id'
    setLangState(v)
    try { localStorage.setItem(KEY, v) } catch {}
  }, [])
  return createElement(LangCtx.Provider, { value: { lang, setLang } }, children)
}

export const useLang = () => useContext(LangCtx)

// t('Teks Indonesia {n}', { n: 3 }) → terjemahan sesuai bahasa aktif, {n} diganti nilainya.
export function translate(lang, text, vars) {
  let s = lang === 'en' && Object.prototype.hasOwnProperty.call(EN, text) ? EN[text] : text
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
  return s
}

export function useT() {
  const { lang } = useContext(LangCtx)
  return useCallback((text, vars) => translate(lang, text, vars), [lang])
}
