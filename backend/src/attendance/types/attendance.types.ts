// backend/src/attendance/types/attendance.types.ts

// ⭐ TIPOS BÁSICOS
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT';
export type AttendanceStatusSpanish = 'PRESENTE' | 'AUSENTE' | 'TARDE';
export type DayOfWeek = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO';

// ⭐ INTERFACES PARA HORARIOS
export interface ScheduleItem {
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
  LUNES: ScheduleItem[];
  MARTES: ScheduleItem[];
  MIERCOLES: ScheduleItem[];
  JUEVES: ScheduleItem[];
  VIERNES: ScheduleItem[];
  SABADO: ScheduleItem[];
}

export interface TrimesterScheduleItem {
  id: number;
  startTime: string;
  endTime: string;
  classroom: string;
  competence: {
    id: number;
    name: string;
  };
  instructor: {
    id: number;
    name: string;
  };
}

// ⭐ INTERFACES PARA ASIGNACIONES DE INSTRUCTOR
export interface InstructorFicha {
  id: number;
  instructorId: number;
  fichaId: number;
  ficha: {
    id: number;
    code: string;
    name: string;
  };
  subject: string;
  trimester: string;
  assignedAt: Date;
  description: string;
  isActive: boolean;
}

export interface InstructorAssignment {
  id: number;
  instructorId: number;
  fichaId: number;
  subject: string;
  description?: string;
  isActive: boolean;
  assignedAt: Date;
  instructor?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  ficha?: {
    id: number;
    code: string;
    name: string;
  };
}

// ⭐ INTERFACES PARA REGISTROS DE ASISTENCIA
export interface AttendanceRecordEntity {
  id: number;
  scheduleId: number;
  learnerId: number;
  accessRecordId?: number;
  status: AttendanceStatus;
  markedAt?: Date;
  manuallyMarkedAt?: Date;
  markedBy?: number;
  notes?: string;
  isManual: boolean;
  createdAt: Date;
  schedule?: ClassSchedule;
  learner?: LearnerProfile;
  accessRecord?: AccessRecord;
}

export interface FormattedAttendanceRecord {
  id: number;
  attendanceId: number;
  learnerId: number;
  learnerName: string;
  status: AttendanceStatus;
  markedAt: string | null;
  manuallyMarkedAt: string | null;
  isManual: boolean;
  accessTime: string | null;
  notes: string | null;
  markedBy: number | null;
  learner: {
    id: number;
    firstName: string;
    lastName: string;
    documentNumber: string;
  };
}

// ⭐ INTERFACES PARA HORARIOS DE CLASE
export interface ClassSchedule {
  id: number;
  assignmentId: number;
  date: Date;
  startTime: string;
  endTime: string;
  classroom?: string;
  description?: string;
  lateToleranceMinutes: number;
  isActive: boolean;
  createdAt: Date;
  assignment?: InstructorAssignment;
  attendanceRecords?: AttendanceRecordEntity[];
}

export interface ClassScheduleForInstructor {
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
  records: FormattedAttendanceRecord[];
}

// ⭐ INTERFACES PARA HORARIOS DE TRIMESTRE
export interface TrimesterSchedule {
  id: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  competenceId: number;
  instructorId: number;
  fichaId: number;
  classroom?: string;
  trimester: string;
  isActive: boolean;
  createdAt: Date;
  competence?: Competence;
  instructor?: User;
  ficha?: Ficha;
}

// ⭐ DTOs PARA CREACIÓN Y ACTUALIZACIÓN
export interface CreateClassScheduleDto {
  assignmentId: number;
  date: string;
  startTime: string;
  endTime: string;
  classroom?: string;
  description?: string;
  lateToleranceMinutes?: number;
}

export interface UpdateClassScheduleDto {
  date?: string;
  startTime?: string;
  endTime?: string;
  classroom?: string;
  description?: string;
  lateToleranceMinutes?: number;
}

export interface CreateTrimesterScheduleDto {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  competenceId: number;
  instructorId: number;
  fichaId: number;
  classroom?: string;
  trimester: string;
}

export interface MarkAttendanceDto {
  scheduleId: number;
  profileId: number;
  status: AttendanceStatusSpanish;
  notes?: string;
  markedBy?: number;
}

export interface CreateInstructorAssignmentDto {
  instructorId: number;
  fichaId: number;
  subject: string;
  description?: string;
}

// ⭐ INTERFACES PARA ESTADÍSTICAS Y REPORTES
export interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  absent: number;
  percentage: number;
  byDate?: Record<string, {
    present: number;
    late: number;
    absent: number;
    total: number;
  }>;
}

export interface InstructorDashboardStats {
  totalFichas: number;
  activeFichas: number;
  todayClasses: number;
  totalStudents: number;
  attendanceToday: number;
  weeklySchedule?: WeeklySchedule;
  recentAttendance?: FormattedAttendanceRecord[];
}

export interface AttendanceReport {
  assignmentId: number;
  instructor: {
    id: number;
    name: string;
    email: string;
  };
  ficha: {
    id: number;
    code: string;
    name: string;
  };
  subject: string;
  period: {
    startDate: string;
    endDate: string;
  };
  stats: AttendanceStats;
  records: FormattedAttendanceRecord[];
  students: {
    id: number;
    name: string;
    documentNumber: string;
    attendancePercentage: number;
    totalClasses: number;
    presentClasses: number;
    lateClasses: number;
    absentClasses: number;
  }[];
}

// ⭐ INTERFACES PARA RESPUESTAS DE API
export interface InstructorScheduleResponse {
  instructor: {
    id: number;
    name: string;
    documentNumber: string;
  };
  trimester: string;
  schedules: WeeklySchedule;
}

export interface AutoAttendanceResponse {
  success: boolean;
  message: string;
  profileId: number;
  entryTime: Date;
  records: AttendanceRecordEntity[];
  error?: string;
}

export interface ScheduleResponse {
  message: string;
  scheduleId?: number;
  assignmentId?: number;
}

export interface TrimesterScheduleResponse {
  LUNES: TrimesterScheduleItem[];
  MARTES: TrimesterScheduleItem[];
  MIERCOLES: TrimesterScheduleItem[];
  JUEVES: TrimesterScheduleItem[];
  VIERNES: TrimesterScheduleItem[];
  SABADO: TrimesterScheduleItem[];
}

// ⭐ INTERFACES PARA ENTIDADES RELACIONADAS (referencias)
export interface LearnerProfile {
  id: number;
  firstName: string;
  lastName: string;
  documentNumber: string;
  email?: string;
  phoneNumber?: string;
}

export interface User {
  id: number;
  email: string;
  isActive: boolean;
  profile?: LearnerProfile;
}

export interface Competence {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface Ficha {
  id: number;
  code: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface AccessRecord {
  id: number;
  profileId: number;
  entryTime: Date;
  exitTime?: Date;
  accessType: string;
  attendanceRecords?: AttendanceRecordEntity[];
}

// ⭐ TIPOS PARA FILTROS Y CONSULTAS
export interface AttendanceFilters {
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  instructorId?: number;
  fichaId?: number;
  competenceId?: number;
  isManual?: boolean;
}

export interface ScheduleFilters {
  date?: string;
  instructorId?: number;
  fichaId?: number;
  trimester?: string;
  dayOfWeek?: DayOfWeek;
  isActive?: boolean;
}

// ⭐ TIPOS PARA VALIDACIONES
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ScheduleConflict {
  conflictType: 'INSTRUCTOR_BUSY' | 'CLASSROOM_OCCUPIED' | 'FICHA_BUSY';
  existingSchedule: {
    id: number;
    startTime: string;
    endTime: string;
    instructor?: string;
    classroom?: string;
    ficha?: string;
  };
  message: string;
}

// ⭐ CONSTANTES Y ENUMS
export const ATTENDANCE_STATUS_MAPPING = {
  'PRESENTE': 'PRESENT',
  'AUSENTE': 'ABSENT',
  'TARDE': 'LATE'
} as const;

export const DAY_NAMES = [
  'DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 
  'JUEVES', 'VIERNES', 'SABADO'
] as const;

export const DEFAULT_LATE_TOLERANCE_MINUTES = 15;
export const DEFAULT_ATTENDANCE_STATUS = 'ABSENT';

// ⭐ TIPOS UTILITARIOS
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ⭐ TIPOS PARA RESPUESTAS PAGINADAS
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
