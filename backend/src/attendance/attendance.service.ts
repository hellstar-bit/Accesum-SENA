// backend/src/attendance/attendance.service.ts - COMPLETO
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassSchedule } from './entities/class-schedule.entity';
import { TrimesterSchedule } from './entities/trimester-schedule.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { InstructorAssignment } from './entities/instructor-assignment.entity';

// ⭐ IMPORTAR TIPOS DESDE EL ARCHIVO COMPARTIDO
import { 
  ScheduleItem, 
  WeeklySchedule, 
  InstructorFicha,
  InstructorAssignment as InstructorAssignmentType,
  TrimesterScheduleItem,
  CreateClassScheduleDto,
  MarkAttendanceDto
} from './types/attendance.types';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(ClassSchedule)
    private readonly scheduleRepository: Repository<ClassSchedule>,

    @InjectRepository(TrimesterSchedule)
    private readonly trimesterScheduleRepository: Repository<TrimesterSchedule>,

    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepository: Repository<AttendanceRecord>,

    @InjectRepository(InstructorAssignment)
    private readonly assignmentRepository: Repository<InstructorAssignment>,
  ) {}

  // ⭐ MÉTODO PRINCIPAL - OBTENER CLASES DEL INSTRUCTOR POR FECHA
  async getMyClassesAttendance(instructorId: number, date?: string) {
    try {
      console.log(`📋 Obteniendo clases del instructor ${instructorId} para fecha ${date}`);
      
      // Si no se proporciona fecha, usar hoy
      const targetDate = date ? new Date(date) : new Date();
      
      // Obtener el día de la semana en español
      const dayNames = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
      const dayOfWeek = dayNames[targetDate.getDay()];
      
      // Determinar el trimestre actual
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      let trimester: string;
      if (month >= 1 && month <= 4) trimester = `${year}-1`;
      else if (month >= 5 && month <= 8) trimester = `${year}-2`;
      else trimester = `${year}-3`;
      
      console.log(`📅 Buscando horarios para: ${dayOfWeek}, trimestre: ${trimester}`);
      
      // Buscar horarios de trimestre para ese día y instructor
      const trimesterSchedules = await this.trimesterScheduleRepository.find({
        where: {
          instructorId,
          dayOfWeek: dayOfWeek as any,
          trimester,
          isActive: true
        },
        relations: ['competence', 'ficha', 'instructor', 'instructor.profile']
      });
      
      console.log(`✅ Encontrados ${trimesterSchedules.length} horarios de trimestre`);
      
      // Convertir trimester schedules a class schedules format
      const classSchedules = trimesterSchedules.map((schedule) => {
        return {
          id: schedule.id,
          scheduleId: schedule.id,
          date: targetDate.toISOString().split('T')[0],
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          classroom: schedule.classroom || 'Sin aula',
          subject: schedule.competence?.name || 'Sin competencia',
          ficha: {
            id: schedule.ficha?.id || 0,
            code: schedule.ficha?.code || 'Sin código',
            name: schedule.ficha?.name || 'Sin nombre'
          },
          attendance: {
            total: 0,
            present: 0,
            late: 0,
            absent: 0,
            percentage: '0.0'
          },
          records: []
        };
      });
      
      console.log(`📋 Retornando ${classSchedules.length} clases convertidas`);
      return classSchedules;
      
    } catch (error) {
      console.error('❌ Error al obtener clases del instructor:', error);
      return [];
    }
  }

  // ⭐ OBTENER HORARIOS DE TRIMESTRE DEL INSTRUCTOR
  async getInstructorTrimesterSchedules(instructorId: number, trimester: string): Promise<WeeklySchedule> {
    try {
      console.log(`📋 Obteniendo horarios del instructor ${instructorId} para trimestre ${trimester}`);
      
      const schedules = await this.trimesterScheduleRepository.find({
        where: {
          instructorId,
          trimester,
          isActive: true
        },
        relations: ['competence', 'ficha', 'instructor', 'instructor.profile']
      });

      // ⭐ TIPAR EXPLÍCITAMENTE EL weeklySchedule
      const weeklySchedule: WeeklySchedule = {
        LUNES: [],
        MARTES: [],
        MIERCOLES: [],
        JUEVES: [],
        VIERNES: [],
        SABADO: []
      };

      schedules.forEach(schedule => {
        const scheduleItem: ScheduleItem = {
          id: schedule.id,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          classroom: schedule.classroom || 'Sin aula',
          competence: {
            id: schedule.competence?.id || 0,
            name: schedule.competence?.name || 'Sin competencia'
          },
          ficha: {
            id: schedule.ficha?.id || 0,
            code: schedule.ficha?.code || 'Sin código',
            name: schedule.ficha?.name || 'Sin nombre'
          }
        };

        weeklySchedule[schedule.dayOfWeek].push(scheduleItem);
      });

      // Ordenar horarios por hora de inicio
      Object.keys(weeklySchedule).forEach(day => {
        weeklySchedule[day as keyof WeeklySchedule].sort((a, b) => a.startTime.localeCompare(b.startTime));
      });

      console.log('✅ Horarios del instructor obtenidos:', schedules.length);
      return weeklySchedule;
    } catch (error) {
      console.error('❌ Error al obtener horarios del instructor:', error);
      throw error;
    }
  }

  // ⭐ OBTENER FICHAS DEL INSTRUCTOR
  async getInstructorFichas(instructorId: number): Promise<InstructorFicha[]> {
    try {
      console.log(`📋 Obteniendo fichas asignadas al instructor ${instructorId}`);
      
      const assignments = await this.trimesterScheduleRepository.find({
        where: {
          instructorId,
          isActive: true
        },
        relations: ['ficha', 'competence'],
        select: ['id', 'trimester', 'instructorId', 'fichaId', 'isActive', 'createdAt']
      });

      const uniqueFichas = assignments.reduce<InstructorFicha[]>((acc, assignment) => {
        const fichaId = assignment.ficha?.id;
        if (fichaId && !acc.find(f => f.fichaId === fichaId)) {
          acc.push({
            id: assignment.id,
            instructorId: assignment.instructorId,
            fichaId: assignment.ficha.id,
            ficha: {
              id: assignment.ficha.id,
              code: assignment.ficha.code || 'Sin código',
              name: assignment.ficha.name || 'Sin nombre'
            },
            subject: assignment.competence?.name || 'Sin materia',
            trimester: assignment.trimester,
            assignedAt: assignment.createdAt || new Date(),
            description: `Instructor asignado para ${assignment.competence?.name || 'competencia'}`,
            isActive: assignment.isActive
          });
        }
        return acc;
      }, []);

      console.log('✅ Fichas del instructor obtenidas:', uniqueFichas.length);
      return uniqueFichas;
    } catch (error) {
      console.error('❌ Error al obtener fichas del instructor:', error);
      return [];
    }
  }

  // ⭐ CREAR HORARIO DE CLASE
  async createClassSchedule(data: CreateClassScheduleDto) {
    try {
      console.log('📋 Creando horario de clase:', data);

      const schedule = this.scheduleRepository.create({
        assignmentId: data.assignmentId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        classroom: data.classroom,
        description: data.description,
        lateToleranceMinutes: data.lateToleranceMinutes || 15,
        isActive: true
      });

      const savedSchedule = await this.scheduleRepository.save(schedule);
      console.log('✅ Horario de clase creado exitosamente');
      return savedSchedule;
    } catch (error) {
      console.error('❌ Error al crear horario de clase:', error);
      throw error;
    }
  }

  // ⭐ OBTENER HORARIOS POR ASIGNACIÓN
  async getSchedulesByAssignment(assignmentId: number) {
    try {
      console.log(`📋 Obteniendo horarios para asignación ${assignmentId}`);

      const schedules = await this.scheduleRepository.find({
        where: {
          assignmentId,
          isActive: true
        },
        relations: ['assignment', 'assignment.instructor', 'assignment.instructor.profile', 'assignment.ficha'],
        order: { date: 'ASC', startTime: 'ASC' }
      });

      console.log('✅ Horarios por asignación obtenidos:', schedules.length);
      return schedules;
    } catch (error) {
      console.error('❌ Error al obtener horarios por asignación:', error);
      return [];
    }
  }

  // ⭐ OBTENER CLASES DE HOY PARA INSTRUCTOR
  async getInstructorTodayClasses(instructorId: number) {
    try {
      console.log(`📋 Obteniendo clases de hoy para instructor ${instructorId}`);

      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      // Usar trimester_schedules para obtener clases de hoy
      return await this.getMyClassesAttendance(instructorId, todayString);
    } catch (error) {
      console.error('❌ Error al obtener clases de hoy:', error);
      return [];
    }
  }

  // ⭐ OBTENER HORARIOS POR FECHA
  async getSchedulesByDate(date: string, instructorId?: number) {
    try {
      console.log(`📋 Obteniendo horarios para fecha ${date}, instructor: ${instructorId}`);

      if (instructorId) {
        // Usar trimester_schedules para instructor específico
        return await this.getMyClassesAttendance(instructorId, date);
      }

      // Obtener todos los horarios para la fecha
      const schedules = await this.scheduleRepository.find({
        where: {
          date: new Date(date),
          isActive: true
        },
        relations: ['assignment', 'assignment.instructor', 'assignment.instructor.profile', 'assignment.ficha'],
        order: { startTime: 'ASC' }
      });

      console.log('✅ Horarios por fecha obtenidos:', schedules.length);
      return schedules;
    } catch (error) {
      console.error('❌ Error al obtener horarios por fecha:', error);
      return [];
    }
  }

  // ⭐ OBTENER HORARIO POR ID
  async getScheduleById(scheduleId: number) {
    try {
      console.log(`📋 Obteniendo horario ${scheduleId}`);

      const schedule = await this.scheduleRepository.findOne({
        where: { id: scheduleId },
        relations: ['assignment', 'assignment.instructor', 'assignment.instructor.profile', 'assignment.ficha']
      });

      if (!schedule) {
        throw new Error('Horario no encontrado');
      }

      console.log('✅ Horario obtenido exitosamente');
      return schedule;
    } catch (error) {
      console.error('❌ Error al obtener horario:', error);
      throw error;
    }
  }

  // ⭐ MARCAR ASISTENCIA
  async markAttendance(data: {
    scheduleId: number;
    profileId: number;
    status: 'PRESENTE' | 'AUSENTE' | 'TARDE';
    notes?: string;
    markedBy?: number;
  }) {
    try {
      console.log('📋 Marcando asistencia:', data);

      // ⭐ CONVERTIR ESTADOS DE ESPAÑOL A INGLÉS
      const statusMapping = {
        'PRESENTE': 'PRESENT' as const,
        'AUSENTE': 'ABSENT' as const,
        'TARDE': 'LATE' as const
      };

      const englishStatus = statusMapping[data.status];

      // Verificar si ya existe un registro de asistencia
      const existingRecord = await this.attendanceRepository.findOne({
        where: {
          scheduleId: data.scheduleId,
          learnerId: data.profileId
        }
      });

      if (existingRecord) {
        // Actualizar registro existente
        existingRecord.status = englishStatus;
        existingRecord.notes = data.notes;
        existingRecord.manuallyMarkedAt = new Date();
        existingRecord.markedAt = new Date();
        existingRecord.markedBy = data.markedBy;
        existingRecord.isManual = true;

        const updatedRecord = await this.attendanceRepository.save(existingRecord);
        console.log('✅ Asistencia actualizada exitosamente');
        return updatedRecord;
      } else {
        // ⭐ CREAR NUEVO REGISTRO CON TIPOS CORRECTOS
        const newRecord = this.attendanceRepository.create({
          scheduleId: data.scheduleId,
          learnerId: data.profileId,
          status: englishStatus,
          notes: data.notes,
          markedAt: new Date(),
          manuallyMarkedAt: new Date(),
          markedBy: data.markedBy,
          isManual: true,
          accessRecordId: undefined
        });

        const savedRecord = await this.attendanceRepository.save(newRecord);
        console.log('✅ Asistencia marcada exitosamente');
        return savedRecord;
      }
    } catch (error) {
      console.error('❌ Error al marcar asistencia:', error);
      throw error;
    }
  }

  // ⭐ OBTENER ASISTENCIA POR HORARIO
  async getAttendanceBySchedule(scheduleId: number) {
    try {
      console.log(`📋 Obteniendo asistencia para horario ${scheduleId}`);

      const records = await this.attendanceRepository.find({
        where: { scheduleId },
        relations: ['learner', 'schedule', 'accessRecord']
      });

      // ⭐ FORMATEAR REGISTROS PARA EL FRONTEND
      const formattedRecords = records.map(record => ({
        id: record.id,
        attendanceId: record.id,
        learnerId: record.learnerId,
        learnerName: record.learner 
          ? `${record.learner.firstName} ${record.learner.lastName}`
          : 'Sin nombre',
        status: record.status,
        markedAt: record.markedAt?.toISOString() || null,
        manuallyMarkedAt: record.manuallyMarkedAt?.toISOString() || null,
        isManual: record.isManual,
        accessTime: record.accessRecord?.entryTime?.toISOString() || null,
        notes: record.notes,
        markedBy: record.markedBy,
        learner: {
          id: record.learner?.id || record.learnerId,
          firstName: record.learner?.firstName || '',
          lastName: record.learner?.lastName || '',
          documentNumber: record.learner?.documentNumber || ''
        }
      }));

      console.log('✅ Registros de asistencia obtenidos:', formattedRecords.length);
      return formattedRecords;
    } catch (error) {
      console.error('❌ Error al obtener asistencia:', error);
      return [];
    }
  }

  // ⭐ MARCAR ASISTENCIA AUTOMÁTICA
  async autoMarkAttendance(profileId: number, entryTime: Date, accessRecordId?: number) {
    try {
      console.log(`📋 Marcando asistencia automática para perfil ${profileId} a las ${entryTime}`);

      // Buscar horarios activos para hoy que correspondan al perfil
      const today = entryTime.toISOString().split('T')[0];
      const currentTime = entryTime.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

      // Buscar en trimester schedules primero
      const dayNames = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
      const dayOfWeek = dayNames[entryTime.getDay()];
      
      const year = entryTime.getFullYear();
      const month = entryTime.getMonth() + 1;
      let trimester: string;
      if (month >= 1 && month <= 4) trimester = `${year}-1`;
      else if (month >= 5 && month <= 8) trimester = `${year}-2`;
      else trimester = `${year}-3`;

      const trimesterSchedules = await this.trimesterScheduleRepository.find({
        where: {
          dayOfWeek: dayOfWeek as any,
          trimester,
          isActive: true
        },
        relations: ['ficha', 'competence']
      });

      // Buscar horarios que coincidan con la hora de entrada (con tolerancia)
      const matchingSchedules = trimesterSchedules.filter(schedule => {
        const startTime = schedule.startTime;
        const endTime = schedule.endTime;
        
        // Verificar si la hora de entrada está dentro del rango del horario
        return currentTime >= startTime && currentTime <= endTime;
      });

      if (matchingSchedules.length === 0) {
        console.log('⚠️ No se encontraron horarios activos para esta hora');
        return { 
          success: false,
          message: 'No hay clases activas en este momento', 
          profileId, 
          entryTime,
          records: []
        };
      }

      // ⭐ USAR ARRAY TIPADO CORRECTAMENTE
      const attendanceRecords: AttendanceRecord[] = [];
      
      for (const schedule of matchingSchedules) {
        // Determinar estado basado en la hora de llegada
        let status: 'PRESENT' | 'LATE' | 'ABSENT' = 'PRESENT';
        const scheduleStart = new Date(`${today}T${schedule.startTime}`);
        const toleranceMinutes = 15; // Tolerancia por defecto
        const lateThreshold = new Date(scheduleStart.getTime() + toleranceMinutes * 60000);
        
        if (entryTime > lateThreshold) {
          status = 'LATE';
        }

        // Verificar si ya existe registro
        const existingRecord = await this.attendanceRepository.findOne({
          where: {
            scheduleId: schedule.id,
            learnerId: profileId
          }
        });

        if (!existingRecord) {
          // ⭐ CREAR REGISTRO CON TIPOS CORRECTOS
          const newRecord = this.attendanceRepository.create({
            scheduleId: schedule.id,
            learnerId: profileId,
            status: status,
            markedAt: entryTime,
            accessRecordId: accessRecordId,
            isManual: false,
            notes: `Marcado automáticamente por control de acceso`
          });

          const savedRecord = await this.attendanceRepository.save(newRecord);
          attendanceRecords.push(savedRecord);
        }
      }

      console.log(`✅ Asistencia automática marcada para ${attendanceRecords.length} clases`);
      return {
        success: true,
        message: `Asistencia marcada automáticamente para ${attendanceRecords.length} clases`,
        profileId,
        entryTime,
        records: attendanceRecords
      };
    } catch (error) {
      console.error('❌ Error en asistencia automática:', error);
      return {
        success: false,
        message: 'Error al marcar asistencia automática',
        profileId,
        entryTime,
        records: [],
        error: error.message
      };
    }
  }

  // ⭐ CREAR HORARIO DE TRIMESTRE
  async createTrimesterSchedule(data: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    competenceId: number;
    instructorId: number;
    fichaId: number;
    classroom?: string;
    trimester: string;
  }) {
    try {
      console.log('📋 Creando horario de trimestre:', data);

      const schedule = this.trimesterScheduleRepository.create({
        dayOfWeek: data.dayOfWeek as any,
        startTime: data.startTime,
        endTime: data.endTime,
        competenceId: data.competenceId,
        instructorId: data.instructorId,
        fichaId: data.fichaId,
        classroom: data.classroom,
        trimester: data.trimester,
        isActive: true
      });

      const savedSchedule = await this.trimesterScheduleRepository.save(schedule);
      console.log('✅ Horario de trimestre creado exitosamente');
      return savedSchedule;
    } catch (error) {
      console.error('❌ Error al crear horario de trimestre:', error);
      throw error;
    }
  }

  // ⭐ OBTENER HORARIO DE TRIMESTRE POR FICHA
  async getTrimesterSchedule(fichaId: number, trimester: string) {
    try {
      console.log(`📋 Obteniendo horarios de trimestre para ficha ${fichaId}, trimestre ${trimester}`);

      const schedules = await this.trimesterScheduleRepository.find({
        where: {
          fichaId,
          trimester,
          isActive: true
        },
        relations: ['competence', 'instructor', 'instructor.profile', 'ficha']
      });

      // ⭐ TIPAR EXPLÍCITAMENTE EL weeklySchedule
      const weeklySchedule: Record<string, TrimesterScheduleItem[]> = {
        LUNES: [],
        MARTES: [],
        MIERCOLES: [],
        JUEVES: [],
        VIERNES: [],
        SABADO: []
      };

      schedules.forEach(schedule => {
        const scheduleItem: TrimesterScheduleItem = {
          id: schedule.id,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          classroom: schedule.classroom || 'Sin aula',
          competence: {
            id: schedule.competence?.id || 0,
            name: schedule.competence?.name || 'Sin competencia'
          },
          instructor: {
            id: schedule.instructor?.id || 0,
            name: schedule.instructor?.profile 
              ? `${schedule.instructor.profile.firstName} ${schedule.instructor.profile.lastName}`
              : 'Sin instructor'
          }
        };

        weeklySchedule[schedule.dayOfWeek].push(scheduleItem);
      });

      // Ordenar por hora de inicio
      Object.keys(weeklySchedule).forEach(day => {
        weeklySchedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
      });

      console.log('✅ Horarios de trimestre obtenidos');
      return weeklySchedule;
    } catch (error) {
      console.error('❌ Error al obtener horarios de trimestre:', error);
      throw error;
    }
  }

  // ⭐ ELIMINAR HORARIO DE TRIMESTRE
  async deleteTrimesterSchedule(id: number) {
    try {
      console.log(`📋 Eliminando horario de trimestre ${id}`);

      const schedule = await this.trimesterScheduleRepository.findOne({
        where: { id }
      });

      if (!schedule) {
        throw new Error('Horario no encontrado');
      }

      // Desactivar en lugar de eliminar
      schedule.isActive = false;
      await this.trimesterScheduleRepository.save(schedule);

      console.log('✅ Horario de trimestre eliminado exitosamente');
      return { message: 'Horario eliminado exitosamente', id };
    } catch (error) {
      console.error('❌ Error al eliminar horario de trimestre:', error);
      throw error;
    }
  }

  // ⭐ OBTENER ESTADÍSTICAS DE ASISTENCIA
  async getAttendanceStats(assignmentId: number, startDate?: Date, endDate?: Date) {
    try {
      console.log(`📋 Obteniendo estadísticas de asistencia para asignación ${assignmentId}`);

      // Implementar lógica de estadísticas
      return {
        message: 'Estadísticas de asistencia - Funcionalidad pendiente',
        assignmentId,
        startDate,
        endDate
      };
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }

  // ⭐ OBTENER REPORTE DE ASISTENCIA
  async getAttendanceReport(assignmentId: number, startDate?: Date, endDate?: Date) {
    try {
      console.log(`📋 Obteniendo reporte de asistencia para asignación ${assignmentId}`);

      // Implementar lógica de reporte
      return {
        message: 'Reporte de asistencia - Funcionalidad pendiente',
        assignmentId,
        startDate,
        endDate
      };
    } catch (error) {
      console.error('❌ Error al obtener reporte:', error);
      throw error;
    }
  }

  // ⭐ OBTENER ESTADÍSTICAS DEL DASHBOARD DEL INSTRUCTOR
  async getInstructorDashboardStats(instructorId: number) {
    try {
      console.log(`📋 Obteniendo estadísticas del dashboard para instructor ${instructorId}`);

      const fichas = await this.getInstructorFichas(instructorId);
      const today = new Date();
      const todayClasses = await this.getMyClassesAttendance(instructorId, today.toISOString().split('T')[0]);

      return {
        totalFichas: fichas.length,
        activeFichas: fichas.filter(f => f.isActive).length,
        todayClasses: todayClasses.length,
        totalStudents: 0, // Implementar cuando tengas acceso a estudiantes
        attendanceToday: 0 // Implementar cuando tengas registros de asistencia
      };
    } catch (error) {
      console.error('❌ Error al obtener estadísticas del dashboard:', error);
      return {
        totalFichas: 0,
        activeFichas: 0,
        todayClasses: 0,
        totalStudents: 0,
        attendanceToday: 0
      };
    }
  }
}
