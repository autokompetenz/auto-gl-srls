import { Building2, ClipboardList, Mail, MapPin } from 'lucide-react'
import ContactForm from '../components/ContactForm'
import { company, companyAddress, companyLocation } from '../data/company'

export default function Contact() {
  return (
    <div className="page shell contact-page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Nous contacter</p>
          <h1>Parlons de votre prochain véhicule.</h1>
          <p>Une question sur une annonce ou un essai ? Préparez votre demande ci-dessous.</p>
        </div>
      </div>
      <div className="contact-layout">
        <div className="contact-form-card">
          <ContactForm />
        </div>
        <aside className="contact-info">
          <div>
            <MapPin size={20} aria-hidden="true" />
            <h2>Siège et point de vente</h2>
            <p>{company.name}<br />{companyAddress}<br />{companyLocation}</p>
          </div>
          <div>
            <Mail size={20} aria-hidden="true" />
            <h2>Courriel professionnel</h2>
            <p><a href={`mailto:${company.email}`}>{company.email}</a></p>
          </div>
          <div>
            <Building2 size={20} aria-hidden="true" />
            <h2>Disponibilité</h2>
            <p>Accueil sur rendez-vous<br />Demande à préparer avec le formulaire</p>
          </div>
          <div>
            <ClipboardList size={20} aria-hidden="true" />
            <h2>Identification</h2>
            <p>REA {company.rea}<br />Code ATECO {company.ateco}<br />{company.activity}</p>
          </div>
          <p className="contact-note">
            Le formulaire transmet votre demande à notre adresse professionnelle. Les informations légales affichées correspondent à {company.name}.{' '}
            <a href="#/mentions-legales">Voir les mentions légales</a>.
          </p>
        </aside>
      </div>
    </div>
  )
}
