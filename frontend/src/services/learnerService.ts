// frontend/src/services/learnerService.ts - ACTUALIZADO CON MÉTODOS PARA MIS CLASES
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

// ⭐ NUEVAS INTERFACES PARA MIS CLASES
export interface LearnerClassSchedule {
  scheduleId: number;
  subject: string;
  instructor: {
    firstName: string;
    lastName: string;
  };
  startTime: string;
  endTime: string;
  classroom: string;
  ficha: {
    code: string;
    name: string;
  };
  competence: {
    name: string;
  };
  attendance?: {
    attendanceId: number;
    status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
    accessTime: string | null;
    isManual: boolean;
    notes?: string;
  };
}

export interface WeeklyAttendanceStats {
  totalClasses: number;
  presentClasses: number;
  lateClasses: number;
  absentClasses: number;
  attendancePercentage: number;
}

export const learnerService = {
  async getMyProfile(): Promise<LearnerProfile> {
    const response = await api.get<LearnerProfile>('/learner/profile');
    return response.data;
  },

  async updateMyProfile(data: UpdateLearnerRequest): Promise<LearnerProfile> {
    const response = await api.put<LearnerProfile>('/learner/profile', data);
    return response.data;
  },

  async regenerateQR(): Promise<LearnerProfile> {
    const response = await api.post<LearnerProfile>('/learner/profile/regenerate-qr');
    return response.data;
  },

  async uploadImage(imageBase64: string): Promise<LearnerProfile> {
    const response = await api.post<LearnerProfile>('/learner/profile/image', {
      profileImage: imageBase64,
    });
    return response.data;
  },

  async getCarnetData(): Promise<CarnetData> {
    const response = await api.get<CarnetData>('/learner/carnet');
    return response.data;
  },

  // ⭐ NUEVOS MÉTODOS PARA MIS CLASES
  async getMyClassesForDate(date: string): Promise<LearnerClassSchedule[]> {
    try {
      console.log(`🔍 Solicitando clases para fecha: ${date}`);
      const response = await api.get<LearnerClassSchedule[]>(`/learner/my-classes/${date}`);
      console.log(`✅ Respuesta recibida:`, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en getMyClassesForDate:', error);
      throw error;
    }
  },

  async getWeeklyAttendanceStats(startDate: string, endDate: string): Promise<WeeklyAttendanceStats> {
    try {
      console.log(`📊 Solicitando estadísticas semanales: ${startDate} - ${endDate}`);
      const response = await api.get<WeeklyAttendanceStats>('/learner/attendance-stats', {
        params: {
          startDate,
          endDate
        }
      });
      console.log(`✅ Estadísticas recibidas:`, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en getWeeklyAttendanceStats:', error);
      throw error;
    }
  },

  // ⭐ MÉTODO ADICIONAL: OBTENER HORARIO SEMANAL COMPLETO
  async getMyWeeklySchedule(weekStartDate: string): Promise<{
    schedules: Record<string, LearnerClassSchedule[]>;
    week: string;
  }> {
    try {
      console.log(`📅 Solicitando horario semanal desde: ${weekStartDate}`);
      const response = await api.get<{
        schedules: Record<string, LearnerClassSchedule[]>;
        week: string;
      }>(`/learner/weekly-schedule/${weekStartDate}`);
      console.log(`✅ Horario semanal recibido:`, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en getMyWeeklySchedule:', error);
      throw error;
    }
  },

  // ⭐ MÉTODO ADICIONAL: OBTENER RESUMEN DE ASISTENCIA MENSUAL
  async getMonthlyAttendanceSummary(year: number, month: number): Promise<{
    totalClasses: number;
    attendedClasses: number;
    attendanceRate: number;
    dailyAttendance: Record<string, {
      present: number;
      late: number;
      absent: number;
      excused: number;
    }>;
  }> {
    try {
      console.log(`📈 Solicitando resumen mensual: ${year}-${month}`);
      const response = await api.get(`/learner/monthly-attendance/${year}/${month}`);
      console.log(`✅ Resumen mensual recibido:`, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en getMonthlyAttendanceSummary:', error);
      throw error;
    }
  }
};