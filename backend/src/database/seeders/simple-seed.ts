// backend/src/database/seeders/simple-seed.ts - CORREGIDO
import { DataSource } from 'typeorm';
import { Role } from '../../users/entities/role.entity';
import { PersonnelType } from '../../config/entities/personnel-type.entity';
import { Regional } from '../../config/entities/regional.entity';
import { Center } from '../../config/entities/center.entity';
import { User } from '../../users/entities/user.entity';
import { Profile } from '../../profiles/entities/profile.entity';
import * as bcrypt from 'bcrypt';

export async function simpleSeed(dataSource: DataSource) {
  console.log('🌱 Iniciando seed básico...');

  try {
    // 1. Crear roles
    const roleRepository = dataSource.getRepository(Role);
    
    const roles = [
      { name: 'Administrador', description: 'Acceso completo al sistema' },
      { name: 'Instructor', description: 'Gestión de clases y asistencia' },
      { name: 'Aprendiz', description: 'Acceso a perfil y horarios' },
      { name: 'Funcionario', description: 'Personal administrativo' },
      { name: 'Contratista', description: 'Personal externo' },
      { name: 'Visitante', description: 'Acceso temporal' }
    ];

    for (const roleData of roles) {
      const existingRole = await roleRepository.findOne({ where: { name: roleData.name } });
      if (!existingRole) {
        const role = roleRepository.create(roleData);
        await roleRepository.save(role);
        console.log(`✅ Rol creado: ${roleData.name}`);
      } else {
        console.log(`ℹ️  Rol ya existe: ${roleData.name}`);
      }
    }

    // 2. Crear tipos de personal
    const personnelTypeRepository = dataSource.getRepository(PersonnelType);
    
    const personnelTypes = [
      { name: 'Administrador' },
      { name: 'Instructor' },
      { name: 'Aprendiz' },
      { name: 'Funcionario' },
      { name: 'Contratista' },
      { name: 'Visitante' }
    ];

    for (const typeData of personnelTypes) {
      const existingType = await personnelTypeRepository.findOne({ where: { name: typeData.name } });
      if (!existingType) {
        const type = personnelTypeRepository.create(typeData);
        await personnelTypeRepository.save(type);
        console.log(`✅ Tipo de personal creado: ${typeData.name}`);
      } else {
        console.log(`ℹ️  Tipo ya existe: ${typeData.name}`);
      }
    }

    // 3. Crear regional
    const regionalRepository = dataSource.getRepository(Regional);
    let regional = await regionalRepository.findOne({ where: { name: 'Regional Cundinamarca' } });
    if (!regional) {
      regional = regionalRepository.create({ name: 'Regional Cundinamarca' });
      regional = await regionalRepository.save(regional);
      console.log('✅ Regional creada');
    } else {
      console.log('ℹ️  Regional ya existe');
    }

    // 4. Crear centro
    const centerRepository = dataSource.getRepository(Center);
    let center = await centerRepository.findOne({ where: { name: 'Centro de Biotecnología Industrial' } });
    if (!center) {
      center = centerRepository.create({
        name: 'Centro de Biotecnología Industrial',
        regionalId: regional.id
      });
      center = await centerRepository.save(center);
      console.log('✅ Centro creado');
    } else {
      console.log('ℹ️  Centro ya existe');
    }

    // 5. Crear usuario administrador
    const userRepository = dataSource.getRepository(User);
    const profileRepository = dataSource.getRepository(Profile);
    
    const adminRole = await roleRepository.findOne({ where: { name: 'Administrador' } });
    const adminType = await personnelTypeRepository.findOne({ where: { name: 'Administrador' } });
    
    if (!adminRole || !adminType) {
      throw new Error('No se encontraron rol o tipo de administrador');
    }

    const adminEmail = 'admin@sena.edu.co';
    let adminUser = await userRepository.findOne({ where: { email: adminEmail } });
    
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      adminUser = userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        roleId: adminRole.id,
        isActive: true
      });
      adminUser = await userRepository.save(adminUser);
      
      // Crear perfil para admin
      const adminProfile = profileRepository.create({
        userId: adminUser.id,
        documentType: 'CC',
        documentNumber: '12345678',
        firstName: 'Administrador',
        lastName: 'Sistema',
        typeId: adminType.id,
        regionalId: regional.id,
        centerId: center.id
      });
      await profileRepository.save(adminProfile);
      
      console.log('✅ Usuario administrador creado');
      console.log('📧 Email: admin@sena.edu.co');
      console.log('🔑 Password: admin123');
    } else {
      console.log('ℹ️  Usuario administrador ya existe');
      console.log('📧 Email: admin@sena.edu.co');
      console.log('🔑 Password: admin123');
    }

    console.log('🎉 Seed completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  }
}