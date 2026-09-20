export interface BangaloreLocality {
  id: string
  name: string
  zone: 'Central' | 'South' | 'South-East' | 'East' | 'North' | 'West'
  ward: string
  lat: number
  lng: number
  landmark: string
}

export const BANGALORE_CENTER = { lat: 12.9716, lng: 77.5946 }

export const BANGALORE_ZONES = [
  'All Bengaluru',
  'Central',
  'South',
  'South-East',
  'East',
  'North',
  'West',
] as const

export const BANGALORE_LOCALITIES: BangaloreLocality[] = [
  // Central
  {
    id: 'blr-indiranagar',
    name: 'Indiranagar (100ft Rd & 12th Main)',
    zone: 'Central',
    ward: 'Ward 112 - Domlur / Indiranagar',
    lat: 12.9784,
    lng: 77.6408,
    landmark: 'Near 100ft Road Metro',
  },
  {
    id: 'blr-mg-road',
    name: 'MG Road & Brigade Road',
    zone: 'Central',
    ward: 'Ward 111 - Shantala Nagar',
    lat: 12.9756,
    lng: 77.6068,
    landmark: 'MG Road Metro Station',
  },
  {
    id: 'blr-shivajinagar',
    name: 'Shivajinagar & Commercial Street',
    zone: 'Central',
    ward: 'Ward 92 - Shivajinagar',
    lat: 12.9856,
    lng: 77.6057,
    landmark: 'Russell Market / Bus Stand',
  },
  {
    id: 'blr-ulsoor',
    name: 'Ulsoor / Halasuru',
    zone: 'Central',
    ward: 'Ward 90 - Halasuru',
    lat: 12.9828,
    lng: 77.625,
    landmark: 'Ulsoor Lake Promenade',
  },
  {
    id: 'blr-shanthinagar',
    name: 'Shanthi Nagar & Richmond Town',
    zone: 'Central',
    ward: 'Ward 117 - Shanthi Nagar',
    lat: 12.961,
    lng: 77.5992,
    landmark: 'Shanthinagar Bus Station',
  },

  // South
  {
    id: 'blr-jayanagar',
    name: 'Jayanagar (4th & 9th Block)',
    zone: 'South',
    ward: 'Ward 153 - Jayanagar',
    lat: 12.9308,
    lng: 77.5838,
    landmark: 'Jayanagar Shopping Complex',
  },
  {
    id: 'blr-basavanagudi',
    name: 'Basavanagudi & Gandhi Bazaar',
    zone: 'South',
    ward: 'Ward 154 - Basavanagudi',
    lat: 12.9422,
    lng: 77.576,
    landmark: 'Gandhi Bazaar Circle / Bull Temple',
  },
  {
    id: 'blr-jp-nagar',
    name: 'JP Nagar (Phases 1-7)',
    zone: 'South',
    ward: 'Ward 177 - JP Nagar',
    lat: 12.9063,
    lng: 77.5857,
    landmark: 'Near Sarakki Junction',
  },
  {
    id: 'blr-btm',
    name: 'BTM Layout (1st & 2nd Stage)',
    zone: 'South',
    ward: 'Ward 176 - BTM Layout',
    lat: 12.9166,
    lng: 77.6101,
    landmark: 'Udupi Garden Junction',
  },
  {
    id: 'blr-banashankari',
    name: 'Banashankari (2nd & 3rd Stage)',
    zone: 'South',
    ward: 'Ward 165 - Ganesh Mandir',
    lat: 12.9255,
    lng: 77.5468,
    landmark: 'Banashankari Bus Stand / BDA Complex',
  },

  // South-East
  {
    id: 'blr-koramangala',
    name: 'Koramangala (4th, 5th, 6th Block)',
    zone: 'South-East',
    ward: 'Ward 151 - Koramangala',
    lat: 12.9352,
    lng: 77.6245,
    landmark: 'Sony World Junction / Forum Mall',
  },
  {
    id: 'blr-hsr',
    name: 'HSR Layout (Sectors 1-7)',
    zone: 'South-East',
    ward: 'Ward 174 - HSR Layout',
    lat: 12.9121,
    lng: 77.6446,
    landmark: '27th Main / BDA Complex',
  },
  {
    id: 'blr-bellandur',
    name: 'Bellandur & Outer Ring Road',
    zone: 'South-East',
    ward: 'Ward 150 - Bellandur',
    lat: 12.9304,
    lng: 77.6784,
    landmark: 'EcoSpace / Central Mall ORR',
  },
  {
    id: 'blr-electronic-city',
    name: 'Electronic City (Phase 1 & 2)',
    zone: 'South-East',
    ward: 'Ward 192 - Electronic City Industrial Hub',
    lat: 12.8452,
    lng: 77.6602,
    landmark: 'Toll Plaza / Infosys Gate 1',
  },
  {
    id: 'blr-sarjapur',
    name: 'Sarjapur Road & Carmelaram',
    zone: 'South-East',
    ward: 'Ward 149 - Varthur / Sarjapur Gate',
    lat: 12.9105,
    lng: 77.685,
    landmark: 'Wipro Corporate Office',
  },

  // East
  {
    id: 'blr-whitefield',
    name: 'Whitefield (ITPL & Kadugodi)',
    zone: 'East',
    ward: 'Ward 84 - Hagadur / Whitefield',
    lat: 12.9698,
    lng: 77.7499,
    landmark: 'ITPL Main Gate / Hope Farm Circle',
  },
  {
    id: 'blr-marathahalli',
    name: 'Marathahalli & Kundalahalli',
    zone: 'East',
    ward: 'Ward 85 - Doddanekkundi',
    lat: 12.9591,
    lng: 77.6974,
    landmark: 'Marathahalli Bridge / Multiplex',
  },
  {
    id: 'blr-kr-puram',
    name: 'KR Puram & Tin Factory',
    zone: 'East',
    ward: 'Ward 52 - KR Puram',
    lat: 13.0075,
    lng: 77.6959,
    landmark: 'Hanging Cable Bridge / Railway Station',
  },
  {
    id: 'blr-cv-raman',
    name: 'CV Raman Nagar & Kaggadasapura',
    zone: 'East',
    ward: 'Ward 57 - CV Raman Nagar',
    lat: 12.9854,
    lng: 77.6638,
    landmark: 'DRDO Complex / Bagmane Tech Park',
  },

  // North
  {
    id: 'blr-hebbal',
    name: 'Hebbal & Airport Flyover',
    zone: 'North',
    ward: 'Ward 21 - Hebbal',
    lat: 13.0358,
    lng: 77.597,
    landmark: 'Hebbal Lake / Esteem Mall',
  },
  {
    id: 'blr-yelahanka',
    name: 'Yelahanka (New & Old Town)',
    zone: 'North',
    ward: 'Ward 4 - Yelahanka Satellite Town',
    lat: 13.1007,
    lng: 77.5963,
    landmark: 'Yelahanka Police Station Circle',
  },
  {
    id: 'blr-rt-nagar',
    name: 'RT Nagar & Ganganagar',
    zone: 'North',
    ward: 'Ward 33 - Manorayanapalya',
    lat: 13.0185,
    lng: 77.5939,
    landmark: 'RT Nagar Post Office',
  },
  {
    id: 'blr-kalyan-nagar',
    name: 'Kalyan Nagar & Kammanahalli (HRBR)',
    zone: 'North',
    ward: 'Ward 28 - Kammanahalli',
    lat: 13.0199,
    lng: 77.6468,
    landmark: 'HRBR Layout 80ft Road',
  },

  // West
  {
    id: 'blr-malleshwaram',
    name: 'Malleshwaram (8th Cross & Margosa Rd)',
    zone: 'West',
    ward: 'Ward 45 - Malleshwaram',
    lat: 12.9982,
    lng: 77.5704,
    landmark: 'Near 8th Cross Flower Market',
  },
  {
    id: 'blr-rajajinagar',
    name: 'Rajajinagar (1st Block & Navrang)',
    zone: 'West',
    ward: 'Ward 98 - Prakash Nagar',
    lat: 12.9901,
    lng: 77.5525,
    landmark: 'Navrang Theatre Circle',
  },
  {
    id: 'blr-vijayanagar',
    name: 'Vijayanagar & Chord Road',
    zone: 'West',
    ward: 'Ward 123 - Vijayanagar',
    lat: 12.9719,
    lng: 77.5305,
    landmark: 'Vijayanagar Water Tank / Metro',
  },
  {
    id: 'blr-yeshwanthpur',
    name: 'Yeshwanthpur & APMC Market',
    zone: 'West',
    ward: 'Ward 37 - Yeshwanthpur',
    lat: 13.0238,
    lng: 77.5529,
    landmark: 'Yeshwanthpur Railway Station',
  },
]
