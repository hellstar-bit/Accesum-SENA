// backend/src/attendance/entities/attendance-record.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ClassSchedule } from './class-schedule.entity';
import { Profile } from '../../profiles/entities/profile.entity';
import { AccessRecord } from '../../access/entities/access-record.entity';

@Entity('attendance_records')
export class AttendanceRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ClassSchedule, schedule => schedule.attendanceRecords)
  @JoinColumn({ name: 'scheduleId' })
  schedule: ClassSchedule;

  @Column()
  scheduleId: number;

  @ManyToOne(() => Profile)
  @JoinColumn({ name: 'learnerId' })
  learner: Profile;

  @Column()
  learnerId: number;

  @ManyToOne(() => AccessRecord, access => access.attendanceRecords, { nullable: true })
  @JoinColumn({ name: 'accessRecordId' })
  accessRecord?: AccessRecord; // ⭐ CAMBIAR A OPCIONAL

  @Column({ nullable: true })
  accessRecordId?: number; // ⭐ CAMBIAR A OPCIONAL

  @Column({
    type: 'enum',
    enum: ['PRESENT', 'LATE', 'ABSENT'],
    default: 'ABSENT'
  })
  status: 'PRESENT' | 'LATE' | 'ABSENT';

  @Column({ type: 'timestamp', nullable: true })
  markedAt?: Date; // ⭐ CAMBIAR A OPCIONAL

  @Column({ type: 'timestamp', nullable: true })
  manuallyMarkedAt?: Date; // ⭐ CAMBIAR A OPCIONAL

  @Column({ nullable: true })
  markedBy?: number; // ⭐ CAMBIAR A OPCIONAL

  @Column({ type: 'text', nullable: true })
  notes?: string; // ⭐ CAMBIAR A OPCIONAL

  @Column({ default: false })
  isManual: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
  
}
