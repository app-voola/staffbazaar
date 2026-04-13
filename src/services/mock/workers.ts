export type WorkerRole = 'chef' | 'helper' | 'captain' | 'bartender' | 'runner' | 'support';
export type Availability = 'now' | 'week' | 'month';

export interface MockWorker {
  id: string;
  name: string;
  role: WorkerRole;
  roleLabel: string;
  city: string;
  availability: Availability;
  experience: number;
  salary: number;
  rating: number;
  phone: string;
  avatar?: string;
  initials: string;
  verified: boolean;
}

export const seedWorkers: MockWorker[] = [
  {
    id: 'w1',
    name: 'Vikram Sharma',
    role: 'chef',
    roleLabel: 'Head Chef',
    city: 'Mumbai',
    availability: 'week',
    experience: 12,
    salary: 45000,
    rating: 4,
    phone: '+919876543220',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop&crop=face',
    initials: 'VS',
    verified: true,
  },
  { id: 'w2', name: 'Ravi Patil', role: 'helper', roleLabel: 'Kitchen Helper', city: 'Bangalore', availability: 'now', experience: 3, salary: 18000, rating: 4, phone: '+919876543221', initials: 'RP', verified: true },
  { id: 'w3', name: 'Ananya Deshmukh', role: 'captain', roleLabel: 'Captain', city: 'Bangalore', availability: 'now', experience: 7, salary: 28000, rating: 4, phone: '+919876543222', initials: 'AD', verified: true },
  { id: 'w4', name: 'Rajesh Kumar', role: 'chef', roleLabel: 'Head Chef', city: 'Bangalore', availability: 'week', experience: 15, salary: 55000, rating: 4, phone: '+919876543223', initials: 'RK', verified: true },
  { id: 'w5', name: 'Abdul Malik', role: 'chef', roleLabel: 'Tandoor Chef', city: 'Hyderabad', availability: 'month', experience: 10, salary: 40000, rating: 4, phone: '+919876543224', initials: 'AM', verified: true },
  { id: 'w6', name: 'Deepak Thakur', role: 'helper', roleLabel: 'Kitchen Helper', city: 'Mumbai', availability: 'now', experience: 1, salary: 14000, rating: 4, phone: '+919876543225', initials: 'DT', verified: true },
  { id: 'w7', name: 'Peter Fernandes', role: 'captain', roleLabel: 'Captain', city: 'Bangalore', availability: 'month', experience: 5, salary: 25000, rating: 4, phone: '+919876543226', initials: 'PF', verified: true },
  { id: 'w8', name: 'Sunita Gupta', role: 'chef', roleLabel: 'Pastry Chef', city: 'Bangalore', availability: 'now', experience: 6, salary: 30000, rating: 4, phone: '+919876543227', initials: 'SG', verified: true },
  { id: 'w9', name: 'Arjun Yadav', role: 'runner', roleLabel: 'Food Runner', city: 'Bangalore', availability: 'now', experience: 2, salary: 16000, rating: 4, phone: '+919876543228', initials: 'AY', verified: true },
  { id: 'w10', name: 'Priya Menon', role: 'captain', roleLabel: 'Captain', city: 'Bangalore', availability: 'week', experience: 4, salary: 22000, rating: 4, phone: '+919876543229', initials: 'PM', verified: true },
  { id: 'w11', name: 'Manoj Sawant', role: 'support', roleLabel: 'Dishwasher', city: 'Bangalore', availability: 'now', experience: 2, salary: 12000, rating: 4, phone: '+919876543230', initials: 'MS', verified: true },
];
