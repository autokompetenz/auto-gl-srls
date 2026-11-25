export const company = {
  name: 'AUTO GL SRLS',
  legalForm: 'Società a responsabilità limitata semplificata (SRLS)',
  address: 'Viale degli Artigiani, 44',
  postalCode: '71122',
  city: 'Foggia',
  province: 'Foggia (FG)',
  region: 'Pouilles (Puglia)',
  country: 'Italie',
  rea: 'FG-330819',
  ateco: '45.11.01',
  activity: 'Commerce de gros et de détail de voitures et de véhicules automobiles légers.',
  email: 'contatto@autoglsrls.com',
} as const

export const companyAddress = `${company.address}, ${company.postalCode} ${company.city} (FG), ${company.country}`
export const companyLocation = `${company.city} (FG), ${company.region}, ${company.country}`
