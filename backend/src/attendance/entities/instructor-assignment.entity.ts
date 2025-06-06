import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Ficha } from '../../config/entities/ficha.entity';
import { ClassSchedule } from './class-schedule.entity';

@Entity('instructor_assignments')
export class InstructorAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'instructorId' })
  instructor: User;

  @Column()
  instructorId: number;

  @ManyToOne(() => Ficha)
  @JoinColumn({ name: 'fichaId' })
  ficha: Ficha;

  @Column()
  fichaId: number;

  @Column({ nullable: true })
  subject: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  @OneToMany(() => ClassSchedule, schedule => schedule.assignment)
  schedules: ClassSchedule[];
}