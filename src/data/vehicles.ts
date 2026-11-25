export type Vehicle = {
  id: string
  name: string
  version: string
  year: number
  mileage: number
  price: number
  color: string
  image: string
  gallery: { src: string; caption: string }[]
  wheels: string
  location: string
  warranty: string
  gearbox: string
  badges: string[]
  description: string
  equipment: string[]
}

export const vehicles: Vehicle[] = [
  {
    id: 'studio-silver-2023',
    name: 'AUTO GL Studio Silver',
    version: 'Série 01 · Multi-spoke',
    year: 2023,
    mileage: 24500,
    price: 27900,
    color: 'Studio Silver',
    image: '/media/exterior-polished.png',
    gallery: [
      { src: '/media/exterior-polished.png', caption: 'Studio Silver' },
      { src: '/media/drive-blue.png', caption: 'Groupe motopropulseur' },
      { src: '/media/battery-blue.png', caption: 'Architecture batterie' },
    ],
    wheels: 'Multi-spoke',
    location: 'Lyon 3e',
    warranty: '12 mois',
    gearbox: 'Automatique',
    badges: ['Garantie 12 mois', 'Historique complet'],
    description: "Notre version d'accueil, livrée en Studio Silver avec jantes Multi-spoke. Un véhicule sobre, entretenu selon le plan constructeur et prêt pour un premier essai.",
    equipment: ['Régulateur de vitesse adaptatif', 'Caméra de recul', 'Sièges chauffants', 'Interface numérique 12,3"', 'Chargeur embarqué 11 kW'],
  },
  {
    id: 'electric-green-2024',
    name: 'AUTO GL Electric Green',
    version: 'Série 02 · Multi-spoke',
    year: 2024,
    mileage: 8900,
    price: 32400,
    color: 'Electric Green',
    image: '/media/config/electric-green.png',
    gallery: [
      { src: '/media/config/electric-green.png', caption: 'Electric Green' },
      { src: '/media/battery-blue.png', caption: 'Architecture batterie' },
      { src: '/media/drive-blue.png', caption: 'Groupe motopropulseur' },
    ],
    wheels: 'Multi-spoke',
    location: 'Bordeaux',
    warranty: '12 mois',
    gearbox: 'Automatique',
    badges: ['Faible kilométrage', 'Garantie 12 mois'],
    description: "La teinte la plus vive de la gamme, associée à un faible kilométrage. Idéale pour découvrir la plateforme AUTO GL dans une configuration très proche du neuf.",
    equipment: ['Régulateur de vitesse adaptatif', 'Caméra 360°', 'Sièges chauffants', 'Toit panoramique', 'Chargeur embarqué 11 kW'],
  },
  {
    id: 'lime-green-2022',
    name: 'AUTO GL Lime Green',
    version: 'Série 01 · Multi-spoke',
    year: 2022,
    mileage: 41200,
    price: 24600,
    color: 'Lime Green',
    image: '/media/config/lime-green.png',
    gallery: [
      { src: '/media/config/lime-green.png', caption: 'Lime Green' },
      { src: '/media/drive-blue.png', caption: 'Groupe motopropulseur' },
      { src: '/media/battery-blue.png', caption: 'Architecture batterie' },
    ],
    wheels: 'Multi-spoke',
    location: 'Nantes',
    warranty: '6 mois',
    gearbox: 'Automatique',
    badges: ['Prix doux', 'Historique complet'],
    description: "Une première série en Lime Green, proposée à un tarif d'accès. Kilométrage plus élevé, mais suivi régulier et contrôle technique à jour.",
    equipment: ['Régulateur de vitesse', 'Caméra de recul', 'Climatisation automatique', 'Interface numérique 12,3"'],
  },
  {
    id: 'sky-blue-2023',
    name: 'AUTO GL Sky Blue',
    version: 'Série 01 · Aero Disc',
    year: 2023,
    mileage: 18700,
    price: 28750,
    color: 'Sky Blue',
    image: '/media/config/sky-blue.png',
    gallery: [
      { src: '/media/config/sky-blue.png', caption: 'Sky Blue' },
      { src: '/media/config/wheels-aero.png', caption: 'Jantes Aero Disc' },
      { src: '/media/battery-blue.png', caption: 'Architecture batterie' },
    ],
    wheels: 'Aero Disc',
    location: 'Rennes',
    warranty: '12 mois',
    gearbox: 'Automatique',
    badges: ['Jantes Aero Disc', 'Garantie 12 mois'],
    description: "Une teinte ciel associée aux jantes Aero Disc, pensées pour privilégier la douceur de roulage. Très bon état general, usage principalement urbain.",
    equipment: ['Régulateur de vitesse adaptatif', 'Caméra de recul', 'Sièges chauffants', 'Chargeur embarqué 11 kW'],
  },
  {
    id: 'graphite-2024',
    name: 'AUTO GL Graphite',
    version: 'Série 02 · Multi-spoke',
    year: 2024,
    mileage: 12300,
    price: 31200,
    color: 'Graphite',
    image: '/media/config/graphite.png',
    gallery: [
      { src: '/media/config/graphite.png', caption: 'Graphite' },
      { src: '/media/battery-blue.png', caption: 'Architecture batterie' },
      { src: '/media/drive-blue.png', caption: 'Groupe motopropulseur' },
    ],
    wheels: 'Multi-spoke',
    location: 'Paris',
    warranty: '12 mois',
    gearbox: 'Automatique',
    badges: ['Garantie 12 mois', 'Historique complet'],
    description: "Une finition Graphite discrète et élégante. Véhicule récent, peu roulé, proposé avec l'ensemble de son dossier d'entretien et de ses factures.",
    equipment: ['Caméra 360°', 'Sièges chauffants', 'Toit panoramique', 'Interface numérique 12,3"', 'Chargeur embarqué 11 kW'],
  },
  {
    id: 'silver-aero-2023',
    name: 'AUTO GL Studio Silver',
    version: 'Série 01 · Aero Disc',
    year: 2023,
    mileage: 29800,
    price: 26900,
    color: 'Studio Silver',
    image: '/media/config/wheels-aero.png',
    gallery: [
      { src: '/media/config/wheels-aero.png', caption: 'Jantes Aero Disc' },
      { src: '/media/exterior-polished.png', caption: 'Studio Silver' },
      { src: '/media/drive-blue.png', caption: 'Groupe motopropulseur' },
    ],
    wheels: 'Aero Disc',
    location: 'Lille',
    warranty: '12 mois',
    gearbox: 'Automatique',
    badges: ['Jantes Aero Disc', 'Garantie 12 mois'],
    description: "Configuration Silver et jantes Aero Disc. Un véhicule polyvalent, révision inclus et disponible rapidement pour un essai.",
    equipment: ['Régulateur de vitesse', 'Caméra de recul', 'Climatisation automatique', 'Interface numérique 12,3"'],
  },
  {
    id: 'silver-forged-2022',
    name: 'AUTO GL Studio Silver',
    version: 'Série 01 · Sport Forged',
    year: 2022,
    mileage: 36400,
    price: 25400,
    color: 'Studio Silver',
    image: '/media/config/wheels-forged.png',
    gallery: [
      { src: '/media/config/wheels-forged.png', caption: 'Jantes Sport Forged' },
      { src: '/media/exterior-polished.png', caption: 'Studio Silver' },
      { src: '/media/battery-blue.png', caption: 'Architecture batterie' },
    ],
    wheels: 'Sport Forged',
    location: 'Toulouse',
    warranty: '6 mois',
    gearbox: 'Automatique',
    badges: ['Jantes Sport Forged', 'Prix doux'],
    description: "Le look Sport Forged sur une base Studio Silver. Un choix équilibré pour qui recherche une silhouette plus affirmée sans monter en gamme de prix.",
    equipment: ['Régulateur de vitesse', 'Caméra de recul', 'Sièges chauffants', 'Interface numérique 12,3"'],
  },
  {
    id: 'graphite-forged-2024',
    name: 'AUTO GL Graphite',
    version: 'Série 02 · Sport Forged',
    year: 2024,
    mileage: 6200,
    price: 34800,
    color: 'Graphite',
    image: '/media/config/graphite.png',
    gallery: [
      { src: '/media/config/graphite.png', caption: 'Graphite' },
      { src: '/media/config/wheels-forged.png', caption: 'Jantes Sport Forged' },
      { src: '/media/drive-blue.png', caption: 'Groupe motopropulseur' },
    ],
    wheels: 'Sport Forged',
    location: 'Nice',
    warranty: '12 mois',
    gearbox: 'Automatique',
    badges: ['Faible kilométrage', 'Garantie 12 mois'],
    description: "La configuration la plus aboutie de notre sélection : Graphite, jantes Sport Forged et un kilométrage très contenu. Disponible sur rendez-vous.",
    equipment: ['Caméra 360°', 'Sièges chauffants', 'Toit panoramique', 'Régulateur adaptatif', 'Chargeur embarqué 11 kW'],
  },
]

export const vehicleById = (id: string) => vehicles.find(vehicle => vehicle.id === id)

export const colors = [...new Set(vehicles.map(vehicle => vehicle.color))].sort((a, b) => a.localeCompare(b, 'fr'))
export const wheelOptions = [...new Set(vehicles.map(vehicle => vehicle.wheels))].sort((a, b) => a.localeCompare(b, 'fr'))
export const years = [...new Set(vehicles.map(vehicle => vehicle.year))].sort((a, b) => a - b)
export const maxPrice = Math.max(...vehicles.map(vehicle => vehicle.price))
export const maxMileage = Math.max(...vehicles.map(vehicle => vehicle.mileage))
