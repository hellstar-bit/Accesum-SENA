// src/config/entities/program-type.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Program } from './program.entity';
import { Competence } from './competence.entity';

@Entity('program_types')
export class ProgramType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // "TPS"

  @Column()
  name: string; // "Técnico en Programación de Software"

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Program, program => program.programType)
  programs: Program[];

  @OneToMany(() => Competence, competence => competence.programType)
  baseCompetences: Competence[];
}