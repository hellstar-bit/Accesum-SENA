// backend/src/attendance/entities/attendance-record.entity.ts - FINAL
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ClassSchedule } from './class-schedule.entity';
import { Profile } from '../../profiles/entities/profile.entity';

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

  @Column({
    type: 'enum',
    enum: ['PRESENT', 'LATE', 'ABSENT'],
    default: 'ABSENT'
  })
  status: 'PRESENT' | 'LATE' | 'ABSENT';

  @Column({ type: 'timestamp', nullable: true })
  markedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  manuallyMarkedAt: Date;

  @Column({ nullable: true })
  markedBy: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: false })
  isManual: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}