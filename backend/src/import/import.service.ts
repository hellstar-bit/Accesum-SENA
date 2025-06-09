// backend/src/import/import.service.ts - ACTUALIZADO CON importLearnersWithForm
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Role } from '../users/entities/role.entity';
import { PersonnelType } from '../config/entities/personnel-type.entity';
import { Regional } from '../config/entities/regional.entity';
import { Center } from '../config/entities/center.entity';
import { Coordination } from '../config/entities/coordination.entity';
import { Program } from '../config/entities/program.entity';
import { Ficha } from '../config/entities/ficha.entity';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcrypt';
import * as QRCode from 'qrcode';

export interface ImportOptions {
  generateQR?: boolean;
  createUsers?: boolean;
  updateExisting?: boolean;
}

export interface ImportResult {
  success: boolean;
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  summary: {
    usersCreated: number;
    profilesCreated: number;
    qrCodesGenerated: number;
    fichasCreated: number;
  };
}

// ⭐ NUEVA INTERFAZ PARA IMPORTACIÓN CON FORMULARIO
export interface ImportResultWithForm {
  success: boolean;
  totalRows: number;
  importedRows: number;
  updatedRows: number;
  fichaInfo: {
    code: string;
    name: string;
    status: string;
    isNew: boolean;
  };
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  summary: {
    nuevos: number;
    actualizados: number;
    errores: number;
  };
}

// ⭐ INTERFAZ PARA DATOS DEL FORMULARIO
export interface FichaFormData {
  codigo: string;
  nombre: string;
  estado: string;
  fecha: string;
  regionalId: string;
  centerId: string;
}

export interface ValidationResult {
  isValid: boolean;
  headers: string[];
  rowCount: number;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(PersonnelType)
    private personnelTypeRepository: Repository<PersonnelType>,
    @InjectRepository(Regional)
    private regionalRepository: Repository<Regional>,
    @InjectRepository(Center)
    private centerRepository: Repository<Center>,
    @InjectRepository(Coordination)
    private coordinationRepository: Repository<Coordination>,
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    @InjectRepository(Ficha)
    private fichaRepository: Repository<Ficha>,
  ) {}

  // ⭐ NUEVO: IMPORTAR APRENDICES CON FORMULARIO
  // Reemplazar el método importLearnersWithForm en import.service.ts
async importLearnersWithForm(file: Express.Multer['File'], fichaData: FichaFormData): Promise<ImportResultWithForm> {
  try {
    console.log('🚀 Iniciando importación con formulario:', fichaData);

    // Validar datos del formulario
    await this.validateFichaFormData(fichaData);

    // Validar ubicación (regional y centro)
    const locationValidation = await this.validateLocation(
      parseInt(fichaData.regionalId), 
      parseInt(fichaData.centerId)
    );
    
    if (!locationValidation.valid) {
      throw new BadRequestException(locationValidation.message);
    }

    // Leer archivo Excel
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // ⭐ NUEVA LÓGICA: Obtener datos como array para detectar headers
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`📊 Archivo leído: ${rawData.length} filas en total`);

    // ⭐ DETECTAR FILA DE HEADERS
    let headerRowIndex = -1;
    let expectedHeaders = ['Tipo de Documento', 'Número de Documento', 'Nombre', 'Apellidos'];
    
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i] as any[];
      if (row && row.length >= 4) {
        // Verificar si esta fila contiene los headers esperados
        const hasHeaders = expectedHeaders.some(header => 
          row.some(cell => cell && cell.toString().toLowerCase().includes(header.toLowerCase().split(' ')[0]))
        );
        
        if (hasHeaders) {
          headerRowIndex = i;
          console.log(`📋 Headers encontrados en fila ${i + 1}:`, row);
          break;
        }
      }
    }

    if (headerRowIndex === -1) {
      throw new BadRequestException('No se encontraron los headers esperados en el archivo Excel');
    }

    // ⭐ EXTRAER SOLO LOS DATOS DESPUÉS DE LOS HEADERS
    const dataRows = rawData.slice(headerRowIndex + 1).filter(row => 
      Array.isArray(row) && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== '')
    );

    console.log(`📊 Datos encontrados: ${dataRows.length} filas de aprendices`);

    if (dataRows.length === 0) {
      throw new BadRequestException('No se encontraron datos de aprendices en el archivo');
    }

    // Buscar o crear ficha
    const ficha = await this.findOrCreateFichaWithLocation(fichaData);

    const result: ImportResultWithForm = {
      success: true,
      totalRows: dataRows.length,
      importedRows: 0,
      updatedRows: 0,
      fichaInfo: {
        code: ficha.code,
        name: ficha.name,
        status: ficha.status,
        isNew: !await this.fichaRepository.findOne({ where: { code: fichaData.codigo } })
      },
      errors: [],
      summary: {
        nuevos: 0,
        actualizados: 0,
        errores: 0
      }
    };

    // ⭐ PROCESAR CADA FILA DE DATOS
    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = dataRows[i] as any[];
        
        // ⭐ MAPEAR DATOS SEGÚN POSICIÓN (formato SENA estándar)
        const learnerData = {
          documentType: row[0] || 'CC',
          documentNumber: row[1],
          firstName: row[2],
          lastName: row[3],
          phoneNumber: row[4],
          email: row[5],
          status: row[6] || 'EN FORMACION'
        };

        const isNew = await this.processLearnerRowWithFormFixed(learnerData, fichaData, ficha);
        
        if (isNew) {
          result.importedRows++;
          result.summary.nuevos++;
        } else {
          result.updatedRows++;
          result.summary.actualizados++;
        }
      } catch (error) {
        result.errors.push({
          row: headerRowIndex + i + 3, // +3 porque: +1 para base 1, +1 para header, +1 para índice actual
          error: error.message,
          data: dataRows[i]
        });
        result.summary.errores++;
      }
    }

    // Determinar si fue exitoso
    result.success = result.errors.length < dataRows.length * 0.5; // Éxito si menos del 50% tienen errores

    console.log('✅ Importación completada:', result.summary);
    return result;

  } catch (error) {
    console.error('❌ Error en importación:', error);
    throw new BadRequestException(`Error al procesar importación: ${error.message}`);
  }
}

// ⭐ NUEVO MÉTODO: Procesar fila con datos ya mapeados
private async processLearnerRowWithFormFixed(
  learnerData: {
    documentType: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    status: string;
  },
  fichaData: FichaFormData, 
  ficha: Ficha
): Promise<boolean> {
  // Validar datos básicos
  if (!learnerData.documentNumber || !learnerData.firstName || !learnerData.lastName) {
    throw new Error('Datos básicos faltantes: documento, nombres o apellidos');
  }

  // Buscar aprendiz existente
  let profile = await this.profileRepository.findOne({
    where: { documentNumber: learnerData.documentNumber.toString() },
    relations: ['user']
  });

  const isNew = !profile;

  if (profile) {
    // Actualizar aprendiz existente
    profile.firstName = learnerData.firstName;
    profile.lastName = learnerData.lastName;
    profile.phoneNumber = learnerData.phoneNumber;
    profile.learnerStatus = learnerData.status;
    profile.fichaId = ficha.id;
    profile.centerId = parseInt(fichaData.centerId);
    profile.regionalId = parseInt(fichaData.regionalId);

    await this.profileRepository.save(profile);
  } else {
    // Crear nuevo aprendiz
    const personnelType = await this.findOrCreatePersonnelType('Aprendiz');

    // Crear usuario si tiene email
    let user: User | null = null;
    if (learnerData.email) {
      const learnerRole = await this.roleRepository.findOne({
        where: { name: 'Aprendiz' }
      });

      if (learnerRole) {
        const hashedPassword = await bcrypt.hash(`sena${learnerData.documentNumber}`, 10);
        user = this.userRepository.create({
          email: learnerData.email,
          password: hashedPassword,
          roleId: learnerRole.id,
          isActive: true
        });
        user = await this.userRepository.save(user);
      }
    }

    // Crear perfil
    profile = this.profileRepository.create({
      userId: user?.id,
      documentType: learnerData.documentType,
      documentNumber: learnerData.documentNumber.toString(),
      firstName: learnerData.firstName,
      lastName: learnerData.lastName,
      phoneNumber: learnerData.phoneNumber,
      learnerStatus: learnerData.status,
      typeId: personnelType.id,
      centerId: parseInt(fichaData.centerId),
      regionalId: parseInt(fichaData.regionalId),
      fichaId: ficha.id
    });

    profile = await this.profileRepository.save(profile);

    // Generar QR por defecto
    try {
      const qrData = {
        id: profile.id,
        doc: profile.documentNumber,
        type: 'ACCESUM_SENA_LEARNER',
        timestamp: Date.now()
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2
      });

      profile.qrCode = qrCodeDataURL;
      await this.profileRepository.save(profile);
    } catch (qrError) {
      console.warn('⚠️ Error generando QR para:', learnerData.documentNumber);
    }
  }

  return isNew;
}

  // ⭐ VALIDAR DATOS DEL FORMULARIO
  private async validateFichaFormData(fichaData: FichaFormData): Promise<void> {
    if (!fichaData.codigo?.trim()) {
      throw new BadRequestException('Código de ficha es requerido');
    }

    if (!fichaData.nombre?.trim()) {
      throw new BadRequestException('Nombre de programa es requerido');
    }

    if (!fichaData.regionalId || !fichaData.centerId) {
      throw new BadRequestException('Regional y centro son requeridos');
    }

    const estadosPermitidos = ['EN EJECUCIÓN', 'TERMINADA', 'CANCELADA'];
    if (!estadosPermitidos.includes(fichaData.estado)) {
      throw new BadRequestException('Estado de ficha inválido');
    }

    // Validar que los IDs sean números válidos
    const regionalId = parseInt(fichaData.regionalId);
    const centerId = parseInt(fichaData.centerId);

    if (isNaN(regionalId) || regionalId <= 0) {
      throw new BadRequestException('ID de regional inválido');
    }

    if (isNaN(centerId) || centerId <= 0) {
      throw new BadRequestException('ID de centro inválido');
    }
  }

  // ⭐ VALIDAR UBICACIÓN
  async validateLocation(regionalId: number, centerId: number): Promise<{ valid: boolean; message: string }> {
    try {
      // Verificar que la regional existe
      const regional = await this.regionalRepository.findOne({
        where: { id: regionalId }
      });

      if (!regional) {
        return {
          valid: false,
          message: 'Regional no encontrada'
        };
      }

      // Verificar que el centro existe y pertenece a la regional
      const center = await this.centerRepository.findOne({
        where: { id: centerId, regionalId: regionalId },
        relations: ['regional']
      });

      if (!center) {
        return {
          valid: false,
          message: 'Centro no encontrado o no pertenece a la regional seleccionada'
        };
      }

      return {
        valid: true,
        message: 'Ubicación válida'
      };

    } catch (error) {
      return {
        valid: false,
        message: 'Error al validar ubicación'
      };
    }
  }

  // ⭐ BUSCAR O CREAR FICHA CON UBICACIÓN
  private async findOrCreateFichaWithLocation(fichaData: FichaFormData): Promise<Ficha> {
    let ficha = await this.fichaRepository.findOne({
      where: { code: fichaData.codigo },
      relations: ['program', 'program.coordination', 'program.coordination.center']
    });

    if (ficha) {
      console.log('📋 Ficha existente encontrada:', ficha.code);
      return ficha;
    }

    // Crear nueva ficha
    console.log('🆕 Creando nueva ficha:', fichaData.codigo);

    // Buscar o crear programa por defecto para este centro
    const center = await this.centerRepository.findOne({
      where: { id: parseInt(fichaData.centerId) },
      relations: ['coordinations']
    });

    if (!center) {
      throw new BadRequestException('Centro no encontrado');
    }

    // Buscar o crear coordinación por defecto
    let coordination = center.coordinations?.[0];
    if (!coordination) {
      coordination = this.coordinationRepository.create({
        name: 'Coordinación General',
        centerId: center.id
      });
      coordination = await this.coordinationRepository.save(coordination);
    }

    // Buscar o crear programa
    let program = await this.programRepository.findOne({
      where: { name: fichaData.nombre, coordinationId: coordination.id }
    });

    if (!program) {
      program = this.programRepository.create({
        name: fichaData.nombre,
        coordinationId: coordination.id
      });
      program = await this.programRepository.save(program);
    }

    // Crear la ficha
    ficha = this.fichaRepository.create({
      code: fichaData.codigo,
      name: fichaData.nombre,
      status: fichaData.estado,
      startDate: new Date(fichaData.fecha),
      programId: program.id
    });

    ficha = await this.fichaRepository.save(ficha);
    console.log('✅ Nueva ficha creada:', ficha.id);

    return ficha;
  }

  // ⭐ PROCESAR FILA DE APRENDIZ CON FORMULARIO
  private async processLearnerRowWithForm(row: any, fichaData: FichaFormData, ficha: Ficha): Promise<boolean> {
    // Mapear columnas del Excel (asumiendo formato estándar SENA)
    const learnerData = {
      documentType: row['A'] || row['Tipo Documento'] || 'CC',
      documentNumber: row['B'] || row['Documento'] || row['Número Documento'],
      firstName: row['C'] || row['Nombres'],
      lastName: row['D'] || row['Apellidos'],
      phoneNumber: row['E'] || row['Celular'] || row['Teléfono'],
      email: row['F'] || row['Correo'] || row['Email'],
      status: row['G'] || row['Estado'] || 'EN FORMACION'
    };

    // Validar datos básicos
    if (!learnerData.documentNumber || !learnerData.firstName || !learnerData.lastName) {
      throw new Error('Datos básicos faltantes: documento, nombres o apellidos');
    }

    // Buscar aprendiz existente
    let profile = await this.profileRepository.findOne({
      where: { documentNumber: learnerData.documentNumber.toString() },
      relations: ['user']
    });

    const isNew = !profile;

    if (profile) {
      // Actualizar aprendiz existente
      profile.firstName = learnerData.firstName;
      profile.lastName = learnerData.lastName;
      profile.phoneNumber = learnerData.phoneNumber;
      profile.learnerStatus = learnerData.status;
      profile.fichaId = ficha.id;
      profile.centerId = parseInt(fichaData.centerId);
      profile.regionalId = parseInt(fichaData.regionalId);

      await this.profileRepository.save(profile);
    } else {
      // Crear nuevo aprendiz
      const personnelType = await this.findOrCreatePersonnelType('Aprendiz');

      // Crear usuario si tiene email
      let user: User | null = null;
      if (learnerData.email) {
        const learnerRole = await this.roleRepository.findOne({
          where: { name: 'Aprendiz' }
        });

        if (learnerRole) {
          const hashedPassword = await bcrypt.hash(`sena${learnerData.documentNumber}`, 10);
          user = this.userRepository.create({
            email: learnerData.email,
            password: hashedPassword,
            roleId: learnerRole.id,
            isActive: true
          });
          user = await this.userRepository.save(user);
        }
      }

      // Crear perfil
      profile = this.profileRepository.create({
        userId: user?.id,
        documentType: learnerData.documentType,
        documentNumber: learnerData.documentNumber.toString(),
        firstName: learnerData.firstName,
        lastName: learnerData.lastName,
        phoneNumber: learnerData.phoneNumber,
        learnerStatus: learnerData.status,
        typeId: personnelType.id,
        centerId: parseInt(fichaData.centerId),
        regionalId: parseInt(fichaData.regionalId),
        fichaId: ficha.id
      });

      profile = await this.profileRepository.save(profile);

      // Generar QR por defecto
      try {
        const qrData = {
          id: profile.id,
          doc: profile.documentNumber,
          type: 'ACCESUM_SENA_LEARNER',
          timestamp: Date.now()
        };

        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: 300,
          margin: 2
        });

        profile.qrCode = qrCodeDataURL;
        await this.profileRepository.save(profile);
      } catch (qrError) {
        console.warn('⚠️ Error generando QR para:', learnerData.documentNumber);
      }
    }

    return isNew;
  }

  // ⭐ VISTA PREVIA DE ARCHIVO EXCEL
  async previewExcelFile(file: Express.Multer['File']): Promise<{
    success: boolean;
    headers: string[];
    sampleRows: any[][];
    totalRows: number;
    errors: string[];
  }> {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const headers = data[0] as string[] || [];
      const sampleRows = data.slice(1, 6) as any[][]; // Primeras 5 filas de datos
      const totalRows = data.length - 1; // Restar header

      return {
        success: true,
        headers,
        sampleRows,
        totalRows,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        headers: [],
        sampleRows: [],
        totalRows: 0,
        errors: [`Error al leer archivo: ${error.message}`]
      };
    }
  }

  // ⭐ VERIFICAR SI UNA FICHA EXISTE
  async checkFichaExists(codigo: string): Promise<{ exists: boolean; ficha?: any }> {
    const ficha = await this.fichaRepository.findOne({
      where: { code: codigo },
      relations: ['program', 'program.coordination', 'program.coordination.center']
    });

    return {
      exists: !!ficha,
      ficha: ficha ? {
        id: ficha.id,
        code: ficha.code,
        name: ficha.name,
        status: ficha.status,
        program: ficha.program?.name,
        center: ficha.program?.coordination?.center?.name
      } : undefined
    };
  }

  // ⭐ OBTENER ESTADÍSTICAS DE IMPORTACIÓN
  async getImportStatistics(fichaCode?: string): Promise<{
    totalImports: number;
    successfulImports: number;
    failedImports: number;
    lastImportDate?: string;
    mostCommonErrors: Array<{ error: string; count: number }>;
  }> {
    // Por ahora retornar datos mock - implementar con tabla de logs más adelante
    return {
      totalImports: 0,
      successfulImports: 0,
      failedImports: 0,
      mostCommonErrors: []
    };
  }

  // =================== MÉTODOS EXISTENTES ===================

  // ⭐ IMPORTAR DESDE EXCEL GENERAL
  async importFromExcel(file: Express.Multer['File']): Promise<ImportResult> {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const result: ImportResult = {
        success: true,
        totalProcessed: data.length,
        successful: 0,
        failed: 0,
        errors: [],
        summary: {
          usersCreated: 0,
          profilesCreated: 0,
          qrCodesGenerated: 0,
          fichasCreated: 0
        }
      };

      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i] as any;
          await this.processGeneralRow(row, result);
          result.successful++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            row: i + 2,
            field: 'general',
            message: error.message
          });
        }
      }

      return result;
    } catch (error) {
      throw new BadRequestException(`Error al procesar archivo Excel: ${error.message}`);
    }
  }

  // ⭐ IMPORTAR APRENDICES ESPECÍFICAMENTE
  async importLearners(file: Express.Multer['File'], options: ImportOptions): Promise<ImportResult> {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const result: ImportResult = {
        success: true,
        totalProcessed: data.length,
        successful: 0,
        failed: 0,
        errors: [],
        summary: {
          usersCreated: 0,
          profilesCreated: 0,
          qrCodesGenerated: 0,
          fichasCreated: 0
        }
      };

      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i] as any;
          await this.processLearnerRow(row, options, result);
          result.successful++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            row: i + 2,
            field: 'learner',
            message: error.message
          });
        }
      }

      return result;
    } catch (error) {
      throw new BadRequestException(`Error al procesar archivo de aprendices: ${error.message}`);
    }
  }

  // ⭐ VALIDAR ARCHIVO ANTES DE IMPORTAR
  async validateImportFile(file: Express.Multer['File']): Promise<ValidationResult> {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const headers = Object.keys(data[0] || {});
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validar headers requeridos
      const requiredHeaders = [
        'firstName', 'lastName', 'documentNumber', 'email'
      ];

      for (const header of requiredHeaders) {
        if (!headers.includes(header)) {
          errors.push(`Header requerido faltante: ${header}`);
        }
      }

      // Validar datos
      if (data.length === 0) {
        errors.push('El archivo no contiene datos');
      }

      if (data.length > 1000) {
        warnings.push('El archivo contiene más de 1000 filas, el procesamiento puede ser lento');
      }

      return {
        isValid: errors.length === 0,
        headers,
        rowCount: data.length,
        errors,
        warnings
      };
    } catch (error) {
      return {
        isValid: false,
        headers: [],
        rowCount: 0,
        errors: [`Error al leer archivo: ${error.message}`],
        warnings: []
      };
    }
  }

  // ⭐ GENERAR PLANTILLA DE IMPORTACIÓN
  async generateTemplate(type: 'learners' | 'general'): Promise<{ filename: string; data: any[] }> {
    const templates = {
      learners: [
        {
          'A': 'CC',
          'B': '12345678',
          'C': 'Juan Carlos',
          'D': 'Pérez Gómez',
          'E': '3001234567',
          'F': 'juan.perez@example.com',
          'G': 'EN FORMACION'
        }
      ],
      general: [
        {
          firstName: 'María',
          lastName: 'García',
          documentType: 'CC',
          documentNumber: '87654321',
          email: 'maria.garcia@example.com',
          phoneNumber: '3009876543',
          roleName: 'Funcionario',
          personnelType: 'Funcionario',
          centerName: 'Centro de Biotecnología Industrial'
        }
      ]
    };

    return {
      filename: `template_${type}.xlsx`,
      data: templates[type]
    };
  }

  // =================== MÉTODOS AUXILIARES ===================

  // ⭐ PROCESAR FILA GENERAL
  private async processGeneralRow(row: any, result: ImportResult): Promise<void> {
    // Validar datos básicos
    if (!row.firstName || !row.lastName || !row.documentNumber || !row.email) {
      throw new Error('Campos requeridos faltantes: firstName, lastName, documentNumber, email');
    }

    // Buscar o crear usuario
    let user = await this.userRepository.findOne({
      where: { email: row.email }
    });

    if (!user) {
      // Buscar rol
      const role = await this.roleRepository.findOne({
        where: { name: row.roleName || 'Funcionario' }
      });

      if (!role) {
        throw new Error(`Rol no encontrado: ${row.roleName || 'Funcionario'}`);
      }

      // Crear usuario
      const hashedPassword = await bcrypt.hash(`sena${row.documentNumber}`, 10);
      user = this.userRepository.create({
        email: row.email,
        password: hashedPassword,
        roleId: role.id,
        isActive: true
      });

      user = await this.userRepository.save(user);
      result.summary.usersCreated++;
    }

    // Crear perfil si no existe
    let profile = await this.profileRepository.findOne({
      where: { userId: user.id }
    });

    if (!profile) {
      // Buscar entidades relacionadas
      const personnelType = await this.findOrCreatePersonnelType(row.personnelType || 'Funcionario');
      const center = await this.findOrCreateCenter(row.centerName);

      profile = this.profileRepository.create({
        userId: user.id,
        documentType: row.documentType || 'CC',
        documentNumber: row.documentNumber,
        firstName: row.firstName,
        lastName: row.lastName,
        phoneNumber: row.phoneNumber,
        bloodType: row.bloodType,
        typeId: personnelType.id,
        centerId: center.id,
        regionalId: center.regionalId
      });

      profile = await this.profileRepository.save(profile);
      result.summary.profilesCreated++;
    }
  }

  // ⭐ PROCESAR FILA DE APRENDIZ
  private async processLearnerRow(row: any, options: ImportOptions, result: ImportResult): Promise<void> {
    // Validar datos básicos
    if (!row.firstName || !row.lastName || !row.documentNumber) {
      throw new Error('Campos requeridos faltantes para aprendiz');
    }

    // Buscar o crear ficha
    let ficha: Ficha | null = null;
    if (row.fichaCode) {
      ficha = await this.findOrCreateFicha(row.fichaCode, row.fichaName, row.programName);
      if (ficha) {
        result.summary.fichasCreated++;
      }
    }

    // Crear usuario si se solicita
    let user: User | null = null;
    if (options.createUsers) {
      const email = row.email || `${row.documentNumber}@aprendiz.sena.edu.co`;
      user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        const learnerRole = await this.roleRepository.findOne({
          where: { name: 'Aprendiz' }
        });

        if (!learnerRole) {
          throw new Error('Rol "Aprendiz" no encontrado');
        }

        const hashedPassword = await bcrypt.hash(`sena${row.documentNumber}`, 10);
        user = this.userRepository.create({
          email,
          password: hashedPassword,
          roleId: learnerRole.id,
          isActive: true
        });

        user = await this.userRepository.save(user);
        result.summary.usersCreated++;
      }
    }

    // Crear perfil
    if (user) {
      const personnelType = await this.findOrCreatePersonnelType('Aprendiz');
      const center = await this.findOrCreateCenter(row.centerName || 'Centro de Biotecnología Industrial');

      const profile = this.profileRepository.create({
        userId: user.id,
        documentType: row.documentType || 'CC',
        documentNumber: row.documentNumber,
        firstName: row.firstName,
        lastName: row.lastName,
        phoneNumber: row.phoneNumber,
        bloodType: row.bloodType,
        learnerStatus: 'EN FORMACION',
        typeId: personnelType.id,
        centerId: center.id,
        regionalId: center.regionalId,
        fichaId: ficha?.id
      });

      const savedProfile = await this.profileRepository.save(profile);
      result.summary.profilesCreated++;

      // Generar QR si se solicita
      if (options.generateQR) {
        const qrData = {
          id: savedProfile.id,
          doc: savedProfile.documentNumber,
          type: 'ACCESUM_SENA_LEARNER',
          timestamp: Date.now()
        };

        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: 300,
          margin: 2
        });

        savedProfile.qrCode = qrCodeDataURL;
        await this.profileRepository.save(savedProfile);
        result.summary.qrCodesGenerated++;
      }
    }
  }

  // ⭐ MÉTODOS AUXILIARES
  private async findOrCreatePersonnelType(name: string): Promise<PersonnelType> {
    let type = await this.personnelTypeRepository.findOne({ where: { name } });
    if (!type) {
      type = this.personnelTypeRepository.create({ name });
      type = await this.personnelTypeRepository.save(type);
    }
    return type;
  }

  private async findOrCreateCenter(name: string): Promise<Center> {
    let center = await this.centerRepository.findOne({ 
      where: { name },
      relations: ['regional']
    });
    
    if (!center) {
      // Buscar o crear regional por defecto
      let regional = await this.regionalRepository.findOne({
        where: { name: 'Regional Cundinamarca' }
      });
      
      if (!regional) {
        regional = this.regionalRepository.create({ name: 'Regional Cundinamarca' });
        regional = await this.regionalRepository.save(regional);
      }

      center = this.centerRepository.create({
        name,
        regionalId: regional.id
      });
      center = await this.centerRepository.save(center);
    }
    
    return center;
  }

  private async findOrCreateFicha(code: string, name?: string, programName?: string): Promise<Ficha | null> {
    let ficha: Ficha | null = await this.fichaRepository.findOne({ where: { code } });
    
    if (!ficha && name) {
      ficha = this.fichaRepository.create({
        code,
        name,
        status: 'EN EJECUCIÓN',
        startDate: new Date()
      });
      ficha = await this.fichaRepository.save(ficha);
    }
    
    return ficha;
  }
}