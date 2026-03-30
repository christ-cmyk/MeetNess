// Types pour les organisations MeedNess - React Native

export type OrganizationType = 'company' | 'family' | 'team';
export type OrganizationPlan = 'free' | 'pro' | 'enterprise';
export type MemberRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  description?: string;
  owner_id: string;
  plan: OrganizationPlan;
  allow_admin_invite: boolean;
  avatar?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  members_count?: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  members_count?: number;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  username: string;
  email: string;
  avatar?: string;
  organization_id: string;
  role: MemberRole;
  team?: Team;
  joined_at: string;
  is_active: boolean;
}

export interface Invitation {
  id: string;
  organization: Organization;
  invited_by: string;
  email: string;
  team?: Team;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
}

export interface OwnershipTransfer {
  id: string;
  organization: Organization;
  from_user: string;
  to_user: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  expires_at: string;
}

export interface CreateOrganizationData {
  name: string;
  type: OrganizationType;
  description?: string;
}
