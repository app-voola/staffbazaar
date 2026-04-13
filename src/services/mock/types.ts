export type Role = 'owner' | 'worker';

export interface MockUser {
  id: string;
  full_name: string;
  phone: string;
  role: Role;
  avatar_url: string | null;
}

export interface MockRestaurant {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  city: string;
}
