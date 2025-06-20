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

  // ✅ CAMPOS CORREGIDOS PARA RESET DE CONTRASEÑA
  @Column({ type: 'varchar', length: 255, nullable: true })
  resetToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resetTokenExpiry: Date | null;

  @OneToOne(() => Profile, profile => profile.user, { cascade: true })
  profile: Profile;

  @ManyToOne(() => Role, role => role.users)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column()
  roleId: number;

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

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}