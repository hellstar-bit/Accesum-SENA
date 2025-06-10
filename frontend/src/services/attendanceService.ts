import api from './api';

export interface AttendanceRecord {
  id: number;
  attendanceId: number;
  learnerId: number;
  learnerName: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  markedAt: string | null;
  isManual: boolean;
  accessTime: string | null;
  notes?: string;
  learner: {
    id: number;
    firstName: string;
    lastName: string;
    documentNumber: string;
  };
}

export interface ClassSchedule {
  id: number;
  scheduleId: number;
  date: string;
  startTime: string;
  endTime: string;
  classroom: string;
  subject: string;
  ficha: {
    id: number;
    code: string;
    name: string;
  };
  attendance: {
    total: number;
    present: number;
    late: number;
    absent: number;
    percentage: string;
  };
  records: AttendanceRecord[];
}

export interface InstructorDashboardStats {
  totalClasses: number;
  totalStudents: number;
  averageAttendance: number;
  todayClasses: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  weeklyStats: {
    day: string;
    present: number;
    late: number;
    absent: number;
  }[];
  monthlyStats: {
    week: string;
    attendance: number;
  }[];
}

export interface ScheduleData {
  assignmentId: number;
  date: string;
  startTime: string;
  endTime: string;
  classroom?: string;
  description?: string;
  lateToleranceMinutes?: number;
}

class AttendanceService {
  // ⭐ OBTENER ASISTENCIA DE MIS CLASES
  async getMyClassesAttendance(date?: string): Promise<ClassSchedule[]> {
    try {
      const params = date ? { date } : {};
      const response = await api.get('/attendance/my-classes', { params });
      
      // Mapear la respuesta para asegurar compatibilidad
      return response.data.map((schedule: any) => ({
        id: schedule.scheduleId || schedule.id,
        scheduleId: schedule.scheduleId || schedule.id,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        classroom: schedule.classroom || 'Sin asignar',
        subject: schedule.assignment?.subject || schedule.subject || 'Sin asignatura',
        ficha: {
          id: schedule.assignment?.ficha?.id || schedule.ficha?.id,
          code: schedule.assignment?.ficha?.code || schedule.ficha?.code || 'N/A',
          name: schedule.assignment?.ficha?.name || schedule.ficha?.name || 'Sin nombre'
        },
        attendance: {
          total: schedule.attendance?.total || 0,
          present: schedule.attendance?.present || 0,
          late: schedule.attendance?.late || 0,
          absent: schedule.attendance?.absent || 0,
          percentage: schedule.attendance?.percentage || '0.0'
        },
        records: (schedule.attendance?.records || schedule.records || []).map((record: any) => ({
          id: record.attendanceId || record.id,
          attendanceId: record.attendanceId || record.id,
          learnerId: record.learnerId,
          learnerName: record.learnerName || `${record.learner?.firstName || ''} ${record.learner?.lastName || ''}`.trim(),
          status: record.status,
          markedAt: record.markedAt,
          isManual: record.isManual || false,
          accessTime: record.accessTime,
          notes: record.notes,
          learner: {
            id: record.learner?.id || record.learnerId,
            firstName: record.learner?.firstName || '',
            lastName: record.learner?.lastName || '',
            documentNumber: record.learner?.documentNumber || ''
          }
        }))
      }));
    } catch (error) {
      console.error('Error al obtener asistencia de clases:', error);
      throw error;
    }
  }

  // ⭐ MARCAR ASISTENCIA MANUAL
  async markAttendance(data: {
    scheduleId: number;
    profileId: number;
    status: 'PRESENTE' | 'TARDE' | 'AUSENTE';
    notes?: string;
  }) {
    try {
      console.log('📝 Enviando datos de asistencia:', data);
      const response = await api.post('/attendance/mark', data);
      return response.data;
    } catch (error) {
      console.error('Error al marcar asistencia:', error);
      throw error;
    }
  }

  // ⭐ OBTENER ASISTENCIA POR HORARIO
  async getAttendanceBySchedule(scheduleId: number) {
    try {
      const response = await api.get(`/attendance/schedule/${scheduleId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener asistencia por horario:', error);
      throw error;
    }
  }

  // ⭐ OBTENER ESTADÍSTICAS DE ASISTENCIA
  async getAttendanceStats(
    assignmentId: number,
    startDate?: string,
    endDate?: string
  ) {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get(`/attendance/stats/${assignmentId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  // ⭐ OBTENER REPORTE DE ASISTENCIA
  async getAttendanceReport(
    assignmentId: number,
    startDate?: string,
    endDate?: string
  ) {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get(`/attendance/report/${assignmentId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener reporte:', error);
      throw error;
    }
  }

  // ⭐ OBTENER DASHBOARD DEL INSTRUCTOR
  async getInstructorDashboard(): Promise<InstructorDashboardStats> {
    try {
      const response = await api.get('/attendance/instructor-dashboard');
      return response.data;
    } catch (error) {
      console.error('Error al obtener dashboard del instructor:', error);
      throw error;
    }
  }

  // ⭐ MARCAR ASISTENCIA AUTOMÁTICA (desde control de acceso)
  async autoMarkAttendance(data: {
    profileId: number;
    entryTime: string;
  }) {
    try {
      const response = await api.post('/attendance/auto-mark', data);
      return response.data;
    } catch (error) {
      console.error('Error en marcado automático:', error);
      throw error;
    }
  }

  // ⭐ OBTENER MIS FICHAS ASIGNADAS
  async getMyFichas() {
    try {
      const response = await api.get('/instructor-assignments/my-fichas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener fichas asignadas:', error);
      throw error;
    }
  }

  // ⭐ OBTENER HORARIOS DE UNA FICHA
  async getFichaSchedules(fichaId: number, date?: string) {
    try {
      const params = date ? { date } : {};
      const response = await api.get(`/attendance/ficha/${fichaId}/schedules`, { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener horarios de ficha:', error);
      throw error;
    }
  }

  // ⭐ CREAR HORARIO DE CLASE
  async createSchedule(data: ScheduleData) {
    try {
      const response = await api.post('/class-schedules', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear horario:', error);
      throw error;
    }
  }

  // ⭐ ACTUALIZAR HORARIO DE CLASE
  async updateSchedule(scheduleId: number, data: Partial<ScheduleData>) {
    try {
      const response = await api.put(`/class-schedules/${scheduleId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar horario:', error);
      throw error;
    }
  }

  // ⭐ ELIMINAR HORARIO DE CLASE
  async deleteSchedule(scheduleId: number) {
    try {
      const response = await api.delete(`/class-schedules/${scheduleId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar horario:', error);
      throw error;
    }
  }

  // ⭐ OBTENER NOTIFICACIONES DE ASISTENCIA
  async getAttendanceNotifications() {
    try {
      const response = await api.get('/attendance/notifications');
      return response.data;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw error;
    }
  }

  // ⭐ MARCAR NOTIFICACIÓN COMO LEÍDA
  async markNotificationAsRead(notificationId: number) {
    try {
      const response = await api.patch(`/attendance/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  }

  // ⭐ EXPORTAR REPORTE A EXCEL
  async exportAttendanceReport(
    assignmentId: number,
    startDate?: string,
    endDate?: string,
    format: 'excel' | 'pdf' = 'excel'
  ) {
    try {
      const params: any = { format };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get(`/attendance/export/${assignmentId}`, {
        params,
        responseType: 'blob'
      });

      // Crear y descargar archivo
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-asistencia-${assignmentId}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'Reporte descargado exitosamente' };
    } catch (error) {
      console.error('Error al exportar reporte:', error);
      throw error;
    }
  }

  // ⭐ OBTENER ESTADÍSTICAS GENERALES
  async getGeneralStats() {
    try {
      const response = await api.get('/attendance/general-stats');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas generales:', error);
      throw error;
    }
  }

  // ⭐ OBTENER ASISTENCIA POR RANGO DE FECHAS
  async getAttendanceByDateRange(startDate: string, endDate: string) {
    try {
      const response = await api.get('/attendance/date-range', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener asistencia por rango de fechas:', error);
      throw error;
    }
  }

  // ⭐ SINCRONIZAR ASISTENCIA CON ACCESO
  async syncAttendanceWithAccess(date?: string) {
    try {
      const params = date ? { date } : {};
      const response = await api.post('/attendance/sync-with-access', params);
      return response.data;
    } catch (error) {
      console.error('Error al sincronizar asistencia con acceso:', error);
      throw error;
    }
  }
}

export const attendanceService = new AttendanceService();
