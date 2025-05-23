// src/config/entities/coordination.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Center } from './center.entity';
import { Program } from './program.entity';
import { Profile } from '../../profiles/entities/profile.entity';

@Entity('coordinations')
export class Coordination {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @ManyToOne(() => Center, center => center.coordinations)
  @JoinColumn({ name: 'centerId' })
  center: Center;

  @Column()
  centerId: number;

  @OneToMany(() => Program, program => program.coordination)
  programs: Program[];

  @OneToMany(() => Profile, profile => profile.coordination)
  profiles: Profile[];
}