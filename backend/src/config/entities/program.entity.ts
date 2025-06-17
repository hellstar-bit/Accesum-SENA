// backend/src/config/entities/program.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Coordination } from './coordination.entity';
import { Ficha } from './ficha.entity';
import { Profile } from '../../profiles/entities/profile.entity';
import { Competence } from './competence.entity'; // ⭐ AGREGAR IMPORTACIÓN
import { ProgramType } from './program-type.entity'; // Importar ProgramType

@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 50, default: 'ACTIVO' })
  status: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 0 })
  totalHours: number;

  @ManyToOne(() => Coordination, coordination => coordination.programs)
  @JoinColumn({ name: 'coordinationId' })
  coordination: Coordination;

  @Column()
  coordinationId: number;

  @OneToMany(() => Ficha, ficha => ficha.program)
  fichas: Ficha[];

  @OneToMany(() => Profile, profile => profile.program)
  profiles: Profile[];

  // ⭐ AGREGAR ESTA RELACIÓN
  @OneToMany(() => Competence, competence => competence.program)
  competences: Competence[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ nullable: true })
  fichaCode: string; // "2999518" - código de la ficha asociada

  @Column({ nullable: true })
  programTypeId: number; // Relación con tipo de programa

  @ManyToOne(() => ProgramType, type => type.programs)
  @JoinColumn({ name: 'programTypeId' })
  programType: ProgramType;
}
