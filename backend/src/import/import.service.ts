// src/import/import.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Role } from '../users/entities/role.entity';
import { PersonnelType } from '../config/entities/personnel-type.entity';
import { Regional } from '../config/entities/regional.entity';
import { Center } from '../config/entities/center.entity';
import { ExcelRowDto, ImportResultDto } from './import-excel.dto';

// Definir el tipo de archivo localmente
type UploadedFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
};

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
  ) {}

  async importFromExcel(file: UploadedFile): Promise<ImportResultDto> {
    const result: ImportResultDto = {
      success: false,
      totalRows: 0,
      importedRows: 0,
      errors: [],
      summary: {
        funcionarios: 0,
        contratistas: 0,
        aprendices: 0,
        visitantes: 0,
      },
    };

    try {
      // Leer el archivo Excel usando type assertion para resolver el problema de tipos
      const workbook = new ExcelJS.Workbook();
      
      // Forzar el tipo usando 'as any' para evitar problemas de compatibilidad
      await workbook.xlsx.load(file.buffer as any);
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        result.errors.push({
          row: 0,
          error: 'No se encontró ninguna hoja de trabajo en el archivo',
        });
        return result;
      }

      // Obtener datos de referencia
      const [defaultRole, defaultPersonnelType, defaultRegional, defaultCenter] = await Promise.all([
        this.roleRepository.findOne({ where: { name: 'Funcionario' } }),
        this.personnelTypeRepository.findOne({ where: { name: 'Funcionario' } }),
        this.regionalRepository.findOne({ where: { name: 'Regional por Defecto' } }),
        this.centerRepository.findOne({ where: { name: 'Centro por Defecto' } }),
      ]);

      if (!defaultRole || !defaultPersonnelType || !defaultRegional || !defaultCenter) {
        result.errors.push({
          row: 0,
          error: 'Faltan datos de referencia básicos. Ejecute el seeder primero.',
        });
        return result;
      }

      // Verificar que la hoja tenga datos
      if (worksheet.rowCount <= 1) {
        result.errors.push({
          row: 0,
          error: 'El archivo no contiene datos para importar',
        });
        return result;
      }

      // Procesar filas (empezamos desde la fila 2, asumiendo que la 1 son los headers)
      const totalRows = worksheet.rowCount - 1; // -1 porque la primera fila son headers
      result.totalRows = totalRows;

      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        try {
          // Extraer datos de la fila
          const rowData: ExcelRowDto = {
            tipoDocumento: this.getCellValue(row, 1)?.toString().trim() || '',
            numeroDocumento: this.getCellValue(row, 2)?.toString().trim() || '',
            nombre: this.getCellValue(row, 3)?.toString().trim() || '',
            apellidos: this.getCellValue(row, 4)?.toString().trim() || '',
            celular: this.getCellValue(row, 5)?.toString().trim() || '',
            correoElectronico: this.getCellValue(row, 6)?.toString().trim() || '',
            estado: this.getCellValue(row, 7)?.toString().trim() || 'Activo',
          };

          // Validar datos requeridos
          if (!rowData.numeroDocumento || !rowData.nombre || !rowData.apellidos || !rowData.correoElectronico) {
            result.errors.push({
              row: rowNumber,
              error: 'Faltan campos requeridos (Documento, Nombre, Apellidos, Email)',
              data: rowData,
            });
            continue;
          }

          // Validar formato de email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(rowData.correoElectronico)) {
            result.errors.push({
              row: rowNumber,
              error: 'Formato de email inválido',
              data: rowData,
            });
            continue;
          }

          // Verificar si el usuario ya existe
          const [existingUser, existingProfile] = await Promise.all([
            this.userRepository.findOne({ where: { email: rowData.correoElectronico } }),
            this.profileRepository.findOne({ where: { documentNumber: rowData.numeroDocumento } }),
          ]);

          if (existingUser || existingProfile) {
            result.errors.push({
              row: rowNumber,
              error: 'Usuario o documento ya existe en el sistema',
              data: rowData,
            });
            continue;
          }

          // Determinar tipo de personal y rol basado en el email
          let roleToAssign = defaultRole;
          let personnelTypeToAssign = defaultPersonnelType;
          
          if (rowData.correoElectronico.includes('@misena.edu.co') || 
              rowData.correoElectronico.toLowerCase().includes('aprendiz')) {
            const [aprendizRole, aprendizType] = await Promise.all([
              this.roleRepository.findOne({ where: { name: 'Aprendiz' } }),
              this.personnelTypeRepository.findOne({ where: { name: 'Aprendiz' } }),
            ]);
            if (aprendizRole && aprendizType) {
              roleToAssign = aprendizRole;
              personnelTypeToAssign = aprendizType;
              result.summary.aprendices++;
            } else {
              result.summary.funcionarios++;
            }
          } else if (rowData.correoElectronico.toLowerCase().includes('contratista') || 
                     rowData.correoElectronico.toLowerCase().includes('contractor')) {
            const [contratistaRole, contratistaType] = await Promise.all([
              this.roleRepository.findOne({ where: { name: 'Contratista' } }),
              this.personnelTypeRepository.findOne({ where: { name: 'Contratista' } }),
            ]);
            if (contratistaRole && contratistaType) {
              roleToAssign = contratistaRole;
              personnelTypeToAssign = contratistaType;
              result.summary.contratistas++;
            } else {
              result.summary.funcionarios++;
            }
          } else {
            result.summary.funcionarios++;
          }

          // Generar contraseña temporal basada en el documento
          const tempPassword = `sena${rowData.numeroDocumento}`;
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          // Crear usuario
          const newUser = await this.userRepository.save({
            email: rowData.correoElectronico,
            password: hashedPassword,
            roleId: roleToAssign.id,
            isActive: rowData.estado.toLowerCase() === 'activo',
          });

          // Crear perfil con manejo correcto de phoneNumber
          const profileData: Partial<Profile> = {
            documentType: this.normalizeDocumentType(rowData.tipoDocumento),
            documentNumber: rowData.numeroDocumento,
            firstName: rowData.nombre,
            lastName: rowData.apellidos,
            userId: newUser.id,
            typeId: personnelTypeToAssign.id,
            regionalId: defaultRegional.id,
            centerId: defaultCenter.id,
          };

          // Solo agregar phoneNumber si tiene valor
          if (rowData.celular && rowData.celular.trim() !== '') {
            profileData.phoneNumber = rowData.celular;
          }

          await this.profileRepository.save(profileData);
          result.importedRows++;

        } catch (error) {
          result.errors.push({
            row: rowNumber,
            error: `Error al procesar fila: ${error.message}`,
            data: row.values,
          });
        }
      }

      result.success = result.importedRows > 0;
      return result;

    } catch (error) {
      result.errors.push({
        row: 0,
        error: `Error general: ${error.message}`,
      });
      return result;
    }
  }

  private getCellValue(row: ExcelJS.Row, columnNumber: number): any {
    try {
      const cell = row.getCell(columnNumber);
      if (cell && cell.value !== null && cell.value !== undefined) {
        // Si es una fecha, convertir a string
        if (cell.value instanceof Date) {
          return cell.value.toISOString();
        }
        // Si es un objeto con text, usar text
        if (typeof cell.value === 'object' && cell.value !== null && 'text' in cell.value) {
          return (cell.value as any).text;
        }
        return cell.value;
      }
      return '';
    } catch (error) {
      console.warn(`Error al obtener valor de celda ${columnNumber}:`, error);
      return '';
    }
  }

  private normalizeDocumentType(tipo: string): string {
    const tipoUpper = tipo?.toUpperCase().trim() || '';
    const tiposValidos = ['CC', 'CE', 'TI', 'PA', 'RC', 'PEP'];
    
    if (tiposValidos.includes(tipoUpper)) {
      return tipoUpper;
    }
    
    // Mapear tipos comunes
    const mapeo: { [key: string]: string } = {
      'CEDULA': 'CC',
      'CÉDULA': 'CC',
      'CEDULA DE CIUDADANIA': 'CC',
      'CÉDULA DE CIUDADANÍA': 'CC',
      'CEDULA EXTRANJERIA': 'CE',
      'CÉDULA DE EXTRANJERÍA': 'CE',
      'TARJETA IDENTIDAD': 'TI',
      'TARJETA DE IDENTIDAD': 'TI',
      'PASAPORTE': 'PA',
      'REGISTRO CIVIL': 'RC',
    };

    return mapeo[tipoUpper] || 'CC'; // Por defecto CC
  }
}