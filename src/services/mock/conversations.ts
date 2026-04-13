export interface MockMessage {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
}

export interface MockConversation {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  initials: string;
  type: 'active' | 'hired';
  lastMessage: string;
  time: string;
  unread: number;
  messages: MockMessage[];
}

export const seedConversations: MockConversation[] = [
  {
    id: 'vikram',
    name: 'Vikram Sharma',
    role: 'Head Chef',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100&h=100&fit=crop&crop=face',
    initials: 'VS',
    type: 'active',
    lastMessage: 'Yes sir, I can join from next Monday',
    time: '10:32 AM',
    unread: 2,
    messages: [
      { id: 'm1', fromMe: false, text: 'Namaste sir, I saw your job post for Head Chef. I have 12 years of experience.', time: '1 Apr, 2:30 PM' },
      { id: 'm2', fromMe: true, text: 'Hello Vikram, thank you for applying. Can you tell me about your tandoor experience?', time: '1 Apr, 3:15 PM' },
      { id: 'm3', fromMe: false, text: 'Yes sir, I have managed live Tandoor counters at The Grand Pavilion for 5 years.', time: '1 Apr, 3:45 PM' },
      { id: 'm4', fromMe: true, text: 'Wonderful. Can you come for an in-person interview this week?', time: '2 Apr, 10:00 AM' },
      { id: 'm5', fromMe: false, text: 'Sure sir, I am available on Thursday or Friday.', time: '2 Apr, 11:30 AM' },
      { id: 'm6', fromMe: true, text: "Let's do Thursday at 11 AM. Please bring your experience certificates.", time: '2 Apr, 12:00 PM' },
      { id: 'm7', fromMe: false, text: 'Yes sir, I can join from next Monday', time: '10:32 AM' },
    ],
  },
  {
    id: 'ananya',
    name: 'Ananya Deshmukh',
    role: 'Head Chef',
    initials: 'AD',
    type: 'active',
    lastMessage: 'What time should I come for the interview?',
    time: '9:15 AM',
    unread: 1,
    messages: [
      { id: 'm1', fromMe: false, text: 'Hi, I applied for the Head Chef position.', time: 'Yesterday, 2:30 PM' },
      { id: 'm2', fromMe: true, text: "Hello Ananya, we'd like to interview you. Are you available this week?", time: 'Today, 9:00 AM' },
      { id: 'm3', fromMe: false, text: 'What time should I come for the interview?', time: '9:15 AM' },
    ],
  },
  {
    id: 'abdul',
    name: 'Abdul Malik',
    role: 'Tandoor Chef',
    initials: 'AM',
    type: 'active',
    lastMessage: 'Thank you for considering my application',
    time: 'Yesterday',
    unread: 0,
    messages: [
      { id: 'm1', fromMe: false, text: 'Thank you for considering my application', time: 'Yesterday, 5:00 PM' },
    ],
  },
  {
    id: 'deepak',
    name: 'Deepak Thakur',
    role: 'Kitchen Helper',
    initials: 'DT',
    type: 'hired',
    lastMessage: 'I will bring my documents tomorrow',
    time: '2 Apr',
    unread: 0,
    messages: [
      { id: 'm1', fromMe: true, text: 'Welcome to the team! When can you start?', time: '1 Apr, 4:00 PM' },
      { id: 'm2', fromMe: false, text: 'I will bring my documents tomorrow', time: '2 Apr, 9:00 AM' },
    ],
  },
];
