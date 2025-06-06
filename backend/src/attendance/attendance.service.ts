// attendance.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { InstructorAssignment } from './entities/instructor-assignment.entity';
import { ClassSchedule } from './entities/class-schedule.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { AccessRecord } from '../access/entities/access-record.entity';

@Injectable()
export class AttendanceService {
  autoMarkAttendance(profileId: number, entryTime: Date) {
    throw new Error('Method not implemented.');
  }
  getAttendanceReport(assignmentId: number, arg1: Date | undefined, arg2: Date | undefined) {
    throw new Error('Method not implemented.');
  }
  getAttendanceStats(assignmentId: number, arg1: Date | undefined, arg2: Date | undefined) {
    throw new Error('Method not implemented.');
  }
  getAttendanceBySchedule(scheduleId: number) {
    throw new Error('Method not implemented.');
  }
  markAttendance(data: { scheduleId: number; profileId: number; status: "PRESENTE" | "AUSENTE" | "TARDE"; notes?: string; }) {
    throw new Error('Method not implemented.');
  }
  getScheduleById(id: number) {
    throw new Error('Method not implemented.');
  }
  getSchedulesByDate(date: string, instructorId: number | undefined) {
    throw new Error('Method not implemented.');
  }
  getInstructorTodayClasses(id: any) {
    throw new Error('Method not implemented.');
  }
  getSchedulesByAssignment(assignmentId: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(InstructorAssignment)
    private assignmentRepository: Repository<InstructorAssignment>,
    @InjectRepository(ClassSchedule)
    private scheduleRepository: Repository<ClassSchedule>,
    @InjectRepository(AttendanceRecord)
    private attendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(AccessRecord)
    private accessRepository: Repository<AccessRecord>,
  ) {}

  // ⭐ ASIGNAR INSTRUCTOR A FICHA
  async assignInstructorToFicha(data: {
    instructorId: number;
    fichaId: number;
    subject: string;
    description?: string;
  }) {
    // Verificar que no exista la asignación
    const existing = await this.assignmentRepository.findOne({
      where: {
        instructorId: data.instructorId,
        fichaId: data.fichaId,
        subject: data.subject,
        isActive: true
      }
    });

    if (existing) {
      throw new BadRequestException('Esta asignación ya existe');
    }

    const assignment = this.assignmentRepository.create(data);
    return await this.assignmentRepository.save(assignment);
  }

  // ⭐ CREAR HORARIO DE CLASE
  async createClassSchedule(data: {
    assignmentId: number;
    date: Date;
    startTime: string;
    endTime: string;
    classroom?: string;
    description?: string;
    lateToleranceMinutes?: number;
  }) {
    const schedule = this.scheduleRepository.create({
      ...data,
      lateToleranceMinutes: data.lateToleranceMinutes || 20
    });
    return await this.scheduleRepository.save(schedule);
  }

  // ⭐ MARCAR ASISTENCIA AUTOMÁTICA CUANDO ENTRA APRENDIZ
  async markAutomaticAttendance(userId: number, entryTime: Date) {
    // Buscar el perfil del aprendiz
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['ficha']
    });

    if (!profile || !profile.ficha) {
      return; // No es aprendiz o no tiene ficha
    }

    const today = new Date(entryTime.toDateString());
    const currentTime = entryTime.getTime();

    // Buscar clases programadas para hoy en su ficha
    const todaySchedules = await this.scheduleRepository.find({
      where: {
        date: today,
        isActive: true,
        assignment: {
          fichaId: profile.fichaId,
          isActive: true
        }
      },
      relations: ['assignment', 'assignment.ficha']
    });

    for (const schedule of todaySchedules) {
      // Convertir tiempo de inicio de la clase a timestamp
      const [hours, minutes, seconds] = schedule.startTime.split(':');
      const classStartTime = new Date(today);
      classStartTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || '0'), 0);

      // Calcular límite de tolerancia
      const lateLimit = new Date(classStartTime.getTime() + (schedule.lateToleranceMinutes * 60 * 1000));

      // Verificar si ya existe registro de asistencia
      const existingRecord = await this.attendanceRepository.findOne({
        where: {
          scheduleId: schedule.id,
          learnerId: profile.id
        }
      });

      if (existingRecord) {
        continue; // Ya tiene registro para esta clase
      }

      // Determinar estado de asistencia
      let status: 'PRESENT' | 'LATE' | 'ABSENT';
      if (currentTime <= classStartTime.getTime()) {
        status = 'PRESENT';
      } else if (currentTime <= lateLimit.getTime()) {
        status = 'LATE';
      } else {
        // Si llegó muy tarde, no marcar asistencia automática
        continue;
      }

      // Crear registro de asistencia
      const attendanceRecord = this.attendanceRepository.create({
        scheduleId: schedule.id,
        learnerId: profile.id,
        status,
        markedAt: entryTime,
        isManual: false
      });

      await this.attendanceRepository.save(attendanceRecord);
    }
  }

  // ⭐ OBTENER ASISTENCIAS DE UN INSTRUCTOR
  async getInstructorAttendance(instructorId: number, date?: Date) {
    const whereCondition: any = {
      assignment: {
        instructorId,
        isActive: true
      }
    };

    if (date) {
      whereCondition.date = date;
    }

    const schedules = await this.scheduleRepository.find({
      where: whereCondition,
      relations: [
        'assignment',
        'assignment.ficha',
        'attendanceRecords',
        'attendanceRecords.learner'
      ],
      order: { date: 'DESC', startTime: 'ASC' }
    });

    return schedules.map(schedule => {
      const totalLearners = schedule.assignment.ficha.profiles?.length || 0;
      const presentCount = schedule.attendanceRecords.filter(r => r.status === 'PRESENT').length;
      const lateCount = schedule.attendanceRecords.filter(r => r.status === 'LATE').length;
      const absentCount = totalLearners - presentCount - lateCount;

      return {
        id: schedule.id,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        classroom: schedule.classroom,
        subject: schedule.assignment.subject,
        ficha: {
          code: schedule.assignment.ficha.code,
          name: schedule.assignment.ficha.name
        },
        attendance: {
          total: totalLearners,
          present: presentCount,
          late: lateCount,
          absent: absentCount,
          percentage: totalLearners > 0 ? ((presentCount + lateCount) / totalLearners * 100).toFixed(1) : '0'
        },
        records: schedule.attendanceRecords.map(record => ({
          id: record.id,
          learner: {
            id: record.learner.id,
            firstName: record.learner.firstName,
            lastName: record.learner.lastName,
            documentNumber: record.learner.documentNumber
          },
          status: record.status,
          markedAt: record.markedAt,
          isManual: record.isManual,
          notes: record.notes
        }))
      };
    });
  }

  // ⭐ MARCAR ASISTENCIA MANUAL (POR INSTRUCTOR)
  async markManualAttendance(
    instructorId: number,
    scheduleId: number,
    learnerId: number,
    status: 'PRESENT' | 'LATE' | 'ABSENT',
    notes?: string
  ) {
    // Verificar que el instructor tenga permiso para esta clase
    const schedule = await this.scheduleRepository.findOne({
      where: {
        id: scheduleId,
        assignment: {
          instructorId,
          isActive: true
        }
      },
      relations: ['assignment']
    });

    if (!schedule) {
      throw new NotFoundException('Clase no encontrada o sin permisos');
    }

    // Buscar o crear registro de asistencia
    let attendanceRecord = await this.attendanceRepository.findOne({
      where: { scheduleId, learnerId }
    });

    if (attendanceRecord) {
      // Actualizar registro existente
      attendanceRecord.status = status;
      attendanceRecord.manuallyMarkedAt = new Date();
      attendanceRecord.markedBy = instructorId;
      attendanceRecord.notes = notes ?? '';
      attendanceRecord.isManual = true;
    } else {
      // Crear nuevo registro
      attendanceRecord = this.attendanceRepository.create({
        scheduleId,
        learnerId,
        status,
        manuallyMarkedAt: new Date(),
        markedBy: instructorId,
        notes,
        isManual: true
      });
    }

    return await this.attendanceRepository.save(attendanceRecord);
  }

  // ⭐ OBTENER FICHAS DE UN INSTRUCTOR
  async getInstructorFichas(instructorId: number) {
    const assignments = await this.assignmentRepository.find({
      where: {
        instructorId,
        isActive: true
      },
      relations: ['ficha', 'ficha.profiles'],
      order: { assignedAt: 'DESC' }
    });

    return assignments.map(assignment => ({
      id: assignment.id,
      subject: assignment.subject,
      description: assignment.description,
      ficha: {
        id: assignment.ficha.id,
        code: assignment.ficha.code,
        name: assignment.ficha.name,
        status: assignment.ficha.status,
        totalLearners: assignment.ficha.profiles?.length || 0
      },
      assignedAt: assignment.assignedAt
    }));
  }

  // ⭐ PROCESAR MÚLTIPLES ASISTENCIAS AUTOMÁTICAS
  async processAccessForAttendance(accessRecord: AccessRecord) {
    if (accessRecord.status === 'entry') {
      await this.markAutomaticAttendance(accessRecord.userId, accessRecord.entryTime);
    }
  }
}