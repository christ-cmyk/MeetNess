// Types pour les organisations MeedNess - React Native

export type OrganizationType = 'company' | 'family' | 'team';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  description?: string;
  owner_id: string;
  created_at: string;
  members_count?: number;
}

export interface Invitation {
  id: string;
  organization: Organization;
  invited_by: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface CreateOrganizationData {
  name: string;
  type: OrganizationType;
  description?: string;
}
