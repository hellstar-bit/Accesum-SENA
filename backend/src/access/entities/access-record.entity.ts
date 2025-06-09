// backend/src/access/entities/access-record.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

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

  @Column({ nullable: true }) // ⭐ AGREGAR ESTA PROPIEDAD
  duration: string;

  @Column({ type: 'text', nullable: true }) // ⭐ AGREGAR ESTA PROPIEDAD
  notes: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
