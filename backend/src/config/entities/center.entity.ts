// src/config/entities/center.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Regional } from './regional.entity';
import { Coordination } from './coordination.entity';
import { Profile } from '../../profiles/entities/profile.entity';

@Entity('centers')
export class Center {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @ManyToOne(() => Regional, regional => regional.centers)
  @JoinColumn({ name: 'regionalId' })
  regional: Regional;

  @Column()
  regionalId: number;

  @OneToMany(() => Coordination, coordination => coordination.center)
  coordinations: Coordination[];

  @OneToMany(() => Profile, profile => profile.center)
  profiles: Profile[];
}