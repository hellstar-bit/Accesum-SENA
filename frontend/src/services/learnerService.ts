// frontend/src/services/learnerService.ts
import api from './api';

export interface LearnerProfile {
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
  learnerStatus?: string;
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
  ficha?: {
    id: number;
    code: string;
    name: string;
    status: string;
  };
}

export interface UpdateLearnerRequest {
  phoneNumber?: string;
  address?: string;
  city?: string;
  bloodType?: string;
  maritalStatus?: string;
  vaccine?: string;
}

export interface CarnetData {
  id: number;
  fullName: string;
  documentType: string;
  documentNumber: string;
  bloodType?: string;
  profileImage?: string;
  qrCode?: string;
  ficha?: {
    code: string;
    name: string;
    status: string;
  };
  type: string;
  center: string;
  regional: string;
  status?: string;
  isActive: boolean;
}

export const learnerService = {
  async getMyProfile(): Promise<LearnerProfile> {
    const response = await api.get<LearnerProfile>('/learner/profile');
    return response.data;
  },

  async updateMyProfile(data: UpdateLearnerRequest): Promise<LearnerProfile> {
    const response = await api.patch<LearnerProfile>('/learner/profile', data);
    return response.data;
  },

  async regenerateQR(): Promise<LearnerProfile> {
    const response = await api.post<LearnerProfile>('/learner/regenerate-qr');
    return response.data;
  },

  async uploadImage(imageBase64: string): Promise<LearnerProfile> {
    const response = await api.post<LearnerProfile>('/learner/upload-image', {
      image: imageBase64,
    });
    return response.data;
  },

  async getCarnetData(): Promise<CarnetData> {
    const response = await api.get<CarnetData>('/learner/carnet');
    return response.data;
  },
};