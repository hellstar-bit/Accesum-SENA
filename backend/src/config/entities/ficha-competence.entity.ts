// backend/src/config/entities/ficha-competence.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Ficha } from './ficha.entity';
import { Competence } from './competence.entity';

@Entity('ficha_competences')
export class FichaCompetence {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ficha, ficha => ficha.competenceAssignments)
  @JoinColumn({ name: 'fichaId' })
  ficha: Ficha;

  @Column()
  fichaId: number;

  @ManyToOne(() => Competence, competence => competence.fichaAssignments)
  @JoinColumn({ name: 'competenceId' })
  competence: Competence;

  @Column()
  competenceId: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
