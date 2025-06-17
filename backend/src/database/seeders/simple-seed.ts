// backend/src/database/seeders/simple-seed.ts - ACTUALIZADO CON NUEVA LÓGICA
import { DataSource } from 'typeorm';
import { Role } from '../../users/entities/role.entity';
import { PersonnelType } from '../../config/entities/personnel-type.entity';
import { Regional } from '../../config/entities/regional.entity';
import { Center } from '../../config/entities/center.entity';
import { Coordination } from '../../config/entities/coordination.entity';
import { ProgramType } from '../../config/entities/program-type.entity'; // ⭐ NUEVO
import { Program } from '../../config/entities/program.entity';
import { Ficha } from '../../config/entities/ficha.entity';
import { User } from '../../users/entities/user.entity';
import { Profile } from '../../profiles/entities/profile.entity';
import * as bcrypt from 'bcrypt';

export async function simpleSeed(dataSource: DataSource) {
  console.log('🌱 Iniciando seed con nueva lógica...');

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

    // 5. Crear coordinación
    const coordinationRepository = dataSource.getRepository(Coordination);
    let coordination = await coordinationRepository.findOne({ 
      where: { name: 'Coordinación Académica', centerId: center.id } 
    });
    if (!coordination) {
      coordination = coordinationRepository.create({
        name: 'Coordinación Académica',
        centerId: center.id
      });
      coordination = await coordinationRepository.save(coordination);
      console.log('✅ Coordinación creada');
    } else {
      console.log('ℹ️  Coordinación ya existe');
    }

    // ⭐ 6. NUEVO: Crear tipos de programa
    const programTypeRepository = dataSource.getRepository(ProgramType);
    
    const programTypes = [
      {
        code: 'TPS',
        name: 'Técnico en Programación de Software',
        description: 'Programa técnico enfocado en desarrollo de software'
      },
      {
        code: 'ADS',
        name: 'Análisis y Desarrollo de Software',
        description: 'Programa tecnológico en desarrollo de software'
      },
      {
        code: 'ADSI',
        name: 'Análisis y Desarrollo de Sistemas de Información',
        description: 'Programa tecnológico en sistemas de información'
      }
    ];

    for (const typeData of programTypes) {
      let programType = await programTypeRepository.findOne({ where: { code: typeData.code } });
      if (!programType) {
        programType = programTypeRepository.create(typeData);
        await programTypeRepository.save(programType);
        console.log(`✅ Tipo de programa creado: ${typeData.code} - ${typeData.name}`);
      } else {
        console.log(`ℹ️  Tipo de programa ya existe: ${typeData.code}`);
      }
    }

    // ⭐ 7. NUEVO: Crear programas específicos (ejemplos)
    const programRepository = dataSource.getRepository(Program);
    
    const tpsType = await programTypeRepository.findOne({ where: { code: 'TPS' } });
    const adsType = await programTypeRepository.findOne({ where: { code: 'ADS' } });

    if (!tpsType || !adsType) {
      throw new Error('No se encontraron los tipos de programa TPS o ADS');
    }
    
    const programs = [
      {
        code: 'TPS-41',
        name: 'Técnico en Programación de Software',
        fichaCode: '2999518',
        programTypeId: tpsType.id,
        coordinationId: coordination.id
      },
      {
        code: 'ADS-15',
        name: 'Análisis y Desarrollo de Software',
        fichaCode: '2853176',
        programTypeId: adsType.id,
        coordinationId: coordination.id
      }
    ];

    for (const programData of programs) {
      let program = await programRepository.findOne({ where: { code: programData.code } });
      if (!program) {
        program = programRepository.create(programData);
        await programRepository.save(program);
        console.log(`✅ Programa creado: ${programData.code} (Ficha: ${programData.fichaCode})`);
      } else {
        console.log(`ℹ️  Programa ya existe: ${programData.code}`);
      }
    }

    // ⭐ 8. NUEVO: Crear fichas asociadas a programas
    const fichaRepository = dataSource.getRepository(Ficha);
    
    const fichas = [
      {
        code: '2999518',
        name: 'Ficha 2999518 - TPS',
        status: 'EN EJECUCIÓN',
        startDate: new Date('2024-01-15'),
        programCode: 'TPS-41'
      },
      {
        code: '2853176',
        name: 'Ficha 2853176 - ADS',
        status: 'EN EJECUCIÓN',
        startDate: new Date('2024-02-01'),
        programCode: 'ADS-15'
      }
    ];

    for (const fichaData of fichas) {
      let ficha = await fichaRepository.findOne({ where: { code: fichaData.code } });
      if (!ficha) {
        const program = await programRepository.findOne({ where: { code: fichaData.programCode } });
        if (!program) {
          console.warn(`⚠️  No se encontró el programa con código: ${fichaData.programCode}. Ficha no creada.`);
          continue;
        }
        ficha = fichaRepository.create({
          code: fichaData.code,
          name: fichaData.name,
          status: fichaData.status,
          startDate: fichaData.startDate,
          programId: program.id
        });
        await fichaRepository.save(ficha);
        console.log(`✅ Ficha creada: ${fichaData.code} → Programa: ${fichaData.programCode}`);
      } else {
        console.log(`ℹ️  Ficha ya existe: ${fichaData.code}`);
      }
    }

    // 9. Crear usuario administrador (sin cambios)
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

    console.log('🎉 Seed completado exitosamente con nueva estructura!');
    console.log('📋 Datos creados:');
    console.log('   • 6 roles');
    console.log('   • 6 tipos de personal');
    console.log('   • 1 regional y 1 centro');
    console.log('   • 1 coordinación');
    console.log('   • 3 tipos de programa (TPS, ADS, ADSI)');
    console.log('   • 2 programas específicos (TPS-41, ADS-15)');
    console.log('   • 2 fichas de ejemplo');
    console.log('   • 1 usuario administrador');
    
  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  }
}