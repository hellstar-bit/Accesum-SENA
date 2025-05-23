// src/access/entities/access-record.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('access_records')
export class AccessRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  entryTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  exitTime: Date;

  @Column({ default: 'entry' })
  status: string; // 'entry' or 'exit'

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;
}