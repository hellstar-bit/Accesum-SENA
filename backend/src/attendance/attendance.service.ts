// backend/src/attendance/attendance.service.ts - COMPLETO
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassSchedule } from './entities/class-schedule.entity';
import { TrimesterSchedule } from './entities/trimester-schedule.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { InstructorAssignment } from './entities/instructor-assignment.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { PersonnelType } from '../config/entities/personnel-type.entity';


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

interface AttendanceUpdateResult {
  id: number;
  attendanceId: number;
  learnerId: number;
  learnerName: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  markedAt: string | null;
  manuallyMarkedAt: string | null;
  isManual: boolean;
  notes: string | undefined;
  excuseReason: string | undefined;
  markedBy: number | undefined;
  learner: {
    id: number;
    firstName: string;
    lastName: string;
    documentNumber: string;
  } | null;
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,

    @InjectRepository(PersonnelType)
    private readonly personnelTypeRepository: Repository<PersonnelType>,

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
  // ⭐ MÉTODO CORREGIDO - Debug completo de fechas
  async getMyClassesAttendance(instructorId: number, date?: string) {
    try {
      console.log(`📋 === INICIANDO getMyClassesAttendance ===`);
      console.log(`📋 Instructor ID: ${instructorId}, Fecha: ${date}`);
      
      // Procesamiento de fecha
      let targetDate: Date;
      if (date) {
        if (date.includes('T')) {
          targetDate = new Date(date);
        } else {
          targetDate = new Date(date + 'T12:00:00');
        }
      } else {
        targetDate = new Date();
      }
      
      // Cálculo de día y trimestre
      const dayNames = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
      const dayOfWeek = dayNames[targetDate.getDay()];
      
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      let trimester: string;
      if (month >= 1 && month <= 4) trimester = `${year}-1`;
      else if (month >= 5 && month <= 8) trimester = `${year}-2`;
      else trimester = `${year}-3`;
      
      console.log(`📅 Buscando: ${dayOfWeek}, trimestre: ${trimester}`);
      
      // Buscar horarios del instructor
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
      
      if (trimesterSchedules.length === 0) {
        console.log(`⚠️ No se encontraron horarios para el instructor ${instructorId} en ${dayOfWeek} del trimestre ${trimester}`);
        return [];
      }
      
      const classSchedules: any[] = [];
      
      for (const schedule of trimesterSchedules) {
        console.log(`📋 Procesando horario ${schedule.id} para ficha ${schedule.fichaId}`);
        
        // 1. Obtener aprendices de la ficha
        const learners = await this.getLearnersFromFicha(schedule.fichaId);
        console.log(`👥 Encontrados ${learners.length} aprendices en la ficha`);
        
        // 2. Obtener/crear registros de asistencia
        const attendanceRecords = await this.getOrCreateAttendanceRecords(
          schedule.id, 
          learners, 
          targetDate.toISOString().split('T')[0]
        );
        console.log(`📝 Procesados ${attendanceRecords.length} registros de asistencia`);
        
        // 3. Calcular estadísticas
        const stats = this.calculateAttendanceStats(attendanceRecords);
        
        // 4. Crear objeto de clase
        const classSchedule = {
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
            total: stats.total,
            present: stats.present,
            late: stats.late,
            absent: stats.absent,
            percentage: stats.total > 0 ? ((stats.present + stats.late) / stats.total * 100).toFixed(1) : '0.0'
          },
          records: attendanceRecords
        };
        
        classSchedules.push(classSchedule);
      }
      
      console.log(`📋 Retornando ${classSchedules.length} clases con aprendices`);
      return classSchedules;
      
    } catch (error) {
      console.error('❌ Error al obtener clases del instructor:', error);
      return [];
    }
  }
  private async getLearnersFromFicha(fichaId: number): Promise<any[]> {
    try {
      console.log(`🔍 === INICIANDO getLearnersFromFicha para ficha ${fichaId} ===`);
      
      // 1. Verificar todos los tipos de personal disponibles
      const allPersonnelTypes = await this.personnelTypeRepository.find();
      console.log(`🔍 TIPOS DE PERSONAL DISPONIBLES:`, allPersonnelTypes.map(t => ({
        id: t.id,
        name: t.name
      })));
      
      // 2. Buscar específicamente el tipo "Aprendiz"
      const learnerType = await this.personnelTypeRepository.findOne({
        where: { name: 'Aprendiz' }
      });
      
      if (!learnerType) {
        console.log('⚠️ PROBLEMA: Tipo "Aprendiz" no encontrado en personnel_types');
        console.log('💡 SOLUCIÓN: Crear registro en personnel_types con name="Aprendiz"');
        return [];
      }
      
      console.log(`✅ Tipo "Aprendiz" encontrado con ID: ${learnerType.id}`);
      
      // 3. Buscar todos los perfiles que coincidan con la ficha
      console.log(`🔍 Buscando perfiles para ficha ${fichaId}...`);
      
      const allProfilesInFicha = await this.profileRepository.find({
        where: { fichaId },
        relations: ['type', 'ficha', 'user'],
        order: { lastName: 'ASC', firstName: 'ASC' }
      });
      
      console.log(`🔍 TODOS LOS PERFILES EN FICHA ${fichaId}:`, allProfilesInFicha.map(p => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        typeId: p.typeId,
        typeName: p.type?.name || 'SIN TIPO',
        fichaId: p.fichaId,
        documentNumber: p.documentNumber
      })));
      
      // 4. Filtrar solo los aprendices
      const learners = allProfilesInFicha.filter(profile => profile.typeId === learnerType.id);
      
      console.log(`👥 APRENDICES FILTRADOS:`, learners.map(l => ({
        id: l.id,
        name: `${l.firstName} ${l.lastName}`,
        documentNumber: l.documentNumber,
        typeId: l.typeId
      })));
      
      if (learners.length === 0) {
        console.log(`⚠️ PROBLEMA: No se encontraron aprendices en la ficha ${fichaId}`);
        console.log(`💡 VERIFICAR:`);
        console.log(`   - ¿Existen perfiles con fichaId = ${fichaId}?`);
        console.log(`   - ¿Algunos perfiles tienen typeId = ${learnerType.id}?`);
        console.log(`   - ¿Los aprendices están asignados correctamente a esta ficha?`);
      }
      
      console.log(`✅ Retornando ${learners.length} aprendices para la ficha ${fichaId}`);
      return learners;
      
    } catch (error) {
      console.error('❌ Error al obtener aprendices:', error);
      return [];
    }
  }
  // ✅ NUEVO MÉTODO: Obtener o crear registros de asistencia
  private async getOrCreateAttendanceRecords(trimesterScheduleId: number, learners: any[], date: string): Promise<any[]> {
  try {
    console.log(`📝 === INICIANDO getOrCreateAttendanceRecords ===`);
    console.log(`📝 TrimesterSchedule ID: ${trimesterScheduleId}, Learners: ${learners.length}, Date: ${date}`);
    
    const records: any[] = [];
    
    for (const learner of learners) {
      console.log(`📝 Procesando aprendiz: ${learner.firstName} ${learner.lastName} (ID: ${learner.id})`);
      
      // ⭐ USAR trimesterScheduleId EN LUGAR DE scheduleId
      let attendanceRecord = await this.attendanceRepository.findOne({
        where: {
          trimesterScheduleId,
          learnerId: learner.id
        },
        relations: ['learner'] // ⭐ AGREGAR RELACIÓN PARA OBTENER DATOS COMPLETOS
      });
      
      if (!attendanceRecord) {
        console.log(`📝 No existe registro, creando nuevo para aprendiz ${learner.id}`);
        
        // ⭐ CREAR USANDO trimesterScheduleId (scheduleId = undefined)
        attendanceRecord = this.attendanceRepository.create({
          trimesterScheduleId,
          learnerId: learner.id,
          status: 'ABSENT',
          isManual: false,
          scheduleId: undefined, // NO usar scheduleId para evitar foreign key constraint
          markedAt: undefined,
          manuallyMarkedAt: undefined,
          markedBy: undefined,
          notes: undefined,
          accessRecordId: undefined
        });
        
        attendanceRecord = await this.attendanceRepository.save(attendanceRecord);
        console.log(`✅ Registro creado con ID: ${attendanceRecord.id}`);
      } else {
        console.log(`📝 Registro existente encontrado con ID: ${attendanceRecord.id}, Status: ${attendanceRecord.status}`);
      }
      
      // ⭐ BUSCAR SI HAY UN REGISTRO DE ACCESO RECIENTE PARA ESTE APRENDIZ
      let accessTime: Date | string | null = null;
      if (attendanceRecord.accessRecordId) {
        // Si hay accessRecordId, buscar el registro de acceso
        try {
          const accessRecord = await this.attendanceRepository.manager.query(
            'SELECT entryTime FROM access_records WHERE id = ?',
            [attendanceRecord.accessRecordId]
          );
          if (accessRecord && accessRecord.length > 0) {
            accessTime = accessRecord[0].entryTime;
          }
        } catch (error) {
          console.log('⚠️ Error al buscar registro de acceso:', error.message);
        }
      } else if (attendanceRecord.markedAt) {
        // Si no hay accessRecordId pero sí markedAt, usar esa fecha
        accessTime = attendanceRecord.markedAt;
      } else {
        // ⭐ BUSCAR REGISTRO DE ACCESO RECIENTE PARA ESTE APRENDIZ
        try {
          const todayStart = new Date(date + 'T00:00:00');
          const todayEnd = new Date(date + 'T23:59:59');
          
          const recentAccessRecord = await this.attendanceRepository.manager.query(`
            SELECT ar.entryTime 
            FROM access_records ar 
            INNER JOIN profiles p ON ar.userId = p.userId 
            WHERE p.id = ? 
              AND ar.entryTime >= ? 
              AND ar.entryTime <= ? 
              AND ar.exitTime IS NULL 
            ORDER BY ar.entryTime DESC 
            LIMIT 1
          `, [learner.id, todayStart, todayEnd]);
          
          if (recentAccessRecord && recentAccessRecord.length > 0) {
            accessTime = recentAccessRecord[0].entryTime;
            console.log(`🕐 Hora de acceso encontrada para ${learner.firstName}: ${accessTime}`);
          }
        } catch (error) {
          console.log('⚠️ Error al buscar acceso reciente:', error.message);
        }
      }
      
      // Formatear para el frontend
      const formattedRecord = {
        id: attendanceRecord.id,
        attendanceId: attendanceRecord.id,
        learnerId: learner.id,
        learnerName: `${learner.firstName} ${learner.lastName}`,
        status: attendanceRecord.status,
        markedAt: attendanceRecord.markedAt?.toISOString() || null,
        manuallyMarkedAt: attendanceRecord.manuallyMarkedAt?.toISOString() || null,
        isManual: attendanceRecord.isManual,
        accessTime: accessTime ? new Date(accessTime).toISOString() : null, // ⭐ AGREGAR HORA DE ACCESO REAL
        notes: attendanceRecord.notes || null,
        markedBy: attendanceRecord.markedBy || null,
        learner: {
          id: learner.id,
          firstName: learner.firstName,
          lastName: learner.lastName,
          documentNumber: learner.documentNumber
        }
      };
      
      records.push(formattedRecord);
    }
    
    console.log(`📝 Retornando ${records.length} registros de asistencia`);
    return records;
    
  } catch (error) {
    console.error('❌ Error al procesar registros de asistencia:', error);
    return [];
  }
}

  // ✅ MÉTODO PARA CALCULAR ESTADÍSTICAS
  private calculateAttendanceStats(records: any[]) {
    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    
    return { total, present, late, absent };
  }

  async debugFichaData(fichaId: number) {
    try {
      console.log(`🔍 === DIAGNÓSTICO COMPLETO DE FICHA ${fichaId} ===`);
      
      // 1. Verificar que la ficha existe
      const ficha = await this.profileRepository.manager.query(
        'SELECT * FROM fichas WHERE id = ?', [fichaId]
      );
      console.log('🔍 FICHA:', ficha);
      
      // 2. Ver todos los tipos de personal
      const personnelTypes = await this.profileRepository.manager.query(
        'SELECT * FROM personnel_types'
      );
      console.log('🔍 TIPOS DE PERSONAL:', personnelTypes);
      
      // 3. Ver todos los perfiles relacionados con la ficha
      const profiles = await this.profileRepository.manager.query(
        'SELECT p.*, pt.name as type_name FROM profiles p LEFT JOIN personnel_types pt ON p.typeId = pt.id WHERE p.fichaId = ?', 
        [fichaId]
      );
      console.log('🔍 PERFILES EN FICHA:', profiles);
      
      // 4. Verificar trimester_schedules
      const schedules = await this.profileRepository.manager.query(
        'SELECT * FROM trimester_schedules WHERE fichaId = ?', 
        [fichaId]
      );
      console.log('🔍 HORARIOS DE TRIMESTRE:', schedules);
      
      return {
        ficha,
        personnelTypes,
        profiles,
        schedules
      };
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      return null;
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
  

  // ⭐ OBTENER ASISTENCIA POR HORARIO
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

    // ⭐ BUSCAR USANDO trimesterScheduleId (data.scheduleId es en realidad trimesterScheduleId)
    const existingRecord = await this.attendanceRepository.findOne({
      where: {
        trimesterScheduleId: data.scheduleId, // scheduleId viene del frontend pero es trimesterScheduleId
        learnerId: data.profileId
      }
    });

    if (existingRecord) {
      // Actualizar registro existente
      existingRecord.status = englishStatus;
      existingRecord.notes = data.notes || undefined;
      existingRecord.manuallyMarkedAt = new Date();
      existingRecord.markedAt = new Date();
      existingRecord.markedBy = data.markedBy || undefined;
      existingRecord.isManual = true;

      const updatedRecord = await this.attendanceRepository.save(existingRecord);
      console.log('✅ Asistencia actualizada exitosamente');
      return updatedRecord;
    } else {
      // ⭐ CREAR NUEVO REGISTRO CON trimesterScheduleId
      const newRecord = this.attendanceRepository.create({
        trimesterScheduleId: data.scheduleId, // scheduleId del frontend es trimesterScheduleId
        learnerId: data.profileId,
        status: englishStatus,
        notes: data.notes || undefined,
        markedAt: new Date(),
        manuallyMarkedAt: new Date(),
        markedBy: data.markedBy || undefined,
        isManual: true,
        scheduleId: undefined, // No usar scheduleId
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

  // ⭐ MARCAR ASISTENCIA AUTOMÁTICA
  async autoMarkAttendance(profileId: number, entryTime: Date, accessRecordId?: number) {
  try {
    console.log(`📋 === INICIANDO MARCADO AUTOMÁTICO ===`);
    console.log(`📋 Perfil ID: ${profileId}, Hora: ${entryTime.toISOString()}, Access Record: ${accessRecordId}`);

    // ⭐ PASO 1: Verificar que el perfil es un aprendiz
    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
      relations: ['type', 'ficha']
    });

    if (!profile) {
      console.log('❌ Perfil no encontrado');
      return { success: false, message: 'Perfil no encontrado', records: [] };
    }

    if (profile.type?.name !== 'Aprendiz') {
      console.log(`ℹ️ El perfil no es un aprendiz (es ${profile.type?.name}), no se marca asistencia`);
      return { success: false, message: 'No es un aprendiz', records: [] };
    }

    if (!profile.ficha) {
      console.log('❌ El aprendiz no tiene ficha asignada');
      return { success: false, message: 'Aprendiz sin ficha asignada', records: [] };
    }

    console.log(`👨‍🎓 Aprendiz encontrado: ${profile.firstName} ${profile.lastName}, Ficha: ${profile.ficha.code}`);

    // ⭐ PASO 2: Determinar día y trimestre
    const dayNames = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const dayOfWeek = dayNames[entryTime.getDay()];
    
    const year = entryTime.getFullYear();
    const month = entryTime.getMonth() + 1;
    let trimester: string;
    if (month >= 1 && month <= 4) trimester = `${year}-1`;
    else if (month >= 5 && month <= 8) trimester = `${year}-2`;
    else trimester = `${year}-3`;

    const currentTime = entryTime.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    console.log(`📅 Buscando clases para: ${dayOfWeek}, trimestre: ${trimester}, hora: ${currentTime}`);

    // ⭐ PASO 3: Buscar horarios de trimestre para la ficha del aprendiz
    const trimesterSchedules = await this.trimesterScheduleRepository.find({
      where: {
        fichaId: profile.ficha.id,
        dayOfWeek: dayOfWeek as any,
        trimester,
        isActive: true
      },
      relations: ['competence', 'ficha', 'instructor', 'instructor.profile']
    });

    console.log(`🔍 Horarios encontrados para la ficha: ${trimesterSchedules.length}`);

    if (trimesterSchedules.length === 0) {
      console.log(`⚠️ No hay clases programadas para la ficha ${profile.ficha.code} en ${dayOfWeek}`);
      return { 
        success: false, 
        message: `No hay clases programadas para ${dayOfWeek}`, 
        profileId, 
        entryTime,
        records: []
      };
    }

    // ⭐ PASO 4: Filtrar horarios que coincidan con la hora de entrada
    const matchingSchedules = trimesterSchedules.filter(schedule => {
      const startTime = schedule.startTime;
      const endTime = schedule.endTime;
      
      // Agregar tolerancia de 2 horas antes y 1 hora después del horario
      const scheduleStartTime = new Date(`1970-01-01T${startTime}`);
      const scheduleEndTime = new Date(`1970-01-01T${endTime}`);
      const currentTimeDate = new Date(`1970-01-01T${currentTime}`);
      
      // Tolerancia: 2 horas antes del inicio hasta 1 hora después del final
      const toleranceStart = new Date(scheduleStartTime.getTime() - 2 * 60 * 60 * 1000); // 2 horas antes
      const toleranceEnd = new Date(scheduleEndTime.getTime() + 1 * 60 * 60 * 1000); // 1 hora después
      
      const isWithinRange = currentTimeDate >= toleranceStart && currentTimeDate <= toleranceEnd;
      
      console.log(`🕐 Horario ${schedule.id}: ${startTime}-${endTime}, Entrada: ${currentTime}, ¿Coincide?: ${isWithinRange}`);
      
      return isWithinRange;
    });

    if (matchingSchedules.length === 0) {
      console.log(`⚠️ No hay clases activas en este momento (${currentTime})`);
      return { 
        success: false, 
        message: `No hay clases activas a las ${currentTime}`, 
        profileId, 
        entryTime,
        records: []
      };
    }

    console.log(`✅ Clases activas encontradas: ${matchingSchedules.length}`);

    // ⭐ PASO 5: Marcar asistencia en cada clase activa
    const attendanceRecords: any[] = [];
    
    for (const schedule of matchingSchedules) {
      console.log(`📝 Procesando clase: ${schedule.competence?.name || 'Sin competencia'} (${schedule.startTime}-${schedule.endTime})`);
      
      // ⭐ BUSCAR REGISTRO EXISTENTE POR trimesterScheduleId
      let existingRecord = await this.attendanceRepository.findOne({
        where: {
          trimesterScheduleId: schedule.id,
          learnerId: profileId
        }
      });

      // ⭐ DETERMINAR ESTADO BASADO EN LA HORA
      let status: 'PRESENT' | 'LATE' | 'ABSENT' = 'PRESENT';
      const scheduleStartTime = new Date(`1970-01-01T${schedule.startTime}`);
      const currentTimeDate = new Date(`1970-01-01T${currentTime}`);
      const toleranceMinutes = 15; // Tolerancia para llegar tarde
      const lateThreshold = new Date(scheduleStartTime.getTime() + toleranceMinutes * 60 * 1000);
      
      if (currentTimeDate > lateThreshold) {
        status = 'LATE';
      }

      if (existingRecord) {
  // ⭐ ACTUALIZAR REGISTRO EXISTENTE (solo si está ABSENT)
  if (existingRecord.status === 'ABSENT') {
    console.log(`📝 Actualizando registro existente de ABSENT a ${status}`);
    existingRecord.status = status;
    existingRecord.markedAt = entryTime;
    existingRecord.accessRecordId = accessRecordId; // ⭐ IMPORTANTE: Guardar accessRecordId
    existingRecord.isManual = false;
    existingRecord.notes = `Marcado automáticamente por control de acceso a las ${currentTime}`;
    
    const updatedRecord = await this.attendanceRepository.save(existingRecord);
    attendanceRecords.push(updatedRecord);
    console.log(`✅ Registro actualizado con accessRecordId: ${accessRecordId}`);
  } else {
    console.log(`📝 Registro ya existe con estado ${existingRecord.status}, no se modifica`);
    attendanceRecords.push(existingRecord);
  }
} else {
  // ⭐ CREAR NUEVO REGISTRO
  console.log(`📝 Creando nuevo registro de asistencia con estado ${status}`);
  const newRecord = this.attendanceRepository.create({
    trimesterScheduleId: schedule.id, // ⭐ USAR trimesterScheduleId
    learnerId: profileId,
    status: status,
    markedAt: entryTime,
    accessRecordId: accessRecordId, // ⭐ IMPORTANTE: Guardar accessRecordId
    isManual: false,
    notes: `Marcado automáticamente por control de acceso a las ${currentTime}`,
    scheduleId: undefined // ⭐ NO usar scheduleId
  });

  const savedRecord = await this.attendanceRepository.save(newRecord);
  attendanceRecords.push(savedRecord);
  console.log(`✅ Registro creado con ID: ${savedRecord.id} y accessRecordId: ${accessRecordId}`);
}}

    console.log(`📋 === MARCADO AUTOMÁTICO COMPLETADO ===`);
    console.log(`✅ Total de registros procesados: ${attendanceRecords.length}`);

    return {
      success: true,
      message: `Asistencia marcada automáticamente para ${attendanceRecords.length} clase(s)`,
      profileId,
      entryTime,
      records: attendanceRecords.map(record => ({
        id: record.id,
        trimesterScheduleId: record.trimesterScheduleId,
        learnerId: record.learnerId,
        status: record.status,
        markedAt: record.markedAt,
        isManual: record.isManual,
        notes: record.notes
      }))
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
      console.log(`📋 INICIANDO - Obteniendo horarios de trimestre para ficha ${fichaId}, trimestre ${trimester}`);

      const schedules = await this.trimesterScheduleRepository.find({
        where: {
          fichaId,
          trimester,
          isActive: true
        },
        relations: ['competence', 'instructor', 'instructor.profile', 'ficha']
      });

      console.log(`🔍 QUERY RESULTADO - Se encontraron ${schedules.length} horarios en la base de datos`);

      // ⭐ DEBUG DETALLADO: Mostrar cada horario encontrado
      schedules.forEach((schedule, index) => {
        console.log(`🔍 HORARIO ${index + 1}:`, {
          id: schedule.id,
          day: schedule.dayOfWeek,
          time: `${schedule.startTime} - ${schedule.endTime}`,
          competenceId: schedule.competenceId,
          competence: schedule.competence ? {
            id: schedule.competence.id,
            name: schedule.competence.name,
            code: schedule.competence.code
          } : 'NULL - NO CARGADA',
          instructorId: schedule.instructorId,
          instructor: schedule.instructor ? {
            id: schedule.instructor.id,
            email: schedule.instructor.email,
            profile: schedule.instructor.profile ? {
              firstName: schedule.instructor.profile.firstName,
              lastName: schedule.instructor.profile.lastName
            } : 'NULL - SIN PERFIL'
          } : 'NULL - NO CARGADO',
          classroom: schedule.classroom,
          fichaId: schedule.fichaId,
          ficha: schedule.ficha ? {
            id: schedule.ficha.id,
            code: schedule.ficha.code,
            name: schedule.ficha.name
          } : 'NULL - NO CARGADA'
        });
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
        // ⭐ DEBUG: Antes de mapear cada item
        console.log(`🔍 MAPEANDO HORARIO ${schedule.id}:`);
        console.log(`  - Competencia: ${schedule.competence?.name || 'NO ENCONTRADA'}`);
        console.log(`  - Instructor: ${schedule.instructor?.profile ? 
          `${schedule.instructor.profile.firstName} ${schedule.instructor.profile.lastName}` : 'NO ENCONTRADO'}`);

        const scheduleItem: TrimesterScheduleItem = {
          id: schedule.id,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          classroom: schedule.classroom || 'Sin aula',
          competence: {
            id: schedule.competence?.id || schedule.competenceId || 0,
            name: schedule.competence?.name || 'Competencia no encontrada'
          },
          instructor: {
            id: schedule.instructor?.id || schedule.instructorId || 0,
            name: schedule.instructor?.profile 
              ? `${schedule.instructor.profile.firstName} ${schedule.instructor.profile.lastName}`
              : 'Instructor no encontrado'
          }
        };

        // ⭐ DEBUG: Después de mapear
        console.log(`🔍 ITEM MAPEADO:`, scheduleItem);

        weeklySchedule[schedule.dayOfWeek].push(scheduleItem);
      });

      // Ordenar por hora de inicio
      Object.keys(weeklySchedule).forEach(day => {
        weeklySchedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
      });

      console.log('✅ RESULTADO FINAL - Horarios de trimestre obtenidos y mapeados');
      console.log('🔍 ESTRUCTURA FINAL:', {
        LUNES: weeklySchedule.LUNES.length,
        MARTES: weeklySchedule.MARTES.length,
        MIERCOLES: weeklySchedule.MIERCOLES.length,
        JUEVES: weeklySchedule.JUEVES.length,
        VIERNES: weeklySchedule.VIERNES.length,
        SABADO: weeklySchedule.SABADO.length
      });

      return weeklySchedule;
    } catch (error) {
      console.error('❌ ERROR COMPLETO al obtener horarios de trimestre:', error);
      console.error('❌ STACK TRACE:', error.stack);
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
  // backend/src/attendance/attendance.service.ts
// AGREGAR ESTOS MÉTODOS AL FINAL DE LA CLASE AttendanceService

// ⭐ ASIGNAR INSTRUCTOR A FICHA
async assignInstructorToFicha(data: {
  instructorId: number;
  fichaId: number;
  subject: string;
  description?: string;
}): Promise<InstructorAssignmentType> {
  try {
    console.log('📋 Asignando instructor a ficha:', data);

    // Verificar si ya existe una asignación activa
    const existingAssignment = await this.assignmentRepository.findOne({
      where: {
        instructorId: data.instructorId,
        fichaId: data.fichaId,
        isActive: true
      }
    });

    if (existingAssignment) {
      throw new Error('El instructor ya está asignado a esta ficha');
    }

    // Crear nueva asignación
    const newAssignment = this.assignmentRepository.create({
      instructorId: data.instructorId,
      fichaId: data.fichaId,
      subject: data.subject,
      description: data.description,
      isActive: true,
      assignedAt: new Date()
    });

    const savedAssignment = await this.assignmentRepository.save(newAssignment);

    console.log('✅ Instructor asignado exitosamente');
    return {
      id: savedAssignment.id,
      instructorId: savedAssignment.instructorId,
      fichaId: savedAssignment.fichaId,
      subject: savedAssignment.subject,
      description: savedAssignment.description,
      isActive: savedAssignment.isActive,
      assignedAt: savedAssignment.assignedAt
    };
  } catch (error) {
    console.error('❌ Error al asignar instructor:', error);
    throw error;
  }
}

// ⭐ OBTENER TODAS LAS ASIGNACIONES
async getAllInstructorAssignments(): Promise<InstructorAssignmentType[]> {
  try {
    console.log('📋 Obteniendo todas las asignaciones de instructores');

    const assignments = await this.assignmentRepository.find({
      relations: ['instructor', 'instructor.profile', 'ficha'],
      order: { assignedAt: 'DESC' }
    });

    const formattedAssignments: InstructorAssignmentType[] = assignments.map(assignment => ({
      id: assignment.id,
      instructorId: assignment.instructorId,
      fichaId: assignment.fichaId,
      subject: assignment.subject,
      description: assignment.description,
      isActive: assignment.isActive,
      assignedAt: assignment.assignedAt,
      instructor: assignment.instructor?.profile ? {
        id: assignment.instructor.id,
        firstName: assignment.instructor.profile.firstName,
        lastName: assignment.instructor.profile.lastName,
        email: assignment.instructor.email
      } : undefined,
      ficha: assignment.ficha ? {
        id: assignment.ficha.id,
        code: assignment.ficha.code,
        name: assignment.ficha.name
      } : undefined
    }));

    console.log('✅ Asignaciones obtenidas:', formattedAssignments.length);
    return formattedAssignments;
  } catch (error) {
    console.error('❌ Error al obtener asignaciones:', error);
    return [];
  }
}

// ⭐ ELIMINAR/DESACTIVAR ASIGNACIÓN
async removeInstructorAssignment(assignmentId: number): Promise<{ message: string; assignmentId: number }> {
  try {
    console.log(`📋 Eliminando asignación ${assignmentId}`);

    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId }
    });

    if (!assignment) {
      throw new Error('Asignación no encontrada');
    }

    // Desactivar en lugar de eliminar
    assignment.isActive = false;
    await this.assignmentRepository.save(assignment);

    console.log('✅ Asignación desactivada exitosamente');
    return {
      message: 'Asignación desactivada exitosamente',
      assignmentId
    };
  } catch (error) {
    console.error('❌ Error al eliminar asignación:', error);
    throw error;
  }
}

// ⭐ ACTUALIZAR ASIGNACIÓN
async updateInstructorAssignment(assignmentId: number, data: {
  subject?: string;
  description?: string;
  isActive?: boolean;
}): Promise<InstructorAssignmentType> {
  try {
    console.log(`📋 Actualizando asignación ${assignmentId}:`, data);

    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['instructor', 'instructor.profile', 'ficha']
    });

    if (!assignment) {
      throw new Error('Asignación no encontrada');
    }

    // Actualizar campos proporcionados
    if (data.subject !== undefined) assignment.subject = data.subject;
    if (data.description !== undefined) assignment.description = data.description;
    if (data.isActive !== undefined) assignment.isActive = data.isActive;

    const updatedAssignment = await this.assignmentRepository.save(assignment);

    console.log('✅ Asignación actualizada exitosamente');
    return {
      id: updatedAssignment.id,
      instructorId: updatedAssignment.instructorId,
      fichaId: updatedAssignment.fichaId,
      subject: updatedAssignment.subject,
      description: updatedAssignment.description,
      isActive: updatedAssignment.isActive,
      assignedAt: updatedAssignment.assignedAt,
      instructor: assignment.instructor?.profile ? {
        id: assignment.instructor.id,
        firstName: assignment.instructor.profile.firstName,
        lastName: assignment.instructor.profile.lastName,
        email: assignment.instructor.email
      } : undefined,
      ficha: assignment.ficha ? {
        id: assignment.ficha.id,
        code: assignment.ficha.code,
        name: assignment.ficha.name
      } : undefined
    };
  } catch (error) {
    console.error('❌ Error al actualizar asignación:', error);
    throw error;
  }
}

// ⭐ OBTENER ASIGNACIÓN POR ID
async getInstructorAssignmentById(assignmentId: number): Promise<InstructorAssignmentType> {
  try {
    console.log(`📋 Obteniendo asignación ${assignmentId}`);

    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['instructor', 'instructor.profile', 'ficha']
    });

    if (!assignment) {
      throw new Error('Asignación no encontrada');
    }

    console.log('✅ Asignación obtenida exitosamente');
    return {
      id: assignment.id,
      instructorId: assignment.instructorId,
      fichaId: assignment.fichaId,
      subject: assignment.subject,
      description: assignment.description,
      isActive: assignment.isActive,
      assignedAt: assignment.assignedAt,
      instructor: assignment.instructor?.profile ? {
        id: assignment.instructor.id,
        firstName: assignment.instructor.profile.firstName,
        lastName: assignment.instructor.profile.lastName,
        email: assignment.instructor.email
      } : undefined,
      ficha: assignment.ficha ? {
        id: assignment.ficha.id,
        code: assignment.ficha.code,
        name: assignment.ficha.name
      } : undefined
    };
  } catch (error) {
    console.error('❌ Error al obtener asignación:', error);
    throw error;
  }
}

// ⭐ OBTENER ASIGNACIONES POR INSTRUCTOR
async getAssignmentsByInstructor(instructorId: number): Promise<InstructorAssignmentType[]> {
  try {
    console.log(`📋 Obteniendo asignaciones del instructor ${instructorId}`);

    const assignments = await this.assignmentRepository.find({
      where: { instructorId },
      relations: ['instructor', 'instructor.profile', 'ficha'],
      order: { assignedAt: 'DESC' }
    });

    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      instructorId: assignment.instructorId,
      fichaId: assignment.fichaId,
      subject: assignment.subject,
      description: assignment.description,
      isActive: assignment.isActive,
      assignedAt: assignment.assignedAt,
      instructor: assignment.instructor?.profile ? {
        id: assignment.instructor.id,
        firstName: assignment.instructor.profile.firstName,
        lastName: assignment.instructor.profile.lastName,
        email: assignment.instructor.email
      } : undefined,
      ficha: assignment.ficha ? {
        id: assignment.ficha.id,
        code: assignment.ficha.code,
        name: assignment.ficha.name
      } : undefined
    }));

    console.log('✅ Asignaciones del instructor obtenidas:', formattedAssignments.length);
    return formattedAssignments;
  } catch (error) {
    console.error('❌ Error al obtener asignaciones del instructor:', error);
    return [];
  }
}

// ⭐ OBTENER ASIGNACIONES POR FICHA
async getAssignmentsByFicha(fichaId: number): Promise<InstructorAssignmentType[]> {
  try {
    console.log(`📋 Obteniendo asignaciones de la ficha ${fichaId}`);

    const assignments = await this.assignmentRepository.find({
      where: { fichaId },
      relations: ['instructor', 'instructor.profile', 'ficha'],
      order: { assignedAt: 'DESC' }
    });

    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      instructorId: assignment.instructorId,
      fichaId: assignment.fichaId,
      subject: assignment.subject,
      description: assignment.description,
      isActive: assignment.isActive,
      assignedAt: assignment.assignedAt,
      instructor: assignment.instructor?.profile ? {
        id: assignment.instructor.id,
        firstName: assignment.instructor.profile.firstName,
        lastName: assignment.instructor.profile.lastName,
        email: assignment.instructor.email
      } : undefined,
      ficha: assignment.ficha ? {
        id: assignment.ficha.id,
        code: assignment.ficha.code,
        name: assignment.ficha.name
      } : undefined
    }));

    console.log('✅ Asignaciones de la ficha obtenidas:', formattedAssignments.length);
    return formattedAssignments;
  } catch (error) {
    console.error('❌ Error al obtener asignaciones de la ficha:', error);
    return [];
  }
}
async getAttendanceBySchedule(scheduleId: number) {
  try {
    console.log(`📋 Obteniendo asistencia para horario ${scheduleId}`);
    
    // Buscar registros de asistencia por trimesterScheduleId
    const attendanceRecords = await this.attendanceRepository.find({
      where: {
        trimesterScheduleId: scheduleId
      },
      relations: ['learner']
    });

    // Si no hay registros, crear automáticamente para todos los aprendices de la ficha
    if (attendanceRecords.length === 0) {
      console.log('📋 No hay registros, creando automáticamente...');
      
      // Obtener el horario de trimestre
      const schedule = await this.trimesterScheduleRepository.findOne({
        where: { id: scheduleId },
        relations: ['ficha']
      });

      if (schedule) {
        // Obtener aprendices de la ficha
        const learners = await this.getLearnersFromFicha(schedule.fichaId);
        
        // Crear registros para cada aprendiz
        for (const learner of learners) {
          const newRecord = this.attendanceRepository.create({
            trimesterScheduleId: scheduleId,
            learnerId: learner.id,
            status: 'ABSENT',
            isManual: false
          });
          
          await this.attendanceRepository.save(newRecord);
        }
        
        // Volver a buscar los registros creados
        return await this.attendanceRepository.find({
          where: { trimesterScheduleId: scheduleId },
          relations: ['learner']
        });
      }
    }

    console.log(`✅ Se encontraron ${attendanceRecords.length} registros de asistencia`);
    return attendanceRecords;
  } catch (error) {
    console.error('❌ Error al obtener asistencia por horario:', error);
    throw error;
  }
}
async updateAttendanceRecord(
  attendanceId: number,
  status: 'PRESENTE' | 'AUSENTE' | 'TARDE' | 'EXCUSA',
  markedBy: number,
  notes?: string,
  excuseReason?: string
): Promise<AttendanceUpdateResult> {
  try {
    console.log(`📋 Actualizando registro de asistencia ${attendanceId} a ${status}`);
    
    // Buscar el registro existente
    const record = await this.attendanceRepository.findOne({
      where: { id: attendanceId },
      relations: ['learner']
    });

    if (!record) {
      throw new Error('Registro de asistencia no encontrado');
    }

    // Mapear estados de español a inglés
    const statusMapping = {
      'PRESENTE': 'PRESENT' as const,
      'AUSENTE': 'ABSENT' as const,
      'TARDE': 'LATE' as const,
      'EXCUSA': 'EXCUSED' as const
    };

    const englishStatus = statusMapping[status];

    // Actualizar el registro
    record.status = englishStatus;
    record.notes = notes || record.notes;
    record.excuseReason = excuseReason || record.excuseReason;
    record.manuallyMarkedAt = new Date();
    record.markedAt = new Date();
    record.markedBy = markedBy;
    record.isManual = true;

    // Si se marca como presente o tarde, registrar la hora
    if (englishStatus === 'PRESENT' || englishStatus === 'LATE') {
      if (!record.markedAt) {
        record.markedAt = new Date();
      }
    }

    const updatedRecord = await this.attendanceRepository.save(record);
    
    console.log(`✅ Registro actualizado: ${record.learner?.firstName} ${record.learner?.lastName} -> ${englishStatus}`);
    
    // ⭐ RETORNO CON TIPO EXPLÍCITO
    return {
      id: updatedRecord.id,
      attendanceId: updatedRecord.id,
      learnerId: updatedRecord.learnerId,
      learnerName: record.learner ? `${record.learner.firstName} ${record.learner.lastName}` : 'Sin nombre',
      status: englishStatus,
      markedAt: updatedRecord.markedAt?.toISOString() || null,
      manuallyMarkedAt: updatedRecord.manuallyMarkedAt?.toISOString() || null,
      isManual: updatedRecord.isManual,
      notes: updatedRecord.notes,
      excuseReason: updatedRecord.excuseReason,
      markedBy: updatedRecord.markedBy,
      learner: record.learner ? {
        id: record.learner.id,
        firstName: record.learner.firstName,
        lastName: record.learner.lastName,
        documentNumber: record.learner.documentNumber
      } : null
    };
  } catch (error) {
    console.error('❌ Error al actualizar registro de asistencia:', error);
    throw error;
  }
}


}
