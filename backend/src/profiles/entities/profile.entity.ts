// backend/src/profiles/entities/profile.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Regional } from '../../config/entities/regional.entity';
import { Center } from '../../config/entities/center.entity';
import { Coordination } from '../../config/entities/coordination.entity';
import { Program } from '../../config/entities/program.entity';
import { Ficha } from '../../config/entities/ficha.entity';
import { PersonnelType } from '../../config/entities/personnel-type.entity';
import { AttendanceRecord } from '../../attendance/entities/attendance-record.entity';


@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  documentType: string;

  @Column({ length: 20, unique: true })
  documentNumber: string;

  @Column({ length: 50 })
  firstName: string;

  @Column({ length: 50 })
  lastName: string;

  @Column({ length: 5, nullable: true })
  bloodType: string;

  @Column({ length: 15, nullable: true })
  phoneNumber: string;

  @Column({ length: 100, nullable: true })
  address: string;

  @Column({ length: 50, nullable: true })
  city: string;

  @Column({ length: 20, nullable: true })
  maritalStatus: string;

  @Column({ length: 10, nullable: true })
  sex: string;

  @Column({ length: 3, nullable: true })
  vaccine: string;

  // 🔧 CAMBIO CRÍTICO: Usar tipo LONGTEXT para imágenes grandes
  @Column({ type: 'text', nullable: true })
  profileImage: string;

  // 🔧 CAMBIO CRÍTICO: Usar tipo LONGTEXT para QR codes
  @Column({ type: 'text', nullable: true })
  qrCode: string;

  // ⭐ NUEVO CAMPO - Estado del aprendiz
  @Column({ length: 50, nullable: true })
  learnerStatus: string; // 'EN FORMACION', 'CANCELADO', 'RETIRO VOLUNTARIO', 'APLAZADO'

  @OneToOne(() => User, user => user.profile)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => PersonnelType, type => type.profiles)
  @JoinColumn({ name: 'typeId' })
  type: PersonnelType;

  @Column()
  typeId: number;

  @ManyToOne(() => Regional, regional => regional.profiles)
  @JoinColumn({ name: 'regionalId' })
  regional: Regional;

  @Column()
  regionalId: number;

  @ManyToOne(() => Center, center => center.profiles)
  @JoinColumn({ name: 'centerId' })
  center: Center;

  @Column()
  centerId: number;

  @ManyToOne(() => Coordination, coordination => coordination.profiles, { nullable: true })
  @JoinColumn({ name: 'coordinationId' })
  coordination: Coordination;

  @Column({ nullable: true })
  coordinationId: number;

  @ManyToOne(() => Program, program => program.profiles, { nullable: true })
  @JoinColumn({ name: 'programId' })
  program: Program;

  @Column({ nullable: true })
  programId: number;

  @ManyToOne(() => Ficha, ficha => ficha.profiles, { nullable: true })
  @JoinColumn({ name: 'fichaId' })
  ficha: Ficha;

  @OneToMany(() => AttendanceRecord, record => record.learner)
  attendanceRecords: AttendanceRecord[];

  @Column({ nullable: true })
  fichaId: number;

  // Timestamps automáticos
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
  
}