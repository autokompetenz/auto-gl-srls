import { company, companyAddress } from '../data/company'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div className="footer-brand">
          <span className="footer-wordmark">AUTO GL SRLS</span>
          <p>Électrique, autrement. Catalogue de véhicules d’occasion présenté par {company.name}.</p>
        </div>
        <div className="footer-group">
          <h2>Explorer</h2>
          <a href="#/catalogue">Catalogue</a>
          <a href="#/favoris">Favoris</a>
          <a href="#/comparateur">Comparateur</a>
          <a href="#/simulation">Simulation</a>
          <a href="#/contact">Nous contacter</a>
        </div>
        <div className="footer-group">
          <h2>Commandes et administration</h2>
          <a href="#/suivi">Suivre une commande</a>
          <a href="#/admin">Administration</a>
          <a href="#/mentions-legales">Mentions légales</a>
        </div>
        <div className="footer-group">
          <h2>Informations</h2>
          <span>REA {company.rea} · ATECO {company.ateco}</span>
          <span>Prix affichés en EUR</span>
          <span>Commandes, alertes et administration via l’API</span>
        </div>
      </div>
      <div className="shell footer-baseline">
        <span>{company.name} · {companyAddress}</span>
        <span>Design original publié sous licence MIT · Amir Mušić</span>
      </div>
    </footer>
  )
}
