// backend/src/attendance/entities/trimester-schedule.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Ficha } from '../../config/entities/ficha.entity';
import { Competence } from '../../config/entities/competence.entity';

@Entity('trimester_schedules')
export class TrimesterSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']
  })
  dayOfWeek: 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO';

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  // ⭐ VERIFICAR QUE ESTAS RELACIONES EXISTAN
  @ManyToOne(() => Competence)
  @JoinColumn({ name: 'competenceId' })
  competence: Competence;

  @Column()
  competenceId: number; // ⭐ ESTA COLUMNA DEBE EXISTIR

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
  classroom: string;

  @Column({ length: 10 })
  trimester: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
