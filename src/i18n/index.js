import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'

export const STORAGE_KEY = 'zivdah-lang'
export const SUPPORTED_LANGUAGES = ['en', 'hi']

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (SUPPORTED_LANGUAGES.includes(stored)) return stored
  } catch {
    // localStorage unavailable (e.g. private browsing) — fall through to browser preference
  }
  return navigator.language?.toLowerCase().startsWith('hi') ? 'hi' : 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: readStoredLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    // best-effort; language still applies for this session even if it can't persist
  }
})

export default i18n
