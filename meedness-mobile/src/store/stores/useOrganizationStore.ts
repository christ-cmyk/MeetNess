// Store Zustand pour les organisations - React Native

import { create } from 'zustand';
import { organizationAPI } from '../../services/api/organization.api';
import type { Organization, Invitation, CreateOrganizationData } from '../../types/organization';

interface OrganizationState {
  organization: Organization | null;
  pendingInvitations: Invitation[];
  isLoading: boolean;
  error: string | null;
}

interface OrganizationActions {
  createOrganization: (data: CreateOrganizationData) => Promise<Organization>;
  fetchMyOrganization: () => Promise<void>;
  checkPendingInvitations: () => Promise<Invitation[]>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  clearOrganization: () => void;
  clearError: () => void;
}

type OrganizationStore = OrganizationState & OrganizationActions;

export const useOrganizationStore = create<OrganizationStore>((set) => ({
  organization: null,
  pendingInvitations: [],
  isLoading: false,
  error: null,

  createOrganization: async (data: CreateOrganizationData) => {
    try {
      set({ isLoading: true, error: null });
      const org = await organizationAPI.createOrganization(data);
      set({ organization: org, isLoading: false });
      return org;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Échec de la création';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  fetchMyOrganization: async () => {
    try {
      set({ isLoading: true, error: null });
      const org = await organizationAPI.getMyOrganization();
      set({ organization: org, isLoading: false });
    } catch (error: any) {
      // 404 = pas encore d'organisation
      if (error.response?.status === 404) {
        set({ organization: null, isLoading: false });
      } else {
        const message = error.response?.data?.message || error.message || 'Erreur de chargement';
        set({ error: message, isLoading: false });
      }
    }
  },

  checkPendingInvitations: async () => {
    try {
      set({ isLoading: true, error: null });
      const invitations = await organizationAPI.getPendingInvitations();
      set({ pendingInvitations: invitations, isLoading: false });
      return invitations;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erreur de vérification';
      set({ error: message, isLoading: false });
      return [];
    }
  },

  acceptInvitation: async (invitationId: string) => {
    try {
      set({ isLoading: true, error: null });
      const org = await organizationAPI.acceptInvitation(invitationId);
      set({ organization: org, isLoading: false, pendingInvitations: [] });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Échec de l'acceptation";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  clearOrganization: () => set({ organization: null, pendingInvitations: [], error: null }),
  clearError: () => set({ error: null }),
}));
