// backend/src/attendance/attendance-notifications.service.ts - ACTUALIZADO
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { ClassSchedule } from './entities/class-schedule.entity';
import { TrimesterSchedule } from './entities/trimester-schedule.entity';
import { Profile } from '../profiles/entities/profile.entity';

// ⭐ INTERFAZ ACTUALIZADA CON NUEVO ESTADO 'EXCUSED'
export interface AttendanceNotification {
  id: string;
  type: 'AUTO_ATTENDANCE' | 'MANUAL_ATTENDANCE' | 'CLASS_UPDATE' | 'BULK_UPDATE' | 'EXCUSE_ADDED';
  timestamp: Date;
  classId?: number;
  trimesterScheduleId?: number;
  learnerId: number;
  learnerName: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  isAutomatic: boolean;
  className: string;
  fichaCode: string;
  excuseReason?: string;
  markedBy?: number;
  markedByName?: string;
  notes?: string;
  batchSize?: number; // Para actualizaciones masivas
}

@Injectable()
export class AttendanceNotificationsService {
  private notifications: Map<number, AttendanceNotification[]> = new Map(); // instructorId -> notifications[]
  
  constructor(
    @InjectRepository(AttendanceRecord)
    private attendanceRepository: Repository<AttendanceRecord>,
    
    @InjectRepository(ClassSchedule)
    private scheduleRepository: Repository<ClassSchedule>,
    
    @InjectRepository(TrimesterSchedule)
    private trimesterScheduleRepository: Repository<TrimesterSchedule>,
    
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  // ⭐ CREAR NOTIFICACIÓN DE ASISTENCIA AUTOMÁTICA (Actualizado)
  async createAutoAttendanceNotification(
    schedule: ClassSchedule | TrimesterSchedule,
    attendanceRecord: AttendanceRecord,
    learnerName: string
  ) {
    try {
      let instructorId: number;
      let className: string;
      let fichaCode: string;
      let scheduleId: number;
      
      // Determinar si es ClassSchedule o TrimesterSchedule
      if ('assignment' in schedule) {
        // Es ClassSchedule
        instructorId = schedule.assignment.instructorId;
        className = schedule.assignment.subject;
        fichaCode = schedule.assignment.ficha.code;
        scheduleId = schedule.id;
      } else {
        // Es TrimesterSchedule
        instructorId = schedule.instructorId;
        className = schedule.competence?.name || 'Clase sin nombre';
        fichaCode = schedule.ficha?.code || 'Sin código';
        scheduleId = schedule.id;
      }
      
      const notification: AttendanceNotification = {
        id: `auto_${Date.now()}_${attendanceRecord.id}`,
        type: 'AUTO_ATTENDANCE',
        timestamp: new Date(),
        classId: 'assignment' in schedule ? schedule.id : undefined,
        trimesterScheduleId: 'assignment' in schedule ? undefined : schedule.id,
        learnerId: attendanceRecord.learnerId,
        learnerName,
        status: attendanceRecord.status,
        isAutomatic: true,
        className,
        fichaCode,
        notes: attendanceRecord.notes
      };

      this.addNotificationToInstructor(instructorId, notification);
      
      
    } catch (error) {
      console.error('❌ Error al crear notificación automática:', error);
    }
  }

  // ⭐ CREAR NOTIFICACIÓN DE ASISTENCIA MANUAL (Actualizado)
  async createManualAttendanceNotification(
    trimesterScheduleId: number,
    attendanceRecord: AttendanceRecord,
    learnerName: string,
    markedBy: number,
    markedByName?: string
  ) {
    try {
      // Obtener información del horario de trimestre
      const schedule = await this.trimesterScheduleRepository.findOne({
        where: { id: trimesterScheduleId },
        relations: ['competence', 'ficha', 'instructor', 'instructor.profile']
      });

      if (!schedule) {
        console.error('❌ Horario de trimestre no encontrado:', trimesterScheduleId);
        return;
      }

      const instructorId = schedule.instructorId;
      
      // Solo crear notificación si no fue marcada por el mismo instructor
      if (markedBy === instructorId) return;
      
      const notification: AttendanceNotification = {
        id: `manual_${Date.now()}_${attendanceRecord.id}`,
        type: attendanceRecord.status === 'EXCUSED' ? 'EXCUSE_ADDED' : 'MANUAL_ATTENDANCE',
        timestamp: new Date(),
        trimesterScheduleId: schedule.id,
        learnerId: attendanceRecord.learnerId,
        learnerName,
        status: attendanceRecord.status,
        isAutomatic: false,
        className: schedule.competence?.name || 'Clase sin nombre',
        fichaCode: schedule.ficha?.code || 'Sin código',
        excuseReason: attendanceRecord.excuseReason,
        markedBy,
        markedByName,
        notes: attendanceRecord.notes
      };

      this.addNotificationToInstructor(instructorId, notification);
      
      
    } catch (error) {
      console.error('❌ Error al crear notificación manual:', error);
    }
  }

  // ⭐ NUEVO: CREAR NOTIFICACIÓN DE ACTUALIZACIÓN MASIVA
  async createBulkUpdateNotification(
    trimesterScheduleId: number,
    updatedRecords: AttendanceRecord[],
    markedBy: number,
    markedByName?: string
  ) {
    try {
      if (updatedRecords.length === 0) return;

      // Obtener información del horario
      const schedule = await this.trimesterScheduleRepository.findOne({
        where: { id: trimesterScheduleId },
        relations: ['competence', 'ficha']
      });

      if (!schedule) {
        console.error('❌ Horario de trimestre no encontrado:', trimesterScheduleId);
        return;
      }

      const instructorId = schedule.instructorId;
      
      // Solo crear notificación si no fue marcada por el mismo instructor
      if (markedBy === instructorId) return;

      // Agrupar por estado para crear notificaciones más informativas
      const statusGroups = updatedRecords.reduce((groups, record) => {
        if (!groups[record.status]) {
          groups[record.status] = [];
        }
        groups[record.status].push(record);
        return groups;
      }, {} as Record<string, AttendanceRecord[]>);

      // Crear una notificación por cada estado modificado
      Object.entries(statusGroups).forEach(([status, records]) => {
        const notification: AttendanceNotification = {
          id: `bulk_${Date.now()}_${trimesterScheduleId}_${status}`,
          type: 'BULK_UPDATE',
          timestamp: new Date(),
          trimesterScheduleId: schedule.id,
          learnerId: records[0].learnerId, // Usar el primer registro como referencia
          learnerName: `${records.length} estudiantes`,
          status: status as any,
          isAutomatic: false,
          className: schedule.competence?.name || 'Clase sin nombre',
          fichaCode: schedule.ficha?.code || 'Sin código',
          markedBy,
          markedByName,
          batchSize: records.length,
          notes: `Actualización masiva: ${records.length} estudiantes marcados como ${this.getStatusText(status as any)}`
        };

        this.addNotificationToInstructor(instructorId, notification);
      });
      
      
    } catch (error) {
      console.error('❌ Error al crear notificación masiva:', error);
    }
  }

  // ⭐ NUEVO: CREAR NOTIFICACIÓN DE EXCUSA
  async createExcuseNotification(
    trimesterScheduleId: number,
    attendanceRecord: AttendanceRecord,
    learnerName: string,
    markedBy: number,
    markedByName?: string
  ) {
    try {
      const schedule = await this.trimesterScheduleRepository.findOne({
        where: { id: trimesterScheduleId },
        relations: ['competence', 'ficha']
      });

      if (!schedule) return;

      const instructorId = schedule.instructorId;
      
      const notification: AttendanceNotification = {
        id: `excuse_${Date.now()}_${attendanceRecord.id}`,
        type: 'EXCUSE_ADDED',
        timestamp: new Date(),
        trimesterScheduleId: schedule.id,
        learnerId: attendanceRecord.learnerId,
        learnerName,
        status: 'EXCUSED',
        isAutomatic: false,
        className: schedule.competence?.name || 'Clase sin nombre',
        fichaCode: schedule.ficha?.code || 'Sin código',
        excuseReason: attendanceRecord.excuseReason,
        markedBy,
        markedByName,
        notes: `Excusa registrada: ${attendanceRecord.excuseReason}`
      };

      this.addNotificationToInstructor(instructorId, notification);
      
     
    } catch (error) {
      console.error('❌ Error al crear notificación de excusa:', error);
    }
  }

  // ⭐ HELPER: Obtener texto del estado
  private getStatusText(status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'): string {
    switch (status) {
      case 'PRESENT': return 'Presente';
      case 'LATE': return 'Tarde';
      case 'ABSENT': return 'Ausente';
      case 'EXCUSED': return 'Excusa';
      default: return status;
    }
  }

  // ⭐ AGREGAR NOTIFICACIÓN A INSTRUCTOR (Sin cambios)
  private addNotificationToInstructor(instructorId: number, notification: AttendanceNotification) {
    const currentNotifications = this.notifications.get(instructorId) || [];
    
    // Agregar al inicio del array
    currentNotifications.unshift(notification);
    
    // Mantener solo las últimas 50 notificaciones
    if (currentNotifications.length > 50) {
      currentNotifications.splice(50);
    }
    
    this.notifications.set(instructorId, currentNotifications);
  }

  // ⭐ OBTENER NOTIFICACIONES DE UN INSTRUCTOR (Actualizado con filtros)
  getInstructorNotifications(
    instructorId: number, 
    limit = 20,
    type?: 'AUTO_ATTENDANCE' | 'MANUAL_ATTENDANCE' | 'CLASS_UPDATE' | 'BULK_UPDATE' | 'EXCUSE_ADDED'
  ): AttendanceNotification[] {
    let notifications = this.notifications.get(instructorId) || [];
    
    // Filtrar por tipo si se especifica
    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }
    
    return notifications.slice(0, limit);
  }

  // ⭐ MARCAR NOTIFICACIONES COMO LEÍDAS (Sin cambios)
  markNotificationsAsRead(instructorId: number, notificationIds: string[]) {
    const notifications = this.notifications.get(instructorId) || [];
    
    const filteredNotifications = notifications.filter(
      notification => !notificationIds.includes(notification.id)
    );
    
    this.notifications.set(instructorId, filteredNotifications);
    
  }

  // ⭐ LIMPIAR NOTIFICACIONES ANTIGUAS (Sin cambios)
  cleanOldNotifications() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    this.notifications.forEach((notifications, instructorId) => {
      const filteredNotifications = notifications.filter(
        notification => notification.timestamp > oneDayAgo
      );
      this.notifications.set(instructorId, filteredNotifications);
    });
  }

  // ⭐ OBTENER ESTADÍSTICAS DE NOTIFICACIONES (Actualizado)
  getNotificationStats(instructorId: number) {
    const notifications = this.notifications.get(instructorId) || [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentNotifications = notifications.filter(n => n.timestamp > oneHourAgo);
    const autoAttendance = notifications.filter(n => n.type === 'AUTO_ATTENDANCE').length;
    const manualAttendance = notifications.filter(n => n.type === 'MANUAL_ATTENDANCE').length;
    const bulkUpdates = notifications.filter(n => n.type === 'BULK_UPDATE').length;
    const excuses = notifications.filter(n => n.type === 'EXCUSE_ADDED').length;
    
    return {
      total: notifications.length,
      recent: recentNotifications.length,
      byType: {
        auto: autoAttendance,
        manual: manualAttendance,
        bulk: bulkUpdates,
        excuses: excuses
      },
      todayStats: this.getTodayStats(notifications)
    };
  }

  // ⭐ NUEVO: OBTENER ESTADÍSTICAS DE HOY
  private getTodayStats(notifications: AttendanceNotification[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayNotifications = notifications.filter(n => n.timestamp >= today);
    
    return {
      total: todayNotifications.length,
      present: todayNotifications.filter(n => n.status === 'PRESENT').length,
      late: todayNotifications.filter(n => n.status === 'LATE').length,
      absent: todayNotifications.filter(n => n.status === 'ABSENT').length,
      excused: todayNotifications.filter(n => n.status === 'EXCUSED').length
    };
  }

  // ⭐ NUEVO: OBTENER NOTIFICACIONES NO LEÍDAS
  getUnreadNotifications(instructorId: number): AttendanceNotification[] {
    const notifications = this.notifications.get(instructorId) || [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Considerar "no leídas" las notificaciones de la última hora
    return notifications.filter(n => n.timestamp > oneHourAgo);
  }

  // ⭐ NUEVO: LIMPIAR TODAS LAS NOTIFICACIONES DE UN INSTRUCTOR
  clearInstructorNotifications(instructorId: number) {
    this.notifications.delete(instructorId);
  }
}