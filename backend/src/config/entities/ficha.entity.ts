// src/config/entities/ficha.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Program } from './program.entity';
import { Profile } from '../../profiles/entities/profile.entity';

@Entity('fichas')
export class Ficha {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @ManyToOne(() => Program, program => program.fichas)
  @JoinColumn({ name: 'programId' })
  program: Program;

  @Column()
  programId: number;

  @OneToMany(() => Profile, profile => profile.ficha)
  profiles: Profile[];
}