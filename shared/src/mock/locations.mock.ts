import type { LocationState } from '../types';

export const ALL_NIGERIA = 'All Nigeria';

export const STATES: LocationState[] = [
  { name: 'Lagos', lgas: ['Ikeja', 'Lekki', 'Surulere', 'Yaba', 'Ikorodu', 'Alimosho'] },
  { name: 'Abuja (FCT)', lgas: ['Garki', 'Wuse', 'Gwarinpa', 'Maitama', 'Kubwa'] },
  { name: 'Rivers', lgas: ['Port Harcourt', 'Obio-Akpor', 'Trans Amadi'] },
  { name: 'Oyo', lgas: ['Ibadan North', 'Bodija', 'Iwo Road'] },
  { name: 'Kano', lgas: ['Kano Municipal', 'Sabon Gari', 'Fagge'] },
  { name: 'Kaduna', lgas: ['Kaduna North', 'Kaduna South'] },
  { name: 'Ogun', lgas: ['Abeokuta South', 'Sagamu', 'Ijebu Ode'] },
  { name: 'Enugu', lgas: ['Enugu North', 'Enugu South'] },
  { name: 'Delta', lgas: ['Warri South', 'Asaba'] },
  { name: 'Edo', lgas: ['Benin City', 'Egor'] },
  { name: 'Anambra', lgas: ['Awka South', 'Onitsha North'] },
  { name: 'Kwara', lgas: ['Ilorin West', 'Ilorin South'] },
];
