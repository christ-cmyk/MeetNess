// Service API pour les organisations MeedNess - React Native

import apiClient from './client';
import { ORG_ENDPOINTS } from '../../config/env';
import type { Organization, Invitation, CreateOrganizationData } from '../../types/organization';

export const organizationAPI = {
  // Créer une organisation (admin)
  createOrganization: async (data: CreateOrganizationData): Promise<Organization> => {
    const response = await apiClient.post(ORG_ENDPOINTS.CREATE, data);
    return response.data;
  },

  // Récupérer mon organisation
  getMyOrganization: async (): Promise<Organization> => {
    const response = await apiClient.get(ORG_ENDPOINTS.MY);
    return response.data;
  },

  // Récupérer les invitations en attente (member)
  getPendingInvitations: async (): Promise<Invitation[]> => {
    const response = await apiClient.get(ORG_ENDPOINTS.PENDING_INVITATIONS);
    return response.data;
  },

  // Accepter une invitation
  acceptInvitation: async (invitationId: string): Promise<Organization> => {
    const response = await apiClient.post(ORG_ENDPOINTS.ACCEPT_INVITATION(invitationId));
    return response.data;
  },
};
