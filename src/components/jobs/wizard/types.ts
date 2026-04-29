export interface WizardData {
  role: string;
  specs: string[];
  description: string;
  salaryMin: string;
  salaryMax: string;
  shift: string;
  jobType: 'Full-time' | 'Part-time' | 'Contract';
  tips: boolean;
}

export const initialWizard: WizardData = {
  role: '',
  specs: [],
  description: '',
  salaryMin: '',
  salaryMax: '',
  shift: '',
  jobType: 'Full-time',
  tips: false,
};
