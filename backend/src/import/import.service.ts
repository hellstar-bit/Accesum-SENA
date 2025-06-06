// backend/src/import/import.service.ts - COMPLETO
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Role } from '../users/entities/role.entity';
import { PersonnelType } from '../config/entities/personnel-type.entity';
import { Regional } from '../config/entities/regional.entity';
import { Center } from '../config/entities/center.entity';
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
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    @InjectRepository(Ficha)
    private fichaRepository: Repository<Ficha>,
  ) {}

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
            row: i + 2, // +2 porque Excel empieza en 1 y hay header
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
          firstName: 'Juan',
          lastName: 'Pérez',
          documentType: 'CC',
          documentNumber: '12345678',
          email: 'juan.perez@example.com',
          phoneNumber: '3001234567',
          bloodType: 'O+',
          fichaCode: '2856502',
          fichaName: 'GESTIÓN DE REDES DE DATOS',
          programName: 'TECNOLOGÍA EN REDES DE DATOS',
          centerName: 'Centro de Biotecnología Industrial'
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