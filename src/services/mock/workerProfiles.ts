export interface WorkExperience {
  years: number;
  role: string;
  place: string;
  date: string;
}

export interface WorkerProfileDetail {
  workerId: string;
  area: string;
  languages: string[];
  cuisines: { name: string; years: number }[];
  experience: WorkExperience[];
  email: string;
  verifications: { aadhaar: boolean; phone: boolean; background: boolean };
  willingStates: string[];
}

const DEFAULT: Omit<WorkerProfileDetail, 'workerId'> = {
  area: 'Andheri West',
  languages: ['Hindi', 'English'],
  cuisines: [
    { name: 'North Indian', years: 6 },
    { name: 'Chinese', years: 4 },
    { name: 'Continental', years: 3 },
  ],
  experience: [
    { years: 3, role: 'Senior Cook', place: 'The Spice Route, Mumbai', date: 'Jan 2022 — Present' },
    { years: 2, role: 'Line Cook', place: 'Café Madras, Bangalore', date: 'Jan 2020 — Dec 2021' },
  ],
  email: 'worker@staffbazaar.in',
  verifications: { aadhaar: true, phone: true, background: false },
  willingStates: ['Maharashtra', 'Karnataka', 'Goa'],
};

export function getWorkerProfile(workerId: string): WorkerProfileDetail {
  return { workerId, ...DEFAULT };
}
