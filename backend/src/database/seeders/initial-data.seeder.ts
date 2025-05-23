// src/database/seeders/initial-data.seeder.ts
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../users/entities/role.entity';
import { User } from '../../users/entities/user.entity';
import { PersonnelType } from '../../config/entities/personnel-type.entity';
import { Regional } from '../../config/entities/regional.entity';
import { Center } from '../../config/entities/center.entity';
import { Profile } from '../../profiles/entities/profile.entity';

export async function seedInitialData(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('🌱 Creando roles del sistema...');
    
    // 1. Crear roles básicos
    const rolesData = [
      { name: 'Administrador', description: 'Acceso completo al sistema' },
      { name: 'Director', description: 'Director regional' },
      { name: 'Funcionario', description: 'Funcionario administrativo' },
      { name: 'Contratista', description: 'Personal contratista' },
      { name: 'Aprendiz', description: 'Aprendiz SENA' },
      { name: 'Visitante', description: 'Visitante' },
    ];

    const roles: Role[] = [];
    for (const roleData of rolesData) {
      const role = queryRunner.manager.create(Role, roleData);
      const savedRole = await queryRunner.manager.save(role);
      roles.push(savedRole);
    }

    console.log('👥 Creando tipos de personal...');
    
    // 2. Crear tipos de personal
    const personnelTypesData = [
      { name: 'Funcionario' },
      { name: 'Contratista' },
      { name: 'Aprendiz' },
      { name: 'Visitante' },
    ];

    const personnelTypes: PersonnelType[] = [];
    for (const typeData of personnelTypesData) {
      const personnelType = queryRunner.manager.create(PersonnelType, typeData);
      const savedType = await queryRunner.manager.save(personnelType);
      personnelTypes.push(savedType);
    }

    console.log('🏢 Creando estructura organizacional básica...');
    
    // 3. Crear regional por defecto
    const regionalData = { name: 'Regional por Defecto' };
    const regional = queryRunner.manager.create(Regional, regionalData);
    const defaultRegional = await queryRunner.manager.save(regional);

    // 4. Crear centro por defecto
    const centerData = {
      name: 'Centro por Defecto',
      regionalId: defaultRegional.id
    };
    const center = queryRunner.manager.create(Center, centerData);
    const defaultCenter = await queryRunner.manager.save(center);

    console.log('👤 Creando usuario administrador...');
    
    // 5. Crear usuario administrador
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUserData = {
      email: 'admin@sena.edu.co',
      password: hashedPassword,
      roleId: roles[0].id, // Administrador
      isActive: true,
    };
    const adminUser = queryRunner.manager.create(User, adminUserData);
    const savedAdminUser = await queryRunner.manager.save(adminUser);

    // 6. Crear perfil para el administrador
    const adminProfileData = {
      documentType: 'CC',
      documentNumber: '12345678',
      firstName: 'Administrador',
      lastName: 'Sistema',
      phoneNumber: '3001234567',
      userId: savedAdminUser.id,
      typeId: personnelTypes[0].id, // Funcionario
      regionalId: defaultRegional.id,
      centerId: defaultCenter.id,
    };
    const adminProfile = queryRunner.manager.create(Profile, adminProfileData);
    await queryRunner.manager.save(adminProfile);

    await queryRunner.commitTransaction();
    
    console.log('✅ Datos iniciales creados exitosamente');
    console.log('📋 Resumen:');
    console.log(`   - ${roles.length} roles creados`);
    console.log(`   - ${personnelTypes.length} tipos de personal creados`);
    console.log(`   - 1 regional por defecto creada`);
    console.log(`   - 1 centro por defecto creado`);
    console.log(`   - 1 usuario administrador creado`);
    console.log('🔑 Credenciales de administrador:');
    console.log('   Email: admin@sena.edu.co');
    console.log('   Password: admin123');

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error al crear datos iniciales:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}