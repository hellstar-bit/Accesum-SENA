// backend/src/learner/learner.service.ts - CON CONSULTAS REALES A LA BASE DE DATOS
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { TrimesterSchedule } from '../attendance/entities/trimester-schedule.entity';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import * as QRCode from 'qrcode';

export interface UpdateLearnerProfileDto {
  phoneNumber?: string;
  address?: string;
  city?: string;
  bloodType?: string;
  maritalStatus?: string;
  vaccine?: string;
}

// ⭐ INTERFACES ACTUALIZADAS PARA MIS CLASES
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

@Injectable()
export class LearnerService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TrimesterSchedule)
    private trimesterScheduleRepository: Repository<TrimesterSchedule>,
    @InjectRepository(AttendanceRecord)
    private attendanceRepository: Repository<AttendanceRecord>,
  ) {}

  // ⭐ OBTENER MI PERFIL
  async getMyProfile(userId: number): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: [
        'user',
        'type',
        'regional',
        'center',
        'coordination',
        'program',
        'ficha',
        'ficha.program'
      ]
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    return profile;
  }

  // ⭐ ACTUALIZAR MI PERFIL
  async updateMyProfile(userId: number, data: UpdateLearnerProfileDto): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['user']
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    // Actualizar solo los campos permitidos
    if (data.phoneNumber !== undefined) profile.phoneNumber = data.phoneNumber;
    if (data.address !== undefined) profile.address = data.address;
    if (data.city !== undefined) profile.city = data.city;
    if (data.bloodType !== undefined) profile.bloodType = data.bloodType;
    if (data.maritalStatus !== undefined) profile.maritalStatus = data.maritalStatus;
    if (data.vaccine !== undefined) profile.vaccine = data.vaccine;

    await this.profileRepository.save(profile);
    return await this.getMyProfile(userId);
  }

  // ⭐ SUBIR IMAGEN DE PERFIL
  async uploadImage(userId: number, imageBase64: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId }
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    if (!this.isValidBase64Image(imageBase64)) {
      throw new BadRequestException('Formato de imagen inválido');
    }

    profile.profileImage = imageBase64;
    await this.profileRepository.save(profile);

    return await this.getMyProfile(userId);
  }

  // ⭐ REGENERAR CÓDIGO QR
  async regenerateQR(userId: number): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['user']
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    try {
      const qrData = {
        id: profile.id,
        doc: profile.documentNumber,
        type: 'ACCESUM_SENA_LEARNER',
        timestamp: Date.now()
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      profile.qrCode = qrCodeDataURL;
      await this.profileRepository.save(profile);

      return await this.getMyProfile(userId);
    } catch (error) {
      throw new BadRequestException('Error al generar código QR');
    }
  }

  // ⭐ NUEVOS MÉTODOS CON DATOS REALES

  // Obtener clases de una fecha específica - CON DATOS REALES
  async getMyClassesForDate(userId: number, date: string): Promise<LearnerClassSchedule[]> {
  console.log(`🔍 [DEBUG] getMyClassesForDate - userId: ${userId}, date: ${date}`);
  
  const profile = await this.profileRepository.findOne({
    where: { userId },
    relations: ['ficha', 'user']
  });

  console.log(`👤 [DEBUG] Profile found:`, {
    profileId: profile?.id,
    fichaId: profile?.ficha?.id,
    fichaCode: profile?.ficha?.code,
    userEmail: profile?.user?.email
  });

  if (!profile?.ficha) {
    console.log(`❌ [DEBUG] No ficha found for user ${userId}`);
    return [];
  }

  // ⭐ CORRECCIÓN: Usar la fecha exacta que viene del frontend
  const targetDate = new Date(date + 'T00:00:00.000Z'); // Forzar UTC para evitar desfases
  
  // ⭐ MAPEO CORREGIDO - Verificar zona horaria
  const dayOfWeekMap = {
    0: 'DOMINGO',
    1: 'LUNES', 
    2: 'MARTES', 
    3: 'MIERCOLES', 
    4: 'JUEVES', 
    5: 'VIERNES', 
    6: 'SABADO'
  };
  
  const dayNumber = targetDate.getUTCDay(); // Usar UTC para evitar problemas de zona horaria
  const dayOfWeek = dayOfWeekMap[dayNumber];
  
  console.log(`📅 [DEBUG] Date info:`, {
    inputDate: date,
    parsedDate: targetDate.toISOString(),
    dayNumber: dayNumber,
    dayOfWeek: dayOfWeek,
    localDay: new Date().getDay(),
    currentLocalTime: new Date().toLocaleString('es-CO')
  });

  // No hay clases los domingos
  if (dayOfWeek === 'DOMINGO') {
    console.log(`📅 [DEBUG] Domingo - no hay clases programadas`);
    return [];
  }

  try {
    console.log(`📚 [DEBUG] Buscando horarios para:`, {
      fichaId: profile.ficha.id,
      fichaCode: profile.ficha.code,
      dayOfWeek: dayOfWeek,
      date: date
    });

    // ⭐ CONSULTA CON LOGGING MEJORADO
    const schedules = await this.trimesterScheduleRepository
      .createQueryBuilder('ts')
      .leftJoinAndSelect('ts.instructor', 'instructor')
      .leftJoinAndSelect('instructor.profile', 'instructorProfile')
      .leftJoinAndSelect('ts.competence', 'competence')
      .leftJoinAndSelect('ts.ficha', 'ficha')
      .where('ts.fichaId = :fichaId', { fichaId: profile.ficha.id })
      .andWhere('ts.dayOfWeek = :dayOfWeek', { dayOfWeek })
      .andWhere('ts.isActive = :isActive', { isActive: true })
      .orderBy('ts.startTime', 'ASC')
      .getMany();

    console.log(`📚 [DEBUG] Query executed:`, {
      schedulesFound: schedules.length,
      fichaId: profile.ficha.id,
      dayOfWeek,
      query: {
        fichaId: profile.ficha.id,
        dayOfWeek: dayOfWeek,
        isActive: true
      }
    });

    // ⭐ LOG DETALLADO DE LOS RESULTADOS
    if (schedules.length > 0) {
      console.log(`✅ [DEBUG] Schedules found:`, schedules.map(s => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        classroom: s.classroom,
        competenceName: s.competence?.name,
        instructorName: `${s.instructor?.profile?.firstName} ${s.instructor?.profile?.lastName}`,
        fichaCode: s.ficha?.code
      })));
    } else {
      console.log(`❌ [DEBUG] No schedules found for criteria:`, {
        fichaId: profile.ficha.id,
        dayOfWeek,
        isActive: true
      });
      
      // ⭐ DEBUG ADICIONAL: Verificar qué horarios existen para esta ficha
      const allSchedulesForFicha = await this.trimesterScheduleRepository.find({
        where: { fichaId: profile.ficha.id },
        select: ['id', 'dayOfWeek', 'startTime', 'endTime', 'isActive']
      });
      
      console.log(`🔍 [DEBUG] All schedules for ficha ${profile.ficha.code}:`, allSchedulesForFicha);
    }

    // ⭐ OBTENER REGISTROS DE ASISTENCIA
    const attendanceRecords = await this.attendanceRepository.find({
      where: {
        learnerId: profile.id,
        trimesterScheduleId: schedules.length > 0 ? undefined : undefined
      },
      relations: ['trimesterSchedule']
    });

    console.log(`📊 [DEBUG] Attendance records found: ${attendanceRecords.length}`);

    // ⭐ MAPEAR RESULTADOS
    const classes: LearnerClassSchedule[] = schedules.map(schedule => {
      const attendanceRecord = attendanceRecords.find(
        record => record.trimesterScheduleId === schedule.id
      );

      return {
        scheduleId: schedule.id,
        subject: schedule.competence?.name || 'Materia no especificada',
        instructor: {
          firstName: schedule.instructor?.profile?.firstName || 'Instructor',
          lastName: schedule.instructor?.profile?.lastName || 'No asignado'
        },
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        classroom: schedule.classroom || 'Aula no asignada',
        ficha: {
          code: schedule.ficha.code,
          name: schedule.ficha.name
        },
        competence: {
          name: schedule.competence?.name || 'Competencia no especificada'
        },
        attendance: attendanceRecord ? {
          attendanceId: attendanceRecord.id,
          status: attendanceRecord.status,
          accessTime: attendanceRecord.markedAt?.toISOString() || null,
          isManual: attendanceRecord.isManual,
          notes: attendanceRecord.notes
        } : undefined
      };
    });

    console.log(`✅ [DEBUG] Final result: ${classes.length} classes mapped for ${date}`);
    return classes;

  } catch (error) {
    console.error('❌ [DEBUG] Error in getMyClassesForDate:', error);
    throw new BadRequestException('Error al obtener clases: ' + error.message);
  }
}

  // Obtener estadísticas de asistencia semanal - CON DATOS REALES
  async getWeeklyAttendanceStats(userId: number, startDate: string, endDate: string): Promise<WeeklyAttendanceStats> {
  console.log(`📊 [Service] getWeeklyAttendanceStats REAL - userId: ${userId}, ${startDate} - ${endDate}`);

  const profile = await this.profileRepository.findOne({
    where: { userId },
    relations: ['ficha']
  });

  if (!profile || !profile.ficha) {
    return {
      totalClasses: 0,
      presentClasses: 0,
      lateClasses: 0,
      absentClasses: 0,
      attendancePercentage: 0
    };
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    console.log(`📊 [DEBUG] Buscando estadísticas para:`, {
      profileId: profile.id,
      fichaId: profile.ficha.id,
      startDate,
      endDate,
      parsedStart: start.toISOString(),
      parsedEnd: end.toISOString()
    });

    // ⭐ NUEVA ESTRATEGIA: Obtener todos los horarios de la semana y sus asistencias
    const daysOfWeek = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    
    // Obtener todos los horarios de la ficha
    const allSchedules = await this.trimesterScheduleRepository.find({
      where: {
        fichaId: profile.ficha.id,
        isActive: true,
        dayOfWeek: In(daysOfWeek) // Solo días laborables
      },
      relations: ['competence']
    });

    console.log(`📚 [DEBUG] Horarios encontrados: ${allSchedules.length}`);

    // ⭐ NUEVA CONSULTA: Buscar asistencias por trimesterScheduleId
    const attendanceRecords = await this.attendanceRepository
      .createQueryBuilder('ar')
      .where('ar.learnerId = :learnerId', { learnerId: profile.id })
      .andWhere('ar.trimesterScheduleId IN (:...scheduleIds)', { 
        scheduleIds: allSchedules.map(s => s.id) 
      })
      .andWhere('DATE(ar.createdAt) BETWEEN :startDate AND :endDate', { 
        startDate: startDate, 
        endDate: endDate 
      })
      .getMany();

    console.log(`📊 [DEBUG] Registros de asistencia encontrados: ${attendanceRecords.length}`);
    console.log(`📊 [DEBUG] Detalles de asistencia:`, attendanceRecords.map(r => ({
      id: r.id,
      scheduleId: r.trimesterScheduleId,
      status: r.status,
      createdAt: r.createdAt,
      markedAt: r.markedAt
    })));

    // ⭐ CALCULAR ESTADÍSTICAS BASADAS EN LOS DÍAS DE LA SEMANA
    let totalClassesInWeek = 0;
    let attendanceInWeek: any[] = [];

    // Para cada día de la semana, verificar si hay clases y asistencia
    const startWeekDate = new Date(start);
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startWeekDate);
      currentDay.setDate(startWeekDate.getDate() + i);
      
      const dayName = daysOfWeek[currentDay.getDay() === 0 ? 6 : currentDay.getDay() - 1]; // Ajustar domingo
      
      if (dayName && daysOfWeek.includes(dayName)) {
        // Obtener horarios para este día
        const daySchedules = allSchedules.filter(s => s.dayOfWeek === dayName);
        
        if (daySchedules.length > 0) {
          totalClassesInWeek += daySchedules.length;
          
          // Buscar asistencias para este día
          const dayAttendance = attendanceRecords.filter(ar => {
            const recordDate = new Date(ar.createdAt);
            return recordDate.toDateString() === currentDay.toDateString();
          });
          
          attendanceInWeek.push(...dayAttendance);
        }
      }
    }

    console.log(`📊 [DEBUG] Análisis semanal:`, {
      totalClassesInWeek,
      attendanceRecordsInWeek: attendanceInWeek.length,
      schedulesChecked: allSchedules.length
    });

    // ⭐ CALCULAR ESTADÍSTICAS FINALES
    const totalClasses = attendanceInWeek.length; // Solo clases con registros de asistencia
    const presentClasses = attendanceInWeek.filter(r => r.status === 'PRESENT').length;
    const lateClasses = attendanceInWeek.filter(r => r.status === 'LATE').length;
    const absentClasses = attendanceInWeek.filter(r => r.status === 'ABSENT').length;
    
    const attendedClasses = presentClasses + lateClasses;
    const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

    const stats: WeeklyAttendanceStats = {
      totalClasses,
      presentClasses,
      lateClasses,
      absentClasses,
      attendancePercentage: Math.round(attendancePercentage * 10) / 10
    };

    console.log(`✅ [Service] Estadísticas REALES calculadas:`, stats);
    return stats;

  } catch (error) {
    console.error('❌ [Service] Error en getWeeklyAttendanceStats:', error);
    throw new BadRequestException('Error al calcular estadísticas: ' + error.message);
  }
}

  // Obtener horario semanal completo - CON DATOS REALES
  async getMyWeeklySchedule(userId: number, weekStartDate: string): Promise<{
    schedules: Record<string, LearnerClassSchedule[]>;
    week: string;
  }> {
    console.log(`📅 [Service] getMyWeeklySchedule REAL - userId: ${userId}, weekStart: ${weekStartDate}`);

    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['ficha']
    });

    if (!profile || !profile.ficha) {
      return {
        schedules: {
          LUNES: [],
          MARTES: [],
          MIERCOLES: [],
          JUEVES: [],
          VIERNES: [],
          SABADO: []
        },
        week: weekStartDate
      };
    }

    try {
      // ⭐ CONSULTA REAL: Obtener todos los horarios de la ficha
      const allSchedules = await this.trimesterScheduleRepository.find({
        where: {
          fichaId: profile.ficha.id,
          isActive: true
        },
        relations: [
          'instructor',
          'instructor.profile',
          'competence',
          'ficha'
        ],
        order: {
          dayOfWeek: 'ASC',
          startTime: 'ASC'
        }
      });

      console.log(`📚 [Service] Encontrados ${allSchedules.length} horarios para la ficha ${profile.ficha.code}`);

      // ⭐ AGRUPAR POR DÍA DE LA SEMANA
      const schedulesByDay: Record<string, LearnerClassSchedule[]> = {
        LUNES: [],
        MARTES: [],
        MIERCOLES: [],
        JUEVES: [],
        VIERNES: [],
        SABADO: []
      };

      allSchedules.forEach(schedule => {
        const classData: LearnerClassSchedule = {
          scheduleId: schedule.id,
          subject: schedule.competence?.name || 'Materia no especificada',
          instructor: {
            firstName: schedule.instructor?.profile?.firstName || 'Instructor',
            lastName: schedule.instructor?.profile?.lastName || 'No asignado'
          },
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          classroom: schedule.classroom || 'Aula no asignada',
          ficha: {
            code: schedule.ficha.code,
            name: schedule.ficha.name
          },
          competence: {
            name: schedule.competence?.name || 'Competencia no especificada'
          }
        };

        schedulesByDay[schedule.dayOfWeek].push(classData);
      });

      console.log(`✅ [Service] Horario semanal REAL generado para ficha: ${profile.ficha.code}`);
      return {
        schedules: schedulesByDay,
        week: weekStartDate
      };

    } catch (error) {
      console.error('❌ [Service] Error en getMyWeeklySchedule:', error);
      throw new BadRequestException('Error al obtener horario semanal: ' + error.message);
    }
  }

  // Obtener resumen mensual de asistencia - CON DATOS REALES
  async getMonthlyAttendanceSummary(userId: number, year: number, month: number): Promise<{
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
    console.log(`📈 [Service] getMonthlyAttendanceSummary REAL - userId: ${userId}, ${year}-${month}`);

    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['ficha']
    });

    if (!profile || !profile.ficha) {
      return {
        totalClasses: 0,
        attendedClasses: 0,
        attendanceRate: 0,
        dailyAttendance: {}
      };
    }

    try {
      // ⭐ CONSULTA REAL: Obtener registros del mes específico
      const startDate = new Date(year, month - 1, 1); // month es 0-indexed
      const endDate = new Date(year, month, 0); // Último día del mes

      const attendanceRecords = await this.attendanceRepository.find({
        where: {
          learnerId: profile.id,
          createdAt: Between(startDate, endDate)
        },
        relations: ['trimesterSchedule']
      });

      console.log(`📊 [Service] Encontrados ${attendanceRecords.length} registros para ${year}-${month}`);

      // ⭐ CALCULAR ESTADÍSTICAS REALES
      const totalClasses = attendanceRecords.length;
      const attendedClasses = attendanceRecords.filter(r => 
        r.status === 'PRESENT' || r.status === 'LATE'
      ).length;
      const attendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

      // ⭐ AGRUPAR POR DÍA
      const dailyAttendance: Record<string, {
        present: number;
        late: number;
        absent: number;
        excused: number;
      }> = {};

      attendanceRecords.forEach(record => {
        const dateKey = record.createdAt.toISOString().split('T')[0];
        
        if (!dailyAttendance[dateKey]) {
          dailyAttendance[dateKey] = { present: 0, late: 0, absent: 0, excused: 0 };
        }

        switch (record.status) {
          case 'PRESENT':
            dailyAttendance[dateKey].present++;
            break;
          case 'LATE':
            dailyAttendance[dateKey].late++;
            break;
          case 'ABSENT':
            dailyAttendance[dateKey].absent++;
            break;
          case 'EXCUSED':
            dailyAttendance[dateKey].excused++;
            break;
        }
      });

      const summary = {
        totalClasses,
        attendedClasses,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        dailyAttendance
      };

      console.log(`✅ [Service] Resumen mensual REAL calculado - Asistencia: ${summary.attendanceRate}%`);
      return summary;

    } catch (error) {
      console.error('❌ [Service] Error en getMonthlyAttendanceSummary:', error);
      throw new BadRequestException('Error al obtener resumen mensual: ' + error.message);
    }
  }

  // ⭐ MÉTODOS EXISTENTES (MANTENER)

  async getCarnetData(userId: number): Promise<any> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: [
        'user',
        'type',
        'regional',
        'center',
        'ficha'
      ]
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    return {
      id: profile.id,
      fullName: `${profile.firstName} ${profile.lastName}`,
      documentType: profile.documentType,
      documentNumber: profile.documentNumber,
      bloodType: profile.bloodType,
      profileImage: profile.profileImage,
      qrCode: profile.qrCode,
      ficha: profile.ficha ? {
        code: profile.ficha.code,
        name: profile.ficha.name,
        status: profile.ficha.status
      } : undefined,
      type: profile.type.name,
      center: profile.center.name,
      regional: profile.regional.name,
      status: profile.learnerStatus,
      isActive: profile.user.isActive
    };
  }

  // Validar imagen base64
  private isValidBase64Image(base64String: string): boolean {
    try {
      const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,[A-Za-z0-9+/]*={0,2}$/;
      return base64Regex.test(base64String);
    } catch {
      return false;
    }
  }

  // Buscar perfil por usuario (método auxiliar)
  async findByUserId(userId: number): Promise<Profile | null> {
    return await this.profileRepository.findOne({
      where: { userId },
      relations: [
        'user',
        'type',
        'regional',
        'center',
        'coordination',
        'program',
        'ficha'
      ]
    });
  }

  // ⭐ MÉTODO LEGACY PARA COMPATIBILIDAD
  async getMyClasses(userId: number, date?: string): Promise<any[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return await this.getMyClassesForDate(userId, targetDate);
  }
}