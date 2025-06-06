// services/instructorService.ts
import  api  from './api';

export interface InstructorProfile {
  id: number;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  bloodType?: string;
  maritalStatus?: string;
  vaccine?: string;
  profileImage?: string;
  qrCode?: string;
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

export interface UpdateInstructorProfileData {
  phoneNumber?: string;
  address?: string;
  city?: string;
  bloodType?: string;
  maritalStatus?: string;
  vaccine?: string;
}

class InstructorService {
  // ⭐ OBTENER MI PERFIL
  async getMyProfile(): Promise<InstructorProfile> {
    const response = await api.get('/instructor-profile/me');
    return response.data;
  }

  // ⭐ ACTUALIZAR MI PERFIL
  async updateMyProfile(data: UpdateInstructorProfileData): Promise<InstructorProfile> {
    const response = await api.put('/instructor-profile/me', data);
    return response.data;
  }

  // ⭐ SUBIR IMAGEN DE PERFIL
  async uploadImage(imageBase64: string): Promise<any> {
    const response = await api.post('/instructor-profile/me/image', {
      profileImage: imageBase64
    });
    return response.data;
  }

  // ⭐ REGENERAR CÓDIGO QR
  async regenerateQR(): Promise<any> {
    const response = await api.post('/instructor-profile/me/regenerate-qr');
    return response.data;
  }
}

export const instructorService = new InstructorService();