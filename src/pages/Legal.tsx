import { company, companyAddress } from '../data/company'

const rows = [
  ['Dénomination', company.name],
  ['Forme juridique', company.legalForm],
  ['Adresse répertoriée', companyAddress],
  ['Ville', company.city],
  ['Province', company.province],
  ['Région', company.region],
  ['Pays', company.country],
  ['Numéro REA', company.rea],
  ['Code ATECO', company.ateco],
  ['Activité associée', company.activity],
  ['Adresse e-mail', company.email],
] as const

export default function Legal() {
  return (
    <div className="page shell legal-page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Informations légales</p>
          <h1>Mentions légales.</h1>
          <p>Identité de l’exploitant et informations d’immatriculation communiquées pour ce site de démonstration.</p>
        </div>
      </div>
      <div className="legal-layout">
        <section className="legal-card" aria-label="Identité de l'exploitant">
          <h2>Exploitant du site</h2>
          <dl>
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <aside className="legal-aside">
          <h2>Catalogue AUTO GL SRLS</h2>
          <p>Les véhicules, prix et disponibilités présentés ici sont des exemples de démonstration. Les formulaires sont traités par l’API ; favoris et comparateur restent locaux à ce navigateur.</p>
          <p>Les visuels utilisés proviennent d’un design study placé sous licence MIT ; voir LICENSE.</p>
          <a className="btn btn-ghost" href="#/contact">Revenir au contact</a>
        </aside>
      </div>
    </div>
  )
}
