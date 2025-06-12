// backend/src/config/entities/ficha.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Program } from './program.entity';
import { Profile } from '../../profiles/entities/profile.entity';
import { InstructorAssignment } from '../../attendance/entities/instructor-assignment.entity';
import { FichaCompetence } from './ficha-competence.entity';

@Entity('fichas')
export class Ficha {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 50, default: 'EN EJECUCIÓN' })
  status: string;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'date', nullable: true })
  reportDate: Date;

  @ManyToOne(() => Program, program => program.fichas)
  @JoinColumn({ name: 'programId' })
  program: Program;

  @Column()
  programId: number;

  // ✅ MANTENER SOLO ESTA RELACIÓN (remover la duplicada)
  @OneToMany(() => FichaCompetence, fichaCompetence => fichaCompetence.ficha)
  fichaCompetences: FichaCompetence[];

  @OneToMany(() => Profile, profile => profile.ficha)
  profiles: Profile[];

  @OneToMany(() => InstructorAssignment, assignment => assignment.ficha)
  instructorAssignments: InstructorAssignment[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}