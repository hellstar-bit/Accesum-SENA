// backend/src/attendance/attendance.service.ts - CÓDIGO COMPLETO CORREGIDO
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InstructorAssignment } from './entities/instructor-assignment.entity';
import { ClassSchedule } from './entities/class-schedule.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(InstructorAssignment)
    private assignmentRepository: Repository<InstructorAssignment>,
    @InjectRepository(ClassSchedule)
    private scheduleRepository: Repository<ClassSchedule>,
    @InjectRepository(AttendanceRecord)
    private attendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ⭐ ASIGNAR INSTRUCTOR A FICHA
  async assignInstructorToFicha(data: {
    instructorId: number;
    fichaId: number;
    subject: string;
    description?: string;
  }) {
    // Verificar que el instructor existe y tiene el rol correcto
    const instructor = await this.userRepository.findOne({
      where: { id: data.instructorId },
      relations: ['role']
    });

    if (!instructor || instructor.role.name !== 'Instructor') {
      throw new BadRequestException('El usuario no es un instructor válido');
    }

    // Verificar que no exista ya una asignación activa
    const existingAssignment = await this.assignmentRepository.findOne({
      where: {
        instructorId: data.instructorId,
        fichaId: data.fichaId,
        isActive: true
      }
    });

    if (existingAssignment) {
      throw new BadRequestException('El instructor ya está asignado a esta ficha');
    }

    const assignment = this.assignmentRepository.create(data);
    return await this.assignmentRepository.save(assignment);
  }

  // ⭐ OBTENER FICHAS DE UN INSTRUCTOR
  async getInstructorFichas(instructorId: number) {
    return await this.assignmentRepository.find({
      where: { instructorId, isActive: true },
      relations: ['ficha', 'instructor'],
      order: { assignedAt: 'DESC' }
    });
  }

  // ⭐ CREAR HORARIO DE CLASE
  async createClassSchedule(data: {
    assignmentId: number;
    date: Date;
    startTime: string;
    endTime: string;
    classroom?: string;
    description?: string;
  }) {
    // Verificar que la asignación existe
    const assignment = await this.assignmentRepository.findOne({
      where: { id: data.assignmentId, isActive: true },
      relations: ['ficha']
    });

    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }

    // Crear el horario
    const schedule = this.scheduleRepository.create(data);
    const savedSchedule = await this.scheduleRepository.save(schedule);

    // Crear registros de asistencia para todos los aprendices de la ficha
    await this.createAttendanceRecordsForSchedule(savedSchedule.id, assignment.fichaId);

    return savedSchedule;
  }

  // ⭐ CREAR REGISTROS DE ASISTENCIA PARA UNA CLASE - CORREGIDO
  private async createAttendanceRecordsForSchedule(scheduleId: number, fichaId: number) {
    console.log(`🔍 Buscando aprendices para ficha ID: ${fichaId}`);
    
    // ⭐ CORREGIR: Buscar aprendices por fichaId correctamente
    const learners = await this.profileRepository
      .createQueryBuilder('profile')
      .leftJoin('profile.type', 'type')
      .leftJoin('profile.ficha', 'ficha')
      .where('ficha.id = :fichaId', { fichaId })
      .andWhere('type.name = :typeName', { typeName: 'Aprendiz' })
      .getMany();

    console.log(`🎓 Encontrados ${learners.length} aprendices para la ficha ${fichaId}`);

    if (learners.length === 0) {
      console.warn('⚠️ No se encontraron aprendices para esta ficha');
      return [];
    }

    // Crear registro de asistencia para cada aprendiz
    const attendanceRecords = learners.map(learner => 
      this.attendanceRepository.create({
        scheduleId,
        learnerId: learner.id,
        status: 'ABSENT', // Por defecto ausente
      })
    );

    const savedRecords = await this.attendanceRepository.save(attendanceRecords);
    console.log(`✅ ${savedRecords.length} registros de asistencia creados para la clase ${scheduleId}`);
    
    return savedRecords;
  }

  // ⭐ OBTENER CLASES Y ASISTENCIA DE UN INSTRUCTOR - CORREGIDO
  async getInstructorAttendance(instructorId: number, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`🔍 Buscando clases para instructor ${instructorId} en fecha ${date.toISOString().split('T')[0]}`);

    const schedules = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.assignment', 'assignment')
      .leftJoinAndSelect('assignment.ficha', 'ficha')
      .leftJoinAndSelect('schedule.attendanceRecords', 'records')
      .leftJoinAndSelect('records.learner', 'learner')
      .where('assignment.instructorId = :instructorId', { instructorId })
      .andWhere('schedule.date BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay })
      .andWhere('schedule.isActive = true')
      .orderBy('schedule.startTime', 'ASC')
      .getMany();

    console.log(`📚 Encontradas ${schedules.length} clases programadas`);

    // ⭐ PARA CADA CLASE, VERIFICAR QUE TENGA REGISTROS DE ASISTENCIA
    for (const schedule of schedules) {
      if (schedule.attendanceRecords.length === 0) {
        console.log(`⚠️ Clase ${schedule.id} no tiene registros de asistencia, creándolos...`);
        await this.createAttendanceRecordsForSchedule(schedule.id, schedule.assignment.fichaId);
        
        // Recargar la clase con los nuevos registros
        const updatedSchedule = await this.scheduleRepository.findOne({
          where: { id: schedule.id },
          relations: ['assignment', 'assignment.ficha', 'attendanceRecords', 'attendanceRecords.learner']
        });
        
        if (updatedSchedule) {
          schedule.attendanceRecords = updatedSchedule.attendanceRecords;
          console.log(`✅ Recargados ${schedule.attendanceRecords.length} registros para la clase ${schedule.id}`);
        }
      }
    }

    // Formatear datos para el frontend
    return schedules.map(schedule => {
      const totalRecords = schedule.attendanceRecords.length;
      const presentCount = schedule.attendanceRecords.filter(r => r.status === 'PRESENT').length;
      const lateCount = schedule.attendanceRecords.filter(r => r.status === 'LATE').length;
      const absentCount = schedule.attendanceRecords.filter(r => r.status === 'ABSENT').length;
      
      const percentage = totalRecords > 0 
        ? (((presentCount + lateCount) / totalRecords) * 100).toFixed(1)
        : '0.0';

      console.log(`📊 Clase ${schedule.id}: ${totalRecords} total, ${presentCount} presentes, ${lateCount} tardíos, ${absentCount} ausentes - ${percentage}% asistencia`);

      return {
        id: schedule.id,
        subject: schedule.assignment.subject,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        classroom: schedule.classroom,
        ficha: {
          code: schedule.assignment.ficha.code,
          name: schedule.assignment.ficha.name
        },
        attendance: {
          total: totalRecords,
          present: presentCount,
          late: lateCount,
          absent: absentCount,
          percentage
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

  // ⭐ OBTENER ESTADÍSTICAS DEL DASHBOARD DEL INSTRUCTOR - NUEVO
  async getInstructorDashboardStats(instructorId: number) {
    console.log(`👨‍🏫 Obteniendo estadísticas del dashboard para instructor ${instructorId}`);
    
    // Obtener todas las fichas asignadas
    const assignments = await this.assignmentRepository.find({
      where: { instructorId, isActive: true },
      relations: ['ficha']
    });

    console.log(`📚 Instructor ${instructorId} tiene ${assignments.length} fichas asignadas`);

    // Contar total de aprendices en todas las fichas
    let totalLearners = 0;
    for (const assignment of assignments) {
      const learnersCount = await this.profileRepository
        .createQueryBuilder('profile')
        .leftJoin('profile.type', 'type')
        .leftJoin('profile.ficha', 'ficha')
        .where('ficha.id = :fichaId', { fichaId: assignment.fichaId })
        .andWhere('type.name = :typeName', { typeName: 'Aprendiz' })
        .getCount();
      
      totalLearners += learnersCount;
      console.log(`📚 Ficha ${assignment.ficha.code}: ${learnersCount} aprendices`);
    }

    // Obtener clases de hoy
    const today = new Date();
    const todayClasses = await this.getInstructorAttendance(instructorId, today);

    console.log(`📊 Resumen: ${assignments.length} fichas, ${totalLearners} aprendices, ${todayClasses.length} clases hoy`);

    return {
      totalFichas: assignments.length,
      totalLearners,
      todayClasses: todayClasses.length,
      todayClassesData: todayClasses,
      assignments: assignments.map(a => ({
        id: a.id,
        subject: a.subject,
        ficha: {
          code: a.ficha.code,
          name: a.ficha.name
        }
      }))
    };
  }

  // ⭐ MARCAR ASISTENCIA MANUAL
  async markAttendance(data: {
    scheduleId: number;
    profileId: number;
    status: 'PRESENTE' | 'AUSENTE' | 'TARDE';
    notes?: string;
  }) {
    // Mapear estados del frontend al backend
    const statusMap = {
      'PRESENTE': 'PRESENT',
      'AUSENTE': 'ABSENT',
      'TARDE': 'LATE'
    };

    const mappedStatus = statusMap[data.status] as 'PRESENT' | 'ABSENT' | 'LATE';

    // Buscar el registro de asistencia
    let attendanceRecord = await this.attendanceRepository.findOne({
      where: {
        scheduleId: data.scheduleId,
        learnerId: data.profileId
      },
      relations: ['learner']
    });

    if (!attendanceRecord) {
      // Si no existe, crear uno nuevo
      attendanceRecord = this.attendanceRepository.create({
        scheduleId: data.scheduleId,
        learnerId: data.profileId,
        status: mappedStatus,
        isManual: true,
        manuallyMarkedAt: new Date(),
        notes: data.notes
      });
    } else {
      // Actualizar el existente
      attendanceRecord.status = mappedStatus;
      attendanceRecord.isManual = true;
      attendanceRecord.manuallyMarkedAt = new Date();
      attendanceRecord.notes = data.notes || '';
    }

    const saved = await this.attendanceRepository.save(attendanceRecord);
    console.log(`✅ Asistencia marcada manualmente: ${mappedStatus} para aprendiz ${data.profileId}`);
    
    return saved;
  }

  // ⭐ MARCAR ASISTENCIA AUTOMÁTICA (desde control de acceso)
  async autoMarkAttendance(profileId: number, entryTime: Date) {
    const today = new Date(entryTime);
    today.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(entryTime);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`🤖 Marcando asistencia automática para perfil ${profileId} a las ${entryTime.toLocaleString()}`);

    // Buscar clases del aprendiz para hoy
    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
      relations: ['ficha', 'type']
    });

    if (!profile || !profile.ficha || profile.type.name !== 'Aprendiz') {
      console.log(`⚠️ Perfil ${profileId} no es un aprendiz con ficha asignada`);
      return null;
    }

    console.log(`🎓 Aprendiz ${profile.firstName} ${profile.lastName} de la ficha ${profile.ficha.code}`);

    // Buscar horarios de clase para la ficha del aprendiz
    const schedules = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.assignment', 'assignment')
      .where('assignment.fichaId = :fichaId', { fichaId: profile.ficha.id })
      .andWhere('schedule.date BETWEEN :today AND :endOfDay', { today, endOfDay })
      .andWhere('schedule.isActive = true')
      .getMany();

    console.log(`📅 Encontradas ${schedules.length} clases programadas para hoy`);

    const results: AttendanceRecord[] = [];

    for (const schedule of schedules) {
      // Verificar si está dentro del horario de clase o tolerancia
      const classStart = new Date(`${schedule.date.toISOString().split('T')[0]}T${schedule.startTime}`);
      const toleranceEnd = new Date(classStart.getTime() + (schedule.lateToleranceMinutes * 60000));

      let status: 'PRESENT' | 'LATE' | 'ABSENT' = 'ABSENT';

      if (entryTime <= classStart) {
        status = 'PRESENT';
      } else if (entryTime <= toleranceEnd) {
        status = 'LATE';
      }

      console.log(`⏰ Clase ${schedule.id}: inicio ${classStart.toLocaleTimeString()}, tolerancia hasta ${toleranceEnd.toLocaleTimeString()}, entrada ${entryTime.toLocaleTimeString()} = ${status}`);

      if (status !== 'ABSENT') {
        // Buscar o crear registro de asistencia
        let attendanceRecord = await this.attendanceRepository.findOne({
          where: {
            scheduleId: schedule.id,
            learnerId: profileId
          }
        });

        if (!attendanceRecord) {
          attendanceRecord = this.attendanceRepository.create({
            scheduleId: schedule.id,
            learnerId: profileId,
            status,
            markedAt: entryTime,
            isManual: false
          });
          console.log(`➕ Creando nuevo registro de asistencia: ${status}`);
        } else if (!attendanceRecord.isManual) {
          // Solo actualizar si no fue marcado manualmente
          attendanceRecord.status = status;
          attendanceRecord.markedAt = entryTime;
          console.log(`🔄 Actualizando registro existente: ${status}`);
        } else {
          console.log(`🔒 Registro ya marcado manualmente, no se actualiza`);
          continue;
        }

        const saved = await this.attendanceRepository.save(attendanceRecord);
        results.push(saved);
      }
    }

    console.log(`✅ Asistencia automática procesada: ${results.length} registros actualizados`);
    return results;
  }

  // ⭐ MÉTODOS ADICIONALES PARA COMPLETAR LA FUNCIONALIDAD
  async getAttendanceBySchedule(scheduleId: number) {
    return await this.attendanceRepository.find({
      where: { scheduleId },
      relations: ['learner'],
      order: { learner: { lastName: 'ASC' } }
    });
  }

  async getAttendanceStats(assignmentId: number, startDate?: Date, endDate?: Date) {
    let query = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoin('attendance.schedule', 'schedule')
      .where('schedule.assignmentId = :assignmentId', { assignmentId });

    if (startDate && endDate) {
      query = query.andWhere('schedule.date BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const records = await query.getMany();
    
    const totalClasses = await this.scheduleRepository.count({
      where: { assignmentId, isActive: true }
    });

    const presentCount = records.filter(r => r.status === 'PRESENT').length;
    const lateCount = records.filter(r => r.status === 'LATE').length;
    const absentCount = records.filter(r => r.status === 'ABSENT').length;

    return {
      totalClasses,
      totalRecords: records.length,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      attendanceRate: records.length > 0 ? ((presentCount + lateCount) / records.length * 100).toFixed(1) : '0'
    };
  }

  async getSchedulesByAssignment(assignmentId: number) {
    return await this.scheduleRepository.find({
      where: { assignmentId, isActive: true },
      relations: ['assignment', 'assignment.ficha'],
      order: { date: 'DESC', startTime: 'ASC' }
    });
  }

  async getInstructorTodayClasses(instructorId: number) {
    const today = new Date();
    return await this.getInstructorAttendance(instructorId, today);
  }

  async getSchedulesByDate(date: string, instructorId?: number) {
    const targetDate = new Date(date);
    
    let query = this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.assignment', 'assignment')
      .leftJoinAndSelect('assignment.ficha', 'ficha')
      .where('schedule.date = :date', { date: targetDate })
      .andWhere('schedule.isActive = true');

    if (instructorId) {
      query = query.andWhere('assignment.instructorId = :instructorId', { instructorId });
    }

    return await query.orderBy('schedule.startTime', 'ASC').getMany();
  }

  async getScheduleById(id: number) {
    return await this.scheduleRepository.findOne({
      where: { id },
      relations: ['assignment', 'assignment.ficha', 'attendanceRecords', 'attendanceRecords.learner']
    });
  }

  async getAttendanceReport(assignmentId: number, startDate?: Date, endDate?: Date) {
    const stats = await this.getAttendanceStats(assignmentId, startDate, endDate);
    const schedules = await this.getSchedulesByAssignment(assignmentId);
    
    return {
      stats,
      schedules: schedules.length,
      period: {
        startDate,
        endDate
      }
    };
  }
}
