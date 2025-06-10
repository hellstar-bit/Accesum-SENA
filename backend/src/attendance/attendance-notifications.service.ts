// backend/src/attendance/attendance-notifications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { ClassSchedule } from './entities/class-schedule.entity';

export interface AttendanceNotification {
  id: string;
  type: 'AUTO_ATTENDANCE' | 'MANUAL_ATTENDANCE' | 'CLASS_UPDATE';
  timestamp: Date;
  classId: number;
  learnerId: number;
  learnerName: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  isAutomatic: boolean;
  className: string;
  fichaCode: string;
}

@Injectable()
export class AttendanceNotificationsService {
  private notifications: Map<number, AttendanceNotification[]> = new Map(); // instructorId -> notifications[]
  
  constructor(
    @InjectRepository(AttendanceRecord)
    private attendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(ClassSchedule)
    private scheduleRepository: Repository<ClassSchedule>,
  ) {}

  // ⭐ CREAR NOTIFICACIÓN DE ASISTENCIA AUTOMÁTICA
  async createAutoAttendanceNotification(
    classSchedule: ClassSchedule,
    attendanceRecord: AttendanceRecord,
    learnerName: string
  ) {
    const instructorId = classSchedule.assignment.instructorId;
    
    const notification: AttendanceNotification = {
      id: `auto_${Date.now()}_${attendanceRecord.id}`,
      type: 'AUTO_ATTENDANCE',
      timestamp: new Date(),
      classId: classSchedule.id,
      learnerId: attendanceRecord.learnerId,
      learnerName,
      status: attendanceRecord.status,
      isAutomatic: true,
      className: classSchedule.assignment.subject,
      fichaCode: classSchedule.assignment.ficha.code
    };

    this.addNotificationToInstructor(instructorId, notification);
    
    console.log('🔔 Notificación de asistencia automática creada:', {
      instructor: instructorId,
      learner: learnerName,
      class: notification.className,
      status: notification.status
    });
  }

  // ⭐ CREAR NOTIFICACIÓN DE ASISTENCIA MANUAL
  async createManualAttendanceNotification(
    classSchedule: ClassSchedule,
    attendanceRecord: AttendanceRecord,
    learnerName: string,
    markedBy: number
  ) {
    const instructorId = classSchedule.assignment.instructorId;
    
    // Solo crear notificación si no fue marcada por el mismo instructor
    if (markedBy === instructorId) return;
    
    const notification: AttendanceNotification = {
      id: `manual_${Date.now()}_${attendanceRecord.id}`,
      type: 'MANUAL_ATTENDANCE',
      timestamp: new Date(),
      classId: classSchedule.id,
      learnerId: attendanceRecord.learnerId,
      learnerName,
      status: attendanceRecord.status,
      isAutomatic: false,
      className: classSchedule.assignment.subject,
      fichaCode: classSchedule.assignment.ficha.code
    };

    this.addNotificationToInstructor(instructorId, notification);
  }

  // ⭐ AGREGAR NOTIFICACIÓN A INSTRUCTOR
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

  // ⭐ OBTENER NOTIFICACIONES DE UN INSTRUCTOR
  getInstructorNotifications(instructorId: number, limit = 20): AttendanceNotification[] {
    const notifications = this.notifications.get(instructorId) || [];
    return notifications.slice(0, limit);
  }

  // ⭐ MARCAR NOTIFICACIONES COMO LEÍDAS
  markNotificationsAsRead(instructorId: number, notificationIds: string[]) {
    const notifications = this.notifications.get(instructorId) || [];
    
    // En una implementación real, marcarías las notificaciones como leídas en la BD
    // Por ahora, las removemos del array en memoria
    const filteredNotifications = notifications.filter(
      notification => !notificationIds.includes(notification.id)
    );
    
    this.notifications.set(instructorId, filteredNotifications);
    
    console.log(`🔔 ${notificationIds.length} notificaciones marcadas como leídas para instructor ${instructorId}`);
  }

  // ⭐ LIMPIAR NOTIFICACIONES ANTIGUAS
  cleanOldNotifications() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    this.notifications.forEach((notifications, instructorId) => {
      const filteredNotifications = notifications.filter(
        notification => notification.timestamp > oneDayAgo
      );
      this.notifications.set(instructorId, filteredNotifications);
    });
  }

  // ⭐ OBTENER ESTADÍSTICAS DE NOTIFICACIONES
  getNotificationStats(instructorId: number) {
    const notifications = this.notifications.get(instructorId) || [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentNotifications = notifications.filter(n => n.timestamp > oneHourAgo);
    const autoAttendance = notifications.filter(n => n.type === 'AUTO_ATTENDANCE').length;
    const manualAttendance = notifications.filter(n => n.type === 'MANUAL_ATTENDANCE').length;
    
    return {
      total: notifications.length,
      recent: recentNotifications.length,
      byType: {
        auto: autoAttendance,
        manual: manualAttendance
      }
    };
  }
}