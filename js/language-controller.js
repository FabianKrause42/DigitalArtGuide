/**
 * LANGUAGE CONTROLLER
 * ===================
 * Verwaltet die Spracheinstellung der App (DE / EN).
 *
 * - Liest gespeicherte Sprache aus localStorage beim Start
 * - Setzt document.documentElement.lang
 * - Feuert CustomEvent 'languageChanged' bei Sprachänderung
 * - CSS-Regel html[lang="de"] [data-lang="en"] { display:none } übernimmt Rest
 *
 * Verwendung im Template:
 *   <span data-lang="de">Deutsch</span>
 *   <span data-lang="en">English</span>
 *
 * Toggle aufrufen: window.toggleLanguage()
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'appLanguage';
  const DEFAULT_LANG = 'de';

  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  function toggleLanguage() {
    const current = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    const next = current === 'de' ? 'en' : 'de';
    localStorage.setItem(STORAGE_KEY, next);
    applyLang(next);
  }

  function getCurrentLang() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  }

  // Sprache sofort beim Laden anwenden (vor dem Rendern anderer Inhalte)
  applyLang(getCurrentLang());

  window.toggleLanguage = toggleLanguage;
  window.getCurrentLang = getCurrentLang;
}());
