// backend/src/attendance/entities/class-schedule.entity.ts - FINAL
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { InstructorAssignment } from './instructor-assignment.entity';
import { AttendanceRecord } from './attendance-record.entity';

@Entity('class_schedules')
export class ClassSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => InstructorAssignment, assignment => assignment.schedules)
  @JoinColumn({ name: 'assignmentId' })
  assignment: InstructorAssignment;

  @Column()
  assignmentId: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ nullable: true })
  classroom: string;

  @Column({ default: 20 })
  lateToleranceMinutes: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => AttendanceRecord, record => record.schedule)
  attendanceRecords: AttendanceRecord[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}