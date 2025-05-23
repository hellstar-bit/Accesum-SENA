// src/config/entities/program.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Coordination } from './coordination.entity';
import { Ficha } from './ficha.entity';
import { Profile } from '../../profiles/entities/profile.entity';

@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @ManyToOne(() => Coordination, coordination => coordination.programs)
  @JoinColumn({ name: 'coordinationId' })
  coordination: Coordination;

  @Column()
  coordinationId: number;

  @OneToMany(() => Ficha, ficha => ficha.program)
  fichas: Ficha[];

  @OneToMany(() => Profile, profile => profile.program)
  profiles: Profile[];
}