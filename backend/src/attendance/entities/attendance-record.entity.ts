// backend/src/attendance/entities/attendance-record.entity.ts - VERSIÓN FINAL CORREGIDA
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TrimesterSchedule } from './trimester-schedule.entity';
import { Profile } from '../../profiles/entities/profile.entity';
import { User } from '../../users/entities/user.entity';
import { ClassSchedule } from './class-schedule.entity';

@Entity('attendance_records')
export class AttendanceRecord {
  @PrimaryGeneratedColumn()
  id: number;

  // ⭐ NUEVA RELACIÓN: trimesterScheduleId (principal)
  @Column({ nullable: true })
  trimesterScheduleId?: number;

  @ManyToOne(() => TrimesterSchedule, { nullable: true })
  @JoinColumn({ name: 'trimesterScheduleId' })
  trimesterSchedule?: TrimesterSchedule;

  // ⭐ MANTENER scheduleId como nullable (para compatibilidad)
  @Column({ nullable: true })
  scheduleId?: number;

  @ManyToOne(() => Profile)
  @JoinColumn({ name: 'learnerId' })
  learner: Profile;

  @Column()
  learnerId: number;

  @Column({ nullable: true })
  accessRecordId?: number;

  // ⭐ ESTADO ACTUALIZADO - Agregando 'EXCUSED' a los estados existentes
  @Column({
    type: 'enum',
    enum: ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'],
    default: 'ABSENT'
  })
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';

  @Column({ type: 'timestamp', nullable: true })
  markedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  manuallyMarkedAt?: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'markedBy' })
  marker?: User;

  @Column({ nullable: true })
  markedBy?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // ⭐ NUEVO CAMPO: Para almacenar motivo de excusas
  @Column({ type: 'text', nullable: true })
  excuseReason?: string;

  @Column({ default: false })
  isManual: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // ⭐ RELACIÓN CON CLASSSCHEDULE - Corregida para ser nullable
  @ManyToOne(() => ClassSchedule, schedule => schedule.attendanceRecords, { nullable: true })
  @JoinColumn({ name: 'scheduleId' })
  schedule?: ClassSchedule;
}