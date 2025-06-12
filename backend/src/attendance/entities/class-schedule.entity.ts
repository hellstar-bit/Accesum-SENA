// backend/src/attendance/entities/class-schedule.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { InstructorAssignment } from './instructor-assignment.entity';
import { AttendanceRecord } from './attendance-record.entity'; // ⭐ AGREGAR IMPORT

@Entity('class_schedules')
export class ClassSchedule {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 15 })
  lateToleranceMinutes: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => InstructorAssignment)
  @JoinColumn({ name: 'assignmentId' })
  assignment: InstructorAssignment;

  // ⭐ AGREGAR ESTA RELACIÓN
  @OneToMany(() => AttendanceRecord, record => record.schedule)
  attendanceRecords: AttendanceRecord[];
}
