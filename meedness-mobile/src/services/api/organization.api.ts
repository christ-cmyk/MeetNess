// Service API pour les organisations MeedNess - React Native

import apiClient from './client';
import { ORG_ENDPOINTS } from '../../config/env';
import type { Organization, Invitation, Team, MemberRole, CreateOrganizationData } from '../../types/organization';

interface MyOrganizationResponse {
  organization: Organization;
  role: MemberRole;
}

interface AcceptInvitationResponse {
  organization: Organization;
  role: MemberRole;
}

export const organizationAPI = {
  createOrganization: async (data: CreateOrganizationData): Promise<Organization> => {
    const response = await apiClient.post(ORG_ENDPOINTS.CREATE, data);
    return response.data;
  },

getMyOrganization: async (): Promise<MyOrganizationResponse | null> => {
  try {
    const response = await apiClient.get(ORG_ENDPOINTS.MY);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // Pas d'organisation, c'est normal
    }
    throw error;
  }
},

  getTeams: async (): Promise<Team[]> => {
    const response = await apiClient.get(ORG_ENDPOINTS.TEAMS);
    return response.data;
  },

  getPendingInvitations: async (): Promise<Invitation[]> => {
    const response = await apiClient.get(ORG_ENDPOINTS.PENDING_INVITATIONS);
    return response.data;
  },

  acceptInvitation: async (invitationId: string): Promise<AcceptInvitationResponse> => {
    const response = await apiClient.post(ORG_ENDPOINTS.ACCEPT_INVITATION(invitationId));
    return response.data;
  },
};
