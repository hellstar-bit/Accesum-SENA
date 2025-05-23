// src/config/entities/regional.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Center } from './center.entity';
import { Profile } from '../../profiles/entities/profile.entity';

@Entity('regionales')
export class Regional {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  name: string;

  @OneToMany(() => Center, center => center.regional)
  centers: Center[];

  @OneToMany(() => Profile, profile => profile.regional)
  profiles: Profile[];
}