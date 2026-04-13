export type ApplicantStage = 'applied' | 'shortlisted' | 'called' | 'hired';

export interface MockApplicant {
  id: string;
  jobId: string;
  name: string;
  role: string;
  experience: number;
  salary: number;
  rating: number;
  phone: string;
  avatar?: string;
  initials: string;
  stage: ApplicantStage;
}

export const APPLICANTS_SCHEMA_VERSION = 2;

export const seedApplicants: MockApplicant[] = [
  // ===== Head Chef =====
  { id: 'a1', jobId: 'head-chef', name: 'Arjun Mehta', role: 'Head Chef', experience: 8, salary: 42000, rating: 4, phone: '+919876543210', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face', initials: 'AM', stage: 'applied' },
  { id: 'a2', jobId: 'head-chef', name: 'Priya Krishnan', role: 'Sous Chef', experience: 6, salary: 35000, rating: 5, phone: '+919876543211', initials: 'PK', stage: 'applied' },
  { id: 'a3', jobId: 'head-chef', name: 'Sandeep Mishra', role: 'Line Cook', experience: 4, salary: 28000, rating: 3, phone: '+919876543212', initials: 'SM', stage: 'applied' },
  { id: 'a4', jobId: 'head-chef', name: 'Neha Reddy', role: 'Head Chef', experience: 10, salary: 50000, rating: 5, phone: '+919876543213', initials: 'NR', stage: 'applied' },
  { id: 'a5', jobId: 'head-chef', name: 'Ramesh Tiwari', role: 'Tandoor Chef', experience: 12, salary: 38000, rating: 4, phone: '+919876543214', initials: 'RT', stage: 'applied' },
  { id: 'a6', jobId: 'head-chef', name: 'Mohammed Javed', role: 'Head Chef', experience: 7, salary: 40000, rating: 3, phone: '+919876543215', initials: 'MJ', stage: 'applied' },
  { id: 'a7', jobId: 'head-chef', name: 'Vikram Sharma', role: 'Head Chef', experience: 12, salary: 45000, rating: 5, phone: '+919876543220', avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100&h=100&fit=crop&crop=face', initials: 'VS', stage: 'shortlisted' },
  { id: 'a8', jobId: 'head-chef', name: 'Abdul Malik', role: 'Tandoor Chef', experience: 10, salary: 40000, rating: 4, phone: '+919876543221', initials: 'AM', stage: 'shortlisted' },
  { id: 'a9', jobId: 'head-chef', name: 'Sunita Gupta', role: 'Pastry Chef', experience: 6, salary: 30000, rating: 4, phone: '+919876543222', initials: 'SG', stage: 'shortlisted' },
  { id: 'a10', jobId: 'head-chef', name: 'Ananya Deshmukh', role: 'Head Chef', experience: 7, salary: 38000, rating: 5, phone: '+919876543230', initials: 'AD', stage: 'called' },
  { id: 'a11', jobId: 'head-chef', name: 'Rajesh Kumar', role: 'Head Chef', experience: 15, salary: 55000, rating: 5, phone: '+919876543231', initials: 'RK', stage: 'called' },
  { id: 'a12', jobId: 'head-chef', name: 'Deepak Thakur', role: 'Kitchen Helper', experience: 1, salary: 14000, rating: 4, phone: '+919876543240', initials: 'DT', stage: 'hired' },

  // ===== Tandoor Chef =====
  { id: 'tc1', jobId: 'tandoor-chef', name: 'Iqbal Ahmed', role: 'Tandoor Specialist', experience: 9, salary: 35000, rating: 5, phone: '+919811112201', initials: 'IA', stage: 'applied' },
  { id: 'tc2', jobId: 'tandoor-chef', name: 'Hardeep Singh', role: 'Tandoor Chef', experience: 7, salary: 32000, rating: 4, phone: '+919811112202', initials: 'HS', stage: 'applied' },
  { id: 'tc3', jobId: 'tandoor-chef', name: 'Faisal Khan', role: 'Tandoor Master', experience: 11, salary: 38000, rating: 5, phone: '+919811112203', initials: 'FK', stage: 'applied' },
  { id: 'tc4', jobId: 'tandoor-chef', name: 'Pankaj Joshi', role: 'Grill & Tandoor', experience: 5, salary: 28000, rating: 4, phone: '+919811112204', initials: 'PJ', stage: 'applied' },
  { id: 'tc5', jobId: 'tandoor-chef', name: 'Kamal Verma', role: 'Tandoor Chef', experience: 8, salary: 33000, rating: 4, phone: '+919811112205', initials: 'KV', stage: 'shortlisted' },
  { id: 'tc6', jobId: 'tandoor-chef', name: 'Rahul Sharma', role: 'Senior Tandoor Chef', experience: 13, salary: 42000, rating: 5, phone: '+919811112206', initials: 'RS', stage: 'shortlisted' },
  { id: 'tc7', jobId: 'tandoor-chef', name: 'Sanjay Bhatia', role: 'Tandoor Chef', experience: 6, salary: 30000, rating: 4, phone: '+919811112207', initials: 'SB', stage: 'called' },
  { id: 'tc8', jobId: 'tandoor-chef', name: 'Vinod Kumar', role: 'Head Tandoor', experience: 14, salary: 45000, rating: 5, phone: '+919811112208', initials: 'VK', stage: 'called' },

  // ===== Kitchen Helper =====
  { id: 'kh1', jobId: 'kitchen-helper', name: 'Suresh Yadav', role: 'Kitchen Helper', experience: 1, salary: 14000, rating: 4, phone: '+919822221101', initials: 'SY', stage: 'applied' },
  { id: 'kh2', jobId: 'kitchen-helper', name: 'Manoj Pawar', role: 'Dishwasher', experience: 2, salary: 13000, rating: 3, phone: '+919822221102', initials: 'MP', stage: 'applied' },
  { id: 'kh3', jobId: 'kitchen-helper', name: 'Ramu Das', role: 'Prep Cook', experience: 3, salary: 16000, rating: 4, phone: '+919822221103', initials: 'RD', stage: 'applied' },
  { id: 'kh4', jobId: 'kitchen-helper', name: 'Lalit Kumar', role: 'Kitchen Helper', experience: 1, salary: 14000, rating: 4, phone: '+919822221104', initials: 'LK', stage: 'applied' },
  { id: 'kh5', jobId: 'kitchen-helper', name: 'Bablu Singh', role: 'Helper', experience: 2, salary: 15000, rating: 3, phone: '+919822221105', initials: 'BS', stage: 'applied' },
  { id: 'kh6', jobId: 'kitchen-helper', name: 'Mohit Roy', role: 'Kitchen Helper', experience: 4, salary: 17000, rating: 5, phone: '+919822221106', initials: 'MR', stage: 'shortlisted' },
  { id: 'kh7', jobId: 'kitchen-helper', name: 'Aakash Jha', role: 'Helper', experience: 1, salary: 13000, rating: 4, phone: '+919822221107', initials: 'AJ', stage: 'shortlisted' },
  { id: 'kh8', jobId: 'kitchen-helper', name: 'Pradeep Nair', role: 'Prep Helper', experience: 3, salary: 15000, rating: 4, phone: '+919822221108', initials: 'PN', stage: 'shortlisted' },
  { id: 'kh9', jobId: 'kitchen-helper', name: 'Sachin Tomar', role: 'Kitchen Helper', experience: 2, salary: 14000, rating: 4, phone: '+919822221109', initials: 'ST', stage: 'called' },
  { id: 'kh10', jobId: 'kitchen-helper', name: 'Vijay More', role: 'Senior Helper', experience: 5, salary: 18000, rating: 5, phone: '+919822221110', initials: 'VM', stage: 'called' },
];
