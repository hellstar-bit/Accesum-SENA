// backend/src/import/import.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import * as xlsx from 'node-xlsx';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Role } from '../users/entities/role.entity';
import { PersonnelType } from '../config/entities/personnel-type.entity';
import { Regional } from '../config/entities/regional.entity';
import { Center } from '../config/entities/center.entity';
import { Ficha } from '../config/entities/ficha.entity';
import { Program } from '../config/entities/program.entity';
import { ImportLearnersResultDto, ExcelLearnerRowDto } from './import-learners.dto';

// ✅ Si tienes instalado @types/multer, descomenta esta línea:
import { Express } from 'express';

// Usar el tipo correcto para Multer - alternativa más robusta
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

// ✅ Alternativa si tienes problemas de tipos, descomenta y usa esta línea:
// type UploadedFile = Express.Multer.File;

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
    @InjectRepository(Ficha)
    private fichaRepository: Repository<Ficha>,
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
  ) {}

  async importLearnersFromExcel(file: UploadedFile): Promise<ImportLearnersResultDto> {
    const result: ImportLearnersResultDto = {
      success: false,
      totalRows: 0,
      importedRows: 0,
      updatedRows: 0,
      fichaInfo: {
        code: '',
        name: '',
        status: '',
        isNew: false,
      },
      errors: [],
      summary: {
        nuevos: 0,
        actualizados: 0,
        errores: 0,
      },
    };

    try {
      console.log('📄 Archivo recibido:', {
        name: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });

      // Verificar que el buffer no esté vacío
      if (!file.buffer || file.buffer.length === 0) {
        throw new BadRequestException('El archivo está vacío');
      }

      const workbook = new ExcelJS.Workbook();
      
      // Intentar cargar el archivo con conversión de buffer más segura
      try {
        // Método 1: Convertir a ArrayBuffer para compatibilidad con ExcelJS
        const arrayBuffer = file.buffer.buffer.slice(
          file.buffer.byteOffset,
          file.buffer.byteOffset + file.buffer.byteLength
        );
        
        await workbook.xlsx.load(arrayBuffer);
      } catch (xlsxError) {
        console.log('❌ Error con método 1, intentando método alternativo...');
        
        try {
          // Método 2: Usar Uint8Array
          const uint8Array = new Uint8Array(file.buffer);
          await workbook.xlsx.load(uint8Array.buffer);
        } catch (secondError) {
          console.log('❌ Error con ambos métodos:', xlsxError, secondError);
          throw new BadRequestException('Error al leer el archivo Excel. Asegúrate de que sea un archivo Excel válido (.xlsx o .xls)');
        }
      }
      
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        throw new BadRequestException('No se encontró hoja de trabajo');
      }

      console.log('📊 Información de la hoja:');
      console.log('- Número de filas:', worksheet.rowCount);
      console.log('- Número de columnas:', worksheet.columnCount);

      // ✅ EXTRAER INFORMACIÓN DEL HEADER
      const fichaInfo = await this.extractHeaderInfo(worksheet);
      
      if (!fichaInfo.code) {
        throw new BadRequestException('No se pudo extraer el código de la ficha');
      }
      
      // ✅ CREAR O ACTUALIZAR FICHA
      const { ficha, isNew } = await this.createOrUpdateFicha(fichaInfo);
      
      // ✅ ACTUALIZAR result.fichaInfo con isNew
      result.fichaInfo = {
        code: fichaInfo.code,
        name: fichaInfo.name,
        status: fichaInfo.status,
        isNew: isNew,
      };

      // ✅ OBTENER DATOS DE REFERENCIA
      const [aprendizRole, aprendizType, defaultRegional, defaultCenter] = await Promise.all([
        this.roleRepository.findOne({ where: { name: 'Aprendiz' } }),
        this.personnelTypeRepository.findOne({ where: { name: 'Aprendiz' } }),
        this.regionalRepository.findOne({ where: { name: 'Regional por Defecto' } }),
        this.centerRepository.findOne({ where: { name: 'Centro por Defecto' } }),
      ]);

      if (!aprendizRole || !aprendizType || !defaultRegional || !defaultCenter) {
        throw new BadRequestException('Faltan datos de referencia básicos');
      }

      // ✅ PROCESAR FILAS DE DATOS
      const dataStartRow = 6; // Los datos empiezan en la fila 6
      let processedRows = 0;

      for (let rowNumber = dataStartRow; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        if (this.isEmptyRow(row)) continue;

        processedRows++;

        try {
          const learnerData = this.extractLearnerData(row, rowNumber);
          
          // Validar datos mínimos requeridos
          if (!learnerData.numeroDocumento || !learnerData.nombre || !learnerData.apellidos || !learnerData.correoElectronico) {
            throw new Error(`Faltan datos requeridos en fila ${rowNumber}`);
          }
          
          // Verificar si el usuario ya existe
          const existingProfile = await this.profileRepository.findOne({
            where: { documentNumber: learnerData.numeroDocumento },
            relations: ['user'],
          });

          if (existingProfile) {
            // ✅ ACTUALIZAR USUARIO EXISTENTE
            await this.updateExistingLearner(existingProfile, learnerData, ficha);
            result.updatedRows++;
            result.summary.actualizados++;
          } else {
            // ✅ CREAR NUEVO USUARIO
            await this.createNewLearner(learnerData, ficha, aprendizRole, aprendizType, defaultRegional, defaultCenter);
            result.importedRows++;
            result.summary.nuevos++;
          }

        } catch (error: any) {
          console.error(`Error en fila ${rowNumber}:`, error.message);
          result.errors.push({
            row: rowNumber,
            error: error.message,
            data: this.getRowValues(row),
          });
          result.summary.errores++;
        }
      }

      result.totalRows = processedRows;
      result.success = (result.importedRows + result.updatedRows) > 0;

      console.log('✅ Importación completada:', result);
      return result;

    } catch (error: any) {
      console.error('❌ Error general en importación:', error);
      result.errors.push({
        row: 0,
        error: `Error general: ${error.message}`,
      });
      return result;
    }
  }

  private async extractHeaderInfo(worksheet: ExcelJS.Worksheet) {
    // Extraer información del header según el formato real
    // Fila 2: A="Ficha de Caracterización:" B="2853176 - ANÁLISIS Y DESARROLLO DE SOFTWARE"
    // Fila 3: A="Estado:" B="EN EJECUCIÓN"  
    // Fila 4: A="Fecha del Reporte:" B="03/04/2025"

    console.log('🔍 Debug - Leyendo header del Excel...');
    
    // Debug: mostrar las primeras filas para identificar el problema
    for (let i = 1; i <= 5; i++) {
      const row = worksheet.getRow(i);
      console.log(`Fila ${i}:`, {
        A: this.getCellValue(row, 1),
        B: this.getCellValue(row, 2),
        C: this.getCellValue(row, 3)
      });
    }

    const fichaRow = worksheet.getRow(2);
    const estadoRow = worksheet.getRow(3);
    const fechaRow = worksheet.getRow(4);

    // Leer valores de la columna B (índice 2) - NO de la columna A
    const fichaCell = this.getCellValue(fichaRow, 2); // Columna B
    const estadoCell = this.getCellValue(estadoRow, 2); // Columna B
    const fechaCell = this.getCellValue(fechaRow, 2); // Columna B

    console.log('🔍 Debug - Valores leídos:');
    console.log('Ficha (B2):', fichaCell);
    console.log('Estado (B3):', estadoCell);
    console.log('Fecha (B4):', fechaCell);

    // Parsear ficha: "2853176 - ANÁLISIS Y DESARROLLO DE SOFTWARE"
    const fichaText = fichaCell?.toString()?.trim() || '';
    let fichaCode = '';
    let fichaName = '';
    
    if (fichaText.includes(' - ')) {
      const [code, ...nameParts] = fichaText.split(' - ');
      fichaCode = code.trim();
      fichaName = nameParts.join(' - ').trim();
    } else if (fichaText.match(/^\d+/)) {
      // Si solo hay números sin el formato completo
      const match = fichaText.match(/^(\d+)/);
      fichaCode = match ? match[1] : fichaText;
      fichaName = fichaText.replace(/^\d+\s*-?\s*/, '').trim() || 'Programa sin nombre';
    } else {
      // Si no se puede extraer, usar el texto completo como código
      fichaCode = fichaText;
      fichaName = 'Programa sin nombre';
    }

    // Parsear estado: "EN EJECUCIÓN"
    const estadoText = estadoCell?.toString()?.trim() || '';
    let fichaStatus = 'EN EJECUCIÓN'; // Por defecto
    
    const upperEstado = estadoText.toUpperCase();
    if (upperEstado.includes('EJECUCIÓN') || upperEstado.includes('EJECUCION')) {
      fichaStatus = 'EN EJECUCIÓN';
    } else if (upperEstado.includes('TERMINADA') || upperEstado.includes('FINALIZADA')) {
      fichaStatus = 'TERMINADA';
    } else if (upperEstado.includes('CANCELADA')) {
      fichaStatus = 'CANCELADA';
    }

    // Parsear fecha: "03/04/2025"
    const fechaText = fechaCell?.toString()?.trim() || '';
    let reportDate: Date | null = null;
    
    try {
      if (fechaText.includes('/')) {
        const [day, month, year] = fechaText.split('/');
        reportDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    } catch (error) {
      console.warn('No se pudo parsear la fecha:', fechaText);
    }

    const result = {
      code: fichaCode,
      name: fichaName,
      status: fichaStatus,
      reportDate: reportDate,
    };

    console.log('✅ Resultado del parseo del header:', result);
    
    // Validar que se extrajo información válida
    if (!fichaCode || fichaCode === 'Ficha de Caracterización:') {
      console.error('❌ Error: No se pudo extraer el código de la ficha correctamente');
      console.error('Valor leído:', fichaText);
      throw new BadRequestException('No se pudo extraer el código de la ficha del Excel. Verifica el formato del archivo.');
    }
    
    return result;
  }

  private async createOrUpdateFicha(fichaInfo: any): Promise<{ ficha: Ficha; isNew: boolean }> {
    let ficha = await this.fichaRepository.findOne({
      where: { code: fichaInfo.code },
    });

    let isNew = false;

    if (ficha) {
      // Actualizar ficha existente
      ficha.name = fichaInfo.name;
      ficha.status = fichaInfo.status;
      ficha.reportDate = fichaInfo.reportDate;
      ficha = await this.fichaRepository.save(ficha);
      console.log('🔄 Ficha actualizada:', ficha.code);
    } else {
      // Crear nueva ficha
      isNew = true;
      const defaultProgram = await this.programRepository.findOne({
        where: { name: 'Programa por Defecto' },
      });

      ficha = this.fichaRepository.create({
        code: fichaInfo.code,
        name: fichaInfo.name,
        status: fichaInfo.status,
        reportDate: fichaInfo.reportDate,
        programId: defaultProgram?.id || 1,
      });

      ficha = await this.fichaRepository.save(ficha);
      console.log('🆕 Nueva ficha creada:', ficha.code);
    }

    return { ficha, isNew };
  }

  private extractLearnerData(row: ExcelJS.Row, rowNumber: number): ExcelLearnerRowDto {
    const result = {
      tipoDocumento: this.normalizeDocumentType(this.getCellValue(row, 1)?.toString() || ''),
      numeroDocumento: this.getCellValue(row, 2)?.toString()?.trim() || '',
      nombre: this.getCellValue(row, 3)?.toString()?.trim() || '',
      apellidos: this.getCellValue(row, 4)?.toString()?.trim() || '',
      celular: this.getCellValue(row, 5)?.toString()?.trim() || '',
      correoElectronico: this.getCellValue(row, 6)?.toString()?.trim() || '',
      estado: this.normalizeStatus(this.getCellValue(row, 7)?.toString() || '') // ✅ COLUMNA G (7)
    };

    console.log(`Fila ${rowNumber}:`, result);
    return result;
  }

  private async createNewLearner(
    learnerData: ExcelLearnerRowDto,
    ficha: Ficha,
    role: Role,
    type: PersonnelType,
    regional: Regional,
    center: Center,
  ) {
    // Validar datos requeridos
    if (!learnerData.numeroDocumento || !learnerData.nombre || !learnerData.apellidos || !learnerData.correoElectronico) {
      throw new Error('Faltan campos requeridos');
    }

    // Generar contraseña temporal
    const tempPassword = `sena${learnerData.numeroDocumento}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Crear usuario
    const newUser = await this.userRepository.save({
      email: learnerData.correoElectronico,
      password: hashedPassword,
      roleId: role.id,
      isActive: learnerData.estado === 'EN FORMACION',
    });

    // Crear perfil
    const profileData: Partial<Profile> = {
      documentType: learnerData.tipoDocumento,
      documentNumber: learnerData.numeroDocumento,
      firstName: learnerData.nombre,
      lastName: learnerData.apellidos,
      learnerStatus: learnerData.estado,
      userId: newUser.id,
      typeId: type.id,
      regionalId: regional.id,
      centerId: center.id,
      fichaId: ficha.id, // ⭐ ASIGNAR FICHA
    };

    // Solo agregar phoneNumber si tiene valor
    if (learnerData.celular && learnerData.celular.trim() !== '') {
      profileData.phoneNumber = learnerData.celular;
    }

    const profile = await this.profileRepository.save(profileData);

    // ✅ GENERAR QR AUTOMÁTICAMENTE
    await this.generateQRForProfile(profile);

    console.log(`✅ Nuevo aprendiz creado: ${learnerData.nombre} ${learnerData.apellidos}`);
  }

  private async updateExistingLearner(
    existingProfile: Profile,
    learnerData: ExcelLearnerRowDto,
    ficha: Ficha,
  ) {
    // Actualizar datos que pueden cambiar
    existingProfile.phoneNumber = learnerData.celular || existingProfile.phoneNumber;
    existingProfile.learnerStatus = learnerData.estado;
    existingProfile.fichaId = ficha.id;

    // Actualizar estado del usuario
    existingProfile.user.isActive = learnerData.estado === 'EN FORMACION';
    
    await this.userRepository.save(existingProfile.user);
    await this.profileRepository.save(existingProfile);

    // Generar QR si no tiene
    if (!existingProfile.qrCode) {
      await this.generateQRForProfile(existingProfile);
    }

    console.log(`🔄 Aprendiz actualizado: ${learnerData.nombre} ${learnerData.apellidos}`);
  }

  private async generateQRForProfile(profile: Profile) {
    const qrData = {
      id: profile.id,
      doc: profile.documentNumber,
      type: 'ACCESUM_SENA',
      timestamp: Date.now()
    };

    const QRCode = require('qrcode');
    const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
    });

    profile.qrCode = qrCodeBase64;
    await this.profileRepository.save(profile);
  }

  private normalizeStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'EN FORMACION': 'EN FORMACION',
      'CANCELADO': 'CANCELADO',
      'RETIRO VOLUNTARIO': 'RETIRO VOLUNTARIO',
      'APLAZADO': 'APLAZADO',
    };

    const upperStatus = status.toUpperCase().trim();
    return statusMap[upperStatus] || 'EN FORMACION';
  }

  private normalizeDocumentType(tipo: string): string {
    const tipoUpper = tipo?.toUpperCase().trim() || '';
    const tiposValidos = ['CC', 'CE', 'TI', 'PA', 'RC', 'PEP'];
    
    if (tiposValidos.includes(tipoUpper)) {
      return tipoUpper;
    }
    
    const mapeo: { [key: string]: string } = {
      'CEDULA': 'CC',
      'CÉDULA': 'CC',
      'CEDULA DE CIUDADANIA': 'CC',
      'CÉDULA DE CIUDADANÍA': 'CC',
    };

    return mapeo[tipoUpper] || 'CC';
  }

  private parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    try {
      // Formato esperado: "01/04/2025"
      const [day, month, year] = dateString.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } catch {
      return null;
    }
  }

  private isEmptyRow(row: ExcelJS.Row): boolean {
    return !this.getCellValue(row, 1) && !this.getCellValue(row, 2) && !this.getCellValue(row, 3);
  }

  private getCellValue(row: ExcelJS.Row, columnNumber: number): any {
    try {
      const cell = row.getCell(columnNumber);
      if (cell && cell.value !== null && cell.value !== undefined) {
        // Manejar diferentes tipos de valores
        if (cell.value instanceof Date) {
          return cell.value.toLocaleDateString('es-CO');
        }
        if (typeof cell.value === 'object' && cell.value !== null) {
          // Manejar rich text y fórmulas
          if ('text' in cell.value) {
            return (cell.value as any).text;
          }
          if ('result' in cell.value) {
            return (cell.value as any).result;
          }
          return cell.value.toString();
        }
        return cell.value;
      }
      return '';
    } catch (error) {
      console.warn(`Error al leer celda ${columnNumber}:`, error);
      return '';
    }
  }

  private getRowValues(row: ExcelJS.Row): string[] {
    const values: string[] = [];
    for (let i = 1; i <= 7; i++) {
      const cellValue = this.getCellValue(row, i);
      values.push(cellValue?.toString() || '');
    }
    return values;
  }

  // Mantener el método existente para compatibilidad
  async importFromExcel(file: UploadedFile): Promise<any> {
    // Método existente para otros tipos de importación...
    // (mantener la implementación actual)
    throw new BadRequestException('Método no implementado aún');
  }
}