// frontend/src/services/instructorService.ts - COMPLETO MODIFICADO
import api from './api';

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

export interface InstructorSchedule {
  id: number;
  startTime: string;
  endTime: string;
  classroom: string;
  competence: {
    id: number;
    name: string;
  };
  ficha: {
    id: number;
    code: string;
    name: string;
  };
}

export interface WeeklySchedule {
  LUNES: InstructorSchedule[];
  MARTES: InstructorSchedule[];
  MIERCOLES: InstructorSchedule[];
  JUEVES: InstructorSchedule[];
  VIERNES: InstructorSchedule[];
  SABADO: InstructorSchedule[];
}

export interface InstructorScheduleResponse {
  instructor: {
    id: number;
    name: string;
    documentNumber: string;
  };
  trimester: string;
  schedules: WeeklySchedule;
}

class InstructorService {
  // ⭐ OBTENER MI PERFIL
  async getMyProfile(): Promise<InstructorProfile> {
    const response = await api.get('/instructor-profile/me');
    return response.data;
  }

  // ⭐ OBTENER MIS HORARIOS
  async getMySchedules(trimester?: string): Promise<InstructorScheduleResponse> {
    const params = trimester ? { trimester } : {};
    const response = await api.get('/instructor-profile/me/schedules', { params });
    return response.data;
  }

  // ⭐ OBTENER MIS ASIGNACIONES
  async getMyAssignments(): Promise<any[]> {
    const response = await api.get('/instructor-profile/me/assignments');
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
