// src/config/entities/personnel-type.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';

@Entity('personnel_types')
export class PersonnelType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  name: string;

  @OneToMany(() => Profile, profile => profile.type)
  profiles: Profile[];
}