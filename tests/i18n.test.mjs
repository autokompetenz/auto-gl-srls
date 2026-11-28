import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultLocale, intlLocales, isLocale, localeNames, locales } from '../src/i18n/locales.ts'
import { localizedPath, splitLocale } from '../src/i18n/routing.ts'
import { translateText } from '../src/i18n/translate.ts'

test('l’italien est la langue par défaut et les cinq langues sont disponibles', () => {
  assert.equal(defaultLocale, 'it')
  assert.deepEqual([...locales], ['it', 'fr', 'en', 'de', 'es'])
  assert.deepEqual(localeNames, {
    it: 'Italiano', fr: 'Français', en: 'English', de: 'Deutsch', es: 'Español',
  })
  assert.equal(isLocale('it'), true)
  assert.equal(isLocale('zz'), false)
  assert.equal(isLocale(null), false)
  for (const locale of locales) assert.match(intlLocales[locale], /^[a-z]{2}-[A-Z]{2}$/)
})

test('splitLocale retire le préfixe de langue et gère les slashs finaux', () => {
  assert.deepEqual(splitLocale('/'), { locale: 'it', path: '/' })
  assert.deepEqual(splitLocale('/it/'), { locale: 'it', path: '/' })
  assert.deepEqual(splitLocale('/fr/catalogue/'), { locale: 'fr', path: '/catalogue' })
  assert.deepEqual(splitLocale('/en'), { locale: 'en', path: '/' })
  assert.deepEqual(splitLocale('/de/vehicule/ok-2026'), { locale: 'de', path: '/vehicule/ok-2026' })
  assert.deepEqual(splitLocale('/es/admin/paiements'), { locale: 'es', path: '/admin/paiements' })
  assert.deepEqual(splitLocale('/inconnu/catalogue'), { locale: 'it', path: '/inconnu/catalogue' })
})

test('localizedPath produit des URL propres sans hash', () => {
  assert.equal(localizedPath('it', '/catalogue'), '/catalogue')
  assert.equal(localizedPath('fr', '/catalogue'), '/fr/catalogue')
  assert.equal(localizedPath('de', '/admin/paiements'), '/de/admin/paiements')
  assert.equal(localizedPath('it', '/'), '/')
  assert.equal(localizedPath('es', '/'), '/es')
  for (const locale of locales) {
    for (const path of ['/', '/catalogue', '/suivi/AGL-20261125-ABC123']) {
      const url = localizedPath(locale, path)
      assert.equal(url.includes('#'), false)
      assert.deepEqual(splitLocale(url), { locale, path })
    }
  }
})

test('translateText est idempotente pour tous les libellés et toutes les langues', () => {
  const labels = [
    'Catalogue', 'Commandes', 'Livraison', 'Garantie 12 mois', 'Renseignez votre nom',
    'Argent', 'argent', 'Noir', 'noir', 'Blanc', 'blanc', 'Step 01', 'Voir : Studio Silver',
    '(véhicule : Studio Silver)', 'Langue', 'Oui', 'Non', 'Italie', 'France',
    '· quantité 2', '· échéance 3', 'Vue 4', '5 mois', 'sur 60 mois',
  ]
  for (const locale of locales) {
    for (const label of labels) {
      const once = translateText(label, locale)
      const twice = translateText(once, locale)
      assert.equal(twice, once, `${locale}: ${label} -> ${once} -> ${twice}`)
    }
  }
})

test('translateText ne modifie pas le contenu dynamique ni les valeurs protégées', () => {
  assert.equal(translateText('Peinture noir', 'it'), 'Peinture noir')
  assert.equal(translateText('Un client a commandé une voiture blanche', 'it'), 'Un client a commandé une voiture blanche')
  assert.equal(translateText('Note du vendeur : argent', 'de'), 'Note du vendeur : argent')
  for (const locale of locales) {
    for (const value of ['AUTO GL', 'AUTO GL SRLS', 'EUR', 'IBAN', 'BIC', 'REA', 'ATECO', 'km', 'contatto@autoglsrls.com']) {
      assert.equal(translateText(value, locale), value)
    }
  }
})

test('les motifs composés restent traduits sans fragment global', () => {
  assert.equal(translateText('Step 01', 'it'), 'FASE 01')
  assert.equal(translateText('Step 01', 'en'), 'STEP 01')
  assert.equal(translateText('Voir : Studio Silver', 'it'), 'Vista: Studio Silver')
  assert.equal(translateText('(véhicule : Studio Silver)', 'it'), '(veicolo: Studio Silver)')
  assert.equal(translateText('(véhicule : Studio Silver)', 'es'), '(vehículo: Studio Silver)')
  assert.equal(translateText('Langue', 'it'), 'Lingua')
  assert.equal(translateText('Langue', 'de'), 'Sprache')
  assert.equal(translateText('argent', 'it'), 'argento')
  assert.equal(translateText('blanc', 'es'), 'blanco')
})
