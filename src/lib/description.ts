export type DescriptionBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }

const BULLET = /^(?:[-*•]|\d+[.)])\s+(.*)$/

/**
 * Transforme le texte saisi dans l'admin en blocs lisibles : paragraphes et
 * listes. Rien n'est interprété comme du HTML : le contenu reste du texte.
 *
 * Règles : une ligne = un paragraphe, une ligne vide sépare les blocs,
 * une ligne commençant par `-`, `*`, `•` ou `1.` devient un élément de liste.
 */
export function parseDescription(value: string | undefined | null): DescriptionBlock[] {
  const text = String(value ?? '').replace(/\r\n?/g, '\n').trim()
  if (!text) return []

  const blocks: DescriptionBlock[] = []
  let items: string[] = []

  const flushList = () => {
    if (items.length) {
      blocks.push({ kind: 'list', items })
      items = []
    }
  }

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) {
      flushList()
      continue
    }
    const bullet = line.match(BULLET)
    if (bullet) {
      items.push(bullet[1].trim())
      continue
    }
    flushList()
    blocks.push({ kind: 'paragraph', text: line })
  }
  flushList()
  return blocks
}
