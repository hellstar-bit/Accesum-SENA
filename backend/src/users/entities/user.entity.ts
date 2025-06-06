// src/users/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { Profile } from '../../profiles/entities/profile.entity';
import { InstructorAssignment } from '../../attendance/entities/instructor-assignment.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @ManyToOne(() => Role, role => role.users)
    @JoinColumn({ name: 'roleId' })
    role: Role;

    @Column()
    roleId: number;

    @OneToOne(() => Profile, profile => profile.user)
    profile: Profile;

    @OneToMany(() => InstructorAssignment, assignment => assignment.instructor)
    instructorAssignments: InstructorAssignment[];

}