import { dictionaries } from './dictionaries'
import type { Locale } from './locales'

/** Entrées absentes de l'extraction automatique mais nécessaires aux textes composés. */
const overrides: Record<Locale, Record<string, string>> = {
  it: {
    Italie: 'Italia',
    France: 'Francia',
    Langue: 'Lingua',
    Oui: 'Sì',
    Non: 'No',
    'autrement.': 'in un altro modo.',
    noir: 'nero',
    Noir: 'Nero',
    blanc: 'bianco',
    Blanc: 'Bianco',
    gris: 'grigio',
    Gris: 'Grigio',
    argent: 'argento',
    Argent: 'Argento',
    rouge: 'rosso',
    Rouge: 'Rosso',
    bleu: 'blu',
    Bleu: 'Blu',
    vert: 'verde',
    Vert: 'Verde',
    'Multi-spoke': 'Multi-spoke',
    'Aero Disc': 'Aero Disc',
    'Sport Forged': 'Sport Forged',
    'Studio Silver': 'Studio Silver',
    'Electric Green': 'Electric Green',
    'Lime Green': 'Lime Green',
    'Sky Blue': 'Sky Blue',
    Graphite: 'Graphite',
  },
  fr: {},
  en: {
    Italie: 'Italy',
    France: 'France',
    Langue: 'Language',
    Oui: 'Yes',
    Non: 'No',
    'autrement.': 'differently.',
    noir: 'black',
    Noir: 'Black',
    blanc: 'white',
    Blanc: 'White',
    gris: 'grey',
    Gris: 'Grey',
    argent: 'silver',
    Argent: 'Silver',
    rouge: 'red',
    Rouge: 'Red',
    bleu: 'blue',
    Bleu: 'Blue',
    vert: 'green',
    Vert: 'Green',
  },
  de: {
    Italie: 'Italien',
    France: 'Frankreich',
    Langue: 'Sprache',
    Oui: 'Ja',
    Non: 'Nein',
    'autrement.': 'nur anders.',
    noir: 'schwarz',
    Noir: 'Schwarz',
    blanc: 'weiß',
    Blanc: 'Weiß',
    gris: 'grau',
    Gris: 'Grau',
    argent: 'silbern',
    Argent: 'Silbern',
    rouge: 'rot',
    Rouge: 'Rot',
    bleu: 'blau',
    Bleu: 'Blau',
    vert: 'grün',
    Vert: 'Grün',
  },
  es: {
    Italie: 'Italia',
    France: 'Francia',
    Langue: 'Idioma',
    Oui: 'Sí',
    Non: 'No',
    'autrement.': 'de otra manera.',
    noir: 'negro',
    Noir: 'Negro',
    blanc: 'blanco',
    Blanc: 'Blanco',
    gris: 'gris',
    Gris: 'Gris',
    argent: 'plateado',
    Argent: 'Plateado',
    rouge: 'rojo',
    Rouge: 'Rojo',
    bleu: 'azul',
    Bleu: 'Azul',
    vert: 'verde',
    Vert: 'Verde',
  },
}

const protectedValues = new Set([
  'AUTO GL',
  'AUTO GL SRLS',
  'EUR',
  'IBAN',
  'BIC',
  'REA',
  'ATECO',
  'km',
  'API',
  'SMTP',
  'contatto@autoglsrls.com',
])

type LocaleSet = Record<Exclude<Locale, 'fr'>, string>
const pick = (locale: Locale, values: LocaleSet) => values[locale as Exclude<Locale, 'fr'>]

type Pattern = {
  re: RegExp
  render: (match: RegExpMatchArray, locale: Locale) => string | null
}

const singularPlural = (locale: Locale, count: number, values: Record<Exclude<Locale, 'fr'>, [string, string]>) => {
  const pair = values[locale as Exclude<Locale, 'fr'>]
  return pair[count === 1 ? 0 : 1].replace('{n}', String(count))
}

const patterns: Pattern[] = [
  {
    re: /^(\d+) véhicules? à comparer$/,
    render: (m, locale) => singularPlural(locale, Number(m[1]), {
      it: ['{n} veicolo da confrontare', '{n} veicoli da confrontare'],
      en: ['{n} vehicle to compare', '{n} vehicles to compare'],
      de: ['{n} Fahrzeug zum Vergleichen', '{n} Fahrzeuge zum Vergleichen'],
      es: ['{n} vehículo para comparar', '{n} vehículos para comparar'],
    }),
  },
  {
    re: /^(\d+) véhicules? en favoris$/,
    render: (m, locale) => singularPlural(locale, Number(m[1]), {
      it: ['{n} veicolo nei preferiti', '{n} veicoli nei preferiti'],
      en: ['{n} vehicle in favourites', '{n} vehicles in favourites'],
      de: ['{n} Fahrzeug in Favoriten', '{n} Fahrzeuge in Favoriten'],
      es: ['{n} vehículo en favoritos', '{n} vehículos en favoritos'],
    }),
  },
  {
    re: /^(\d+) véhicules? disponibles?$/,
    render: (m, locale) => singularPlural(locale, Number(m[1]), {
      it: ['{n} veicolo disponibile', '{n} veicoli disponibili'],
      en: ['{n} vehicle available', '{n} vehicles available'],
      de: ['{n} Fahrzeug verfügbar', '{n} Fahrzeuge verfügbar'],
      es: ['{n} vehículo disponible', '{n} vehículos disponibles'],
    }),
  },
  {
    re: /^(\d+)\/(\d+) véhicules$/,
    render: (m, locale) => pick(locale, {
      it: `${m[1]}/${m[2]} veicoli`,
      en: `${m[1]}/${m[2]} vehicles`,
      de: `${m[1]}/${m[2]} Fahrzeuge`,
      es: `${m[1]}/${m[2]} vehículos`,
    }),
  },
  { re: /^Voir : (.+)$/, render: (m, locale) => pick(locale, {
    it: `Vista: ${m[1]}`, en: `View: ${m[1]}`, de: `Ansicht: ${m[1]}`, es: `Vista: ${m[1]}`,
  }) },
  { re: /^Retirer (.+) du comparateur$/, render: (m, locale) => pick(locale, {
    it: `Rimuovi ${m[1]} dal confronto`, en: `Remove ${m[1]} from compare`,
    de: `${m[1]} aus Vergleich entfernen`, es: `Quitar ${m[1]} del comparador`,
  }) },
  { re: /^Ajouter (.+) au comparateur$/, render: (m, locale) => pick(locale, {
    it: `Aggiungi ${m[1]} al confronto`, en: `Add ${m[1]} to compare`,
    de: `${m[1]} zum Vergleich hinzufügen`, es: `Añadir ${m[1]} al comparador`,
  }) },
  { re: /^Retirer (.+) des favoris$/, render: (m, locale) => pick(locale, {
    it: `Rimuovi ${m[1]} dai preferiti`, en: `Remove ${m[1]} from favourites`,
    de: `${m[1]} aus Favoriten entfernen`, es: `Quitar ${m[1]} de favoritos`,
  }) },
  { re: /^Ajouter (.+) aux favoris$/, render: (m, locale) => pick(locale, {
    it: `Aggiungi ${m[1]} ai preferiti`, en: `Add ${m[1]} to favourites`,
    de: `${m[1]} zu Favoriten hinzufügen`, es: `Añadir ${m[1]} a favoritos`,
  }) },
  { re: /^Voir (.+)$/, render: (m, locale) => pick(locale, {
    it: `Vedi ${m[1]}`, en: `View ${m[1]}`, de: `${m[1]} ansehen`, es: `Ver ${m[1]}`,
  }) },
  { re: /^Merci, votre demande concernant (.+) a bien été reçue\. Nous vous répondrons au plus vite\.$/, render: (m, locale) => pick(locale, {
    it: `Grazie, la sua richiesta relativa a ${m[1]} è stata ricevuta. Le risponderemo al più presto.`,
    en: `Thank you, your enquiry about ${m[1]} has been received. We will get back to you shortly.`,
    de: `Vielen Dank, Ihre Anfrage zu ${m[1]} ist eingegangen. Wir melden uns schnellstmöglich.`,
    es: `Gracias, hemos recibido su consulta sobre ${m[1]}. Le responderemos lo antes posible.`,
  }) },
  { re: /^À propos de : (.+)$/, render: (m, locale) => pick(locale, {
    it: `In merito a: ${m[1]}`, en: `About: ${m[1]}`, de: `Betreff: ${m[1]}`, es: `Sobre: ${m[1]}`,
  }) },
  { re: /^\(véhicule : (.+)\)$/, render: (m, locale) => pick(locale, {
    it: `(veicolo: ${m[1]})`, en: `(vehicle: ${m[1]})`, de: `(Fahrzeug: ${m[1]})`, es: `(vehículo: ${m[1]})`,
  }) },
  { re: /^Passée le (.+)$/, render: (m, locale) => pick(locale, {
    it: `Effettuato il ${m[1]}`, en: `Placed on ${m[1]}`, de: `Aufgegeben am ${m[1]}`, es: `Realizado el ${m[1]}`,
  }) },
  { re: /^· quantité (\d+)$/, render: (m, locale) => pick(locale, {
    it: `· quantità ${m[1]}`, en: `· quantity ${m[1]}`, de: `· Menge ${m[1]}`, es: `· cantidad ${m[1]}`,
  }) },
  { re: /^· échéance (\d+)$/, render: (m, locale) => pick(locale, {
    it: `· rata ${m[1]}`, en: `· instalment ${m[1]}`, de: `· Rate ${m[1]}`, es: `· cuota ${m[1]}`,
  }) },
  { re: /^Échéance (\d+)$/, render: (m, locale) => pick(locale, {
    it: `Rata ${m[1]}`, en: `Instalment ${m[1]}`, de: `Rate ${m[1]}`, es: `Cuota ${m[1]}`,
  }) },
  { re: /^Vue (\d+)$/, render: (m, locale) => pick(locale, {
    it: `Vista ${m[1]}`, en: `View ${m[1]}`, de: `Ansicht ${m[1]}`, es: `Vista ${m[1]}`,
  }) },
  { re: /^STEP (\d{1,2})$/i, render: (m, locale) => pick(locale, {
    it: `FASE ${m[1]}`, en: `STEP ${m[1]}`, de: `SCHRITT ${m[1]}`, es: `PASO ${m[1]}`,
  }) },
  { re: /^(\d+) mois$/, render: (m, locale) => pick(locale, {
    it: `${m[1]} mesi`, en: `${m[1]} months`, de: `${m[1]} Monate`, es: `${m[1]} meses`,
  }) },
  { re: /^sur (\d+) mois$/, render: (m, locale) => pick(locale, {
    it: `su ${m[1]} mesi`, en: `over ${m[1]} months`, de: `über ${m[1]} Monate`, es: `durante ${m[1]} meses`,
  }) },
  { re: /^Véhicules signalés jusqu’ici : (\d+)$/, render: (m, locale) => pick(locale, {
    it: `Veicoli segnalati finora: ${m[1]}`, en: `Vehicles reported so far: ${m[1]}`,
    de: `Bisher gemeldete Fahrzeuge: ${m[1]}`, es: `Vehículos notificados hasta ahora: ${m[1]}`,
  }) },
  { re: /^créée le (.+)$/, render: (m, locale) => pick(locale, {
    it: `creata il ${m[1]}`, en: `created on ${m[1]}`, de: `erstellt am ${m[1]}`, es: `creada el ${m[1]}`,
  }) },
  { re: /^Impossible d’obtenir la simulation : (.+)$/, render: (m, locale) => pick(locale, {
    it: `Impossibile ottenere la simulazione: ${m[1]}`, en: `Unable to get the simulation: ${m[1]}`,
    de: `Simulation konnte nicht abgerufen werden: ${m[1]}`, es: `No se pudo obtener la simulación: ${m[1]}`,
  }) },
  { re: /^Requête refusée \((\d+)(.*)\)$/, render: (m, locale) => pick(locale, {
    it: `Richiesta rifiutata (${m[1]}${m[2]})`, en: `Request rejected (${m[1]}${m[2]})`,
    de: `Anfrage abgelehnt (${m[1]}${m[2]})`, es: `Solicitud rechazada (${m[1]}${m[2]})`,
  }) },
  { re: /^Note (\d+) sur 5$/, render: (m, locale) => pick(locale, {
    it: `Valutazione ${m[1]} su 5`, en: `Rating ${m[1]} out of 5`,
    de: `Bewertung ${m[1]} von 5`, es: `Valoración ${m[1]} de 5`,
  }) },
  { re: /^(Modifier|Activer|Désactiver|Supprimer) (.+)$/, render: (m, locale) => {
    const verbs: Record<string, LocaleSet> = {
      Modifier: { it: 'Modifica', en: 'Edit', de: 'Bearbeiten', es: 'Editar' },
      Activer: { it: 'Attiva', en: 'Activate', de: 'Aktivieren', es: 'Activar' },
      Désactiver: { it: 'Disattiva', en: 'Deactivate', de: 'Deaktivieren', es: 'Desactivar' },
      Supprimer: { it: 'Elimina', en: 'Delete', de: 'Löschen', es: 'Eliminar' },
    }
    return `${pick(locale, verbs[m[1]])} ${m[2]}`
  } },
  { re: /^Statut du paiement (.+)$/, render: (m, locale) => pick(locale, {
    it: `Stato del pagamento ${m[1]}`, en: `Payment status ${m[1]}`,
    de: `Zahlungsstatus ${m[1]}`, es: `Estado del pago ${m[1]}`,
  }) },
  { re: /^(.+) : (.+)$/, render: (m, locale) => {
    const left = translateText(m[1], locale)
    if (left === m[1]) return null
    const spacer = locale === 'fr' ? ' : ' : ': '
    return `${left}${spacer}${m[2]}`
  } },
]

function lookup(text: string, locale: Locale): string | undefined {
  if (locale === 'fr') return undefined
  return dictionaries[locale][text] ?? overrides[locale]?.[text]
}

function preserveSurround(source: string, translated: string): string {
  const leading = source.match(/^\s*/)?.[0] ?? ''
  const trailing = source.match(/\s*$/)?.[0] ?? ''
  return `${leading}${translated}${trailing}`
}

/**
 * Traduit un texte affiché. Le français est l'identité.
 * Seuls les libellés connus et les motifs explicites sont traduits : le contenu
 * dynamique (base de données, saisie utilisateur) reste inchangé et ne peut pas
 * être altéré par une sous-chaîne traduite une seconde fois.
 */
export function translateText(text: string, locale: Locale): string {
  if (!text || locale === 'fr' || protectedValues.has(text.trim())) return text
  const trimmed = text.trim()
  if (!trimmed) return text

  const exact = lookup(trimmed, locale)
  if (exact !== undefined) return preserveSurround(text, exact)

  for (const pattern of patterns) {
    const match = trimmed.match(pattern.re)
    if (match) {
      const rendered = pattern.render(match, locale)
      if (rendered !== null && rendered !== undefined) return preserveSurround(text, rendered)
    }
  }

  return text
}
