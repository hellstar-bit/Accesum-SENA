// backend/src/attendance/attendance.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { ClassSchedule } from './entities/class-schedule.entity';
import { InstructorAssignment } from './entities/instructor-assignment.entity';
import { Profile } from '../profiles/entities/profile.entity';

@Injectable()
export class AttendanceService {
  getInstructorTodayClasses: any;
  createClassSchedule(arg0: { date: Date; assignmentId: number; startTime: string; endTime: string; classroom?: string; description?: string; }) {
    throw new Error('Method not implemented.');
  }
  getSchedulesByAssignment(assignmentId: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepository: Repository<AttendanceRecord>,
    
    @InjectRepository(ClassSchedule)
    private readonly scheduleRepository: Repository<ClassSchedule>,
    
    @InjectRepository(InstructorAssignment)
    private readonly instructorAssignmentRepository: Repository<InstructorAssignment>,
    
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  // ⭐ OBTENER ASISTENCIA DE LAS CLASES DEL INSTRUCTOR
  async getInstructorAttendance(instructorId: number, date: Date = new Date()) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const schedules = await this.scheduleRepository.find({
        where: {
          date: Between(startOfDay, endOfDay),
          assignment: { instructorId }
        },
        relations: [
          'assignment',
          'assignment.ficha',
          'attendanceRecords',
          'attendanceRecords.learner',
          'attendanceRecords.accessRecord'
        ],
        order: { startTime: 'ASC' }
      });

      return schedules.map(schedule => ({
        scheduleId: schedule.id,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        classroom: schedule.classroom,
        subject: schedule.assignment?.subject || 'Sin asignatura',
        ficha: {
          id: schedule.assignment?.ficha?.id,
          code: schedule.assignment?.ficha?.code,
          name: schedule.assignment?.ficha?.name
        },
        attendance: schedule.attendanceRecords.map(record => ({
          attendanceId: record.id,
          learnerId: record.learnerId,
          learnerName: record.learner
            ? `${record.learner.firstName} ${record.learner.lastName}`
            : 'Sin nombre',
          status: record.status,
          markedAt: record.markedAt,
          isManual: record.isManual,
          accessTime: record.accessRecord?.entryTime || null,
          notes: record.notes
        }))
      }));
    } catch (error) {
      console.error('Error al obtener asistencia del instructor:', error);
      throw error;
    }
  }

  // ⭐ OBTENER FICHAS ASIGNADAS A UN INSTRUCTOR
  async getInstructorFichas(instructorId: number) {
    try {
      const assignments = await this.instructorAssignmentRepository.find({
        where: { 
          instructorId,
          isActive: true 
        },
        relations: [
          'instructor',
          'instructor.profile',
          'ficha'
        ],
        order: {
          assignedAt: 'DESC'
        }
      });

      return assignments.map(assignment => ({
        id: assignment.id,
        instructorId: assignment.instructorId,
        fichaId: assignment.fichaId,
        subject: assignment.subject,
        description: assignment.description,
        isActive: assignment.isActive,
        assignedAt: assignment.assignedAt,
        instructor: {
          id: assignment.instructor.id,
          email: assignment.instructor.email,
          profile: {
            firstName: assignment.instructor.profile?.firstName,
            lastName: assignment.instructor.profile?.lastName
          }
        },
        ficha: {
          id: assignment.ficha.id,
          code: assignment.ficha.code,
          name: assignment.ficha.name,
          status: assignment.ficha.status
        }
      }));
    } catch (error) {
      console.error('Error al obtener fichas del instructor:', error);
      throw new Error('Error al obtener las fichas del instructor');
    }
  }

  // ⭐ ASIGNAR INSTRUCTOR A FICHA
  async assignInstructorToFicha(data: {
    instructorId: number;
    fichaId: number;
    subject: string;
    description?: string;
  }) {
    try {
      // Verificar si ya existe una asignación activa
      const existingAssignment = await this.instructorAssignmentRepository.findOne({
        where: {
          instructorId: data.instructorId,
          fichaId: data.fichaId,
          isActive: true
        }
      });

      if (existingAssignment) {
        throw new BadRequestException('El instructor ya está asignado a esta ficha');
      }

      // Crear nueva asignación
      const assignment = this.instructorAssignmentRepository.create({
        instructorId: data.instructorId,
        fichaId: data.fichaId,
        subject: data.subject,
        description: data.description,
        isActive: true,
        assignedAt: new Date()
      });

      const savedAssignment = await this.instructorAssignmentRepository.save(assignment);

      // Retornar con relaciones
      return await this.instructorAssignmentRepository.findOne({
        where: { id: savedAssignment.id },
        relations: ['instructor', 'instructor.profile', 'ficha']
      });
    } catch (error) {
      console.error('Error al asignar instructor a ficha:', error);
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
      // Mapear estados del frontend al backend
      const statusMap = {
        'PRESENTE': 'PRESENT',
        'TARDE': 'LATE',
        'AUSENTE': 'ABSENT'
      };

      const mappedStatus = statusMap[data.status] as 'PRESENT' | 'LATE' | 'ABSENT';

      // Verificar si ya existe un registro
      let attendanceRecord = await this.attendanceRepository.findOne({
        where: {
          scheduleId: data.scheduleId,
          learnerId: data.profileId
        }
      });

      if (attendanceRecord) {
        // Actualizar registro existente
        attendanceRecord.status = mappedStatus;
        attendanceRecord.notes = data.notes ?? '';
        attendanceRecord.isManual = true;
        attendanceRecord.manuallyMarkedAt = new Date();
      } else {
        // Crear nuevo registro
        attendanceRecord = this.attendanceRepository.create({
          scheduleId: data.scheduleId,
          learnerId: data.profileId,
          status: mappedStatus,
          notes: data.notes,
          isManual: true,
          markedAt: new Date(),
          manuallyMarkedAt: new Date()
        });
      }

      return await this.attendanceRepository.save(attendanceRecord);
    } catch (error) {
      console.error('Error al marcar asistencia:', error);
      throw error;
    }
  }
  async getSchedulesByDate(date: Date, instructorId?: number) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const whereCondition: any = {
      date: Between(startOfDay, endOfDay),
      isActive: true
    };

    // Si se proporciona instructorId, filtrar por instructor
    if (instructorId) {
      whereCondition.assignment = { instructorId };
    }

    const schedules = await this.scheduleRepository.find({
      where: whereCondition,
      relations: [
        'assignment',
        'assignment.instructor',
        'assignment.instructor.profile',
        'assignment.ficha',
        'attendanceRecords',
        'attendanceRecords.learner'
      ],
      order: { startTime: 'ASC' }
    });

    return schedules.map(schedule => ({
      id: schedule.id,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      classroom: schedule.classroom,
      description: schedule.description,
      lateToleranceMinutes: schedule.lateToleranceMinutes,
      isActive: schedule.isActive,
      assignment: {
        id: schedule.assignment.id,
        subject: schedule.assignment.subject,
        instructor: {
          id: schedule.assignment.instructor.id,
          name: schedule.assignment.instructor.profile 
            ? `${schedule.assignment.instructor.profile.firstName} ${schedule.assignment.instructor.profile.lastName}`
            : 'Sin nombre'
        },
        ficha: {
          id: schedule.assignment.ficha.id,
          code: schedule.assignment.ficha.code,
          name: schedule.assignment.ficha.name
        }
      },
      attendanceCount: {
        total: schedule.attendanceRecords.length,
        present: schedule.attendanceRecords.filter(r => r.status === 'PRESENT').length,
        late: schedule.attendanceRecords.filter(r => r.status === 'LATE').length,
        absent: schedule.attendanceRecords.filter(r => r.status === 'ABSENT').length
      }
    }));
  } catch (error) {
    console.error('Error al obtener horarios por fecha:', error);
    throw error;
  }
}
// backend/src/attendance/attendance.service.ts
// Agregar estos métodos adicionales:

async createSchedule(data: {
  assignmentId: number;
  date: string;
  startTime: string;
  endTime: string;
  classroom?: string;
  description?: string;
  lateToleranceMinutes?: number;
}) {
  try {
    const schedule = this.scheduleRepository.create({
      assignmentId: data.assignmentId,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      classroom: data.classroom,
      description: data.description,
      lateToleranceMinutes: data.lateToleranceMinutes || 20,
      isActive: true
    });

    return await this.scheduleRepository.save(schedule);
  } catch (error) {
    console.error('Error al crear horario:', error);
    throw error;
  }
}

async updateSchedule(scheduleId: number, data: {
  date?: string;
  startTime?: string;
  endTime?: string;
  classroom?: string;
  description?: string;
  lateToleranceMinutes?: number;
}) {
  try {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId }
    });

    if (!schedule) {
      throw new Error('Horario no encontrado');
    }

    if (data.date) schedule.date = new Date(data.date);
    if (data.startTime) schedule.startTime = data.startTime;
    if (data.endTime) schedule.endTime = data.endTime;
    if (data.classroom !== undefined) schedule.classroom = data.classroom;
    if (data.description !== undefined) schedule.description = data.description;
    if (data.lateToleranceMinutes !== undefined) schedule.lateToleranceMinutes = data.lateToleranceMinutes;

    return await this.scheduleRepository.save(schedule);
  } catch (error) {
    console.error('Error al actualizar horario:', error);
    throw error;
  }
}

async deleteSchedule(scheduleId: number) {
  try {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId }
    });

    if (!schedule) {
      throw new Error('Horario no encontrado');
    }

    // Marcar como inactivo en lugar de eliminar
    schedule.isActive = false;
    return await this.scheduleRepository.save(schedule);
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    throw error;
  }
}

async getScheduleById(scheduleId: number) {
  try {
    return await this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: [
        'assignment',
        'assignment.instructor',
        'assignment.instructor.profile',
        'assignment.ficha',
        'attendanceRecords',
        'attendanceRecords.learner'
      ]
    });
  } catch (error) {
    console.error('Error al obtener horario por ID:', error);
    throw error;
  }
}


  // ⭐ OBTENER ASISTENCIA POR HORARIO
  async getAttendanceBySchedule(scheduleId: number) {
    try {
      const records = await this.attendanceRepository.find({
        where: { scheduleId },
        relations: ['learner', 'accessRecord'],
        order: { createdAt: 'ASC' }
      });

      return records.map(record => ({
        id: record.id,
        learnerId: record.learnerId,
        learnerName: record.learner 
          ? `${record.learner.firstName} ${record.learner.lastName}`
          : 'Sin nombre',
        status: record.status,
        markedAt: record.markedAt,
        isManual: record.isManual,
        accessTime: record.accessRecord?.entryTime,
        notes: record.notes
      }));
    } catch (error) {
      console.error('Error al obtener asistencia por horario:', error);
      throw error;
    }
  }

  // ⭐ MARCAR ASISTENCIA AUTOMÁTICA (desde control de acceso)
  async autoMarkAttendance(profileId: number, entryTime: Date, accessRecordId?: number) {
    try {
      const profile = await this.profileRepository.findOne({
        where: { id: profileId },
        relations: ['ficha']
      });

      if (!profile?.ficha) {
        console.log('Perfil sin ficha asociada:', profileId);
        return [];
      }

      const today = new Date(entryTime);
      today.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      // Buscar horarios de clase para esa ficha en ese día
      const schedules = await this.scheduleRepository.find({
        where: {
          date: Between(today, endOfDay),
          assignment: { fichaId: profile.ficha.id }
        },
        relations: ['assignment']
      });

      if (schedules.length === 0) {
        console.log('No hay horarios para la ficha:', profile.ficha.id);
        return [];
      }

      const attendanceRecords: AttendanceRecord[] = [];

      for (const schedule of schedules) {
        // Verificar si ya existe un registro de asistencia
        const existingRecord = await this.attendanceRepository.findOne({
          where: {
            scheduleId: schedule.id,
            learnerId: profileId
          }
        });

        if (existingRecord) {
          console.log('Ya existe registro de asistencia para:', profileId, schedule.id);
          continue;
        }

        // Calcular estado de asistencia
        const status = this.calculateAttendanceStatus(
          entryTime, 
          schedule.startTime, 
          schedule.lateToleranceMinutes || 20
        );

        // Crear nuevo registro de asistencia
        const attendanceRecord = this.attendanceRepository.create({
          scheduleId: schedule.id,
          learnerId: profileId,
          status,
          accessRecordId, // Vincular con el registro de acceso
          markedAt: new Date(),
          isManual: false
        });

        const savedRecord = await this.attendanceRepository.save(attendanceRecord);
        attendanceRecords.push(savedRecord);
      }

      return attendanceRecords;
    } catch (error) {
      console.error('Error en autoMarkAttendance:', error);
      throw error;
    }
  }

  // ⭐ CALCULAR ESTADO DE ASISTENCIA
  private calculateAttendanceStatus(
    entryTime: Date, 
    scheduleStartTime: string, 
    lateToleranceMinutes: number
  ): 'PRESENT' | 'LATE' | 'ABSENT' {
    const entryHour = entryTime.getHours();
    const entryMinute = entryTime.getMinutes();
    
    const [scheduleHour, scheduleMinute] = scheduleStartTime.split(':').map(Number);
    
    const entryTotalMinutes = entryHour * 60 + entryMinute;
    const scheduleTotalMinutes = scheduleHour * 60 + scheduleMinute;
    
    const diffMinutes = entryTotalMinutes - scheduleTotalMinutes;
    
    if (diffMinutes <= 0) {
      return 'PRESENT'; // Llegó a tiempo o temprano
    } else if (diffMinutes <= lateToleranceMinutes) {
      return 'LATE'; // Llegó tarde pero dentro de la tolerancia
    } else {
      return 'ABSENT'; // Llegó muy tarde
    }
  }

  // ⭐ OBTENER ESTADÍSTICAS DEL DASHBOARD DEL INSTRUCTOR
  async getInstructorDashboardStats(instructorId: number) {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      // Obtener clases de hoy
      const todaySchedules = await this.scheduleRepository.find({
        where: {
          date: Between(startOfDay, endOfDay),
          assignment: { instructorId }
        },
        relations: ['attendanceRecords']
      });

      // Calcular estadísticas
      let totalStudents = 0;
      let presentToday = 0;
      let lateToday = 0;
      let absentToday = 0;

      todaySchedules.forEach(schedule => {
        schedule.attendanceRecords.forEach(record => {
          totalStudents++;
          switch (record.status) {
            case 'PRESENT':
              presentToday++;
              break;
            case 'LATE':
              lateToday++;
              break;
            case 'ABSENT':
              absentToday++;
              break;
          }
        });
      });

      return {
        totalClasses: todaySchedules.length,
        totalStudents,
        presentToday,
        lateToday,
        absentToday,
        averageAttendance: totalStudents > 0 
          ? Math.round(((presentToday + lateToday) / totalStudents) * 100) 
          : 0
      };
    } catch (error) {
      console.error('Error al obtener estadísticas del dashboard:', error);
      throw error;
    }
  }

  // ⭐ OBTENER ESTADÍSTICAS DE ASISTENCIA
  async getAttendanceStats(
    assignmentId: number,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      const whereCondition: any = {
        schedule: { assignmentId }
      };

      if (startDate && endDate) {
        whereCondition.createdAt = Between(startDate, endDate);
      }

      const records = await this.attendanceRepository.find({
        where: whereCondition,
        relations: ['schedule']
      });

      const total = records.length;
      const present = records.filter(r => r.status === 'PRESENT').length;
      const late = records.filter(r => r.status === 'LATE').length;
      const absent = records.filter(r => r.status === 'ABSENT').length;

      return {
        total,
        present,
        late,
        absent,
        percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de asistencia:', error);
      throw error;
    }
  }

  // ⭐ OBTENER REPORTE DE ASISTENCIA
  async getAttendanceReport(
    assignmentId: number,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      const whereCondition: any = {
        schedule: { assignmentId }
      };

      if (startDate && endDate) {
        whereCondition.createdAt = Between(startDate, endDate);
      }

      const records = await this.attendanceRepository.find({
        where: whereCondition,
        relations: ['schedule', 'learner', 'accessRecord'],
        order: { createdAt: 'DESC' }
      });

      return records.map(record => ({
        id: record.id,
        date: record.schedule.date,
        startTime: record.schedule.startTime,
        endTime: record.schedule.endTime,
        learnerName: record.learner 
          ? `${record.learner.firstName} ${record.learner.lastName}`
          : 'Sin nombre',
        documentNumber: record.learner?.documentNumber,
        status: record.status,
        markedAt: record.markedAt,
        accessTime: record.accessRecord?.entryTime,
        isManual: record.isManual,
        notes: record.notes
      }));
    } catch (error) {
      console.error('Error al obtener reporte de asistencia:', error);
      throw error;
    }
  }

  // ⭐ ELIMINAR ASIGNACIÓN DE INSTRUCTOR
  async removeInstructorAssignment(assignmentId: number) {
    try {
      const assignment = await this.instructorAssignmentRepository.findOne({
        where: { id: assignmentId }
      });

      if (!assignment) {
        throw new NotFoundException('Asignación no encontrada');
      }

      // Marcar como inactiva en lugar de eliminar
      assignment.isActive = false;
      return await this.instructorAssignmentRepository.save(assignment);
    } catch (error) {
      console.error('Error al eliminar asignación:', error);
      throw error;
    }
  }

  // ⭐ OBTENER TODAS LAS ASIGNACIONES (Para administradores)
  async getAllInstructorAssignments() {
    try {
      return await this.instructorAssignmentRepository.find({
        relations: [
          'instructor',
          'instructor.profile',
          'ficha'
        ],
        order: {
          assignedAt: 'DESC'
        }
      });
    } catch (error) {
      console.error('Error al obtener todas las asignaciones:', error);
      throw error;
    }
  }
  async getTrimesterSchedule(fichaId: number, trimester: string) {
  try {
    console.log(`📋 Obteniendo horarios de trimestre para ficha ${fichaId}, trimestre ${trimester}`);
    
    // Por ahora retornamos estructura vacía ya que no tienes la tabla trimester_schedules
    // Cuando implementes la tabla, aquí harías la consulta real
    const weeklySchedule = {
      LUNES: [],
      MARTES: [],
      MIERCOLES: [],
      JUEVES: [],
      VIERNES: [],
      SABADO: []
    };

    console.log('📋 Horarios obtenidos (estructura vacía por ahora)');
    return weeklySchedule;
  } catch (error) {
    console.error('❌ Error al obtener horarios de trimestre:', error);
    // Retornar estructura vacía en caso de error
    return {
      LUNES: [],
      MARTES: [],
      MIERCOLES: [],
      JUEVES: [],
      VIERNES: [],
      SABADO: []
    };
  }
}

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
    
    // Por ahora solo logueamos, cuando tengas la tabla implementarás la lógica real
    console.log('✅ Horario creado (simulado por ahora)');
    
    return {
      id: Date.now(), // ID temporal
      ...data,
      isActive: true,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('❌ Error al crear horario de trimestre:', error);
    throw error;
  }
}

async deleteTrimesterSchedule(id: number) {
  try {
    console.log(`📋 Eliminando horario de trimestre ${id}`);
    
    // Por ahora solo logueamos
    console.log('✅ Horario eliminado (simulado por ahora)');
    
    return { message: 'Horario eliminado exitosamente' };
  } catch (error) {
    console.error('❌ Error al eliminar horario de trimestre:', error);
    throw error;
  }
}
}
