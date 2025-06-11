// backend/src/config/entities/competence.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, OneToMany, JoinColumn } from 'typeorm';
import { Program } from './program.entity';
import { User } from '../../users/entities/user.entity';
import { FichaCompetence } from './ficha-competence.entity'; // ⭐ AGREGAR IMPORTACIÓN

@Entity('competences')
export class Competence {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ length: 300 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 240 })
  hours: number;

  @ManyToOne(() => Program, program => program.competences)
  @JoinColumn({ name: 'programId' })
  program: Program;

  @Column()
  programId: number;

  @ManyToMany(() => User, user => user.competences)
  instructors: User[];

  // ⭐ AGREGAR ESTA RELACIÓN
  @OneToMany(() => FichaCompetence, fichaCompetence => fichaCompetence.competence)
  fichaAssignments: FichaCompetence[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
