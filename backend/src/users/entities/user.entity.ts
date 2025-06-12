// backend/src/users/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
import { Role } from './role.entity';
import { Competence } from '../../config/entities/competence.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => Profile, profile => profile.user, { cascade: true })
  profile: Profile;

  @ManyToOne(() => Role, role => role.users)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column()
  roleId: number;

  // ✅ Relación many-to-many con Competence
  @ManyToMany(() => Competence, competence => competence.instructors)
  @JoinTable({
    name: 'instructor_competences',
    joinColumn: {
      name: 'instructorId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'competenceId',
      referencedColumnName: 'id'
    }
  })
  competences: Competence[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}