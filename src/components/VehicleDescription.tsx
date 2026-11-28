import { parseDescription } from '../lib/description'
import { T } from '../i18n'

export default function VehicleDescription({ value }: { value: string }) {
  const blocks = parseDescription(value)

  if (!blocks.length) {
    return (
      <T>
      <p className="detail-description">Aucune description renseignée pour ce véhicule.</p>
      </T>
    )
  }

  return (
    <T>
    <div className="detail-description">
      {blocks.map((block, index) => block.kind === 'paragraph'
        ? <p key={index}>{block.text}</p>
        : (
          <ul key={index}>
            {block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
          </ul>
        ))}
    </div>
    </T>
  )
}
