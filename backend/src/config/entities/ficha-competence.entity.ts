// backend/src/config/entities/ficha-competence.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn } from 'typeorm';
import { Ficha } from './ficha.entity';
import { Competence } from './competence.entity';

@Entity('ficha_competences')
export class FichaCompetence {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ficha, ficha => ficha.fichaCompetences)
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

  // ⭐ AGREGAR LA PROPIEDAD assignedAt QUE FALTA
  @CreateDateColumn()
  assignedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
