// Store Zustand pour les organisations - React Native

import { create } from 'zustand';
import { organizationAPI } from '../../services/api/organization.api';
import type { Organization, Invitation, Team, MemberRole, CreateOrganizationData } from '../../types/organization';

interface OrganizationState {
  organization: Organization | null;
  myRole: MemberRole | null;
  teams: Team[];
  pendingInvitations: Invitation[];
  isLoading: boolean;
  error: string | null;
}

interface OrganizationActions {
  createOrganization: (data: CreateOrganizationData) => Promise<Organization>;
  fetchMyOrganization: () => Promise<void>;
  fetchTeams: () => Promise<void>;
  checkPendingInvitations: () => Promise<Invitation[]>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  clearOrganization: () => void;
  clearError: () => void;
}

type OrganizationStore = OrganizationState & OrganizationActions;

export const useOrganizationStore = create<OrganizationStore>((set) => ({
  organization: null,
  myRole: null,
  teams: [],
  pendingInvitations: [],
  isLoading: false,
  error: null,

  createOrganization: async (data: CreateOrganizationData) => {
    try {
      set({ isLoading: true, error: null });
      const org = await organizationAPI.createOrganization(data);
      set({ organization: org, myRole: 'owner', isLoading: false });
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
    const data = await organizationAPI.getMyOrganization();
    
    if (!data) {
      // Pas d'organisation trouvée
      set({ organization: null, myRole: null, isLoading: false });
      return;
    }

    set({
      organization: data.organization,
      myRole: data.role,
      isLoading: false,
    });
  } catch (error: any) {
    set({ organization: null, myRole: null, isLoading: false });
  }
},
  fetchTeams: async () => {
    try {
      set({ isLoading: true, error: null });
      const teams = await organizationAPI.getTeams();
      set({ teams, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erreur de chargement des équipes';
      set({ error: message, isLoading: false });
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
      const result = await organizationAPI.acceptInvitation(invitationId);
      set({
        organization: result.organization || result,
        myRole: result.role || 'member',
        isLoading: false,
        pendingInvitations: [],
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Échec de l'acceptation";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  clearOrganization: () => set({ organization: null, myRole: null, teams: [], pendingInvitations: [], error: null }),
  clearError: () => set({ error: null }),
}));
