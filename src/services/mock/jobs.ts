export type JobStatus = 'active' | 'draft' | 'paused' | 'closed';

export interface MockJob {
  id: string;
  title: string;
  role: string;
  status: JobStatus;
  applicants: number;
  newToday: number;
  views: number;
  postedDaysAgo: number;
  salaryMin: number;
  salaryMax: number;
  shift: string;
  jobType: string;
  tips: boolean;
  description: string;
  customDetails?: string;
}

export const seedJobs: MockJob[] = [
  {
    id: 'head-chef',
    title: 'Head Chef',
    role: 'Cooks & Chefs',
    status: 'active',
    applicants: 12,
    newToday: 3,
    views: 156,
    postedDaysAgo: 5,
    salaryMin: 35000,
    salaryMax: 50000,
    shift: 'Evening',
    jobType: 'Full-time',
    tips: true,
    description:
      'We are looking for an experienced Head Chef with strong leadership skills and expertise in North Indian cuisine.',
  },
  {
    id: 'tandoor-chef',
    title: 'Tandoor Chef',
    role: 'Cooks & Chefs',
    status: 'active',
    applicants: 8,
    newToday: 2,
    views: 89,
    postedDaysAgo: 3,
    salaryMin: 25000,
    salaryMax: 38000,
    shift: 'Evening',
    jobType: 'Full-time',
    tips: true,
    description: 'Experienced tandoor chef needed for our busy restaurant.',
  },
  {
    id: 'kitchen-helper',
    title: 'Kitchen Helper',
    role: 'Kitchen Helpers',
    status: 'active',
    applicants: 22,
    newToday: 5,
    views: 230,
    postedDaysAgo: 7,
    salaryMin: 12000,
    salaryMax: 18000,
    shift: 'Morning',
    jobType: 'Full-time',
    tips: false,
    description: 'Hardworking kitchen helper needed. Training provided.',
  },
  {
    id: 'waiter',
    title: 'Waiter / Server',
    role: 'Waiters & Servers',
    status: 'paused',
    applicants: 15,
    newToday: 0,
    views: 198,
    postedDaysAgo: 14,
    salaryMin: 15000,
    salaryMax: 22000,
    shift: 'Evening',
    jobType: 'Full-time',
    tips: true,
    description: 'Friendly waiter for our front of house team.',
  },
  {
    id: 'bartender',
    title: 'Bartender',
    role: 'Bartenders',
    status: 'closed',
    applicants: 18,
    newToday: 0,
    views: 312,
    postedDaysAgo: 30,
    salaryMin: 25000,
    salaryMax: 35000,
    shift: 'Night',
    jobType: 'Full-time',
    tips: true,
    description: 'Mixology experience required.',
  },
];
