// backend/src/config/entities/.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Program } from './program.entity';
import { Profile } from '../../profiles/entities/profile.entity';
import { InstructorAssignment } from '../../attendance/entities/instructor-assignment.entity';


@Entity('fichas')
export class Ficha {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  code: string; // "2856502"

  @Column({ length: 200 })
  name: string; // "GESTIÓN DE REDES DE DATOS"

  @Column({ length: 50, default: 'EN EJECUCIÓN' })
  status: string; // "EN EJECUCIÓN", "TERMINADA", "CANCELADA"

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'date', nullable: true })
  reportDate: Date; // Fecha del último reporte importado

  @ManyToOne(() => Program, program => program.fichas)
  @JoinColumn({ name: 'programId' })
  program: Program;

  @Column()
  programId: number;

  @OneToMany(() => Profile, profile => profile.ficha)
  profiles: Profile[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => InstructorAssignment, assignment => assignment.ficha)
  instructorAssignments: InstructorAssignment[];

}