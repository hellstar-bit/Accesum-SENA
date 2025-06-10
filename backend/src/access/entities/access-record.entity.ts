import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AttendanceRecord } from '../../attendance/entities/attendance-record.entity';

@Entity('access_records')
export class AccessRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'timestamp' })
  entryTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  exitTime: Date;

  @Column()
  status: string;

  @Column({ nullable: true })
  duration: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relación con AttendanceRecord
  @OneToMany(() => AttendanceRecord, record => record.accessRecord)
  attendanceRecords: AttendanceRecord[];
}
