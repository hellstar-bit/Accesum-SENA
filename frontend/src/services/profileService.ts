// frontend/src/services/profileService.ts
import api from './api';

export interface Profile {
  id: number;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  bloodType?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  maritalStatus?: string;
  sex?: string;
  vaccine?: string;
  profileImage?: string;
  qrCode?: string;
  userId: number;
  user: {
    id: number;
    email: string;
    isActive: boolean;
  };
  type: {
    id: number;
    name: string;
  };
  regional: {
    id: number;
    name: string;
  };
  center: {
    id: number;
    name: string;
  };
}

export interface ProfilesResponse {
  data: Profile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateProfileRequest {
  documentType?: string;
  documentNumber?: string;
  firstName?: string;
  lastName?: string;
  bloodType?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  maritalStatus?: string;
  sex?: string;
  vaccine?: string;
  typeId?: number;
  regionalId?: number;
  centerId?: number;
}

export interface ProfileStats {
  totalProfiles: number;
  profilesByType: Array<{ typeName: string; count: string }>;
  profilesByRegional: Array<{ regionalName: string; count: string }>;
  profilesWithQR: number;
  profilesWithoutQR: number;
}

export const profileService = {
  async getProfiles(page: number = 1, limit: number = 10, search?: string): Promise<ProfilesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }

    const response = await api.get<ProfilesResponse>(`/profiles?${params}`);
    return response.data;
  },

  async getProfileById(id: number): Promise<Profile> {
    const response = await api.get<Profile>(`/profiles/${id}`);
    return response.data;
  },

  async getProfileByUserId(userId: number): Promise<Profile> {
    const response = await api.get<Profile>(`/profiles/user/${userId}`);
    return response.data;
  },

  async updateProfile(id: number, data: UpdateProfileRequest): Promise<Profile> {
    const response = await api.patch<Profile>(`/profiles/${id}`, data);
    return response.data;
  },

  async regenerateQR(id: number): Promise<Profile> {
    const response = await api.post<Profile>(`/profiles/${id}/regenerate-qr`);
    return response.data;
  },

  async uploadProfileImage(id: number, imageBase64: string): Promise<Profile> {
    const response = await api.post<Profile>(`/profiles/${id}/upload-image`, {
      image: imageBase64,
    });
    return response.data;
  },

  async getProfileStats(): Promise<ProfileStats> {
    const response = await api.get<ProfileStats>('/profiles/stats');
    return response.data;
  },
};