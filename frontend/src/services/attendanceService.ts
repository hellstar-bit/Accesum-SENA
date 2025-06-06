// services/attendanceService.ts
import api from './api';

export interface InstructorFicha {
  id: number;
  subject: string;
  description?: string;
  ficha: {
    id: number;
    code: string;
    name: string;
    status: string;
    totalLearners: number;
  };
  assignedAt: Date;
}

export interface ClassSchedule {
  id: number;
  date: Date;
  startTime: string;
  endTime: string;
  classroom?: string;
  subject: string;
  ficha: {
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

export interface AttendanceRecord {
  id: number;
  learner: {
    id: number;
    firstName: string;
    lastName: string;
    documentNumber: string;
  };
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  markedAt?: Date;
  isManual: boolean;
  notes?: string;
}

export interface CreateScheduleData {
  assignmentId: number;
  date: string;
  startTime: string;
  endTime: string;
  classroom?: string;
  description?: string;
}

export interface MarkAttendanceData {
  scheduleId: number;
  learnerId: number;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  notes?: string;
}

class AttendanceService {
  // ⭐ OBTENER MIS FICHAS (INSTRUCTOR)
  async getMyFichas(): Promise<InstructorFicha[]> {
    const response = await api.get('/instructor-assignments/my-fichas');
    return response.data;
  }

  // ⭐ OBTENER MIS HORARIOS Y ASISTENCIAS (INSTRUCTOR)
  async getMyClassesAttendance(date?: string): Promise<ClassSchedule[]> {
    const params = date ? { date } : {};
    const response = await api.get('/attendance/my-classes', { params });
    return response.data;
  }

  // ⭐ CREAR HORARIO DE CLASE
  async createSchedule(data: CreateScheduleData): Promise<any> {
    const response = await api.post('/class-schedules', data);
    return response.data;
  }

  // ⭐ MARCAR ASISTENCIA MANUAL
  async markAttendance(data: MarkAttendanceData): Promise<AttendanceRecord> {
    const response = await api.post('/attendance/mark', data);
    return response.data;
  }

  // ⭐ ASIGNAR INSTRUCTOR A FICHA (ADMIN)
  async assignInstructorToFicha(data: {
    instructorId: number;
    fichaId: number;
    subject: string;
    description?: string;
  }): Promise<any> {
    const response = await api.post('/instructor-assignments', data);
    return response.data;
  }

  // ⭐ OBTENER FICHAS DE INSTRUCTOR (ADMIN)
  async getInstructorFichas(instructorId: number): Promise<InstructorFicha[]> {
    const response = await api.get(`/instructor-assignments/instructor/${instructorId}/fichas`);
    return response.data;
  }

  // ⭐ VER ASISTENCIA DE INSTRUCTOR (ADMIN)
  async getInstructorAttendance(instructorId: number, date?: string): Promise<ClassSchedule[]> {
    const params = date ? { date } : {};
    const response = await api.get(`/attendance/instructor/${instructorId}`, { params });
    return response.data;
  }
  // ⭐ OBTENER HORARIOS DE UNA ASIGNACIÓN
  async getSchedulesByAssignment(assignmentId: number) {
    const response = await api.get(`/class-schedules/assignment/${assignmentId}`);
    return response.data;
  }

  // ⭐ OBTENER ASISTENCIA DE UNA CLASE
  async getAttendanceBySchedule(scheduleId: number) {
    const response = await api.get(`/attendance/schedule/${scheduleId}`);
    return response.data;
  }

  // ⭐ OBTENER MIS CLASES DE HOY (para instructor)
  async getMyTodayClasses() {
    const response = await api.get('/class-schedules/my-today');
    return response.data;
  }

  // ⭐ OBTENER ESTADÍSTICAS DE ASISTENCIA
  async getAttendanceStats(assignmentId: number, dateRange?: {
    startDate: string;
    endDate: string;
  }) {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('startDate', dateRange.startDate);
      params.append('endDate', dateRange.endDate);
    }
    
    const response = await api.get(`/attendance/stats/${assignmentId}?${params}`);
    return response.data;
  }

  // ⭐ OBTENER HORARIOS POR FECHA
  async getSchedulesByDate(date: string, instructorId?: number) {
    const params = new URLSearchParams();
    params.append('date', date);
    if (instructorId) {
      params.append('instructorId', instructorId.toString());
    }
    
    const response = await api.get(`/class-schedules/date/${date}?${params}`);
    return response.data;
  }

  // ⭐ OBTENER HORARIO ESPECÍFICO
  async getScheduleById(id: number) {
    const response = await api.get(`/class-schedules/${id}`);
    return response.data;
  }
}

export const attendanceService = new AttendanceService();

