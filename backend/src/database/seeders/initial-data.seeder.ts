// backend/src/database/seeders/initial-data.seeder.ts
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../users/entities/role.entity';
import { User } from '../../users/entities/user.entity';
import { PersonnelType } from '../../config/entities/personnel-type.entity';
import { Regional } from '../../config/entities/regional.entity';
import { Center } from '../../config/entities/center.entity';
import { Coordination } from '../../config/entities/coordination.entity';
import { Program } from '../../config/entities/program.entity';
import { Ficha } from '../../config/entities/ficha.entity';
import { Profile } from '../../profiles/entities/profile.entity';

export async function seedInitialData(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('🌱 Creando datos iniciales del sistema...');
    
    // 1. Crear roles básicos
    console.log('👥 Creando roles del sistema...');
    const rolesData = [
      { name: 'Administrador', description: 'Acceso completo al sistema' },
      { name: 'Instructor', description: 'Instructor con acceso a gestión académica' },
      { name: 'Aprendiz', description: 'Aprendiz SENA con acceso limitado' },
      { name: 'Funcionario', description: 'Funcionario administrativo' },
      { name: 'Contratista', description: 'Personal contratista' },
      { name: 'Visitante', description: 'Visitante temporal' },
      { name: 'Escaner', description: 'Rol solo para control de acceso' },
    ];

    const roles: Role[] = [];
    for (const roleData of rolesData) {
      const role = queryRunner.manager.create(Role, roleData);
      const savedRole = await queryRunner.manager.save(role);
      roles.push(savedRole);
    }

    // 2. Crear tipos de personal
    console.log('🏷️ Creando tipos de personal...');
    const personnelTypesData = [
      { name: 'Funcionario' },
      { name: 'Contratista' },
      { name: 'Aprendiz' },
      { name: 'Visitante' },
      { name: 'Instructor' },
    ];

    const personnelTypes: PersonnelType[] = [];
    for (const typeData of personnelTypesData) {
      const personnelType = queryRunner.manager.create(PersonnelType, typeData);
      const savedType = await queryRunner.manager.save(personnelType);
      personnelTypes.push(savedType);
    }

    // 3. Crear estructura organizacional básica
    console.log('🏢 Creando estructura organizacional...');
    
    // Regional por defecto
    const regionalData = { name: 'Regional por Defecto' };
    const regional = queryRunner.manager.create(Regional, regionalData);
    const defaultRegional = await queryRunner.manager.save(regional);

    // Centro por defecto
    const centerData = {
      name: 'Centro por Defecto',
      regionalId: defaultRegional.id
    };
    const center = queryRunner.manager.create(Center, centerData);
    const defaultCenter = await queryRunner.manager.save(center);

    // Coordinación por defecto
    const coordinationData = {
      name: 'Coordinación por Defecto',
      centerId: defaultCenter.id
    };
    const coordination = queryRunner.manager.create(Coordination, coordinationData);
    const defaultCoordination = await queryRunner.manager.save(coordination);

    // Programa por defecto
    const programData = {
      name: 'Programa por Defecto',
      coordinationId: defaultCoordination.id
    };
    const program = queryRunner.manager.create(Program, programData);
    const defaultProgram = await queryRunner.manager.save(program);

    // ⭐ FICHA POR DEFECTO
    console.log('📋 Creando ficha por defecto...');
    const fichaData = {
      code: '0000000',
      name: 'Ficha por Defecto',
      status: 'EN EJECUCIÓN',
      programId: defaultProgram.id
    };
    const ficha = queryRunner.manager.create(Ficha, fichaData);
    const defaultFicha = await queryRunner.manager.save(ficha);

    // 4. Crear usuarios de prueba
    console.log('👤 Creando usuarios del sistema...');
    
    // Usuario Administrador
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = queryRunner.manager.create(User, {
      email: 'admin@sena.edu.co',
      password: adminPassword,
      roleId: roles.find(r => r.name === 'Administrador')!.id,
      isActive: true,
    });
    const savedAdminUser = await queryRunner.manager.save(adminUser);

    // Perfil Administrador
    const adminProfile = queryRunner.manager.create(Profile, {
      documentType: 'CC',
      documentNumber: '12345678',
      firstName: 'Administrador',
      lastName: 'Sistema',
      phoneNumber: '3001234567',
      userId: savedAdminUser.id,
      typeId: personnelTypes.find(t => t.name === 'Funcionario')!.id,
      regionalId: defaultRegional.id,
      centerId: defaultCenter.id,
    });
    await queryRunner.manager.save(adminProfile);

    // Usuario Instructor
    const instructorPassword = await bcrypt.hash('instructor123', 10);
    const instructorUser = queryRunner.manager.create(User, {
      email: 'instructor@sena.edu.co',
      password: instructorPassword,
      roleId: roles.find(r => r.name === 'Instructor')!.id,
      isActive: true,
    });
    const savedInstructorUser = await queryRunner.manager.save(instructorUser);

    // Perfil Instructor
    const instructorProfile = queryRunner.manager.create(Profile, {
      documentType: 'CC',
      documentNumber: '87654321',
      firstName: 'Instructor',
      lastName: 'Demo',
      phoneNumber: '3007654321',
      userId: savedInstructorUser.id,
      typeId: personnelTypes.find(t => t.name === 'Instructor')!.id,
      regionalId: defaultRegional.id,
      centerId: defaultCenter.id,
    });
    await queryRunner.manager.save(instructorProfile);

    // Usuario Aprendiz de prueba
    const aprendizPassword = await bcrypt.hash('sena1234567890', 10);
    const aprendizUser = queryRunner.manager.create(User, {
      email: 'aprendiz.demo@misena.edu.co',
      password: aprendizPassword,
      roleId: roles.find(r => r.name === 'Aprendiz')!.id,
      isActive: true,
    });
    const savedAprendizUser = await queryRunner.manager.save(aprendizUser);

    // Perfil Aprendiz
    const aprendizProfile = queryRunner.manager.create(Profile, {
      documentType: 'CC',
      documentNumber: '1234567890',
      firstName: 'Juan Carlos',
      lastName: 'Pérez Demo',
      phoneNumber: '3009876543',
      learnerStatus: 'EN FORMACION',
      userId: savedAprendizUser.id,
      typeId: personnelTypes.find(t => t.name === 'Aprendiz')!.id,
      regionalId: defaultRegional.id,
      centerId: defaultCenter.id,
      fichaId: defaultFicha.id,
    });
    await queryRunner.manager.save(aprendizProfile);

    // Usuario Escáner
    const escanerPassword = await bcrypt.hash('escaner123', 10);
    const escanerUser = queryRunner.manager.create(User, {
      email: 'escaner@sena.edu.co',
      password: escanerPassword,
      roleId: roles.find(r => r.name === 'Escaner')!.id,
      isActive: true,
    });
    const savedEscanerUser = await queryRunner.manager.save(escanerUser);

    // Perfil Escáner
    const escanerProfile = queryRunner.manager.create(Profile, {
      documentType: 'CC',
      documentNumber: '11111111',
      firstName: 'Control',
      lastName: 'Acceso',
      phoneNumber: '3001111111',
      userId: savedEscanerUser.id,
      typeId: personnelTypes.find(t => t.name === 'Funcionario')!.id,
      regionalId: defaultRegional.id,
      centerId: defaultCenter.id,
    });
    await queryRunner.manager.save(escanerProfile);

    await queryRunner.commitTransaction();
    
    console.log('✅ Datos iniciales creados exitosamente');
    console.log('📋 Resumen:');
    console.log(`   - ${roles.length} roles creados`);
    console.log(`   - ${personnelTypes.length} tipos de personal creados`);
    console.log(`   - 1 regional, centro, coordinación y programa creados`);
    console.log(`   - 1 ficha por defecto creada`);
    console.log(`   - 4 usuarios de prueba creados`);
    console.log('');
    console.log('🔑 Credenciales de acceso:');
    console.log('   👨‍💼 Administrador: admin@sena.edu.co / admin123');
    console.log('   👨‍🏫 Instructor: instructor@sena.edu.co / instructor123');
    console.log('   🎓 Aprendiz: aprendiz.demo@misena.edu.co / sena1234567890');
    console.log('   📱 Escáner: escaner@sena.edu.co / escaner123');

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error al crear datos iniciales:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}