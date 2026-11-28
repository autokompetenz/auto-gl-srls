import { Children, cloneElement, isValidElement, type ReactNode } from 'react'
import { useLocale } from './LocaleContext'

const translatableProps = new Set([
  'placeholder',
  'aria-label',
  'title',
  'alt',
  'label',
  'content',
  'summary',
  'abbr',
  'aria-description',
  'aria-placeholder',
])

function translateNode(node: ReactNode, t: (text: string) => string): ReactNode {
  if (typeof node === 'string') return t(node)
  if (Array.isArray(node)) return Children.map(node, child => translateNode(child, t))
  if (!isValidElement(node)) return node

  const props = node.props as Record<string, unknown>
  const nextProps: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue
    nextProps[key] = typeof value === 'string' && translatableProps.has(key) ? t(value) : value
  }

  if ('children' in props) {
    nextProps.children = Children.map(props.children as ReactNode, child => translateNode(child, t))
  }

  return cloneElement(node, nextProps)
}

/** Traduit récursivement les textes et attributs affichés d'un sous-arbre React. */
export default function T({ children }: { children?: ReactNode }) {
  const { t } = useLocale()
  return <>{translateNode(children, t)}</>
}
